// trying to keep the cost low by using the free methods first and then falling back to the paid method. 
// yes this might not be the best way to do it but it works lol.

import TranscriptAPI from 'youtube-transcript-api';
import { getSubtitles } from 'youtube-captions-scraper';
import { YoutubeTranscript } from 'youtube-transcript';
export const runtime = 'edge';
import axios from 'axios';

class YoutubeTranscriptError extends Error {
  constructor(message: string) {
    super(`[YoutubeTranscript] ${message}`);
  }
}

function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '=',
    '&nbsp;': ' ',
  };
  
  text = text.replace(/&amp;#39;/g, "'")
             .replace(/&amp;quot;/g, '"')
             .replace(/&amp;gt;/g, '>')
             .replace(/&amp;lt;/g, '<')
             .replace(/&amp;amp;/g, '&');
  
  text = text.replace(/&[\w#]+;/g, entity => entities[entity] || entity);
  
  text = text.replace(/\\'/g, "'");
  
  return text;
}

function cleanTranscriptText(text: string): string {
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/\n/g, ' ')
    .trim();
}

function groupTranscriptByApprox10Seconds(transcript: Array<{ text: string; start: number }>): string {
  let result = '';
  let currentGroup = '';
  let groupStartTime = transcript[0]?.start || 0;

  transcript.forEach((item, index) => {
    if (index === 0 || item.start - groupStartTime >= 10) {
      if (currentGroup) {
        result += `[${groupStartTime.toFixed(1)}] ${currentGroup.trim()}\n`;
      }
      groupStartTime = item.start;
      currentGroup = item.text;
    } else {
      currentGroup += ' ' + item.text;
    }
  });

  // Add the last group
  if (currentGroup) {
    result += `[${groupStartTime.toFixed(1)}] ${currentGroup.trim()}\n`;
  }

  return result.trim();
}

async function fetchTranscriptPrimary(videoId: string, lang: string = 'en'): Promise<string> {
  try {
    const captions = await getSubtitles({
      videoID: videoId,
      lang: lang
    });
    
    const formattedCaptions = captions.map(item => ({
      text: cleanTranscriptText(item.text),
      start: parseFloat(item.start)
    }));

    return groupTranscriptByApprox10Seconds(formattedCaptions);
  } catch (error) {
    console.error('Error fetching transcript with youtube-captions-scraper:', error);
    throw error;
  }
}

async function fetchTranscriptSecondary(videoId: string): Promise<string> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const formattedTranscript = transcript.map(item => ({
      text: decodeHtmlEntities(item.text),
      start: item.offset 
    }));
    return groupTranscriptByApprox10Seconds(formattedTranscript);
  } catch (error) {
    console.error('Error fetching transcript with youtube-transcript:', error);
    throw error;
  }
}

async function fetchTranscriptTertiary(videoId: string): Promise<string> {
  try {
    const videoExists = await TranscriptAPI.validateID(videoId);
    if (!videoExists) {
      throw new Error('Video does not exist');
    }
    const transcript = await TranscriptAPI.getTranscript(videoId);
    // clean up the transcript using cleanTranscriptText

    return groupTranscriptByApprox10Seconds(transcript);
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw error;
  }
}

async function fetchTranscriptSearchAPI(videoId: string, lang: string = 'en'): Promise<string> {
  const API_KEY = process.env.SEARCH_API_KEY; // SearchAPI 키를 환경 변수에서 가져옵니다.
  if (!API_KEY) {
    throw new Error('SearchAPI key is not set');
  }

  try {
    const response = await axios.get('https://www.searchapi.io/api/v1/search', {
      params: {
        engine: 'youtube_transcripts',
        video_id: videoId,
        lang: lang,
        api_key: API_KEY
      }
    });

    const data = response.data;

    if (data.error) {
      throw new Error(data.error);
    }

    if (!data.transcripts || data.transcripts.length === 0) {
      throw new Error('No transcripts found');
    }

    const formattedTranscript = data.transcripts.map((item: any) => ({
      text: cleanTranscriptText(item.text),
      start: item.start
    }));

    return groupTranscriptByApprox10Seconds(formattedTranscript);
  } catch (error) {
    console.error('Error fetching transcript with SearchAPI:', error);
    throw error;
  }
}

async function fetchTranscriptWithBackup(videoId: string, lang: string = 'en'): Promise<string> {
  try {
    const primaryTranscript = await fetchTranscriptPrimary(videoId, lang);
    console.log('Extracted transcript using primary method', primaryTranscript, '\n');
    return primaryTranscript;
  } catch (primaryError) {
    console.warn('Primary method failed, trying secondary method:', primaryError);
    try {
      const secondaryTranscript = await fetchTranscriptSecondary(videoId);
      console.log('Extracted transcript using secondary method', secondaryTranscript, '\n');
      return secondaryTranscript;
    } catch (secondaryError) {
      console.warn('Secondary method failed, trying tertiary method:', secondaryError);
      try {
        const tertiaryTranscript = await fetchTranscriptTertiary(videoId);
        console.log('Extracted transcript using tertiary method', tertiaryTranscript, '\n');
        
        // 특정 메시지가 포함된 경우 에러로 처리
        if (tertiaryTranscript.includes("We're sorry, YouTube is currently blocking us from fetching subtitles")) {
          throw new Error("YouTube is blocking subtitle fetching");
        }
        
        return tertiaryTranscript;
      } catch (tertiaryError) {
        console.warn('Tertiary method failed or blocked, trying SearchAPI method as last resort:', tertiaryError);
        try {
          const searchAPITranscript = await fetchTranscriptSearchAPI(videoId, lang);
          console.log('Extracted transcript using SearchAPI', searchAPITranscript, '\n');
          return searchAPITranscript;
        } catch (searchAPIError) {
          console.error('All methods failed:', searchAPIError);
          throw new YoutubeTranscriptError('Failed to fetch transcript using all available methods');
        }
      }
    }
  }
}

const getYouTubeVideoId = (url: string): string => {
  if (!url || url.trim() === '') {
    return '';
  }

  try {
    let videoId = '';
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?(?:m\.)?youtu(?:be\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/)|\.be\/)([\w\-]{11})(?:\S+)?/,
      /(?:https?:\/\/)?(?:www\.)?(?:m\.)?youtube\.com\/shorts\/([\w\-]{11})(?:\S+)?/
    ];
  
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        videoId = match[1];
        break;
      }
    }
  
    if (!videoId) {
      const urlObj = new URL(url);
      videoId = urlObj.searchParams.get('v') || '';
    }
  
    if (!videoId) {
      // Generate a unique ID for non-YouTube links using a simple hash function
      videoId = simpleHash(url).toString(16).substring(0, 11);
    }
  
    return videoId;
  } catch (error) {
    console.error('Invalid URL:', url);
    return '';
  }
};

// Simple hash function for browser environments
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export { fetchTranscriptWithBackup, getYouTubeVideoId };