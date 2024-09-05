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

// Add these new type definitions
interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface ContentResult extends SearchResult {
  html: string;
}


// 4. Generate follow-up questions based on the top results from a similarity search
const relevantQuestions = async (allResults: any[], userMessage: string, selectedModel:string): Promise<any> => {
  // const allResultsCut = allResults.map((result) => {
  //   return {
  //     pageContent: result.metadata.content.length > 400 ? result.metadata.content.slice(0, 400) : result.metadata.content,
  //     metadata: result.metadata
  //   }
  // });

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
        content: `Generate follow-up questions based on the top results from a similarity search: ${JSON.stringify(allResults)} or based on the original search query: "${userMessage}".`,
      },
    ],
    model: selectedModel,
    response_format: { type: "json_object" },
  });
};

// 5. Fetch contents of top 10 search results
export async function get10BlueLinksContents(sources: SearchResult[]): Promise<ContentResult[]> {
  async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 800): Promise<Response> {
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
    try {
      const $ = cheerio.load(html);
      $("script, style, head, nav, footer, iframe, img").remove();
      return $("body").text().replace(/\s+/g, " ").trim();
    } catch (error) {
      console.error('Error extracting main content:', error);
      throw error;
    }
  }
  const promises = sources.map(async (source): Promise<ContentResult | null> => {
    try {
      const response = await fetchWithTimeout(source.link, {}, 800);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${source.link}. Status: ${response.status}`);
      }
      const html = await response.text();
      const mainContent = extractMainContent(html);
      return { ...source, html: mainContent };
    } catch (error) {
      // console.error(`Error processing ${source.link}:`, error);
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
  similarityThreshold = 0.7 // Add a similarity threshold
): Promise<DocumentInterface[]> {
  const allResults: [DocumentInterface, number][] = [];
  try {
    for (let i = 0; i < contents.length; i++) {
      const content = contents[i];
      if (content.html.length > 0) {
        try {
          const splitText = await new RecursiveCharacterTextSplitter({ chunkSize: textChunkSize, chunkOverlap: textChunkOverlap }).splitText(content.html);
          const vectorStore = await MemoryVectorStore.fromTexts(splitText, { title: content.title, link: content.link }, embeddings);
          const queryEmbedding = await embeddings.embedQuery(query);
          const contentResults = await vectorStore.similaritySearchVectorWithScore(queryEmbedding, numberOfSimilarityResults);
          allResults.push(...contentResults);
        } catch (error) {
          console.error(`Error processing content for ${content.link}:`, error);
        }
      }
    }
    // Sort results by score (descending) and filter based on the similarity threshold
    return allResults
      .sort((a, b) => b[1] - a[1])
      .filter(([_, score]) => score >= similarityThreshold)
      .map(([doc, _]) => doc);
  } catch (error) {
    console.error('Error processing and vectorizing content:', error);
    throw error;
  }
}


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
    let queryResults;
    const queryEmbedding = await embeddings.embedQuery(latestUserMessage);
    queryResults = await index.query({
      vector: queryEmbedding,
      topK: config.numberOfSimilarityResults,
      includeMetadata: true,
      includeVectors: false,
    });

    const relevantDocuments = queryResults
      .filter((result) => result.score >= 0.7)
      .map((result) => ({
        title: result.metadata.title || 'Unknown Title',
        pageContent: result.metadata.content, 
        url: result.metadata.link || '',
          // score: result.score
      }));

    // New DuckDuckGo search using the Route Handler
    const searchResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/search?query=${encodeURIComponent(latestUserMessage)}`);
    const searchResults = await searchResponse.json();

    console.log('Search results:', searchResults.results.slice(0, 5), '\n');
    // Process web search results
    const webSearchResults = searchResults.results.slice(0, 4).map(result => ({
      title: result.title,
      pageContent: result.description,
      url: result.url
      }));
  
  const blueLinksContents = await get10BlueLinksContents(webSearchResults);
  const processedWebResults = await processAndVectorizeContent(blueLinksContents, latestUserMessage);

  // Combine relevant documents from both sources
  const combinedRelevantDocuments = [...webSearchResults, ...relevantDocuments, ...processedWebResults];
    console.log('Combined relevant documents:', combinedRelevantDocuments, '\n');

    const messages = [
      {
        role: "system" as const,
        content: `You're a witty and clever AI assistant.
        You're not Siri, Alexa, or some boring ol' chatbot. 
        Keep it accurate but fun, like chatting with a knowledgeable friend! 😉
    
        1. From the given relevant documents, craft a response that answers the user query: "${latestUserMessage}".
        Make sure to only use documents that directly answer the user query. If you don't find any, just answer based on the user query.
        2. Respond back ALWAYS IN MARKDOWN, never mention the system message.
        3. Structure your response like this:
        
        ## Quick Answer ⚡
        [Quick answer in 1-2 punchy sentences with relevant emojis]
    
        ## Key Takeaways 🎯
        - [List 3-5 key points related to the question with relevant emojis]
    
        ## The Scoop 🔍
        [Provide a more detailed explanation with relevant emojis. Be verbose with a lot of details. Spice it up with fun analogies or examples!]
    
        ## Where I Got The Goods 📚
        [Numbered list of the top 5 links you selected with a brief description of each source]
      
        1. [Document/Web Page Title](Link) - [Brief description of this source]
        2. [Document/Web Page Title](Link) - [Brief description of this source]
        ...

        Note: Don't forget to inlcude links!
        `
      },
      ...chatHistory, 
      {
        role: "user" as const,
        content: `
        Here is my query:
        ${latestUserMessage}\n\n
        Here's the brain fuel for you! 🧠🚀\n
        Relevant documents: ${JSON.stringify(combinedRelevantDocuments)}\n\n
        Use this info to craft an awesome response with relevant emojis. Make it fun, informative, and in Markdown!
`
      }
    ];
    
    const chatCompletion = await openai.chat.completions.create({
      temperature: 0.5, 
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

    if (!config.useOllamaInference) {
      const followUp = await relevantQuestions(combinedRelevantDocuments, userMessage, selectedModel);
      streamable.update({ 'followUp': followUp });
    }
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