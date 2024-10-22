import React, { FormEvent, useRef, useMemo, useState, useCallback } from 'react';
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
import ProcessedWebResultsComponent from '@/components/answer/ProcessedWebResults';
import VideosComponent from '@/components/answer/VideosComponent';
import ImagesComponent from '@/components/answer/ImagesComponent';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { getYouTubeVideoId } from '@/lib/youtube-transcript';
// import RateLimit from '@/components/answer/RateLimit';

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
  randomQuestions: string[];  // 새로 추가된 prop
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
  randomQuestions,  // 새로 추가된 prop
}) => {
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [addedLinks, setAddedLinks] = useState<Set<string>>(new Set());
  
  const combinedQuestions = useMemo(() => {
    if (extractedQuestions.length > 0) {
      return extractedQuestions;
    }
    return randomQuestions;
  }, [extractedQuestions, randomQuestions]);


  const mobileVariants = {
    hidden: { y: "100%" },
    visible: { y: 0 },
  };

  const handleAddLink = useCallback((link: string) => {
    const linkId = getYouTubeVideoId(link);
    if (linkId) {
      onAddLink(link);
      setAddedLinks(prev => new Set(prev).add(linkId));
    }
  }, [onAddLink]);

  return (
    <AnimatePresence>
      {(isDesktop || isOpen) && (
        <motion.div
          className={`${
            isDesktop ? 'relative py-10 pr-48 pl-10 md:pr-32' : 'fixed inset-0'
          } backdrop-blur-xl bg-background/90 dark:bg-background/50 will-change-transform ${
            isDesktop ? 'h-full' : ''
          } ${isDesktop ? '' : 'z-30'} flex flex-col`}
          initial={isDesktop ? false : "hidden"}
          animate={isDesktop ? false : "visible"}
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
          <div className={`flex-1 overflow-y-auto ${isDesktop ? 'py-10' : 'py-4'} pb-20 sm:pb-0 flex flex-col`}>
            {messages.length === 0 && !inputValue ? (
              <div className="flex-grow flex items-center justify-center pr-0 sm:pr-36 md:pr-0">
                <InitialQueries
                  questions={combinedQuestions}
                  handleFollowUpClick={handleFollowUpClick}
                  setIsChatOpen={() => {}}
                />
              </div>
            ) : (
              <div className="px-4 sm:px-6">
                {messages.map((message, index) => (
                  <div key={index}>
                    {/* {message.status && message.status === 'rateLimitReached' && <RateLimit />} */}
                    <UserMessageComponent message={message.userMessage} />
                    {message.relevantDocuments && (
                           <RelevantLinksComponent
                           relevantDocuments={message.relevantDocuments}
                           onAddLink={handleAddLink}
                           setIsChatOpen={setIsOpen}
                           addedLinks={addedLinks}
                         />
                    )}
                    {message.processedWebResults && (
                      <ProcessedWebResultsComponent
                        processedWebResults={message.processedWebResults}
                        onAddLink={handleAddLink}
                        setIsChatOpen={setIsOpen}
                        addedLinks={addedLinks}
                        currentLlmResponse={currentLlmResponse} // isLoading 대신 currentLlmResponse를 전달

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
            )}
          </div>
          <div className={`${isDesktop ? 'relative' : 'absolute bottom-0 left-0 right-0'} px-2 bg-gradient-to-t from-background to-[rgba(255,255,255,0)] dark:from-background dark:to-[rgba(23,25,35,0)] pb-4 pt-2`}>
            <div className="mx-auto max-w-xl">
              <form ref={formRef} onSubmit={handleFormSubmit}>
                <div className="relative px-3 py-4 pt-5">
                  <Textarea
                    ref={inputRef}
                    tabIndex={0}
                    onKeyDown={onKeyDown}
                    placeholder="King Bob"
                    className="w-full placeholder:text-md rounded-none  bg-transparent border-b-[1px] border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors text-black dark:text-white resize-none overflow-hidden"
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
                        className="absolute right-3 bottom-6 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 focus:outline-none bg-transparent"
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

