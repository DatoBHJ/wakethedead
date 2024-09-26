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
      const formattedContent = convertTimestamps(chunk.pageContent);
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
  


  // async function generateCasualSummary(chunk: string, videoInfo: any, selectedModel: string, chunkNumber: number, totalChunks: number, selectedLanguage): Promise<any> {
  //   const formattedChunk = convertTimestamps(chunk);
  //   console.log('formattedChunk:', formattedChunk);
  //   const response = await openai.chat.completions.create({
  //     model: selectedModel,
  //     messages: [
  //       {
  //         role: "system",
  //         content: `You're casually watching a YouTube video and jotting down quick, brief, informal notes. Use everyday language, and include brief personal reactions or questions.
  //                 Always respond in user preference language whcih is ${selectedLanguage}. `
  //       },
  //       {
  //         role: "user",
  //         content: `Create casual, quick notes for part ${chunkNumber} of ${totalChunks} of this video: "${videoInfo.title || ''}" by ${videoInfo.author || ''}. 
  //         I speak ${selectedLanguage} and I want you to respond in ${selectedLanguage}.\n\n
  //         Use many relevant emojis !! Include:
  //         - A super brief "what's this part about" line
  //         - A few key points with timestamps (always use [HH:MM:SS] or [MM:SS] format with square brackets)
  //         - Maybe 1 question/thought or reaction
  
  //         Base your notes on this transcript chunk:
  //         ${formattedChunk}
  
  //         Format your response like someone quickly jotting notes. Use dashes, arrows, emojis. Be brief and casual! Start with "Part ${chunkNumber}/${totalChunks}:" to indicate which part of the video these notes cover. Remember, always use square brackets for timestamps!`
  //       }
  //     ],
  //     temperature: 0.7,
  //     stream: true,
  //     max_tokens: 500,
  //   });
  
  //   return response;
  // }
  
  // async function generateArticleSummary(chunk: string, articleInfo: any, selectedModel: string, chunkNumber: number, totalChunks: number, selectedLanguage): Promise<any> {
  //   const response = await openai.chat.completions.create({
  //     model: selectedModel,
  //     messages: [
  //       {
  //         role: "system",
  //         content: `You're quickly skimming through an article and taking brief, informal notes. Use everyday language, and include short personal reactions or questions.
  //                     Always respond in user preference language whcih is ${selectedLanguage}. `
  //       },
  //       {
  //         role: "user",
  //         content: `Create casual, quick notes for part ${chunkNumber} of ${totalChunks} of this article: "${articleInfo.title || ''}".
  //         I speak ${selectedLanguage} and I want you to respond in ${selectedLanguage}.\n\n
  //         Use many relevant emojis !! Include:
  //         - A very brief "what's this part about" line
  //         - A few key points or interesting facts 
  //         - Maybe 1 question/thought or reaction
  
  //         Base your notes on this content chunk:
  //         ${chunk}
  
  //         Format your response like someone quickly jotting notes. Use dashes, arrows, emojis. Be brief and casual! Start with "Part ${chunkNumber}/${totalChunks}:" to indicate which part of the article these notes cover.
  //         If the chunk seems unrelated to the article title or contains ads, just write "🤔 Unrelated stuff..." or "📢 Looks like an ad?" and move on. 
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
    console.log('formattedChunk:', formattedChunk);
    const response = await openai.chat.completions.create({
      model: selectedModel,
      messages: [
        {
          role: "system",
          content: `You're casually watching a YouTube video and jotting down quick, informal notes. Use everyday language and be spontaneous. Always respond in ${selectedLanguage}. 
          Use emojis frequently to enhance the mood and give a quick impression of the content. Aim for a balance where emojis complement the text without overwhelming it.`
        },
        {
          role: "user",
          content: `
          Create casual, quick notes for part ${chunkNumber} of ${totalChunks} of this video: "${videoInfo.title || ''}" by ${videoInfo.author || ''}. 
          Respond in ${selectedLanguage}.
  
          Include:
          - A level 1 heading (#) "Part ${chunkNumber}/${totalChunks}".
          - A level 2 heading (##) with a summary with 1-2 sentences, including ANY crucial information or major conclusions, even if briefly mentioned.
          - 5-8 key points or interesting facts.
            * Each point should start with a timestamp in [HH:MM:SS] or [MM:SS] format.
            * Be extremely concise. Aim for 10-15 words max per point, focusing on the most important information.
            * ALWAYS include any important data or key information, even if it's mentioned only briefly or once in the chunk. For example, if a review score is mentioned, always include it as a key point.
            * Use emojis to make the notes engaging and fun!
          - 2-3 follow-up questions which start with a blockquote (>).
            * Use SPECIFIC proper nouns, album/song titles, or event names. Avoid vague references like "the album" or "the artist". Use the title or author's name for clarity if needed.
            * Each question should be self-contained and clearly indicate what it's about without needing context.
  
          Base your notes on this transcript chunk:
          ${formattedChunk}
  
          Respond back ALWAYS IN MARKDOWN, following the format <answerFormat> below.
  
          <answerFormat>
          # Part ${chunkNumber}/${totalChunks}
  
          ## [Summary with 1-2 sentences]
  
          [5-8 concise key points with timestamps]
          * Example: [10:15] 🎸 John Mayer wrote "Your Body Is a Wonderland" in 30 minutes!
          * Example: [05:30] 🏆 "Folklore" scores 10/10 on Pitchfork!

          [2-3 follow-up questions in blockquotes]
          * Example: > How will Beyoncé's "Renaissance" influence 2023's pop landscape? 🏠🎵
          
          </answerFormat>
          Do not include any notes or explanations about the format in your response.
          `
        }
      ],
      temperature: 0.7,
      stream: true,
      max_tokens: 500,
    });
  
    return response;
  }
  async function generateArticleSummary(chunk: string, articleInfo: any, selectedModel: string, chunkNumber: number, totalChunks: number, selectedLanguage: string): Promise<any> {
    const response = await openai.chat.completions.create({
      model: selectedModel,
      messages: [
        {
          role: "system",
          content: `You're casually skimming an article and jotting down quick, informal notes. Use everyday language and be spontaneous. Always respond in ${selectedLanguage}. 
          Use emojis frequently to enhance the mood and give a quick impression of the content. Aim for a balance where emojis complement the text without overwhelming it.`
        },
        {
          role: "user",
          content: `
          Create casual, quick notes for part ${chunkNumber} of ${totalChunks} of this article: "${articleInfo.title || ''}". 
          Respond in ${selectedLanguage}.

          Include:
          - A level 1 heading (#) "Part ${chunkNumber}/${totalChunks}".
          - A level 2 heading (##) with a summary with 1-2 sentences, including ANY crucial information or major conclusions, even if briefly mentioned.
          - 5-8 key points or interesting facts.
            * Be extremely concise. Aim for 10-15 words max per point, focusing on the most important information.
            * ALWAYS include any important data or key information, even if it's mentioned only briefly or once in the chunk.
            * Use emojis to make the notes engaging and fun!
          - 2-3 follow-up questions which start with a blockquote (>).
            * Use SPECIFIC proper nouns, article titles, or event names. Avoid vague references.
            * Each question should be self-contained and clearly indicate what it's about without needing context.

          Base your notes on this content chunk:
          ${chunk}

          Respond back ALWAYS IN MARKDOWN, following the format <answerFormat> below.

          <answerFormat>
          # Part ${chunkNumber}/${totalChunks}

          ## [Summary with 1-2 sentences]

          [5-8 concise key points]
          * Example: 🚀 SpaceX launches 60 Starlink satellites in single mission!
          * Example: 📊 Global smartphone sales declined 5.9% in Q2 2023.

          [2-3 follow-up questions in blockquotes]
          * Example: > How will Apple's new M2 chip impact the laptop market in 2024? 💻🍎

          </answerFormat>
          Do not include any notes or explanations about the format in your response.
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
        // 파싱 에러 발생 시 캐시된 데이터를 그대로 반환
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
          }
  
          // Cache the complete generated summary with title, link, and timestamp
          const cacheData = {
            content: accumulatedResponse,
            title: contentInfo.title || '',
            link: videoUrl,
            timestamp: Date.now()
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