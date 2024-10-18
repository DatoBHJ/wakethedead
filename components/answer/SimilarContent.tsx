import React, { useEffect, useState } from 'react';

interface SimilarContentProps {
  title: string;
  currentUrl: string;
  onAddLink: (link: string) => void;
}

interface SimilarDocument {
  title: string;
  pageContent: string;
  url: string;
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

const SimilarContent: React.FC<SimilarContentProps> = ({ title, currentUrl, onAddLink }) => {
  const [similarDocuments, setSimilarDocuments] = useState<SimilarDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSimilarDocuments = async () => {
      if (!title) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/similar-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title, currentUrl }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch similar content');
        }

        const data = await response.json();
        setSimilarDocuments(data);
      } catch (err) {
        setError('Error fetching shared content. Please try again later.');
        console.error('Error fetching shared content:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSimilarDocuments();
  }, [title, currentUrl]);

  const handleLinkClick = (e: React.MouseEvent<HTMLDivElement>, url: string) => {
    e.preventDefault();
    onAddLink(url);
  };

  if (isLoading || error || similarDocuments.length === 0) {
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
        {similarDocuments.map((doc, index) => (
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