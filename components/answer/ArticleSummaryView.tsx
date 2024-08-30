import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Components } from 'react-markdown';

interface GeneralArticleViewProps {
  content: string;
}

const GeneralArticleView: React.FC<GeneralArticleViewProps> = ({ content }) => {
  const components: Components = {
    h1: ({ children }) => <h1 className="text-3xl font-bold my-4 break-words">{children}</h1>,
    h2: ({ children }) => <h2 className="text-2xl font-bold my-3 break-words">{children}</h2>,
    h3: ({ children }) => <h3 className="text-xl font-semibold my-2 break-words">{children}</h3>,
    h4: ({ children }) => <h4 className="text-lg font-semibold my-2 break-words">{children}</h4>,
    h5: ({ children }) => <h5 className="text-base font-semibold my-2 break-words">{children}</h5>,
    h6: ({ children }) => <h6 className="text-sm font-semibold my-2 break-words">{children}</h6>,
    p: ({ children }) => <p className="my-2 leading-relaxed break-words">{children}</p>,
    ul: ({ children }) => <ul className="list-disc list-inside my-4 space-y-2">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside my-4 space-y-2">{children}</ol>,
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
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-blue-600 dark:text-blue-400 hover:underline font-medium break-words"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    img: ({ src, alt }) => (
      <img src={src} alt={alt} className="max-w-full h-auto my-4 rounded" />
    ),
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

export default GeneralArticleView;