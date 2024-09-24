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
    // Remove '**' from the beginning and end of the summary
    return summary.replace(/^\*\*|\*\*$/g, '');
  };

  return (
    <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
      <ul className="mt-2 md:mr-10 mr-0">
        {questions.map((question, index) => (
          <li
            key={index}
            className="flex items-center cursor-pointer bg-transparent p-3 my-1"
            onClick={() => handleQuestionClick(question)}
          >
            <span role="img" aria-label="link" className="mr-2 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300">
              <IconPlus className='flex h-5 w-5 pb-1' />
            </span>
            <p className={`${question.startsWith('**Part') ? 'font-handwriting font-bold text-base md:text-lg' : 'font-handwriting text-sm md:text-base '} dark:text-white text-black`}>
              {question.startsWith('**Part') ? formatSummary(question) : question}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InitialQueries;