// hooks/useArticleGeneration.ts

import { useState, useCallback } from 'react';

interface ArticleStatus {
  status: 'cached' | 'new' | 'error' | 'rate_limit';
  index: number;
}

export function useArticleGeneration() {
  const [articleStatuses, setArticleStatuses] = useState<ArticleStatus[]>([]);

  const checkArticleStatus = useCallback(async (
    transcript: string,
    videoUrl: string,
    videoId: string,
    index: number,
    selectedModel: string  
  ): Promise<ArticleStatus> => {
    try {
      const response = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, videoUrl, videoId, forceRegenerate: false, selectedModel }),
      });

       if (!response.ok) {
          if (response.status === 429) {
            console.error(`Rate limit exceeded for ${selectedModel}`);
            return { status: 'rate_limit', index };
          } else {
            console.error(`Error checking cache or generating article for ${videoUrl}: ${response.statusText}`);
            return { status: 'error', index };
          }
        }
  
        const contentType = response.headers.get('Content-Type');
        const isStreamResponse = response.headers.get('X-Stream-Response') === 'true';
  
        if (contentType && contentType.includes('application/json') && !isStreamResponse) {
          const { exists } = await response.json();
          console.log(`Cache check for ${videoUrl}: exists = ${exists}`);
          return { status: exists ? 'cached' : 'new', index };
        } else if (isStreamResponse) {
          console.log(`Cache miss for ${videoUrl}, received streaming response`);
          return { status: 'new', index };
        } else {
          console.log(`Unexpected response format for ${videoUrl}`);
          return { status: 'error', index };
        }
      } catch (error) {
        console.error(`Error checking cache or generating article for ${videoUrl}:`, error);
        return { status: 'error', index };
      }
  }, []);

  const checkAllArticlesStatus = useCallback(async (
    transcripts: string[],
    videoUrls: string[],
    videoIds: string[],
    selectedModel: string  
  ) => {
    const statuses = await Promise.all(
      transcripts.map((transcript, index) => 
        checkArticleStatus(transcript, videoUrls[index], videoIds[index], index, selectedModel)
      )
    );
    setArticleStatuses(statuses);
    return statuses;
  }, [checkArticleStatus]);

  return { checkAllArticlesStatus, articleStatuses };
}