import React from 'react';
import { IconPlus } from '@/components/ui/icons';

interface InitialQueriesProps {
  questions: string[];
  handleFollowUpClick: (question: string) => void;
}

const InitialQueries: React.FC<InitialQueriesProps> = ({ questions, handleFollowUpClick }) => {
  const handleQuestionClick = (question: string) => {
    handleFollowUpClick(question);
  };

  const formatSummary = (summary: string) => {
    return summary.replace(/^\*\*|\*\*$/g, '');
  };

  const renderItem = (item: string, index: number) => {
    const isSummary = item.startsWith('**Part');
    const formattedItem = isSummary ? formatSummary(item) : item;

    return (
      <li
        key={index}
        className="flex items-center cursor-pointer bg-transparent p-3 my-1"
        onClick={() => handleQuestionClick(item)}
      >
        <span role="img" aria-label="link" className="mr-2 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300">
          <IconPlus className='flex h-5 w-5 pb-1' />
        </span>
        <p className={` text-base md:text-base ${isSummary ? 'font-handwriting font-bold' : 'font-handwriting'} dark:text-gray-400 text-black`}>
          {formattedItem}
        </p>
      </li>
    );
  };

  const renderSeparator = (index: number) => (
    <li key={`separator-${index}`} className="my-2">
      <div className="w-full h-px bg-gray-200 dark:bg-gray-700 opacity-50"></div>
      </li>
  );

  const groupedItems = questions.reduce((acc, item, index) => {
    if (item.startsWith('**Part')) {
      acc.push([item]);
    } else if (acc.length > 0) {
      acc[acc.length - 1].push(item);
    } else {
      acc.push([item]);
    }
    return acc;
  }, [] as string[][]);

  return (
    <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
      <ul className="mt-2 md:mr-10 mr-0">
        {groupedItems.map((group, groupIndex) => (
          <React.Fragment key={groupIndex}>
            {group.map(renderItem)}
            {groupIndex < groupedItems.length - 1 && renderSeparator(groupIndex)}
          </React.Fragment>
        ))}
      </ul>
    </div>
  );
};

export default InitialQueries;