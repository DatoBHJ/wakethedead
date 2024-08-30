import TranscriptAPI from 'youtube-transcript-api';
import { getSubtitles } from 'youtube-captions-scraper';
import { YoutubeTranscript } from 'youtube-transcript';
import crypto from 'crypto';
export const runtime = 'edge';

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


async function fetchTranscriptWithBackup(videoId: string): Promise<string> {
  try {
    const primaryTranscript = await fetchTranscriptPrimary(videoId);
    console.log('extracting transcript from primary method', primaryTranscript, '\n');
    // console.log(primaryTranscript,'\n\n');
    return primaryTranscript;
  } catch (secondaryError) {
    console.warn('primary method failed, trying Secondary method:', secondaryError);
    try {
      const secondaryTranscript = await fetchTranscriptSecondary(videoId);
      console.log('extracting transcript from Secondary method', secondaryTranscript, '\n');
      // console.log(secondaryTranscript,'\n\n');
      return secondaryTranscript;
    } catch (primaryError) {
      console.warn('secondary method failed, trying tertiary method:', primaryError);
      try {
        const tertiaryTranscript = await fetchTranscriptTertiary(videoId);
        console.log('extracting transcript from tertiary method', tertiaryTranscript, '\n');
        // console.log(tertiaryTranscript,'\n\n');
        return tertiaryTranscript;
      } catch (tertiaryError) {
        console.error('All methods failed:', tertiaryError);
        throw new YoutubeTranscriptError(tertiaryError as string);
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