import React, { useMemo } from 'react';
import { Check, Link as LinkIcon, ExternalLink } from "lucide-react";

interface RelevantLink {
  title: string;
  url: string;
}

interface RelevantLinksComponentProps {
  combinedRelevantDocuments: RelevantLink[];
  onAddLink: (link: string) => void;
}

const decodeHtmlEntities = (text: string): string => {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
};

const RelevantLinksComponent: React.FC<RelevantLinksComponentProps> = ({ combinedRelevantDocuments, onAddLink }) => {
  const [addedLinks, setAddedLinks] = React.useState<Set<string>>(new Set());

  const uniqueLinks = useMemo(() => {
    const linkMap = new Map<string, RelevantLink>();
    combinedRelevantDocuments.forEach(link => {
      if (!linkMap.has(link.url)) {
        linkMap.set(link.url, {
          ...link,
          title: decodeHtmlEntities(link.title)
        });
      }
    });
    return Array.from(linkMap.values());
  }, [combinedRelevantDocuments]);

  const handleLinkClick = (url: string) => {
    onAddLink(url);
    setAddedLinks(prev => new Set(prev).add(url));
  };

  if (uniqueLinks.length === 0) {
    return null;
  }

  return (
    <div className="backdrop-blur-sm bg-card-foreground/[3%] dark:bg-card-foreground/5 rounded-xl p-5 mt-4 transition-all duration-300">
      <div className="flex items-center mb-4">
        <LinkIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
        <h2 className="text-xl font-medium text-blue-700 dark:text-blue-200"> Where I Got The Goods 📚</h2>
      </div>
      <ul className="space-y-3">
        {uniqueLinks.map((link, index) => (
          <li
            key={link.url}
            className="flex items-center group"
          >
            <ExternalLink 
              className="h-5 w-5 min-w-[1.25rem] text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 mr-3 transition-colors duration-200" 
            />
            <button
              onClick={() => handleLinkClick(link.url)}
              className={`text-base text-card-foreground dark:text-card-foreground group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200 ${addedLinks.has(link.url) ? 'opacity-70' : ''}`}
            >
              {link.title}
            </button>
            {addedLinks.has(link.url) && (
              <Check size={16} className="ml-2 text-green-500" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RelevantLinksComponent;