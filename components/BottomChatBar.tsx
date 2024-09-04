import React, { FormEvent, useRef } from 'react';
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit';
import Textarea from 'react-textarea-autosize';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowUp } from '@phosphor-icons/react';
import LLMResponseComponent from '@/components/answer/LLMResponseComponent';
import UserMessageComponent from '@/components/answer/UserMessageComponent';
import FollowUpComponent from '@/components/answer/FollowUpComponent';
import InitialQueries from '@/components/answer/InitialQueries';
import { motion } from 'framer-motion';


interface BottomChatBarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  messages: any[];
  currentLlmResponse: string;
  handleFollowUpClick: (question: string) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  handleFormSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onAddLink: (link: string) => void;

}

const BottomChatBar: React.FC<BottomChatBarProps> = ({
  isOpen,
  setIsOpen,
  messages,
  currentLlmResponse,
  handleFollowUpClick,
  inputValue,
  setInputValue,
  handleFormSubmit,
  onAddLink,
}) => {
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className={`absolute bottom-0 left-0 right-0 backdrop-blur-xl bg-background/90 dark:bg-background/50 will-change-transform ${isOpen ? 'h-full z-30' : 'h-1'} transition-all duration-100 overflow-hidden flex flex-col`}>
      {isOpen && (
        <>
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="w-full h-14 bg-transparent flex items-center justify-center"
          >
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </button>
          <div className="flex-1 overflow-y-auto px-4 sm:px-60 pb-32">
            {messages.map((message, index) => (
              <div key={index}>
                <UserMessageComponent message={message.userMessage} />
                <LLMResponseComponent
                  llmResponse={message.content}
                  currentLlmResponse={currentLlmResponse}
                  index={index}
                  isolatedView={false}
                  onAddLink={onAddLink}
                />
                {message.followUp && (
                  <FollowUpComponent
                    followUp={message.followUp}
                    handleFollowUpClick={handleFollowUpClick}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 px-2 bg-gradient-to-t from-background to-[rgba(255,255,255,0)] dark:from-background dark:to-[rgba(23,25,35,0)] pb-4 pt-2">
            <div className="mx-auto max-w-xl">
              {messages.length === 0 && !inputValue && (
                <>
                  <div className="text-center mb-20 sm:mb-44 sm:text-sm text-xs text-gray-500 dark:text-gray-400">
                    💬 Chat • 🔗 Click Links • 📚 Learn More • 🔄 Repeat
                  </div>
                  <InitialQueries
                    questions={[               
                      "But what is a GPT? 🤖",
                      "When did Ye drop Ye? 🎵",
                      "How's NVIDIA stock doing? 📈",
                      "Explain black holes like I'm 5 🕳️",
                      "BRAT 🟩 vs Charlie XCX's old stuff? 🎧",
                    ]}
                    handleFollowUpClick={handleFollowUpClick}
                  />
                </>
              )}
              <form ref={formRef} onSubmit={handleFormSubmit}>
                <div className="relative px-3 py-4 pt-5">
                  <Textarea
                    ref={inputRef}
                    tabIndex={0}
                    onKeyDown={onKeyDown}
                    placeholder="Ask away! Let's learn together 🚀"
                    className="w-full rounded-none pb-2 bg-transparent border-b-[1px] border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors text-black dark:text-white resize-none overflow-hidden"
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    name="message"
                    rows={1}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button 
                        type="submit" 
                        className="absolute right-3 bottom-8 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 focus:outline-none bg-transparent"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={inputValue === ''}
                      >
                        <ArrowUp size={20} weight="bold" />
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent>Send message</TooltipContent>
                  </Tooltip>
                </div>
              </form>
            </div>
          </div>ㅇ
        </>
      )}
    </div>
  );
};

export default BottomChatBar;