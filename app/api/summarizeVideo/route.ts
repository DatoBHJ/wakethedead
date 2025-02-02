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
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from 'next/headers'

export const runtime = 'edge';

// OpenAI configuration handler based on selected model
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

// Initialize rate limiting if enabled in config
let ratelimit: Ratelimit | undefined;
if (config.useRateLimiting) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "10 m") 
  });
}

let openai: OpenAI;
let semanticCache: SemanticCache | undefined;
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

  semanticCache = new SemanticCache({ index, minProximity: 0.99 }); // Set minProximity to 0.99 for exact match
}

// Processes and stores transcript embeddings with metadata
async function embedTranscripts(transcript: string, videoId: string, contentInfo: any, videoUrl: string, cacheKey: string): Promise<void> {
  const textSplitter = new RecursiveCharacterTextSplitter({ 
    chunkSize: config.textChunkSize,
    chunkOverlap: config.textChunkOverlap
  });

  try {
    // Prepare metadata for embedding storage
    const metadata = {
      title: contentInfo.title || '',
      author: contentInfo.author || '',
      link: videoUrl,
    };

    // Create and store embeddings for each chunk
    const chunks = await textSplitter.createDocuments([transcript], [metadata]);

    const embeddingPromises = chunks.map(async (chunk, index) => {
      const formattedContent = `${convertTimestamps(chunk.pageContent)}\nTitle: ${metadata.title}\nAuthor: ${metadata.author}\nLink: ${metadata.link}`;
      const embedding = await embeddings.embedQuery(formattedContent);
      return embeddingsIndex.upsert([
        {
          id: `${cacheKey}-chunk${index + 1}`,
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

// Converts raw seconds to formatted timestamp strings
function convertTimestamps(content: string): string {
  return content.replace(/\[(\d+(?:\.\d+)?)\]/g, (match, seconds) => {
    return formatTimestamp(parseFloat(seconds));
  });
}

// Formats seconds into HH:MM:SS or MM:SS format
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

// Generates an enthusiastic video summary in a specified language
async function generateCasualSummary(chunk: string, videoInfo: any, selectedModel: string, chunkNumber: number, totalChunks: number, selectedLanguage: string): Promise<any> {
  openai = new OpenAI(getOpenAIConfig(selectedModel));

  const formattedChunk = convertTimestamps(chunk);
  console.log('formattedChunk:', { formattedChunk });
  const response = await openai.chat.completions.create({
    model: selectedModel,
    messages: [
      {
        role: "system",
        content: `
You're a SUPER EXCITED fan watching your absolute FAVORITE topic video! 🤩✨
Respond in ${selectedLanguage} and use emojis and symbols to show your excitement!!!

IMPORTANT: Only include statistics, ratings, or numerical information that are EXPLICITLY mentioned in the provided transcript chunk. Never make up or assume any numbers that aren't directly stated in the text.
        `
      },
      {
        role: "user",
        content: `
Create super CASUAL short summary notes for part ${chunkNumber}/${totalChunks} of this video: "${videoInfo.title || ''}" by ${videoInfo.author || ''}. 
Respond in ${selectedLanguage}.

Your note MUST include these 4 elements, using ONLY information explicitly stated in the transcript: 
1. A level 1 heading (#) "Part ${chunkNumber}/${totalChunks}". 
2. A 1-2 sentence summary that includes:
   - Main points or conclusions DIRECTLY from the chunk
   - IF PROVIDED in the chunk: exact statistics, ratings, or numerical information
   - Start with ##, without spaces or line breaks
3. Key moments with timestamps. For each moment:
   - Only include details explicitly mentioned
   - Use **bold** for important keywords
   - Keep it concise
4. 1 standalone question that starts with a blockquote (>). Base it on actual content from the chunk.

Format:
# Part ${chunkNumber}/${totalChunks}
## [summary based only on chunk content]
[Key moments with verified timestamps] & > question

Important Guidelines:
- Answer in MARKDOWN format
- Add emojis and symbols for excitement
- Only bold the most important words in key moments
- User knows the video title and author, so don't repeat them
- Be super CASUAL and excited, like you're at a concert!
- CRUCIAL: Only include information that appears in this specific chunk
- Never make up or assume any statistics, ratings, or numbers

Transcript chunk to summarize (use ONLY this content):
${formattedChunk}`
      }
    ],
    temperature: 0.6,
    stream: true,
    max_tokens: 500,
  });

  return response;
}

// Generates an enthusiastic article summary in a specified language
async function generateArticleSummary(chunk: string, articleInfo: any, selectedModel: string, chunkNumber: number, totalChunks: number, selectedLanguage: string): Promise<any> {
  openai = new OpenAI(getOpenAIConfig(selectedModel));

  const response = await openai.chat.completions.create({
    model: selectedModel,
    messages: [
      {
        role: "system",
        content: `
You're an ENTHUSIASTIC reader totally OBSESSED with the topic! 🤓📚
Respond in ${selectedLanguage} and use LOTS of emojis and symbols to show your excitement!!!
Use CAPS and exclamation marks to emphasize important points!!!
Your enthusiasm should be THROUGH THE ROOF for every detail!!!
        `
      },
      {
        role: "user",
        content: `
Jot down super CASUAL summary notes for part ${chunkNumber}/${totalChunks} of this article: "${articleInfo.title || ''}". 
Respond in ${selectedLanguage}.

Your note MUST include these 4 elements: 
1. A level 1 heading (#) "Part ${chunkNumber}/${totalChunks}". 
2. A 1-2 sentence summary, including crucial information or major points, starting with ##, without any spaces or line breaks.
3. Key points (be concise, 7-10 words each).  Use **bold** to emphasize key words. 
4. 1 standalone question that starts with a blockquote (>). 

Format:
# Part ${chunkNumber}/${totalChunks}
## [summary]
[Key points] & > question

Important Guidelines:
- Answer in MARKDOWN format. 
- The summary should be visually appealing with emojis and symbols. 
- Be super CASUAL and excited, like you're at a concert! 

Article chunk:
        ${chunk}`
      }
    ],
    temperature: 0.5,
    stream: true,
    max_tokens: 500,
  });

  return response;
}

export async function POST(request: Request) {
  // Extract and validate request parameters
  const { videoId, videoUrl, forceRegenerate, selectedModel, selectedLanguage } = await request.json();

  const language = selectedLanguage || 'en';
  const cacheKey = await generateUniqueKey(videoId, selectedModel, language);

  // Check cache before proceeding
  const { exists, article } = await checkCachedArticle(cacheKey);

  if (!forceRegenerate && exists && article) {
    console.log('Returning cached summary', cacheKey);
    try {
      const parsedArticle = JSON.parse(article);
      return new NextResponse(parsedArticle.content, {
        headers: {
          'Content-Type': 'text/plain',
          'X-Cache-Exists': 'true',
          'X-Stream-Response': 'false',
        },
      });
    } catch (error) {
      console.error('Error parsing cached article:', error);
      return new NextResponse(article, {
        headers: {
          'Content-Type': 'text/plain',
          'X-Cache-Exists': 'true',
          'X-Stream-Response': 'false',
        },
      });
    }
  }

  // Handle rate limiting for non-cached requests
  if (config.useRateLimiting && ratelimit && (!exists || forceRegenerate)) {
    const identifier = headers().get('x-forwarded-for') || 
                       headers().get('x-real-ip') || 
                       headers().get('cf-connecting-ip') || 
                       headers().get('client-ip') || "";
    const { success, limit, reset, remaining } = await ratelimit.limit(identifier)
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', limit, reset, remaining },
        { status: 429 }
      );
    }
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
        return NextResponse.json({ error: 'Failed to fetch video link content' }, { status: 500 });
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
      embedTranscripts(transcript, videoId, contentInfo, videoUrl, cacheKey);
    }
  
    // // forceRegenerate가 true이거나 캐시가 없을 때 임베딩 생성
    // if (forceRegenerate || !exists) {
    //   await embedTranscripts(transcript, videoId, contentInfo, videoUrl, cacheKey);
    // }

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 6000,
      chunkOverlap: 0,
    });
    const chunks = await textSplitter.splitText(transcript);
    const encoder = new TextEncoder();

    const customStream = new ReadableStream({
      async start(controller) {
        let accumulatedResponse = "";
        let validChunksCount = 0;
  
        const validChunks = chunks.filter(chunk => chunk.length >= config.MINIMUM_CHUNK_SIZE);
        const totalValidChunks = validChunks.length;
  
        for (const chunk of validChunks) {
          validChunksCount++;
          
          try {
            const summaryStream = isYouTube
              ? await generateCasualSummary(chunk, contentInfo, selectedModel, validChunksCount, totalValidChunks, language)
              : await generateArticleSummary(chunk, contentInfo, selectedModel, validChunksCount, totalValidChunks, language);
  
            for await (const part of summaryStream) {
              const content = part.choices[0]?.delta?.content || '';
              controller.enqueue(encoder.encode(content));
              accumulatedResponse += content;
            }
  
            if (validChunksCount < totalValidChunks) {
              controller.enqueue(encoder.encode('\n\n---\n\n'));
              accumulatedResponse += '\n\n---\n\n';
            }
          } catch (error) {
            console.error('Error processing chunk:', error);
            if (error.status === 429) {
              controller.enqueue(encoder.encode(`Error: ${error.error.message}`));
              controller.close();
              return;
            } else {
              throw error;
            }
          }
        }
  
        const cacheData = {
          content: accumulatedResponse,
          title: contentInfo.title || '',
          link: videoUrl,
          timestamp: Date.now(),
          publishedTime: contentInfo.publishedTime || ''
        };
        await semanticCache.set(cacheKey, JSON.stringify(cacheData));
        console.log('Summary cached with key:', cacheKey);
        console.log('Generated article link:', videoUrl);
        console.log('Generated article content:', accumulatedResponse);

        controller.close();
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
    if (error.status === 429) {
      return NextResponse.json({ error: error.error.message }, { status: 429 });
    }
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
  
export async function PUT(request: Request) {
  const { videoId, editedContent, selectedModel, selectedLanguage, title, link } = await request.json();

  console.log('PUT request:', { videoId, selectedModel, selectedLanguage });
  
  const cacheKey = await generateUniqueKey(videoId, selectedModel, selectedLanguage);

  try {
    if (config.useSemanticCache && semanticCache) {
      const cacheData = {
        content: editedContent,
        title: title || '',
        link: link,
        timestamp: Date.now()
      };
      await semanticCache.set(cacheKey, JSON.stringify(cacheData));
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