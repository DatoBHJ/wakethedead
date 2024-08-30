import React, { useState, useEffect, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { Components } from 'react-markdown';

interface EditableArticleViewProps {
  content: string;
  onTimestampClick?: (timestamp: number) => void;
  onEdit: (editedContent: string) => void;
  isEditing: boolean;
}

const EditableArticleView: React.FC<EditableArticleViewProps> = ({ content, onTimestampClick, onEdit, isEditing }) => {
  const [editedContent, setEditedContent] = useState(content);
  const [originalContent, setOriginalContent] = useState(content);

  useEffect(() => {
    setEditedContent(content);
    setOriginalContent(content);
  }, [content]);

  useEffect(() => {
    if (!isEditing && editedContent !== originalContent) {
      onEdit(editedContent);
    }
  }, [isEditing, editedContent, originalContent, onEdit]);

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

  const renderWithClickableTimestamps = (children: ReactNode): ReactNode => {
    if (typeof children === 'string') {
      const parts = children.split(/(\[\d{2}:\d{2}(:\d{2})?\])/);
      return parts.map((part, index) => {
        if (part && typeof part === 'string' && part.match(/^\[\d{2}:\d{2}(:\d{2})?\]$/)) {
          const seconds = parseTimestamp(part.slice(1, -1));
          return (
            <span
              key={index}
              className="text-blue-500 cursor-pointer"
              onClick={() => onTimestampClick && onTimestampClick(seconds)}
            >
              {part}
            </span>
          );
        }
        return part || '';
      });
    } else if (Array.isArray(children)) {
      return children.map((child, index) => 
        child !== undefined && typeof child === 'string' ? renderWithClickableTimestamps(child) : child
      );
    }
    return children;
  };

  const components: Components = {
    h1: ({ children }) => <h1 className="text-3xl font-handwriting font-bold my-4 break-words">{renderWithClickableTimestamps(children)}</h1>,
    h2: ({ children }) => <h2 className="text-2xl font-handwriting font-bold mt-6 mb-3 break-words">{renderWithClickableTimestamps(children)}</h2>,
    h3: ({ children }) => <h3 className="text-xl font-handwriting font-semibold mt-4 mb-2 px-4 break-words">{renderWithClickableTimestamps(children)}</h3>,
    p: ({ children }) => {
      if (typeof children === 'string' && children.match(/^={3,}$/)) {
        return <hr className="border-t border-gray-300 dark:border-gray-700 mt-2 mb-4 px-2" />;
      }
      return <p className="mt-2 mb-4 leading-relaxed px-2 break-words font-handwriting text-base">{renderWithClickableTimestamps(children)}</p>;
    },
    ul: ({ children }) => <ul className="list-none my-4 space-y-2 font-handwriting text-base">{children}</ul>,
    ol: ({ children }) => <ol className="list-none my-4 space-y-2 font-handwriting text-base">{children}</ol>,
    li: ({ children }) => {
      const childrenArray = React.Children.toArray(children);
      const firstChild = childrenArray[0];
      if (typeof firstChild === 'string' && firstChild.startsWith('- ')) {
        return (
          <li className="flex items-start space-x-2 ml-4 break-words font-handwriting">
            <span className="mt-1.5">•</span>
            <span>{renderWithClickableTimestamps(firstChild.slice(2))}</span>
          </li>
        );
      } else if (typeof firstChild === 'string' && firstChild.startsWith('→ ')) {
        return (
          <li className="flex items-start space-x-2 ml-8 break-words font-handwriting">
            <span className="mt-1.5">→</span>
            <span>{renderWithClickableTimestamps(firstChild.slice(2))}</span>
          </li>
        );
      }
      return <li className="ml-4 break-words font-handwriting">{renderWithClickableTimestamps(children)}</li>;
    },
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 my-4 italic break-words font-handwriting text-base">{renderWithClickableTimestamps(children)}</blockquote>
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
    strong: ({ children }) => <strong className="font-bold break-words font-handwriting">{renderWithClickableTimestamps(children)}</strong>,
    em: ({ children }) => <em className="italic break-words font-handwriting">{renderWithClickableTimestamps(children)}</em>,
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-blue-600 dark:text-blue-400 hover:underline font-medium break-words font-handwriting"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
  };

  return (
    <div className="w-full overflow-hidden">
      {isEditing ? (
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full h-[calc(100vh-200px)] p-4 border rounded font-handwriting text-base"
        />
      ) : (
        <article className="prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-none font-handwriting">
          <ReactMarkdown components={components} skipHtml>
            {editedContent}
          </ReactMarkdown>
        </article>
      )}
    </div>
  );
};

export default EditableArticleView;