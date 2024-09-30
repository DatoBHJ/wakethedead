import React from 'react';
import InitialQueries from './InitialQueries';
import { X } from "@phosphor-icons/react";
import { Button } from '@/components/ui/button';

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

  return (
    <div className="bg-background dark:bg-background overflow-auto h-full">
      <div className="max-w-4xl mx-auto p-4 h-full flex flex-col">
        <div className="flex-grow overflow-auto">
          <InitialQueries questions={questions} handleFollowUpClick={handleQuestionClick} />
        </div>
      </div>
    </div>
  );
};

export default ExtractedQuestionsModal;