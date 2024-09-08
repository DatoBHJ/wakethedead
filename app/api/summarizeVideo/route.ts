import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { config } from '../../config';
import { checkCachedArticle, generateUniqueKey } from '@/lib/utils/cacheUtils';
import { fetchVideoInfo, fetchLinkInfo } from '@/lib/utils/fetchinfo';
import { Index } from "@upstash/vector";
import { SemanticCache } from "@upstash/semantic-cache";
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from '@langchain/openai';
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { fetchTranscriptWithBackup } from '@/lib/youtube-transcript';

export const runtime = 'edge';

let openai: OpenAI;
let semanticCache: SemanticCache | undefined;

openai = new OpenAI({
  baseURL: config.nonOllamaBaseURL,
  apiKey: config.inferenceAPIKey
});

// Set up embeddings
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

// Set up Upstash Vector Index for embeddings
const UPSTASH_VECTOR_REST_URL = process.env.UPSTASH_REDIS_REST_URL_2;
const UPSTASH_VECTOR_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN_2;

if (!UPSTASH_VECTOR_REST_URL || !UPSTASH_VECTOR_REST_TOKEN) {
  console.error("Upstash Vector environment variables are not set correctly");
  throw new Error("Upstash Vector configuration is missing");
}

const embeddingsIndex = new Index({
  url: UPSTASH_VECTOR_REST_URL,
  token: UPSTASH_VECTOR_REST_TOKEN,
});

// Set up Semantic Cache
if (config.useSemanticCache) {
  const UPSTASH_VECTOR_REST_URL = process.env.UPSTASH_REDIS_REST_URL_1;
  const UPSTASH_VECTOR_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN_1;

  if (!UPSTASH_VECTOR_REST_URL || !UPSTASH_VECTOR_REST_TOKEN) {
    console.error("Upstash Vector environment variables are not set correctly");
    throw new Error("Upstash Vector configuration is missing");
  }

  const index = new Index({
    url: UPSTASH_VECTOR_REST_URL,
    token: UPSTASH_VECTOR_REST_TOKEN,
  });

  semanticCache = new SemanticCache({ index, minProximity: 0.99 });
}
async function embedTranscripts(transcript: string, videoId: string, videoInfo: any, videoUrl:string): Promise<void> {
    const textSplitter = new RecursiveCharacterTextSplitter({ 
      chunkSize: config.textChunkSize,
      chunkOverlap: config.textChunkOverlap
    });
  
    try {
      const metadata = {
        title: videoInfo.title || '',
        author: videoInfo.author || '',
        link: videoUrl,
      };
  
      const chunks = await textSplitter.createDocuments([transcript], [metadata]);
  
      const embeddingPromises = chunks.map(async (chunk) => {
        const formattedContent = convertTimestamps(chunk.pageContent);
        const embedding = await embeddings.embedQuery(formattedContent);
        return embeddingsIndex.upsert([
          {
            id: `${videoId}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            vector: embedding,
            metadata: {
              content: formattedContent,
              title: metadata.title,
              link: metadata.link
            }
          }
        ]);
      });
      
      await Promise.all(embeddingPromises);
      console.log(`Embeddings created for video: ${videoId}`);
    } catch (error) {
      console.error("Error in embedTranscripts:", error);
    }
  }

  function formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
  
    if (hours > 0) {
      return `[${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}]`;
    } else {
      return `[${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}]`;
    }
  }
  
  function convertTimestamps(content: string): string {
    return content.replace(/\[(\d+(?:\.\d+)?)\]/g, (match, seconds) => {
      return formatTimestamp(parseFloat(seconds));
    });
  }
  
  async function generateCasualSummary(chunk: string, videoInfo: any, selectedModel: string, chunkNumber: number, totalChunks: number): Promise<any> {
    const formattedChunk = convertTimestamps(chunk);
    console.log('formattedChunk:', formattedChunk);
    const response = await openai.chat.completions.create({
      model: selectedModel,
      messages: [
        {
          role: "system",
          content: "You're casually watching a YouTube video and jotting down quick, brief, informal notes. Use everyday language, and include brief personal reactions or questions."
        },
        {
          role: "user",
          content: `Create casual, quick notes for part ${chunkNumber} of ${totalChunks} of this video: "${videoInfo.title || ''}" by ${videoInfo.author || ''}. 
          Use many relevant emojis !! Include:
          - A super brief "what's this part about" line
          - A few key points with timestamps (always use [HH:MM:SS] or [MM:SS] format with square brackets)
          - Maybe 1 question/thought or reaction
  
          Base your notes on this transcript chunk:
          ${formattedChunk}
  
          Format your response like someone quickly jotting notes. Use dashes, arrows, emojis. Be brief and casual! Start with "Part ${chunkNumber}/${totalChunks}:" to indicate which part of the video these notes cover. Remember, always use square brackets for timestamps!`
        }
      ],
      temperature: 0.7,
      stream: true,
      max_tokens: 500,
    });
  
    return response;
  }
  
  async function generateArticleSummary(chunk: string, articleInfo: any, selectedModel: string, chunkNumber: number, totalChunks: number): Promise<any> {
    const response = await openai.chat.completions.create({
      model: selectedModel,
      messages: [
        {
          role: "system",
          content: "You're quickly skimming through an article and taking brief, informal notes. Use everyday language, and include short personal reactions or questions."
        },
        {
          role: "user",
          content: `Create casual, quick notes for part ${chunkNumber} of ${totalChunks} of this article: "${articleInfo.title || ''}".
          Use many relevant emojis !! Include:
          - A very brief "what's this part about" line
          - A few key points or interesting facts 
          - Maybe 1 question/thought or reaction
  
          Base your notes on this content chunk:
          ${chunk}
  
          Format your response like someone quickly jotting notes. Use dashes, arrows, emojis. Be brief and casual! Start with "Part ${chunkNumber}/${totalChunks}:" to indicate which part of the article these notes cover.
          If the chunk seems unrelated to the article title or contains ads, just write "🤔 Unrelated stuff..." or "📢 Looks like an ad?" and move on. 
          `
        }
      ],
      temperature: 0.7,
      stream: true,
      max_tokens: 500,
    });
  
    return response;
  }
  
  export async function POST(request: Request) {
    const { videoId, videoUrl, forceRegenerate, selectedModel, selectedLanguage } = await request.json();
  
    const language = selectedLanguage || 'en';
    console.log('selectedLanguage:', language);
    console.log('selectedModel:', selectedModel);
  
    const cacheKey = await generateUniqueKey(videoId, selectedModel, language);
    console.log('cachekey', cacheKey)
    
    const { exists, article } = await checkCachedArticle(cacheKey);
  
    if (!forceRegenerate && exists && article) {
      console.log('Returning cached summary');
      return new NextResponse(article, {
        headers: {
          'Content-Type': 'text/plain',
          'X-Cache-Exists': 'true',
          'X-Stream-Response': 'false',
        },
      });
    }
    
    try {
      let contentInfo;
      let transcript;
      let isYouTube = false;
  
      if (videoUrl.includes('youtube') || videoUrl.includes('youtu.be')) {
        isYouTube = true;
        contentInfo = await fetchVideoInfo(videoId);
        transcript = await fetchTranscriptWithBackup(videoId);
        if (!transcript) {
          return NextResponse.json({ error: 'Failed to fetch video transcript' }, { status: 500 });
        }
      } else {
        contentInfo = await fetchLinkInfo(videoUrl);
        transcript = contentInfo.content;
        if (!transcript) {
          return NextResponse.json({ error: 'Failed to fetch link content' }, { status: 500 });
        }
      }
  
      console.log('app/api/summarizeContent contentInfo:', { contentInfo });
  
      if (!forceRegenerate && !exists) {
        embedTranscripts(transcript, videoId, contentInfo, videoUrl);
      }
    
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 6000,
        chunkOverlap: 0,
      });
      const chunks = await textSplitter.splitText(transcript);
      const encoder = new TextEncoder();
  
      const customStream = new ReadableStream({
        async start(controller) {
          let accumulatedResponse = "";
  
          for (let i = 0; i < chunks.length; i++) {
            console.log(`Processing chunk ${i + 1} of ${chunks.length}`);
            const chunk = chunks[i];
            const summaryStream = isYouTube
              ? await generateCasualSummary(chunk, contentInfo, selectedModel, i + 1, chunks.length)
              : await generateArticleSummary(chunk, contentInfo, selectedModel, i + 1, chunks.length);
  
            for await (const part of summaryStream) {
              const content = part.choices[0]?.delta?.content || '';
              controller.enqueue(encoder.encode(content));
              accumulatedResponse += content;
            }
  
            if (i < chunks.length - 1) {
              controller.enqueue(encoder.encode('\n\n---\n\n'));
              accumulatedResponse += '\n\n---\n\n';
            }
          }
          
          controller.close();
  
        // Cache the complete generated summary
          await semanticCache.set(cacheKey, accumulatedResponse);
          console.log('Summary cached with key:', cacheKey);
        },
      });
  
      return new NextResponse(customStream, {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Stream-Response': 'true',
        },
      });
    }
    catch (error) {
      console.error('Error generating summary:', error);
      return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
    }
  }
  

export async function PUT(request: Request) {
  const { videoId, editedContent, selectedModel, selectedLanguage } = await request.json();

  console.log('PUT request:', { videoId, selectedModel, selectedLanguage });
  
  const cacheKey = await generateUniqueKey(videoId, selectedModel, selectedLanguage);

  try {
    if (config.useSemanticCache && semanticCache) {
      await semanticCache.set(cacheKey, editedContent);
      console.log('Edited summary cached with key:', cacheKey);
    }

    return new NextResponse(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error updating cached summary:', error);
    return NextResponse.json({ error: 'Failed to update cached summary' }, { status: 500 });
  }
}