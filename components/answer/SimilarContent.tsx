import React from 'react';

interface SimilarDocument {
  title: string;
  pageContent: string;
  url: string;
}

interface SimilarContentProps {
  documents: SimilarDocument[];
  isLoading: boolean;
  error: string | null;
  onAddLink: (link: string) => void;
}

const decodeHtmlEntities = (text: string): string => {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
};

const truncateText = (text: string, maxLength: number = 70): string => {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
};

const SimilarContent: React.FC<SimilarContentProps> = ({ 
  documents, 
  isLoading, 
  error, 
  onAddLink 
}) => {
  const handleLinkClick = (e: React.MouseEvent<HTMLDivElement>, url: string) => {
    e.preventDefault();
    onAddLink(url);
  };

  if (isLoading || error || documents.length === 0) {
    return null;
  }

  return (
    <div className="bg-card-foreground/[3%] dark:bg-card-foreground/5 rounded-xl p-5 mt-4">
      <div className="flex flex-col mb-3">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold font-handwriting dark:text-gray-400">
            Shared by our users 🤝
          </h2>
        </div>
      </div>
      <ul className="space-y-6">
        {documents.map((doc, index) => (
          <li key={index} className="group relative">
            <div 
              className="flex items-center cursor-pointer
                         text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
              onClick={(e) => handleLinkClick(e, doc.url)}
            >
              <span className="flex-shrink-0 mr-2 mb-1">⚡</span>
              <span className="font-handwriting text-left text-base">
                {truncateText(decodeHtmlEntities(doc.title))}
              </span>
            </div>
            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              Beam me up!🚀
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SimilarContent;