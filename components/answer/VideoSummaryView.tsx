import React, { useState, useEffect, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { Components } from 'react-markdown';

interface EditableArticleViewProps {
  content: string;
  onTimestampClick?: (timestamp: number) => void;
  onEdit: (editedContent: string) => void;
  isEditing: boolean;
}

interface CustomLiProps extends React.LiHTMLAttributes<HTMLLIElement> {
  depth?: number;
  index?: number;
}

interface CustomUlOlProps extends React.HTMLAttributes<HTMLUListElement | HTMLOListElement> {
  depth?: number;
}

interface CustomCodeProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
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
      const regex = /(\[?\d{1,2}:\d{2}(?::\d{2})?\]?)/g;
      const parts = children.split(regex);
      return parts.map((part, index) => {
        if (part.match(regex)) {
          const timestamp = part.replace(/^\[|\]$/g, '');
          const seconds = parseTimestamp(timestamp);
          return (
            <React.Fragment key={index}>
              <span
                className="text-blue-500 cursor-pointer"
                onClick={() => onTimestampClick && onTimestampClick(seconds)}
              >
                {part}
              </span>
              {' '}
            </React.Fragment>
          );
        }
        return (
          <React.Fragment key={index}>
            {part}
          </React.Fragment>
        );
      });
    } else if (Array.isArray(children)) {
      return children.map((child, index) => 
        child !== undefined && typeof child === 'string' ? renderWithClickableTimestamps(child) : child
      );
    }
    return children;
  };

  const components: Components = {
    h1: ({ children }) => <h1 className="mt-5 text-base font-handwriting font-bold break-words">{renderWithClickableTimestamps(children)}</h1>,
    // h1: ({ children }) => <h1 className="text-3xl font-handwriting font-bold my-4 break-words">{renderWithClickableTimestamps(children)}</h1>,
    h2: ({ children }) => <h2 className="mt-5 mb-5 text-gray-700 dark:text-zinc-300 bg-card-foreground/[3%] dark:bg-card-foreground/[7%] rounded-xl p-3 px-6 text-xl font-handwriting font-semibold break-words">{renderWithClickableTimestamps(children)}</h2>,
    h3: ({ children }) => <h3 className="text-xl font-handwriting font-semibold mt-4 mb-2 px-4 break-words">{renderWithClickableTimestamps(children)}</h3>,
    h4: ({ children }) => <h4 className="text-lg font-handwriting font-semibold mt-3 mb-2 px-4 break-words">{renderWithClickableTimestamps(children)}</h4>,
    h5: ({ children }) => <h5 className="text-base font-handwriting font-semibold mt-2 mb-1 px-4 break-words">{renderWithClickableTimestamps(children)}</h5>,
    h6: ({ children }) => <h6 className="text-sm font-handwriting font-semibold mt-2 mb-1 px-4 break-words">{renderWithClickableTimestamps(children)}</h6>,
    p: ({ children }) => {
      const processedChildren = React.Children.map(children, child => {
        if (typeof child === 'string') {
          // Check for heading patterns
          const headingMatch = child.match(/^([^\S\r\n]*[^\w\s#]*[^\S\r\n]*)(#{1,6})\s*(.+)$/);
          if (headingMatch) {
            const level = headingMatch[2].length;
            const headingText = headingMatch[3];
            const HeadingComponent = components[`h${level}` as keyof Components] as React.ComponentType<{ children: React.ReactNode }>;
            return <HeadingComponent>{renderWithClickableTimestamps(headingText)}</HeadingComponent>;
          }
  
          // If not a heading, process as normal paragraph content
          return child.split('\n').map((line, index) => (
            <React.Fragment key={index}>
              {index > 0 && <br />}
              {renderWithClickableTimestamps(line)}
            </React.Fragment>
          ));
        }
        return renderWithClickableTimestamps(child);
      });
  
      return (
        <p className="p-4 leading-relaxed break-words font-handwriting text-base">
          {processedChildren}
        </p>
      );
    },
    // p: ({ children }) => {
    //   const processedChildren = React.Children.map(children, child => {
    //     if (typeof child === 'string') {
    //       return child.split('\n').map((line, index) => (
    //         <React.Fragment key={index}>
    //           {index > 0 && <br />}
    //           {renderWithClickableTimestamps(line)}
    //         </React.Fragment>
    //       ));
    //     }
    //     return renderWithClickableTimestamps(child);
    //   });
    //   return (
    //     <p className="mt-2 mb-4 leading-relaxed px-2 break-words font-handwriting text-base">
    //       {processedChildren}
    //     </p>
    //   );
    // },
    ul: ({ children, ...props }: CustomUlOlProps) => {
      const depth = props.depth || 0;
      return (
        <ul className={`list-none my-2 space-y-2 font-handwriting text-base ${depth > 0 ? 'ml-4' : ''}`}>
          {React.Children.map(children, (child) => 
            React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<CustomLiProps>, { depth: depth + 1 }) : child
          )}
        </ul>
      );
    },
    ol: ({ children, ...props }: CustomUlOlProps) => {
      const depth = props.depth || 0;
      return (
        <ol className={`list-none my-2 space-y-2 font-handwriting text-base ${depth > 0 ? 'ml-4' : ''}`}>
          {React.Children.map(children, (child, index) => 
            React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<CustomLiProps>, { depth: depth + 1, index: index + 1 }) : child
          )}
        </ol>
      );
    },
    li: ({ children, ...props }: CustomLiProps) => {
      const depth = props.depth || 0;
      const index = props.index;
      const childrenArray = React.Children.toArray(children);
      const firstChild = childrenArray[0];
      let bulletPoint = '•';
      let extraClasses = '';
      let contentClasses = '';

      if (typeof firstChild === 'string') {
        if (firstChild.startsWith('[ ] ') || firstChild.startsWith('[x] ')) {
          bulletPoint = firstChild.startsWith('[x] ') ? '☑' : '☐';
          childrenArray[0] = firstChild.slice(4);
          extraClasses = 'flex items-start space-x-2';
          contentClasses = 'flex-1';
        } else if (firstChild.startsWith('- ')) {
          childrenArray[0] = firstChild.slice(2);
        } else if (firstChild.startsWith('→ ')) {
          bulletPoint = '→';
          childrenArray[0] = firstChild.slice(2);
        } else if (firstChild.startsWith('* ')) {
          bulletPoint = '•';
          childrenArray[0] = firstChild.slice(2);
        } else if (index !== undefined) {
          bulletPoint = `${index}.`;
        }
      }

      const indentClass = `ml-${depth * 4}`;

      return (
        <li className={`${indentClass} ${extraClasses} break-words font-handwriting flex items-start mb-2`}>
          <span className="mr-2 inline-block min-w-[1em] text-center flex-shrink-0 mt-1">{bulletPoint}</span>
          <span className={`${contentClasses} flex-grow`}>
            {childrenArray.map((child, index) => (
              <React.Fragment key={index}>
                {index > 0 && typeof child === 'string' && child.trim() === '' && <br />}
                {renderWithClickableTimestamps(child)}
              </React.Fragment>
            ))}
          </span>
        </li>
      );
    },
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 mt-4 mb-10 italic break-words font-handwriting text-base">
        {renderWithClickableTimestamps(children)}
      </blockquote>
    ),
    code: ({ className, children, ...props }: CustomCodeProps) => {
      const match = /language-(\w+)/.exec(className || '')
      return !props.inline && match ? (
        <pre className="bg-gray-100 dark:bg-gray-800 rounded p-2 my-2 overflow-x-auto max-w-full">
          <code className={`${className} text-sm`} {...props}>
            {children}
          </code>
        </pre>
      ) : (
        <code className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 text-sm break-words" {...props}>
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
    hr: () => <hr className="my-4 border-0 h-px bg-gray-200 dark:bg-gray-700 opacity-50" />,
    table: ({ children }) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>,
    tbody: ({ children }) => <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">{children}</tbody>,
    tr: ({ children }) => <tr>{children}</tr>,
    th: ({ children }) => (
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-zinc-400 ">
        {renderWithClickableTimestamps(children)}
      </td>
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