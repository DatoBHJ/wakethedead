// /utils/cacheUtils.ts

import { SemanticCache } from "@upstash/semantic-cache";
import { Index } from "@upstash/vector";
import { config } from '@/app/config';

let semanticCache: SemanticCache | undefined;

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

export async function generateUniqueKey(videoId: string, selectedModel: string, selectedLanguage: string): Promise<string> {
  const encoder = new TextEncoder();
  const videoIdData = encoder.encode(videoId);
  const modelData = encoder.encode(selectedModel);
  const languageData = encoder.encode(selectedLanguage);

  const videoIdHash = await crypto.subtle.digest('SHA-256', videoIdData);
  const modelHash = await crypto.subtle.digest('SHA-256', modelData);
  const languageHash = await crypto.subtle.digest('SHA-256', languageData);

  const videoIdHashHex = Array.from(new Uint8Array(videoIdHash)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 8);
  const modelHashHex = Array.from(new Uint8Array(modelHash)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 8);
  const languageHashHex = Array.from(new Uint8Array(languageHash)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 8);

  return `${videoIdHashHex}_${modelHashHex}_${languageHashHex}`;
}

export async function checkCachedArticle(cacheKey: string) {
  if (config.useSemanticCache && semanticCache) {
    const cachedData = await semanticCache.get(cacheKey);
    if (cachedData) {
      return { exists: true, article: cachedData };
    }
  }

  return { exists: false };
}