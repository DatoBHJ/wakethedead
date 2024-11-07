// External Dependencies
import 'server-only';
import { createAI, createStreamableValue } from 'ai/rsc';
import { OpenAI } from 'openai';
import { OpenAIEmbeddings } from '@langchain/openai';
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { config } from './config';
import { Index } from "@upstash/vector";
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document as DocumentInterface } from 'langchain/document';
import { performWebSearch, performImageSearch, performVideoSearch } from './tools/Providers_w_serper';

// Rate Limiting Dependencies
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from 'next/headers';

// Runtime Configuration
export const runtime = 'edge';

/**
 * Interface Definitions
 */
interface SearchResult {
  title: string;
  url: string;
  pageContent: string;
  date?: string;
}

interface ContentResult extends SearchResult {
  mainContent: string;
}

interface NewsResult {
  title: string;
  link: string;
  snippet: string;
  date: string;
  source: string;
}

/**
 * Global Configurations and Initializations
 */
let openai: OpenAI;
let ratelimit: Ratelimit | undefined;

// Initialize rate limiter if enabled in config
if (config.useRateLimiting) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "10 m") // 10 requests per 10 minutes
  });
}

/**
 * Upstash Vector Database Configuration
 */
const UPSTASH_VECTOR_REST_URL = process.env.UPSTASH_REDIS_REST_URL_2;
const UPSTASH_VECTOR_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN_2;

if (!UPSTASH_VECTOR_REST_URL || !UPSTASH_VECTOR_REST_TOKEN) {
  console.error("Upstash Vector environment variables are not set correctly");
  throw new Error("Upstash Vector configuration is missing");
}

const index = new Index({
  url: UPSTASH_VECTOR_REST_URL,
  token: UPSTASH_VECTOR_REST_TOKEN,
});

/**
 * OpenAI Configuration Functions
 */
function getOpenAIConfig(selectedModel: string) {
  if (selectedModel === "grok-beta") {
    return {
      baseURL: config.xaiBaseURL,
      apiKey: config.xaiAPIKey
    };
  }
  return {
    baseURL: config.nonOllamaBaseURL,
    apiKey: config.inferenceAPIKey
  };
}

// Initialize OpenAI with default config
openai = new OpenAI(getOpenAIConfig(""));

/**
 * Embeddings Configuration
 */
let embeddings: OllamaEmbeddings | OpenAIEmbeddings;

if (config.useOllamaEmbeddings) {
  embeddings = new OllamaEmbeddings({
    model: config.embeddingsModel,
    baseUrl: "http://localhost:11434"
  });
} else {
  embeddings = new OpenAIEmbeddings({
    modelName: config.embeddingsModel
  });
}

/**
 * Document Processing Functions
 */

/**
 * Retrieves user shared documents based on similarity to query
 * @param userMessage - User's query message
 * @param embeddings - Embeddings instance for vector similarity
 * @param index - Vector database index
 * @returns Array of relevant documents
 */
async function getUserSharedDocument(
  userMessage: string, 
  embeddings: OllamaEmbeddings | OpenAIEmbeddings, 
  index: Index
) {
  const queryEmbedding = await embeddings.embedQuery(userMessage);
  const queryResults = await index.query({
    vector: queryEmbedding,
    topK: config.numberOfSimilarityResults,
    includeMetadata: true,
    includeVectors: false,
  });

  return queryResults
    .filter((result) => 
      result.score >= config.similarityThreshold &&
      result.metadata.title &&
      result.metadata.content &&
      result.metadata.link
    )
    .map((result) => ({
      title: result.metadata.title as string,
      pageContent: result.metadata.content as string,
      url: result.metadata.link as string,
      score: result.score,
      id: result.id
    }));
}

/**
 * Fetches and processes content from a URL
 * @param source - Source information including URL
 * @returns Processed content result or null if failed
 */
