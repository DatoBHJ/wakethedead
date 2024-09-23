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
  
  return (
    <div className="mb-4 max-h-[calc(100vh-300px)] overflow-y-auto">
      <ul className="mt-2">
        {questions.map((question, index) => (
          <li
            key={index}
            className="flex items-center cursor-pointer bg-transparent p-3 my-1"
            onClick={() => handleQuestionClick(question)}
          >
            <span role="img" aria-label="link" className="mr-2 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300">
              <IconPlus className='flex h-5 w-5 pb-1' />
            </span>
            <p className="text-sm sm:text-base font-handwriting dark:text-white text-black">{question}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InitialQueries;