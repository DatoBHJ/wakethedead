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

// ratelimit
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from 'next/headers'
let ratelimit: Ratelimit | undefined;
if (config.useRateLimiting) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "10 m") // 30 requests per 10 minutes
  });
}

export const runtime = 'edge';

let openai: OpenAI;

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

interface SearchResult {
  title: string;
  url: string;
  pageContent: string;
  date?: string;
}


interface ContentResult extends SearchResult {
  html: string;
}

interface NewsResult {
  title: string;
  link: string;
  snippet: string;
  date: string;
  source: string;
}

async function getUserSharedDocument(userMessage: string, embeddings: OllamaEmbeddings | OpenAIEmbeddings, index: Index) {
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
    return { ...source, html: mainContent };
  } catch (error) {
    console.error(`Error processing ${source.url}:`, error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractMainContent(html: string): string {
  let content = '';
  const mainContent = html.match(/<main[\s\S]*?>([\s\S]*?)<\/main>/i) ||
                      html.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i) ||
                      html.match(/<div[\s\S]*?class=["'][\s\S]*?content[\s\S]*?["'][\s\S]*?>([\s\S]*?)<\/div>/i);
  
  if (mainContent) {
    content = mainContent[1]
      .replace(/<script[\s\S]*?<\/script>/gi, '') 
      .replace(/<style[\s\S]*?<\/style>/gi, '')   
      .replace(/<[^>]*>/g, ' ')              
      .replace(/\s+/g, ' ')                 
      .trim();                              
  } else {
    content = html.replace(/<head[\s\S]*?<\/head>/i, '')
                  .replace(/<script[\s\S]*?<\/script>/gi, '')
                  .replace(/<style[\s\S]*?<\/style>/gi, '')
                  .replace(/<[^>]*>/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();
  }
  
  return content;
}

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
    if (content.html.length > 0) {
      try {
        const splitText = await new RecursiveCharacterTextSplitter({ chunkSize: textChunkSize, chunkOverlap: textChunkOverlap }).splitText(content.html);
        const metadata = {
          title: content.title,
          url: content.url,
          date: content.date // date가 undefined여도 그대로 전달
        };
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
      date: doc.metadata.date as string | undefined, // date가 없으면 undefined
      score: score
    }));
}

async function relevantQuestions(sources: SearchResult[], userMessage: string, selectedModel: string): Promise<any> {
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

function removeDuplicates(processedResults: SearchResult[], relevantDocs: SearchResult[]): SearchResult[] {
  const relevantUrls = new Set(relevantDocs.map(doc => doc.url));
  return processedResults.filter(result => !relevantUrls.has(result.url));
}

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

    if (config.useRateLimiting && ratelimit) {
      const identifier = headers().get('x-forwarded-for') || headers().get('x-real-ip') || headers().get('cf-connecting-ip') || headers().get('client-ip') || "";
      const { success, limit, reset, remaining } = await ratelimit.limit(identifier)
      console.log('Rate limit:', { success, limit, reset, remaining });
      if (!success) {
        return streamable.done({ 
          'status': 'ChatRateLimitReached',
          'rateLimitInfo': { limit, reset, remaining }
        });
      }
    }

    const currentTimestamp = new Date().toISOString();

    const isNewsQuery = (query: string): boolean => {
      const newsKeywords = ['news', 'headline', 'breaking', 'latest', 'today', 'current', 'these days', 'recent', 'new', 'update' ];
      return newsKeywords.some(keyword => query.toLowerCase().includes(keyword));
    };

    const isNewsSearch = isNewsQuery(userMessage);

    // Parallel execution of initial searches
    const [webSearchResults, relevantDocuments, images, videos] = await Promise.all([
      performWebSearch(userMessage, config.startIndexOfPagesToScan, config.numberOfPagesToScan, isNewsSearch),
      getUserSharedDocument(userMessage, embeddings, index),
      isRefresh ? null : performImageSearch(userMessage),
      isRefresh ? null : performVideoSearch(userMessage)
    ]);
    // console.log('relevantDocuments:', relevantDocuments);
    // Immediately update streamable with available results
    streamable.update({
      relevantDocuments,
      processedWebResults: webSearchResults.slice(config.startIndexOfPagesToScan, config.numberOfPagesToScan),
      ...(isRefresh ? {} : { images, videos })
    });

    // Process web search results
    let processedResults: SearchResult[] = isNewsSearch
    ? (webSearchResults as NewsResult[]).map((result): SearchResult => ({
        title: result.title,
        pageContent: `${result.snippet} (Source: ${result.source}, Date: ${result.date})`,
        url: result.link,
        date: result.date
      }))
    : webSearchResults as SearchResult[];
  

    const slicedWebSearchResults = processedResults.slice(config.startIndexOfPagesToScan, config.numberOfPagesToScan);

    // Fetch and process content in parallel
    const contentPromises = slicedWebSearchResults.map(source => fetchAndProcessContent(source));
    const blueLinksContents = (await Promise.all(contentPromises)).filter((content): content is ContentResult => content !== null);

    // Process and vectorize content
    const processedWebResults = await processAndVectorizeContent(blueLinksContents, userMessage, embeddings);

    const uniqueProcessedWebResults = removeDuplicates(
      processedWebResults.length > 0 ? processedWebResults : slicedWebSearchResults,
      relevantDocuments || []
    );

    // Update streamable with processed results
    streamable.update({ 'processedWebResults': uniqueProcessedWebResults.slice(0, config.numberOfSimilarityResults) });

    // Prepare final results for LLM prompt
    const promptProcessedWebResults = uniqueProcessedWebResults.slice(0, config.numberOfSimilarityResults);
    console.log('Prompt processed web results:', promptProcessedWebResults);

    // LLM request
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
        
    const chatCompletion = await openai.chat.completions.create({
      temperature: 0.3, 
      messages,
      stream: true,
      model: selectedModel
    });

    for await (const chunk of chatCompletion) {
      if (chunk.choices[0].delta && chunk.choices[0].finish_reason !== "stop" && chunk.choices[0].delta.content !== null) {
        streamable.update({ 'llmResponse': chunk.choices[0].delta.content });
      } else if (chunk.choices[0].finish_reason === "stop") {
        streamable.update({ 'llmResponseEnd': true });
      }
    }

    // Generate follow-up questions after LLM response
    const followUp = await relevantQuestions(
      [...promptProcessedWebResults, ...(relevantDocuments || [])],
      userMessage,
      selectedModel
    );
    streamable.update({ 'followUp': followUp });
    streamable.done({ status: 'done' });
  })();

  return streamable.value;
}

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

export const AI = createAI({
  actions: {
    myAction  },
  initialUIState,
  initialAIState
});