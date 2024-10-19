import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Index } from '@upstash/vector';
import { config } from '@/app/config';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export async function POST(request: Request) {
  const { title, currentUrl } = await request.json();

  if (!title) {
    return NextResponse.json({ message: 'Title is required' }, { status: 400 });
  }

  try {
    const embeddingResponse = await openai.embeddings.create({
      model: config.embeddingsModel,
      input: title,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    const queryResults = await index.query({
      vector: queryEmbedding,
      topK: 20,
      includeMetadata: true,
      includeVectors: false,
    });

    const seenTitles = new Set();

    const similarDocuments = queryResults
      .filter((result) => 
        result.score >= config.ArticleSimilarityThreshold &&
        result.metadata.title &&
        result.metadata.content &&
        result.metadata.link &&
        result.metadata.link !== currentUrl // 현재 URL과 다른 결과만 포함
      )
      .reduce((acc, result) => {
        const title = result.metadata.title as string;
        if (!seenTitles.has(title)) {
          seenTitles.add(title);
          acc.push({
            title: title,
            pageContent: result.metadata.content as string,
            url: result.metadata.link as string,
          });
        }
        return acc;
      }, [] as Array<{title: string, pageContent: string, url: string}>)
      .slice(0, config.numberOfSimilarityResults); // 가장 첫 4개만 보여주도록 수정

    console.log('similarDocuments:', similarDocuments);
    return NextResponse.json(similarDocuments);
  } catch (error) {
    console.error('Error processing similar content request:', error);
    return NextResponse.json({ message: 'Error processing request' }, { status: 500 });
  }
}