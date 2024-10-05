import React, { useMemo } from 'react';
import { Check } from "lucide-react";
import { getYouTubeVideoId } from '@/lib/youtube-transcript';
import { useMediaQuery } from '@/lib/hooks/use-media-query';

interface RelevantLink {
  title: string;
  url: string;
}

interface ProcessedWebResultsComponentProps {
  processedWebResults: RelevantLink[];
  onAddLink: (link: string) => void;
  setIsChatOpen?: (isOpen: boolean) => void;
  addedLinks: Set<string>;
}

const decodeHtmlEntities = (text: string): string => {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
};

const ProcessedWebResultsComponent: React.FC<ProcessedWebResultsComponentProps> = ({ 
  processedWebResults, 
  onAddLink,
  setIsChatOpen,
  addedLinks
}) => {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const uniqueLinks = useMemo(() => {
    const linkMap = new Map<string, RelevantLink>();
    processedWebResults.forEach(link => {
      if (!linkMap.has(link.url)) {
        linkMap.set(link.url, {
          ...link,
          title: decodeHtmlEntities(link.title)
        });
      }
    });
    return Array.from(linkMap.values());
  }, [processedWebResults]);

  const handleLinkClick = (url: string) => {
    onAddLink(url);
    if (!isDesktop && setIsChatOpen) {
      setIsChatOpen(false);
    }
  };

  if (uniqueLinks.length === 0) {
    return null;
  }

  return (
    <div className="backdrop-blur-sm bg-card-foreground/[3%] dark:bg-card-foreground/5 rounded-xl p-5 mt-4 transition-all duration-300">
      <div className="flex flex-col mb-3">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold font-handwriting">
            Curated web discoveries 🔎
          </h2>
        </div>
      </div>
      <ul className="space-y-3">
        {uniqueLinks.map((link) => {
          const linkId = getYouTubeVideoId(link.url);
          return (
            <li
              key={link.url}
              className="group relative"
            >
              <div 
                className={`flex items-center cursor-pointer transition-all duration-200 
                            text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300
                            ${addedLinks.has(linkId) ? 'opacity-70' : ''}`}
                onClick={() => handleLinkClick(link.url)}
              >
                <span className="flex-shrink-0 mr-2 mb-1">⚡</span>
                <span className="font-handwriting text-left text-base">
                  {link.title.includes('Something went wrong!') ? link.url : link.title}
                </span>
                {addedLinks.has(linkId) && (
                  <Check size={16} className="ml-2 text-green-500 flex-shrink-0" />
                )}
              </div>
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                {addedLinks.has(linkId) ? 'Link beamed up!⚡️' : 'Beam me up! 🚀'}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ProcessedWebResultsComponent;