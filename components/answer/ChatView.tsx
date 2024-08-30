import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Components } from 'react-markdown';
import { X, Plus } from "@phosphor-icons/react";
import { Check } from "lucide-react";

interface ChatViewProps {
  content: string;
  onTimestampClick?: (timestamp: number) => void;
  onAddLink: (link: string) => void;

}

const ChatView: React.FC<ChatViewProps> = ({ content, onTimestampClick, onAddLink }) => {
  const [addedLinks, setAddedLinks] = useState<Set<string>>(new Set());

  const components: Components = {
    h1: ({ children }) => <h1 className="text-3xl font-bold my-4 break-words font-handwriting">{children}</h1>,
    h2: ({ children }) => {
      const match = /\[(\d{2,}:\d{2}(:\d{2})?)\]/.exec(children?.toString() || '');
      if (match) {
        const timestamp = match[1];
        const seconds = parseTimestamp(timestamp);
        return (
          <h2 className="text-2xl font-extrabold mt-6 mb-3 cursor-pointer break-words font-handwriting" onClick={() => onTimestampClick && onTimestampClick(seconds)}>
            <span className="text-blue-500">{match[0]}</span>
            {children.toString().replace(match[0], '')}
          </h2>
        );
      }
      return <h2 className="text-2xl font-extrabold mt-6 mb-3 break-words font-handwriting">{children}</h2>;
    },
    h3: ({ children }) => {
      const match = /\[(\d{2,}:\d{2}(:\d{2})?)\]/.exec(children?.toString() || '');
      if (match) {
        const timestamp = match[1];
        const seconds = parseTimestamp(timestamp);
        return (
          <h3 className="text-xl font-bold mt-4 mb-2 cursor-pointer px-2 break-words font-handwriting" onClick={() => onTimestampClick && onTimestampClick(seconds)}>
            <span className="text-blue-500">{match[0]}</span>
            {children.toString().replace(match[0], '')}
          </h3>
        );
      }
      return <h3 className="text-xl font-bold mt-4 mb-2 px-4 break-words">{children}</h3>;
    },
    p: ({ children }) => {
      if (typeof children === 'string' && children.match(/^={3,}$/)) {
        return <hr className="border-t border-gray-300 dark:border-gray-700 mt-2 mb-4 px-2 font-handwriting" />;
      }
      return <p className="mt-2 mb-4 leading-relaxed px-2 break-words font-handwriting">{children}</p>;
    },
    ul: ({ children }) => <ul className="list-disc list-inside my-4 space-y-2 font-handwriting">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside my-4 space-y-2 font-handwriting">{children}</ol>,
    li: ({ children }) => <li className="ml-4 break-words">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 my-4 italic break-words">{children}</blockquote>
    ),
    code: ({ node, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '')
      return match ? (
        <pre className="bg-gray-100 dark:bg-gray-800 rounded p-2 my-2 overflow-x-auto max-w-full">
          <code className={`${className} whitespace-pre-wrap break-words`} {...props}>
            {children}
          </code>
        </pre>
      ) : (
        <code className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 break-words" {...props}>
          {children}
        </code>
      )
    },
    strong: ({ children }) => <strong className="font-bold break-words">{children}</strong>,
    em: ({ children }) => <em className="italic break-words">{children}</em>,
    a: ({ href, children }) => {
      const isAdded = addedLinks.has(href || '');

      const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (href) {
          onAddLink(href);
          setAddedLinks(prev => new Set(prev).add(href));
        }
      };

      return (
        <span className="inline-flex items-center group relative">
          <a
            href={href}
            className={`text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium break-words transition-colors duration-200 ${isAdded ? 'opacity-70' : ''}`}
            onClick={handleClick}
          >
            {children}
          </a>
          {isAdded && (
            <Check size={16} className="ml-1 text-green-500" />
          )}
          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {isAdded ? 'Note shared!' : 'Thoughts incoming... 💭⚡️ (Click)'}
          </span>
        </span>
      );
    },
  };
  const parseTimestamp = (timestamp: string): number => {
    const parts = timestamp.split(':').map(Number);
    if (parts.length === 3) {
      const [hours, minutes, seconds] = parts;
      return hours * 3600 + minutes * 60 + seconds;
    } else if (parts.length === 2) {
      const [minutes, seconds] = parts;
      return minutes * 60 + seconds;
    }
    return 0;
  };

  return (
    <div className="w-full overflow-hidden">
      <article className="prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-none ">
        <ReactMarkdown components={components} skipHtml>
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
};

export default ChatView;