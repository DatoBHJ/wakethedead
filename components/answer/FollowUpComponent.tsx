import React, { useState } from 'react';
import { IconPlus } from '@/components/ui/icons';
import { Check } from "lucide-react";

interface FollowUp {
    choices: {
        message: {
            content: string;
        };
    }[];
}

const FollowUpComponent = ({ followUp, handleFollowUpClick }: { followUp: FollowUp; handleFollowUpClick: (question: string) => void }) => {
    const [clickedQuestions, setClickedQuestions] = useState<Set<string>>(new Set());

    const handleQuestionClick = (question: string) => {
        handleFollowUpClick(question);
        setClickedQuestions(prev => new Set(prev).add(question));
    };

    const renderQuestions = () => {
        if (!followUp.choices[0]?.message?.content) {
            return null;
        }

        try {
            const parsed = JSON.parse(followUp.choices[0].message.content);
            if (!parsed.followUp || !Array.isArray(parsed.followUp)) {
                console.error('Invalid followUp data structure:', parsed);
                return null;
            }

            return parsed.followUp.map((question: string, index: number) => (
                <li
                    key={index}
                    className="flex items-center cursor-pointer group relative"
                    onClick={() => handleQuestionClick(question)}
                >
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center mr-3">
                        {clickedQuestions.has(question) ? (
                            <Check className="w-5 h-5 text-green-500" />
                        ) : (
                            <IconPlus className="h-5 w-5 text-textlight dark:text-textdark group-hover:text-blue-500 group-hover:dark:text-blue-400 transition-colors duration-200" />
                        )}
                    </div>
                    <p className={`text-base flex-1 ${clickedQuestions.has(question) ? 'text-gray-500' : 'text-card-foreground dark:text-zinc-300  group-hover:text-blue-500 group-hover:dark:text-blue-400'} transition-colors duration-200`}>
                        {question}
                    </p>
                    {clickedQuestions.has(question) && (
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                            Question added! 🚀
                        </span>
                    )}
                </li>
            ));
        } catch (e) {
            console.error('Failed to parse followUp content:', e);
            return null;
        }
    };

    return (
        <div className="backdrop-blur-xl bg-card-foreground/[3%] dark:bg-card-foreground/5 rounded-xl p-5 mt-4 transition-all duration-300">
            <div className="flex items-center mb-4">
                <h2 className="text-2xl font-bold font-handwriting dark:text-zinc-300 ">Related Questions 🤔</h2>
            </div>
            <ul className="space-y-3">
                {renderQuestions()}
            </ul>
        </div>
    );
};

export default FollowUpComponent;