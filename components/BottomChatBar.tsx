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
  randomQuestions: string[];  
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
  randomQuestions,  
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
            isDesktop ? 'relative py-10 pr-48 pl-10 md:pr-32' : 'backdrop-blur-xl fixed inset-0 bg-background/90 dark:bg-background/90 '
          }  will-change-transform ${
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
          <div className={`flex-1 overflow-y-auto ${isDesktop ? 'py-10' : 'py-4'} pb-4 flex flex-col`}>
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
                        currentLlmResponse={currentLlmResponse} 

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
          <div className="relative">
            <div className="mx-auto max-w-xl">
              <form ref={formRef} onSubmit={handleFormSubmit}>
                <div className="relative px-6 pb-8 pt-5">
                <p className='uppercase text-lg font-light pl-2 pb-1'>search</p>
                <div className="relative">
                  <Textarea
                    ref={inputRef}
                    tabIndex={0}
                    onKeyDown={onKeyDown}
                    placeholder=""
                    className="w-full placeholder:text-md rounded-none pl-2 bg-transparent text-secondarylight dark:text-secondarydark font-light resize-none overflow-hidden"
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    name="message"
                    rows={1}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <div className="bg-transparent border-b-[1px] border-bluelight dark:border-bluedark"></div>
                  <motion.button 
                    type="submit" 
                    className="absolute right-0 top-0 pb-1 text-textlight dark:text-textdark "
                  >
                    <ArrowUp size={22} weight="bold" />
                  </motion.button>
                  </div>
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

