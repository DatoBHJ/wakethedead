import React from 'react';
import InitialQueries from './InitialQueries';
import { useMediaQuery } from '@/lib/hooks/use-media-query';

interface ExtractedQuestionsModalProps {
  questions: string[];
  handleFollowUpClick: (question: string) => void;
}

const ExtractedQuestionsModal: React.FC<ExtractedQuestionsModalProps> = ({
  questions,
  handleFollowUpClick
}) => {
  const handleQuestionClick = (question: string) => {
    handleFollowUpClick(question);
    // The modal will be closed in the parent component when a question is selected
  };
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  return (
    <div className="bg-background dark:bg-background overflow-auto h-full">
      <div className={`max-w-4xl mx-auto p-4 ${isDesktop ? 'py-10' : 'py-4'} h-full flex flex-col`}>
      <div className="flex-grow flex items-center justify-center">
      <InitialQueries questions={questions} handleFollowUpClick={handleQuestionClick} />
        </div>
      </div>
    </div>
  );
};

export default ExtractedQuestionsModal;