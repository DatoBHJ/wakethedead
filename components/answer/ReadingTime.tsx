import React, { useMemo } from 'react';

const calculateReadingTime = (content: string): number => {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute * 60);
};

interface ReadingTimeProps {
  content: string;
  inline?: boolean;
  label: 'Headline Skim' | 'Full Skim';
  isYouTube?: boolean;
}

const ReadingTime: React.FC<ReadingTimeProps> = ({ content, inline = false, label, isYouTube = false }) => {
  const readingTimeInSeconds = useMemo(() => calculateReadingTime(content), [content]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)} sec`;
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  };

  const readingTime = formatTime(readingTimeInSeconds);
  const originalTime = (label === 'Full Skim' && !isYouTube) ? formatTime(readingTimeInSeconds * 7) : null;

  const timeContent = (
    <>
      {label}: {readingTime}<br />
      {originalTime && <>Original Source: {originalTime}<br /></>}
    </>
  );

  return inline ? (
    <span className="text-sm text-gray-400 dark:text-gray-600 ">
      {timeContent}
    </span>
  ) : (
    <div className="text-sm text-gray-400 dark:text-gray-600  mb-2">
      {timeContent}
    </div>
  );
};

export default ReadingTime;