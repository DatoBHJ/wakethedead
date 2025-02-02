import React, { useState } from 'react';
import { IconPlus, IconCheck } from '@/components/ui/icons';
import { useMediaQuery } from '@/lib/hooks/use-media-query';

interface InitialQueriesProps {
  questions: string[];
  handleFollowUpClick: (question: string) => void;
  setIsChatOpen: (isOpen: boolean) => void;
}

const InitialQueries: React.FC<InitialQueriesProps> = ({ questions, handleFollowUpClick, setIsChatOpen }) => {
  const [clickedQuestions, setClickedQuestions] = useState<Set<string>>(new Set());
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const handleQuestionClick = (question: string) => {
    handleFollowUpClick(question);
    setClickedQuestions(prev => new Set(prev).add(question));
    if (!isDesktop) {
      setIsChatOpen(true);
    }
  };

  const formatText = (text: string) => {
    if (!text.includes('**')) {
      return text;
    }
    
    return text.split('**').map((part, index) => {
      return index % 2 === 0 ? (
        <span key={index} className="font-bold">{part}</span>
      ) : (
        part
      );
    });
  };

  const renderItem = (item: string, index: number) => {
    const isSummary = item.startsWith('**Part');
    const isClicked = clickedQuestions.has(item);

    return (
      <li
        key={index}
        className={`flex items-center p-3 ${isDesktop ? 'my-1 md:my-3' : 'my-1'} ${
          isSummary ? 'bg-card-foreground/[3%] dark:bg-card-foreground/[7%] rounded-xl px-6' : 'bg-transparent'
        } ${isClicked ? 'opacity-70' : ''}`}
      >
        {!isSummary && (
          <span
            role="img"
            aria-label="link"
            className="mr-2 text-bluelight dark:text-bluedark cursor-pointer"
            onClick={() => handleQuestionClick(item)}
          >
            {isClicked ? <IconCheck className='flex h-5 w-5 pb-1' /> : <IconPlus className='flex h-5 w-5 pb-1' />}
          </span>
        )}
        <p className={`${
          isSummary ? 'text-base text-black dark:text-white' : 'text-sm sm:text-base font-light text-textlight dark:text-boxlight cursor-pointer'
        } ${isClicked ? 'text-bluelight dark:text-bluedark' : ''} font-handwriting`}
           onClick={() => !isSummary && handleQuestionClick(item)}>
          {formatText(item)}
        </p>
      </li>
    );
  };

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
    <div className="h-full flex items-center justify-center px-4">
      <ul className="w-full max-w-md">
        {groupedItems.map((group, groupIndex) => (
          <React.Fragment key={groupIndex}>
            {group.map(renderItem)}
          </React.Fragment>
        ))}
      </ul>
    </div>
  );
};

export default InitialQueries;