async function fetchAndProcessContent(source: SearchResult): Promise<ContentResult | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const response = await fetch(source.url, { 
      signal: controller.signal 
    });
    clearTimeout(timeoutId);

    const html = await response.text();
    const mainContent = extractMainContent(html);
    return { ...source, mainContent };
  } catch (error) {
    console.error(`Error processing ${source.url}:`, error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Extracts main content from HTML
 * @param rawHtml - Raw HTML content
 * @returns Cleaned and formatted content
 */
function extractMainContent(rawHtml: string): string {
  let extractedContent = '';
  
  // Try to find main content within specific HTML tags
  const mainContentMatch = rawHtml.match(/<main[\s\S]*?>([\s\S]*?)<\/main>/i) ||
                          rawHtml.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i) ||
                          rawHtml.match(/<div[\s\S]*?class=["'][\s\S]*?content[\s\S]*?["'][\s\S]*?>([\s\S]*?)<\/div>/i);
  
  if (mainContentMatch) {
    extractedContent = mainContentMatch[1]
      .replace(/<script[\s\S]*?<\/script>/gi, '')  // Remove scripts
      .replace(/<style[\s\S]*?<\/style>/gi, '')    // Remove styles
      .replace(/<[^>]*>/g, ' ')                    // Remove HTML tags
      .replace(/\s+/g, ' ')                        // Normalize whitespace
      .trim();
  } else {
    // Fallback to cleaning entire HTML
    extractedContent = rawHtml
      .replace(/<head[\s\S]*?<\/head>/i, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  return extractedContent;
}

/**
 * Content Processing and Analysis Functions
 */

/**
 * Processes and vectorizes content for similarity search
 * @param contents - Array of content to process
 * @param query - User's query
 * @param embeddings - Embeddings instance
 * @param textChunkSize - Size of text chunks
 * @param textChunkOverlap - Overlap between chunks
 * @param numberOfSimilarityResults - Number of results to return
 * @returns Array of relevant search results
 */
async function processAndVectorizeContent(
  contents: ContentResult[],
  query: string,
  embeddings: OllamaEmbeddings | OpenAIEmbeddings,
  textChunkSize = config.textChunkSize,
  textChunkOverlap = config.textChunkOverlap,
  numberOfSimilarityResults = config.numberOfSimilarityResults,
): Promise<SearchResult[]> {
  const relevantDocuments: [DocumentInterface, number][] = [];
  
  const processingPromises = contents.map(async (content) => {
    if (content.mainContent.length > 0) {
      try {
        // Split text into chunks
        const splitText = await new RecursiveCharacterTextSplitter({ 
          chunkSize: textChunkSize, 
          chunkOverlap: textChunkOverlap 
        }).splitText(content.mainContent);
        
        // Prepare metadata
        const metadata = {
          title: content.title,
          url: content.url,
          date: content.date
        };
        
        // Create vector store and search for similar content
        const vectorStore = await MemoryVectorStore.fromTexts(splitText, metadata, embeddings);
        const queryEmbedding = await embeddings.embedQuery(query);
        return await vectorStore.similaritySearchVectorWithScore(queryEmbedding, numberOfSimilarityResults);
      } catch (error) {
        console.error(`Error processing content for ${content.url}:`, error);
        return [];
      }
    }
    return [];
  });

  const results = await Promise.all(processingPromises);
  relevantDocuments.push(...results.flat());

  return relevantDocuments
    .sort((a, b) => b[1] - a[1])
    .filter(([_, score]) => score >= config.similarityThreshold)
    .map(([doc, score]) => ({
      title: doc.metadata.title as string,
      pageContent: doc.pageContent,
      url: doc.metadata.url as string,
      date: doc.metadata.date as string | undefined,
      score: score
    }));
}

/**
 * Question Generation and Analysis
 */

/**
 * Generates relevant follow-up questions based on search results
 * @param sources - Array of search results
 * @param userMessage - Original user query
 * @param selectedModel - Selected AI model
 * @returns Generated questions in JSON format
 */
async function relevantQuestions(
  sources: SearchResult[], 
  userMessage: string, 
  selectedModel: string
): Promise<any> {
  return await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `
          You are a Question generator who generates an array of 3 follow-up self-contained questions in JSON format.
          The JSON schema should include:
          {
            "original": "The original search query or context",
            "followUp": [
              "Question 1",
              "Question 2", 
              "Question 3"
            ]
          }
          `,
      },
      {
        role: "user",
        content: `Generate follow-up self-contained questions based on the top results from a similarity search: ${JSON.stringify(sources)}. The original search query is: "${userMessage}".`,
      },
    ],
    model: selectedModel,
    response_format: { type: "json_object" },
  });
}

/**
 * Utility Functions
 */

/**
 * Removes duplicate results based on URL
 * @param processedResults - Processed search results
 * @param relevantDocs - Relevant documents to check against
 * @returns Deduplicated results array
 */
function removeDuplicates(
  processedResults: SearchResult[], 
  relevantDocs: SearchResult[]
): SearchResult[] {
  const relevantUrls = new Set(relevantDocs.map(doc => doc.url));
  return processedResults.filter(result => !relevantUrls.has(result.url));
}

/**
 * Checks if a query is news-related
 * @param query - User's search query
 * @returns Boolean indicating if query is news-related
 */
function isNewsQuery(query: string): boolean {
  const newsKeywords = [
    'news', 'headline', 'breaking', 'latest', 
    'today', 'current', 'these days', 'recent', 
    'new', 'update'
  ];
  return newsKeywords.some(keyword => query.toLowerCase().includes(keyword));
}


/**
 * Main action function that processes user queries and returns results
 * @param userMessage - User's input message
 * @param selectedModel - Selected AI model
 * @param selectedLanguage - Selected language for response
 * @param isRefresh - Whether this is a refresh request
 * @returns Processed results and AI response
 */
async function myAction(
  userMessage: string, 
  selectedModel: string,
  selectedLanguage: string,
  isRefresh: boolean = false,
): Promise<any> {
  "use server";
  console.log('myAction called with:', { userMessage, selectedModel, selectedLanguage, isRefresh });

  openai = new OpenAI(getOpenAIConfig(selectedModel));
  const streamable = createStreamableValue({});
  
  (async () => {
    // Rate limiting check
    if (config.useRateLimiting && ratelimit) {
      const identifier = headers().get('x-forwarded-for') || 
                        headers().get('x-real-ip') || 
                        headers().get('cf-connecting-ip') || 
                        headers().get('client-ip') || 
                        "";
      const { success, limit, reset, remaining } = await ratelimit.limit(identifier);
      console.log('Rate limit:', { success, limit, reset, remaining });
      
      if (!success) {
        return streamable.done({ 
          'status': 'ChatRateLimitReached',
          'rateLimitInfo': { limit, reset, remaining }
        });
      }
    }

    const currentTimestamp = new Date().toISOString();
    const isNewsSearch = isNewsQuery(userMessage);

    // Execute initial searches in parallel for better performance
    const [webSearchResults, relevantDocuments, images, videos] = await Promise.all([
      performWebSearch(userMessage, config.startIndexOfPagesToScan, config.numberOfPagesToScan, isNewsSearch),
      getUserSharedDocument(userMessage, embeddings, index),
      isRefresh ? null : performImageSearch(userMessage),
      isRefresh ? null : performVideoSearch(userMessage)
    ]);

    // Provide immediate feedback with initial results
    streamable.update({
      relevantDocuments,
      processedWebResults: webSearchResults.slice(config.startIndexOfPagesToScan, config.numberOfPagesToScan),
      ...(isRefresh ? {} : { images, videos })
    });

    // Format results based on search type (news vs regular)
    let processedResults: SearchResult[] = isNewsSearch
      ? (webSearchResults as NewsResult[]).map((result): SearchResult => ({
          title: result.title,
          pageContent: `${result.snippet} (Source: ${result.source}, Date: ${result.date})`,
          url: result.link,
          date: result.date
        }))
      : webSearchResults as SearchResult[];

    // Process subset of results based on configuration
    const slicedWebSearchResults = processedResults.slice(
      config.startIndexOfPagesToScan, 
      config.numberOfPagesToScan
    );

    // Fetch and process content in parallel
    const contentPromises = slicedWebSearchResults.map(source => fetchAndProcessContent(source));
    const blueLinksContents = (await Promise.all(contentPromises))
      .filter((content): content is ContentResult => content !== null);

    // Process and vectorize the content
    const processedWebResults = await processAndVectorizeContent(
      blueLinksContents, 
      userMessage, 
      embeddings
    );

    // Remove duplicate results
    const uniqueProcessedWebResults = removeDuplicates(
      processedWebResults.length > 0 ? processedWebResults : slicedWebSearchResults,
      relevantDocuments || []
    );

    // Update streamable with processed results
    streamable.update({ 
      'processedWebResults': uniqueProcessedWebResults.slice(0, config.numberOfSimilarityResults) 
    });

    // Prepare final results for LLM prompt
    const promptProcessedWebResults = uniqueProcessedWebResults.slice(0, config.numberOfSimilarityResults);
    console.log('Prompt processed web results:', promptProcessedWebResults);

    // Construct messages for LLM
    const messages = [
      {
        role: "system" as const,
        content: `You're a witty and clever AI assistant.
        Keep it accurate but be super CASUAL and excited, like chatting with a friend in a concert!! 😉 Respond in ${selectedLanguage}.
    
        1. Respond to the user's input, which may be a question or a search term. 
        If it's a search term, provide relevant information about that topic.
        Use only relevant documents from the provided sources.
        If you find any conflicting or outdated information, trust sources shared by web search results over user-shared documents.
        Use **bold** and CAPS to emphasize key words and important points!!!

        Today's date and time: 
        ${currentTimestamp}
    
        Sources from the web:
        ${JSON.stringify(promptProcessedWebResults)}
    
        Sources shared by users:
        ${JSON.stringify(relevantDocuments)}
    
        2. Respond back ALWAYS IN MARKDOWN, with the following structure:
        ## Quick Answer 💡
        [Provide a brief, engaging response to the user's input '${userMessage}' in 1-2 punchy sentences with relevant emojis. If it's a search term, give a concise overview of the topic.]
    
        ## Key Takeaways 🎯
        - [List 3-5 key points related to the input with relevant emojis]
    
        ## The Scoop 🔍
        [Provide a more detailed explanation with relevant emojis. 
        Be verbose with a lot of details. Spice it up with fun analogies or examples! 
        If the input was a search term, elaborate on the most interesting aspects of the topic.
        It should be visually appealing with emojis and symbols. ]
        `
      },
      {
        role: "user" as const,
        content: `
        Here is my input:
        ${userMessage}
    
        I speak ${selectedLanguage} and I want you to respond in ${selectedLanguage}.
        `
      }
    ];

    // Generate LLM response with streaming
    const chatCompletion = await openai.chat.completions.create({
      temperature: 0.3,
      messages,
      stream: true,
      model: selectedModel
    });

    // Process streaming response
    for await (const chunk of chatCompletion) {
      if (chunk.choices[0].delta && 
          chunk.choices[0].finish_reason !== "stop" && 
          chunk.choices[0].delta.content !== null) {
        streamable.update({ 'llmResponse': chunk.choices[0].delta.content });
      } else if (chunk.choices[0].finish_reason === "stop") {
        streamable.update({ 'llmResponseEnd': true });
      }
    }

    // Generate follow-up questions
    const followUp = await relevantQuestions(
      [...promptProcessedWebResults, ...(relevantDocuments || [])],
      userMessage,
      selectedModel
    );

    // Final updates and completion
    streamable.update({ 'followUp': followUp });
    streamable.done({ status: 'done' });
  })();

  return streamable.value;
}

/**
 * AI Configuration
 */
const initialAIState: {
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  id?: string;
  name?: string;
}[] = [];

const initialUIState: {
  id: number;
  display: React.ReactNode;
}[] = [];

// Create and export AI instance
export const AI = createAI({
  actions: { myAction },
  initialUIState,
  initialAIState
});