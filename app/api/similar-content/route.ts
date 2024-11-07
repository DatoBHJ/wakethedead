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
  const { title, summary, currentUrl } = await request.json();

  try {
    let searchText = '';

    if (title) {
      searchText = summary ? `${title} ${summary}` : title;
      console.log('Searching for similar content with title and summary:', searchText);
    } else if (summary) {
      searchText = summary;
      console.log('Searching for similar content with summary:', searchText);
    } else {
      return NextResponse.json({ message: 'No search content provided' }, { status: 400 });
    }
    
    const embeddingResponse = await openai.embeddings.create({
      model: config.embeddingsModel,
      input: searchText,
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
        result.metadata.link !== currentUrl
      )
      .reduce((acc, result) => {
        const title = result.metadata.title as string;
        let link = result.metadata.link as string;
        
        if (link === 'https://wakethedead.vercel.app/tips') {
          link = 'https://buymeacoffee.com/kingbob';
          if (!seenTitles.has('King Bob - Creator of Wake The Dead')) {
            acc.push({
              title: 'King Bob - Creator of Wake The Dead',
              pageContent: result.metadata.content as string,
              url: link,
            });
            seenTitles.add('King Bob - Creator of Wake The Dead');
          }
        } else if (!seenTitles.has(title)) {
          seenTitles.add(title);
          acc.push({
            title: title,
            pageContent: result.metadata.content as string,
            url: link,
          });
        }
        return acc;
      }, [] as Array<{title: string, pageContent: string, url: string}>)
      .slice(0, config.numberOfSimilarityResults);
    
    return NextResponse.json(similarDocuments);
  } catch (error) {
    console.error('Error processing similar content request:', error);
    return NextResponse.json({ message: 'Error processing request' }, { status: 500 });
  }
}