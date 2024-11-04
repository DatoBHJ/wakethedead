import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Components } from 'react-markdown';
import { Check } from "lucide-react";

interface ChatViewProps {
  content: string;
  onAddLink: (link: string) => void;
}

interface CustomLiProps extends React.LiHTMLAttributes<HTMLLIElement> {
  depth?: number;
  index?: number;
}

interface CustomUlOlProps extends React.HTMLAttributes<HTMLUListElement | HTMLOListElement> {
  depth?: number;
}

const ChatView: React.FC<ChatViewProps> = ({ content, onAddLink }) => {
  const [addedLinks, setAddedLinks] = useState<Set<string>>(new Set());

  const components: Components = {
    h1: ({ children }) => (
      <h1 className="text-3xl font-bold my-4 break-words font-handwriting">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-extrabold mt-6 mb-3 break-words font-handwriting">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-bold mt-4 mb-2 px-2 break-words font-handwriting">
        {children}
      </h3>
    ),
    p: ({ children }) => {
      if (typeof children === 'string' && children.match(/^={3,}$/)) {
        return <hr className="border-t border-gray-300 dark:border-gray-700 mt-2 mb-4 px-2" />;
      }
      return (
        <p className="mt-2 mb-4 leading-relaxed px-2 break-words font-handwriting">
          {children}
        </p>
      );
    },
    ul: ({ children, ...props }: CustomUlOlProps) => {
      const depth = props.depth || 0;
      return (
        <ul className={`list-disc list-inside my-4 space-y-2 font-handwriting ${depth > 0 ? 'ml-4' : ''}`}>
          {React.Children.map(children, (child) => 
            React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<CustomLiProps>, { depth: depth + 1 }) : child
          )}
        </ul>
      );
    },
    ol: ({ children, ...props }: CustomUlOlProps) => {
      const depth = props.depth || 0;
      return (
        <ol className={`list-decimal list-inside my-4 space-y-2 font-handwriting ${depth > 0 ? 'ml-4' : ''}`}>
          {React.Children.map(children, (child, index) => 
            React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<CustomLiProps>, { depth: depth + 1, index: index + 1 }) : child
          )}
        </ol>
      );
    },
    li: ({ children, ...props }: CustomLiProps) => {
      const depth = props.depth || 0;
      const childrenArray = React.Children.toArray(children);
      const firstChild = childrenArray[0];
      let bulletPoint = '';
      let extraClasses = '';
      let contentClasses = '';

      if (typeof firstChild === 'string') {
        if (firstChild.startsWith('[ ] ') || firstChild.startsWith('[x] ')) {
          bulletPoint = firstChild.startsWith('[x] ') ? '☑' : '☐';
          childrenArray[0] = firstChild.slice(4);
          extraClasses = 'flex items-start space-x-2';
          contentClasses = 'flex-1';
        }
      }

      return (
        <li className={`ml-4 ${extraClasses} break-words font-handwriting`}>
          {bulletPoint && (
            <span className="mr-2 inline-block min-w-[1em] text-center flex-shrink-0">
              {bulletPoint}
            </span>
          )}
          <span className={contentClasses}>
            {childrenArray}
          </span>
        </li>
      );
    },
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 my-4 italic break-words font-handwriting">
        {children}
      </blockquote>
    ),
    code: ({ node, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      return match ? (
        <pre className="bg-gray-100 dark:bg-gray-800 rounded p-2 my-2 overflow-x-auto max-w-full">
          <code className={`${className} whitespace-pre-wrap break-words font-handwriting`} {...props}>
            {children}
          </code>
        </pre>
      ) : (
        <code className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 break-words font-handwriting" {...props}>
          {children}
        </code>
      );
    },
    strong: ({ children }) => (
      <strong className="font-bold break-words font-handwriting">
        {children}
      </strong>
    ),
    em: ({ children }) => (
      <em className="italic break-words font-handwriting">
        {children}
      </em>
    ),
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
            className={`text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium break-words transition-colors duration-200 font-handwriting ${isAdded ? 'opacity-70' : ''}`}
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

  return (
    <div className="w-full overflow-hidden">
      <article className="prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-none">
        <ReactMarkdown components={components} skipHtml>
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
};

export default ChatView;