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
import cheerio from 'cheerio';
// import { functionCalling } from './function-calling';
import { performWebSearch, performImageSearch, performVideoSearch } from './tools/Providers';

export const runtime = 'edge';

// 1. Set up the OpenAI API based on the config.tsx
let openai: OpenAI;
openai = new OpenAI({
  baseURL: config.nonOllamaBaseURL,
  apiKey: config.inferenceAPIKey
});

// 2. Set up the embeddings model based on the config.tsx
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

// 3. Set up the Upstash vector index
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

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface SearchResult {
  title: string;
  url: string;
  pageContent: string;
}

interface ContentResult extends SearchResult {
  html: string;
}


async function getUserSharedDocument(latestUserMessage: string, embeddings: OllamaEmbeddings | OpenAIEmbeddings, index: Index) {
  const queryEmbedding = await embeddings.embedQuery(latestUserMessage);
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
      title: result.metadata.title,
      pageContent: result.metadata.content,
      url: result.metadata.link,
      score: result.score
    }));
}


// 5. Fetch contents of top 10 search results
export async function get10BlueLinksContents(sources: SearchResult[]): Promise<ContentResult[]> {
  async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = config.timeout): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (error) {
        console.log(`Skipping ${url}!`);
      }
      throw error;
    }
  }

  
  function extractMainContent(html: string): string {
    let content = '';
    const mainContent = html.match(/<main[\s\S]*?>([\s\S]*?)<\/main>/i) ||
                        html.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i) ||
                        html.match(/<div[\s\S]*?class=["'][\s\S]*?content[\s\S]*?["'][\s\S]*?>([\s\S]*?)<\/div>/i);
    
    if (mainContent) {
      content = mainContent[1]
        .replace(/<script[\s\S]*?<\/script>/gi, '') // Remove script tags
        .replace(/<style[\s\S]*?<\/style>/gi, '')   // Remove style tags
        .replace(/<[^>]*>/g, ' ')              // Remove remaining HTML tags
        .replace(/\s+/g, ' ')                  // Replace multiple spaces with single space
        .trim();                               // Trim leading and trailing spaces
    } else {
      // Fallback to extracting content from body if main content is not found
      content = html.replace(/<head[\s\S]*?<\/head>/i, '')
                    .replace(/<script[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[\s\S]*?<\/style>/gi, '')
                    .replace(/<[^>]*>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
    }
    
    return content;
  }

  const promises = sources.map(async (source): Promise<ContentResult | null> => {
    try {
      const response = await fetchWithTimeout(source.url, {}, config.timeout);
      // if (!response.ok) {
      //   throw new Error(`Failed to fetch ${source.url}. Status: ${response.status}`);
      // }
      const html = await response.text();
      const mainContent = extractMainContent(html);
      return { ...source, html: mainContent };
    } catch (error) {
      console.error(`Error processing ${source.url}:`, error);
      return null;
    }
  });
  try {
    const results = await Promise.all(promises);
    return results.filter((source): source is ContentResult => source !== null);
  } catch (error) {
    console.error('Error fetching and processing blue links contents:', error);
    throw error;
  }
}
// 6. Process and vectorize content using LangChain
async function processAndVectorizeContent(
  contents: ContentResult[],
  query: string,
  textChunkSize = config.textChunkSize,
  textChunkOverlap = config.textChunkOverlap,
  numberOfSimilarityResults = config.numberOfSimilarityResults,
): Promise<SearchResult[]> {
  const relevantDocuments: [DocumentInterface, number][] = [];
  try {
    for (let i = 0; i < contents.length; i++) {
      const content = contents[i];
      if (content.html.length > 0) {
        try {
          const splitText = await new RecursiveCharacterTextSplitter({ chunkSize: textChunkSize, chunkOverlap: textChunkOverlap }).splitText(content.html);
          const vectorStore = await MemoryVectorStore.fromTexts(splitText, { title: content.title, url: content.url }, embeddings);
          const queryEmbedding = await embeddings.embedQuery(query);
          const contentResults = await vectorStore.similaritySearchVectorWithScore(queryEmbedding, numberOfSimilarityResults);
          relevantDocuments.push(...contentResults);
        } catch (error) {
          console.error(`Error processing content for ${content.url}:`, error);
        }
      }
    }
    // Sort results by score (descending), filter based on the similarity threshold, and return title, pageContent, url, and score
    return relevantDocuments
      .sort((a, b) => b[1] - a[1])
      .filter(([_, score]) => score >= config.similarityThreshold)
      .map(([doc, score]) => ({
        title: doc.metadata.title as string,
        pageContent: doc.pageContent,
        url: doc.metadata.url as string,
        score: score
      }));
  } catch (error) {
    console.error('Error processing and vectorizing content:', error);
    throw error;
  }
}


// 4. Generate follow-up questions based on the top results from a similarity search
const relevantQuestions = async (sources: SearchResult[], userMessage: String, selectedModel:string): Promise<any> => {
  return await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `
          You are a Question generator who generates an array of 3 follow-up questions in JSON format.
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
        content: `Generate follow-up questions based on the top results from a similarity search: ${JSON.stringify(sources)}. The original search query is: "${userMessage}".`,
      },
    ],
    model: selectedModel,
    response_format: { type: "json_object" },
  });
};


// 6. Main action function that orchestrates the entire process
async function myAction(
  chatHistory: ChatMessage[],
  userMessage: string, 
  selectedModel: string,
  selectedLanguage: string,
): Promise<any> {
  "use server";

  const streamable = createStreamableValue({});
  (async () => {
    const latestUserMessage = chatHistory[chatHistory.length - 1].content;
    const currentTimestamp = new Date().toISOString();
    const userMessageWithTimestamp = `${currentTimestamp}: ${latestUserMessage}`;
    console.log('User message:', latestUserMessage, '\n');
    
    const [images, webSearchResults, videos, relevantDocuments] = await Promise.all([
      performImageSearch(latestUserMessage),
      performWebSearch(latestUserMessage, config.numberOfPagesToScan),
      performVideoSearch(latestUserMessage),
      getUserSharedDocument(latestUserMessage, embeddings, index)
    ]);

    // console.log('length of images', images.length);
    streamable.update({'relevantDocuments': relevantDocuments});
    streamable.update({ 'searchResults': webSearchResults });
    streamable.update({ 'images': images });
    streamable.update({ 'videos': videos });

    // console.log('Relevant documents:', relevantDocuments, '\n');
    // console.log('Web search results:', webSearchResults, '\n');
    // console.log('Images:', images, '\n');
    // console.log('Videos:', videos, '\n');

    const blueLinksContents = await get10BlueLinksContents(webSearchResults);
    let processedWebResults = await processAndVectorizeContent(blueLinksContents, userMessageWithTimestamp);

    // processedWebResults 있으면 그대로 processedWebResults 를 사용하고, 없으면 webSearchResults 를 사용한다.
    processedWebResults = processedWebResults.length > 0 ? processedWebResults : webSearchResults;
    // console.log('Processed web results:', processedWebResults.slice(0,config.numberOfSimilarityResults), '\n');    

    streamable.update({ 'processedWebResults': processedWebResults.slice(0,config.numberOfSimilarityResults) });



    const messages = [
      {
        role: "system" as const,
        content: `You're a witty and clever AI assistant.
        Keep it accurate but fun, like chatting with a knowledgeable friend! 😉
    
        1. Answer the user query using only relevant documents from the provided sources.
        If you find any conflicting or outdated information, trust sources shared by web search results over user-shared documents.
        Also fyi squared brackets like [HH:MM:SS] or [MM:SS] are timestamps for videos.\n\n
        Today's date and time: 
        ${currentTimestamp}\n\n
        Sources from the web:
        ${JSON.stringify(processedWebResults.slice(0,config.numberOfSimilarityResults))}\n\n
        Sources shared by users:
        ${JSON.stringify(relevantDocuments)}\n\n

        2. Respond back ALWAYS IN MARKDOWN, following the format <answerFormat> below.
        <answerFormat>
        ## Quick Answer ⚡
        [Quick answer to the user message in 1-2 punchy sentences with relevant emojis]
    
        ## Key Takeaways 🎯
        - [List 3-5 key points related to the question with relevant emojis]
    
        ## The Scoop 🔍
        [Provide a more detailed explanation with relevant emojis. Be verbose with a lot of details. Spice it up with fun analogies or examples!]
        </answerFormat>
        `
      },
      ...chatHistory, 
      {
        role: "user" as const,
        content: `
        Here is my query:
        ${latestUserMessage}\n\n
        I speak ${selectedLanguage} and I want you to respond in ${selectedLanguage}.\n\n
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
    

    const followUp = await relevantQuestions(webSearchResults, userMessage, selectedModel);
    streamable.update({ 'followUp': followUp });

    streamable.done({ status: 'done' });
  })();
  return streamable.value;
}

// 7. Define initial AI and UI states
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

// 8. Export the AI instance
export const AI = createAI({
  actions: {
    myAction  },
  initialUIState,
  initialAIState
});