import React, { FormEvent, useRef, useMemo } from 'react';
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit';
import Textarea from 'react-textarea-autosize';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowUp } from '@phosphor-icons/react';
import LLMResponseComponent from '@/components/answer/LLMResponseComponent';
import UserMessageComponent from '@/components/answer/UserMessageComponent';
import FollowUpComponent from '@/components/answer/FollowUpComponent';
import InitialQueries from '@/components/answer/InitialQueries';
import { motion, AnimatePresence } from 'framer-motion';
import RelevantLinksComponent from '@/components/answer/RelevantLinksComponent';
import ProcessedWebResults from '@/components/answer/ProcessedWebResults';
import VideosComponent from '@/components/answer/VideosComponent';
import ImagesComponent from '@/components/answer/ImagesComponent';
import { useMediaQuery } from '@/lib/hooks/use-media-query';

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
  onRefresh: (index: number) => void;
  extractedQuestions: string[];
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
  onRefresh,
  extractedQuestions,
}) => {
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const initialQuestions = [
    "Give me some memes 🤣",
    "OpenAI o1 Mini vs Claude 3.5 Sonnet 🤖",
    "iPhone 16 📱",
    "I need a kindle link to The Hobbit 📚",
    "How many people did Pieter mute on Twitter? 🤐",
  ];

  const combinedQuestions = useMemo(() => {
    if (extractedQuestions.length > 0) {
      return extractedQuestions;
    }
    return initialQuestions;
  }, [extractedQuestions, initialQuestions]);

  const mobileVariants = {
    hidden: { y: "100%" },
    visible: { y: 0 },
  };

  return (
    <AnimatePresence>
      {(isDesktop || isOpen) && (
        <motion.div
          className={`${
            isDesktop ? 'relative py-10 pr-48 pl-10 md:pr-32' : 'fixed inset-0'
          } backdrop-blur-xl bg-background/90 dark:bg-background/50 will-change-transform ${
            isDesktop ? 'h-full' : ''
          } ${isDesktop ? '' : 'z-30'} overflow-hidden flex flex-col`}
          initial={isDesktop ? false : "hidden"}
          animate={isDesktop ? false : "visible"}
          // exit={isDesktop ? false : "hidden"}
          variants={isDesktop ? {} : mobileVariants}
          transition={{ type: "tween", duration: 0.15 }}
                  >
          {!isDesktop && (
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="w-full h-14 bg-transparent flex items-center justify-center"
            >
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </button>
          )}
          <div className={`flex-1 overflow-y-auto px-6 ${isDesktop ? 'pb-20' : 'pb-20'} flex flex-col`}>
            {messages.length === 0 && !inputValue && (
              <div className="flex-grow flex items-center justify-center">
                <InitialQueries
                  questions={combinedQuestions}
                  handleFollowUpClick={handleFollowUpClick}
                />
              </div>
            )}
            {messages.map((message, index) => (
              <div key={index}>
                <UserMessageComponent message={message.userMessage} />
                {message.relevantDocuments && (
                  <RelevantLinksComponent
                    relevantDocuments={message.relevantDocuments}
                    onAddLink={onAddLink}
                  />
                )}
                {message.processedWebResults && (
                  <ProcessedWebResults
                    processedWebResults={message.processedWebResults}
                    onAddLink={onAddLink}
                  />
                )}
                <LLMResponseComponent
                  llmResponse={message.content}
                  currentLlmResponse={currentLlmResponse}
                  index={index}
                  isolatedView={false}
                  onAddLink={onAddLink}
                  onRefresh={onRefresh}
                />
                {message.followUp && (
                  <FollowUpComponent
                    followUp={message.followUp}
                    handleFollowUpClick={handleFollowUpClick}
                  />
                )}
                {message.videos && (
                  <VideosComponent videos={message.videos} onAddLink={onAddLink} />
                )}
                {message.images && (
                  <ImagesComponent images={message.images} />
                )}
              </div>
            ))}
          </div>
          <div className={`${isDesktop ? 'relative' : 'absolute bottom-0 left-0 right-0'} px-2 bg-gradient-to-t from-background to-[rgba(255,255,255,0)] dark:from-background dark:to-[rgba(23,25,35,0)] pb-4 pt-2`}>
            <div className="mx-auto max-w-xl">
              <form ref={formRef} onSubmit={handleFormSubmit}>
                <div className="relative px-3 py-4 pt-5">
                  <Textarea
                    ref={inputRef}
                    tabIndex={0}
                    onKeyDown={onKeyDown}
                    placeholder="Help me Obi-Wan Kenobi"
                    className="w-full placeholder:text-md rounded-none pb-2 bg-transparent border-b-[1px] border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors text-black dark:text-white resize-none overflow-hidden"
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
                        <ArrowUp size={24} weight="bold" />
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent>Send message</TooltipContent>
                  </Tooltip>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BottomChatBar;