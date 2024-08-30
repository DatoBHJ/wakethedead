import { useState, useCallback, useRef } from 'react';
import { getYouTubeVideoId } from '@/lib/youtube-transcript';

export const useArticleGenerator = (
  youtubeLinks: string[],
  selectedModel: string,
  selectedLanguage: string
) => {
  const [articles, setArticles] = useState<{ [key: string]: string }>({});
  const [streamingContent, setStreamingContent] = useState<{ [key: string]: string }>({});
  const [isGenerating, setIsGenerating] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const requestedArticles = useRef(new Set<string>());
  const videoIds = youtubeLinks.map(getYouTubeVideoId);

  const generateArticle = useCallback(async (videoId: string, forceRegenerate: boolean = false) => {
    if (requestedArticles.current.has(videoId) && !forceRegenerate) {
      console.log(`Article for ${videoId} already requested. Skipping.`);
      return;
    }

    requestedArticles.current.add(videoId);
    setStreamingContent(prev => ({ ...prev, [videoId]: '' }));
    setIsGenerating(prev => ({ ...prev, [videoId]: true }));

    try {
      const response = await fetch('/api/summarizeVideo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, videoUrl: youtubeLinks[videoIds.indexOf(videoId)], forceRegenerate, selectedModel, selectedLanguage }),
      });

      if (!response.ok) throw new Error(`Article generation failed: ${response.statusText}`);

      const isStreaming = response.headers.get('X-Stream-Response') === 'true';

      if (isStreaming) {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('Failed to get reader from response');

        let accumulatedContent = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = new TextDecoder().decode(value);
          accumulatedContent += chunk;
          setStreamingContent(prev => ({ ...prev, [videoId]: accumulatedContent }));
        }
        setArticles(prev => ({ ...prev, [videoId]: accumulatedContent }));
      } else {
        const articleContent = await response.text();
        setArticles(prev => ({ ...prev, [videoId]: articleContent }));
        setStreamingContent(prev => ({ ...prev, [videoId]: articleContent }));
      }
    } catch (error) {
      console.error('Error generating article:', error);
      setError(`Article generation failed for video ${videoId}. ${error.message}`);
    } finally {
      setIsGenerating(prev => ({ ...prev, [videoId]: false }));
    }
  }, [youtubeLinks, videoIds, selectedModel, selectedLanguage]);

  return { articles, streamingContent, isGenerating, error, generateArticle };
};