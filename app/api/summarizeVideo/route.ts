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
async function embedTranscripts(transcript: string, videoId: string, contentInfo: any, videoUrl: string, cacheKey: string): Promise<void> {
  const textSplitter = new RecursiveCharacterTextSplitter({ 
    chunkSize: config.textChunkSize,
    chunkOverlap: config.textChunkOverlap
  });

  try {
    const metadata = {
      title: contentInfo.title || '',
      author: contentInfo.author || '',
      link: videoUrl,
    };

    const chunks = await textSplitter.createDocuments([transcript], [metadata]);

    const embeddingPromises = chunks.map(async (chunk, index) => {
      // const formattedContent = convertTimestamps(chunk.pageContent);
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

// async function generateCasualSummary(chunk: string, videoInfo: any, selectedModel: string, chunkNumber: number, totalChunks: number, selectedLanguage: string): Promise<any> {
//   const formattedChunk = convertTimestamps(chunk);
//   // console.log('formattedChunk:', formattedChunk);
//   console.log('selectedModel:', selectedModel);
//   const response = await openai.chat.completions.create({
//     model: selectedModel,
//     messages: [
//       {
//         role: "system",
//         content: `
//         You're casually watching a YouTube video and scribbling down quick, messy, informal short notes filled with emojis.
//         Use everyday language, be super casual - like real handwritten notes.
//         Always respond in the user's preferred language, which is ${selectedLanguage}.
//         Your response must include all required 4 elements.`
//       },
//       {
//         role: "user",
//         content: `Scribble down some casual notes for part ${chunkNumber} of ${totalChunks} of this video: "${videoInfo.title || ''}" by ${videoInfo.author || ''}. 
//         I speak ${selectedLanguage}, so respond in that language.\n\n
//         Sprinkle in LOTS of relevant emojis! Your response MUST include these 4 elements:\n
//         1. A level 1 heading (#) "Part ${chunkNumber}/${totalChunks}"\n\n
//         2. A level 2 heading (##) that has a summary with 1-2 sentences, including ANY crucial information or major conclusions, even if briefly mentioned.
//           For example, if a specific data, number, score, or event is mentioned, ALWAYS include it.\n\n
//         3. Casual short summary scribble, maximum 3-8 concise key points that have timestamps at the beginning of each point.\n
//           * Timestamps should be in [HH:MM:SS] or [MM:SS] format with square brackets.\n
//           * Avoid directly quoting or listing the transcript CHUNK.\n
//           * Be short, casual and informal. Use emojis, arrows (->), squiggles (~), and other doodles.\n\n
//         4. 1 follow-up question which starts with a blockquote (>).\n
//           * Each question should be self-contained and clearly indicate what it's about without needing context.\n
//           * Avoid questions that rely on personal opinions or subjective experiences of the LLM.\n
//           * Focus on questions that can be answered based on factual information, analysis, or interpretation of known events/works.\n\n

//         Follow this format:\n
//         # Part ${chunkNumber}/${totalChunks}\n
//         ## [Summary with 1-2 sentences]\n
//         [casual short summary scribble with key points that have timestamps]\n
//         > [Follow-up question]\n\n

//         Base your scribbles on this CHUNK:\n
//         ${formattedChunk}\n\n

//         Remember, always to answer in MARKDOWN with emojis and do not include any notes or explanations about the format in your response.
//         `
//       }
//     ],
//     temperature: 0.6,
//     stream: true,
//     max_tokens: 500,
//   });

//   return response;
// }

// async function generateArticleSummary(chunk: string, articleInfo: any, selectedModel: string, chunkNumber: number, totalChunks: number, selectedLanguage: string): Promise<any> {
//   const response = await openai.chat.completions.create({
//     model: selectedModel,
//     messages: [
//       {
//         role: "system",
//         content: `You're casually skimming an article and scribbling down quick, messy, informal short notes filled with emojis.
//         Use everyday language, be super casual - like real handwritten notes.
//         Always respond in the user's preferred language, which is ${selectedLanguage}.
//         Your response must include all required 4 elements.`
//       },
//       {
//         role: "user",
//         content: `Scribble down some casual, messy notes for part ${chunkNumber} of ${totalChunks} of this article: "${articleInfo.title || ''}". 
//         I speak ${selectedLanguage}, so respond in that language.\n\n
//         Sprinkle in LOTS of relevant emojis! Your response MUST include these 4 elements:\n
//         1. A level 1 heading (#) "Part ${chunkNumber}/${totalChunks}"\n\n
//         2. A level 2 heading (##) that has a summary with 1-2 sentences, including ANY crucial information or major conclusions, even if briefly mentioned.
//           For example, if a specific data, number, score, or event is mentioned, ALWAYS include it.\n\n
//         3. Casual short summary scribble, maximum 3-8 key points.\n
//           * Avoid directly quoting or listing the article content.\n
//           * Be short, casual and informal. Use arrows (->), squiggles (~), and other doodles.\n\n
//         4. 1 follow-up question which starts with a blockquote (>).\n
//           * Each question should be self-contained and clearly indicate what it's about without needing context.\n
//           * Avoid questions that rely on personal opinions or subjective experiences of the LLM.\n
//           * Focus on questions that can be answered based on factual information, analysis, or interpretation of known events/works.\n\n

//         Follow this format:\n
//         # Part ${chunkNumber}/${totalChunks}\n
//         ## [Summary with 1-2 sentences]\n
//         [casual short summary scribble with key points]\n
//         > [Follow-up question]\n\n

//         Base your scribbles on this:\n
//         Chunk: ${chunk}\n\n
        
//         Remember, always to answer in MARKDOWN and do not include any notes or explanations about the format in your response.
//         If the chunk seems unrelated to the article title or contains ads, just write "🤔 Unrelated content..." or "📢 Possible advertisement?" and move on.
//         `
//       }
//     ],
//     temperature: 0.7,
//     stream: true,
//     max_tokens: 500,
//   });

//   return response;
// }
  
async function generateCasualSummary(chunk: string, videoInfo: any, selectedModel: string, chunkNumber: number, totalChunks: number, selectedLanguage: string): Promise<any> {
  const formattedChunk = convertTimestamps(chunk);
  console.log('selectedModel:', selectedModel);
  const response = await openai.chat.completions.create({
    model: selectedModel,
    messages: [
      {
        role: "system",
        content: `
        You're casually watching a YouTube video and creating quick, informal notes with emojis.
        Use everyday language and be super casual - like real handwritten notes.`
      },
      {
        role: "user",
        content: `Create casual notes for part ${chunkNumber} of ${totalChunks} of this video: "${videoInfo.title || ''}" by ${videoInfo.author || ''}. 
        I speak ${selectedLanguage}, so respond in that language.\n\n
        Include LOTS of relevant emojis! Your MARKDOWN response MUST have these 4 elements:\n
        1. A level 1 heading (#) "Part ${chunkNumber}/${totalChunks}"\n\n
        2. A level 2 heading (##) followed immediately by a short but comprehensive summary in 1-2 sentences with emojis:
          * Start with "## " and then write that summary.
          * Focus on the most crucial information or main idea of this chunk.
          * Include ANY key data, numbers, scores, or events if mentioned.
          * Use emojis, arrows (→, ↑, ↓), or other relevant symbols to enhance readability and make the summary more visually appealing.\n\n
        3. Casual short scribble with 2-5 key points:
          * Start each point with timestamp which should be in [HH:MM:SS] or [MM:SS] format with square brackets.
          * Avoid directly quoting or listing the transcript chunk.
          * Be short, casual and informal. Use emojis, arrows (->), squiggles (~), and other doodles.\n\n
        4. 1 follow-up question starting with a blockquote (>):
          * Make it self-contained and clearly indicate its topic.
          * Aim for a thought-provoking question that encourages further exploration.\n\n

        Follow this MARKDOWN format:\n
        # Part ${chunkNumber}/${totalChunks}\n
        ## Comprehensive summary in 1-2 sentences\n
        casual short scribble with key points and timestamps\n
        > [Follow-up question]\n\n

        Base your notes on this transcript chunk:\n
        ${formattedChunk}\n\n

        Remember to have all 4 ELEMENTS in your MARKDOWN response and NEVER INCLUDE any notes or explanations or system prompts in your response.
        `
      }
    ],
    temperature: 0.8,
    stream: true,
    max_tokens: 500,
  });

  return response;
}

async function generateArticleSummary(chunk: string, articleInfo: any, selectedModel: string, chunkNumber: number, totalChunks: number, selectedLanguage: string): Promise<any> {
  console.log('selectedModel:', selectedModel);
  const response = await openai.chat.completions.create({
    model: selectedModel,
    messages: [
      {
        role: "system",
        content: `You're casually reading an article and creating quick, informal notes with emojis.
        Use everyday language, be super casual - like real handwritten notes.
        `
      },
      {
        role: "user",
        content: `Create casual notes for part ${chunkNumber} of ${totalChunks} of this article: "${articleInfo.title || ''}". 
        I speak ${selectedLanguage}, so respond in that language.\n\n
        Include LOTS of relevant emojis! Your MARKDOWN response MUST have these 4 elements:\n
        1. A level 1 heading (#) "Part ${chunkNumber}/${totalChunks}"\n\n
        2. A level 2 heading (##) followed immediately by a short but comprehensive summary in 1-2 sentences with emojis:
          * Start with "## " and then write that summary.
          * Focus on the most crucial information or main idea of this chunk.
          * Include ANY key data, numbers, scores, or events if mentioned.
          * Use emojis, arrows (→, ↑, ↓), or other relevant symbols to enhance readability and make the summary more visually appealing.\n\n
        3. Casual short scribble with 2-5 key points:
          * Avoid directly quoting or listing the transcript chunk.
          * Be short, casual and informal. Use emojis, arrows (->), squiggles (~), and other doodles.\n\n
        4. 1 follow-up question starting with a blockquote (>):
          * Make it self-contained and clearly indicate its topic.
          * Aim for a thought-provoking question that encourages further exploration.\n\n

        Follow this MARKDOWN format:\n
        # Part ${chunkNumber}/${totalChunks}\n
        ## Comprehensive summary in 1-2 sentences\n
        casual short scribble with key points\n
        > [Follow-up question]\n\n

        Base your scribbles on this:\n
        Chunk: ${chunk}\n\n
        
        Remember to have all 4 ELEMENTS in your MARKDOWN response and NEVER INCLUDE any notes or explanations or system prompts in your response.
        If the chunk seems unrelated to the article title or contains ads, just write "🤔 Unrelated content..." or "📢 Possible advertisement?" and move on.
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
          try {
            const summaryStream = isYouTube
              ? await generateCasualSummary(chunk, contentInfo, selectedModel, i + 1, chunks.length, language)
              : await generateArticleSummary(chunk, contentInfo, selectedModel, i + 1, chunks.length, language);

            for await (const part of summaryStream) {
              const content = part.choices[0]?.delta?.content || '';
              controller.enqueue(encoder.encode(content));
              accumulatedResponse += content;
            }

            if (i < chunks.length - 1) {
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

        // Cache the complete generated summary with title, link, and timestamp
        const cacheData = {
          content: accumulatedResponse,
          title: contentInfo.title || '',
          link: videoUrl,
          timestamp: Date.now(),
          publishedTime: contentInfo.publishedTime || ''
        };
        await semanticCache.set(cacheKey, JSON.stringify(cacheData));
        console.log('Summary cached with key:', cacheKey);
        
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