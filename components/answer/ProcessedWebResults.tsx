import React, { useMemo, useState } from 'react';
import { Check } from "lucide-react";

interface RelevantLink {
  title: string;
  url: string;
}

interface ProcessedWebResultsComponentProps {
  processedWebResults: RelevantLink[];
  onAddLink: (link: string) => void;
}

const decodeHtmlEntities = (text: string): string => {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
};

const ProcessedWebResultsComponent: React.FC<ProcessedWebResultsComponentProps> = ({ processedWebResults, onAddLink }) => {
  const [addedLinks, setAddedLinks] = useState<Set<string>>(new Set());

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
    setAddedLinks(prev => new Set(prev).add(url));
  };

  if (uniqueLinks.length === 0) {
    return null;
  }

  return (
    <div className="backdrop-blur-sm bg-card-foreground/[3%] dark:bg-card-foreground/5 rounded-xl p-5 mt-4">
      <div className="flex flex-col mb-3">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold font-handwriting">
            Curated web discoveries 🔎
          </h2>
        </div>
      </div>
      <ul className="space-y-3">
        {uniqueLinks.map((link) => (
          <li key={link.url} className="flex items-center group">
            <span className="relative inline-block">
              <button
                onClick={() => handleLinkClick(link.url)}
                className={`font-handwriting underline text-left text-base text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors duration-200 ${addedLinks.has(link.url) ? 'opacity-70' : ''}`}
              >
                {link.title.includes('Something went wrong!') ? link.url : link.title}
              </button>
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                {addedLinks.has(link.url) ? 'Link beamed up!⚡️' : 'Beam me up!🚀'}
              </span>
            </span>
            {addedLinks.has(link.url) && (
              <Check size={16} className="ml-2 text-green-500" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProcessedWebResultsComponent;