'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useActions, readStreamableValue } from 'ai/rsc';
import { type AI } from './action';
import CombinedYoutubeComponent from '@/components/answer/CombinedYoutubeComponent';
import LeftSidebar from '@/components/LeftSidebar';
import BottomChatBar from '@/components/BottomChatBar';
import { List, ArrowRight, Gear } from "@phosphor-icons/react";
import { motion } from 'framer-motion';
import { IconMessage } from '@/components/ui/icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ModelSelector from '@/components/ModelSelector';
import LanguageSelector from '@/components/LanguageSelector';
import ThemeBasedVideo from '@/components/ThemeBasedVideo'; 
import UserSharedLinks from '@/components/UserSharedLinks';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import ExampleLinks from '@/components/ExampleLinks';
import { initialQuestions } from '@/components/initialQuestions';
import ChatRateLimit from '@/components/answer/ChatRateLimit';

interface UserDataResult {
  title: string;
  link: string;
}

interface YouTubeCard {
  id: string;
  title: string;
  thumbnail: string;
  isYouTube: boolean;
  link: string;
}

interface RelevantLink {
  title: string;
  url: string;
}

interface SearchResult {
  title: string;
  url: string;
  pageContent: string;
}

interface Image {
  link: string;
}
interface Video {
  link: string;
  imageUrl: string;
}

interface Message {
  id: number;
  content: string;
  userMessage: string;
  followUp: FollowUp | null;
  isStreaming: boolean;
  status?: string;
  relevantDocuments?: RelevantLink[];
  processedWebResults?: UserDataResult[];
  SearchResult?: SearchResult[];
  images?: Image[];
  videos?: Video[];
}


interface RateLimitInfo {
  limit: number;
  reset: number;
  remaining: number;
}

interface StreamMessage {
  userMessage?: string;
  llmResponse?: string;
  llmResponseEnd?: boolean;
  followUp?: any;
  status?: string;
  relevantDocuments?: RelevantLink[];
  processedWebResults?: UserDataResult[];
  SearchResult?: SearchResult[];
  images?: Image[];
  videos?: Video[];
  rateLimitInfo?: RateLimitInfo;  // 새로 추가된 필드
}
interface FollowUp {
  choices: {
    message: {
      content: string;
    };
  }[];
}
const isValidUrl = (string: string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

export default function Page() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentLlmResponse, setCurrentLlmResponse] = useState('');
  const [youtubeLinks, setYoutubeLinks] = useState<string[]>([]);
  const [currentYoutubeIndex, setCurrentYoutubeIndex] = useState(0);
  const [selectedModel, setSelectedModel] = useState('llama3-8b-8192');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInitialMessage, setIsInitialMessage] = useState(true);
  const [inputLinks, setInputLinks] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(true);
  const [currentLink, setCurrentLink] = useState<string | null>(null);
  const [cards, setCards] = useState<YouTubeCard[]>([]);
  const [showUFO, setShowUFO] = useState(false);
  const mainContentRef = useRef(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [isChatRateLimited, setIsChatRateLimited] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);

  const randomQuestions = useMemo(() => {
    const shuffled = [...initialQuestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
  }, []);

  // Ref declarations
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  // Custom hooks
  const { myAction } = useActions<typeof AI>();

  // question extraction from video/article
  const [extractedQuestions, setExtractedQuestions] = useState<string[]>([]);
  const handleExtractQuestions = useCallback((questions: string[]) => {
    setExtractedQuestions(questions);
  }, []);
  
  // Effect to update currentYoutubeIndex when youtubeLinks change
  useEffect(() => {
    if (youtubeLinks.length > 0) {
      setCurrentYoutubeIndex(youtubeLinks.length - 1);
      setCurrentLink(youtubeLinks[youtubeLinks.length - 1]);
      setShowLinkInput(false);
    } else {
      setCurrentLink(null);
      setShowLinkInput(true);
    }
  }, [youtubeLinks]);
  
  // Effect to handle keyboard shortcuts
  useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === '/') {
      if (
        e.target &&
        ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).nodeName)
      ) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      if (inputRef?.current) {
        inputRef.current.focus();
      }
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}, [inputRef]);

  const handleSubmit = async (payload: { message: string; youtubeLinks: string[] }) => {
    if (!payload.message) return;
    await handleUserMessageSubmission(payload);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setInputValue('');
  
    const payload = {
      message: inputValue.trim(),
      youtubeLinks: youtubeLinks  
    };
  
    await handleSubmit(payload)
  };
  

  const handleUserMessageSubmission = async (payload: {message: string; youtubeLinks: string[]}): Promise<void> => {
    const newMessageId = Date.now();
    const newMessage = {
      id: newMessageId,
      userMessage: payload.message,
      content: '',
      followUp: null,
      isStreaming: true,
      status: '',
    };

    setMessages(prevMessages => [...prevMessages, newMessage] as Message[]);

    let lastAppendedResponse = "";
    try {
      const streamableValue = await myAction(payload.message, selectedModel, selectedLanguage);
      if (isInitialMessage) {        
        setIsInitialMessage(false);
      }
    
      let llmResponseString = "";
      for await (const message of readStreamableValue(streamableValue)) {
        const typedMessage = message as StreamMessage;
        setMessages((prevMessages) => {
          const messagesCopy = [...prevMessages];
          const messageIndex = messagesCopy.findIndex(msg => msg.id === newMessageId);
          if (messageIndex !== -1) { 
            const currentMessage = messagesCopy[messageIndex];



            if (typedMessage.status === 'ChatRateLimitReached') {
              currentMessage.status = 'ChatRateLimitReached';
              setIsChatRateLimited(true);
              if (typedMessage.rateLimitInfo) {
                setRateLimitInfo(typedMessage.rateLimitInfo);
              }
            } else {
              currentMessage.status = typedMessage.status || currentMessage.status;
            }

            
            if (typedMessage.llmResponse && typedMessage.llmResponse !== lastAppendedResponse) {
              currentMessage.content += typedMessage.llmResponse;
              lastAppendedResponse = typedMessage.llmResponse;
            }

            currentMessage.isStreaming = typedMessage.llmResponseEnd ? false : currentMessage.isStreaming;
            currentMessage.followUp = typedMessage.followUp || currentMessage.followUp;
            currentMessage.relevantDocuments = typedMessage.relevantDocuments || currentMessage.relevantDocuments;
            currentMessage.processedWebResults = typedMessage.processedWebResults || currentMessage.processedWebResults;
            currentMessage.SearchResult = typedMessage.SearchResult || currentMessage.SearchResult;
            currentMessage.images = typedMessage.images || currentMessage.images;
            currentMessage.videos = typedMessage.videos || currentMessage.videos;
          }
          return messagesCopy;
        });

        if (typedMessage.llmResponse) {
          llmResponseString += typedMessage.llmResponse;
          setCurrentLlmResponse(llmResponseString);
        }
      }

    } catch (error) {
      console.error("Error streaming data for user message:", error);
    }
  };

  useEffect(() => {
    setShowLinkInput(youtubeLinks.length === 0);
  }, [youtubeLinks]);

  const handleLinksSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidUrl(inputLinks)) {
      setYoutubeLinks(prevLinks => [...prevLinks, inputLinks]);
    } else {
      console.error('Invalid URL');
    }
    setInputLinks('');
    setIsSidebarOpen(false);
  };


  const handleCardClick = useCallback((index: number) => {
    setCurrentYoutubeIndex(index);
  }, []);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && 
        !(event.target as Element).closest('.sidebar-toggle-button')) {
      setIsSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  const toggleSidebar = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setIsSidebarOpen(!isSidebarOpen);
  }, [isSidebarOpen]);

  const handleCardsUpdate = useCallback((updatedCards: YouTubeCard[]) => {
    setCards(updatedCards);
  }, []);

  const handleLinkClick = useCallback((link: string) => {
    if (link) {
      try {
        window.open(link, '_blank', 'noopener,noreferrer');
      } catch (error) {
        console.error('Error opening link:', error);
        window.location.href = link;
      }
    }
  }, []);

  const handleFollowUpClick = useCallback(async (question: string) => {
    setCurrentLlmResponse('');
    await handleUserMessageSubmission({ message: question, youtubeLinks: []});
  }, []);
  
  const handleQuestionSelected = useCallback((question: string) => {
    handleFollowUpClick(question);
    if (!isDesktop) {
      setIsChatOpen(true);
    }
  }, [handleFollowUpClick, isDesktop]);

  const memoizedCombinedYoutubeComponent = useMemo(() => (
    <CombinedYoutubeComponent 
      youtubeLinks={youtubeLinks} 
      currentIndex={currentYoutubeIndex}
      setCurrentIndex={setCurrentYoutubeIndex}
      selectedModel={selectedModel}
      selectedLanguage={selectedLanguage}
      cards={cards}
      onLinkClick={handleLinkClick}
      onExtractQuestions={handleExtractQuestions}
      onQuestionSelected={handleQuestionSelected} 
      setIsChatOpen={setIsChatOpen}

    />
  ), [youtubeLinks, currentYoutubeIndex, selectedModel, selectedLanguage, cards, handleLinkClick, handleExtractQuestions, handleQuestionSelected]);

  
  const handleAddLink = useCallback((link: string) => {
    setYoutubeLinks(prevLinks => {
      if (!prevLinks.includes(link)) {
        return [...prevLinks, link];
      }
      return prevLinks;
    });
  }, []);
  useEffect(() => {
    if (youtubeLinks.length === 0) {
      const timer = setTimeout(() => {
        setShowUFO(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowUFO(false);
    }
  }, [youtubeLinks]);

  const handleRefresh = useCallback(async (index: number) => {
    const messageToRefresh = messages[index];
    if (!messageToRefresh) return;

    setMessages(prevMessages => {
      const newMessages = [...prevMessages];
      newMessages[index] = {
        ...newMessages[index],
        content: '',
        followUp: null,
        isStreaming: true,
        status: '',
        processedWebResults: undefined,
      };
      return newMessages;
    });

    let lastAppendedResponse = "";
    try {
      const streamableValue = await myAction(messageToRefresh.userMessage, selectedModel, selectedLanguage, true);
      
      let llmResponseString = "";
      for await (const message of readStreamableValue(streamableValue)) {
        const typedMessage = message as StreamMessage;
        setMessages((prevMessages) => {
          const messagesCopy = [...prevMessages];
          const messageIndex = messagesCopy.findIndex(msg => msg.id === messageToRefresh.id);
          if (messageIndex !== -1) { 
            const currentMessage = messagesCopy[messageIndex];

            if (typedMessage.llmResponse && typedMessage.llmResponse !== lastAppendedResponse) {
              currentMessage.content += typedMessage.llmResponse;
              lastAppendedResponse = typedMessage.llmResponse;
            }

            currentMessage.isStreaming = typedMessage.llmResponseEnd ? false : currentMessage.isStreaming;
            currentMessage.followUp = typedMessage.followUp || currentMessage.followUp;
            currentMessage.processedWebResults = typedMessage.processedWebResults || currentMessage.processedWebResults;
          }
          return messagesCopy;
        });

        if (typedMessage.llmResponse) {
          llmResponseString += typedMessage.llmResponse;
          setCurrentLlmResponse(llmResponseString);
        }
      }
    } catch (error) {
      console.error("Error streaming data for refreshed message:", error);
    }
  }, [messages, myAction, selectedModel, selectedLanguage]);
  
  return (
    <div className="flex h-screen overflow-hidden bg-background dark:bg-background">
      <div className={`flex-1 flex ${isDesktop ? 'flex-row' : 'flex-col'} overflow-hidden`}>
        <div className={`${isDesktop ? 'w-1/2' : 'w-full h-full'} flex flex-col overflow-hidden`}>
          <header className="flex justify-start items-center p-4">
            <button 
              onClick={toggleSidebar}
              className="sidebar-toggle-button text-foreground/70 z-50 hover:text-foreground transition-colors duration-200 focus:outline-none"
            >
              <List size={24} />
            </button>
            <a href="/" className=" hover:text-blue-600 text-foreground/70 dark:hover:text-blue-300 font-semibold px-4">
              {/* Wake The Dead */}
              {isDesktop ? 'Wake The Dead' : 'WTD'}
            </a>
            {!isDesktop && (
              <div className="flex items-center space-x-4 ml-auto">
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                  <DialogTrigger asChild>
                    <button 
                      ref={settingsButtonRef}
                      className="text-foreground/70 hover:text-foreground transition-colors duration-200 focus:outline-none"
                    >
                      <Gear size={24} />
                    </button>
                  </DialogTrigger>
                  <DialogContent 
                    className="absolute right-0 top-[calc(100%+0.5rem)] w-60 sm:w-96"
                    style={{
                      transform: 'none',
                      top: settingsButtonRef.current ? `${settingsButtonRef.current.offsetTop + settingsButtonRef.current.offsetHeight + 8}px` : 'auto',
                      right: '3rem',
                      left: 'auto',
                    }}
                  >
                    <DialogHeader>
                      <DialogTitle>Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      <ModelSelector
                        selectedModel={selectedModel}
                        setSelectedModel={setSelectedModel}
                      />
                      <LanguageSelector
                        selectedLanguage={selectedLanguage}
                        setSelectedLanguage={setSelectedLanguage}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
                <button 
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className="text-foreground/70 hover:text-foreground transition-colors duration-200 focus:outline-none pb-0.5"
                >
                  <IconMessage className="w-6 h-6" />
                </button>
              </div>
            )}
          </header>
          <main 
            ref={mainContentRef}
            className={`flex-1 flex flex-col overflow-y-auto ${isDesktop ? 'pl-48 md:pl-32 py-10 pr-10' : 'overflow-y-auto'}`}
          >
            {showLinkInput ? (
              <div className="flex-grow flex items-center justify-center w-full">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-full max-w-xl justify-center p-4 flex flex-col item-center sm:items-start"
                >
                  <h1 className="text-4xl sm:text-5xl font-bold mt-5 mb-5 text-center sm:text-left text-blue-500 w-full px-6">
                    Skim. Ask. <br /> Move on.
                  </h1>
                  <p className="text-xs text-center sm:text-left sm:text-sm text-gray-400 dark:text-gray-600 mb-10 sm:mb-12 px-6">
                  No need to save for later. Absorb in seconds {isDesktop ? null : <br />} what used to take minutes. 
                  </p>
                  <div className="w-full flex flex-col items-start sm:pb-4 px-6">
                    <motion.form 
                      onSubmit={handleLinksSubmit} 
                      className="w-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                    >
                      <div className="relative flex items-center">
                        <motion.button 
                          type="submit" 
                          className="absolute left-0 bottom-2 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 focus:outline-none"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          ⚡
                        </motion.button>
                        <input
                          type="text"
                          value={inputLinks}
                          onChange={(e) => setInputLinks(e.target.value)}
                          placeholder="Your article or video link"
                          className="w-full rounded-none pb-2 pl-7 bg-transparent border-b-[1px] placeholder-blue-500 dark:placeholder-blue-400 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                        />
                        <div className="absolute bottom-0 left-0 w-full border-b border-gray-200 dark:border-gray-700 opacity-50"></div>
                         <motion.button 
                          type="submit" 
                          className="absolute right-3 bottom-2 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 focus:outline-none"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <ArrowRight size={22} weight="bold" />
                        </motion.button>
                      </div>
                    </motion.form>
                    <ExampleLinks onAddLink={handleAddLink} />
                  </div>
                </motion.div>
              </div>
            ) : (
              <div className="h-full w-full">
                {memoizedCombinedYoutubeComponent}
              </div>
            )}
          </main>
          <footer className="p-2 text-center">
            <span className="text-[8px] text-gray-400">created by King Bob</span>
          </footer>
        </div>
        {isDesktop && (
          <>
            <motion.div
              className="w-px bg-gray-200 dark:bg-gray-700 opacity-50 my-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            />
            <motion.div
              className="w-1/2 flex flex-col overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <header className="flex justify-end items-center p-4">
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                  <DialogTrigger asChild>
                    <button 
                      ref={settingsButtonRef}
                      className="text-foreground/70 hover:text-foreground transition-colors duration-200 focus:outline-none"
                    >
                      <Gear size={24} />
                    </button>
                  </DialogTrigger>
                  <DialogContent 
                    className="absolute right-0 top-[calc(100%+0.5rem)] w-96"
                    style={{
                      transform: 'none',
                      top: settingsButtonRef.current ? `${settingsButtonRef.current.offsetTop + settingsButtonRef.current.offsetHeight + 8}px` : 'auto',
                      right: '3rem',
                      left: 'auto',
                    }}
                  >
                    <DialogHeader>
                      <DialogTitle>Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      <ModelSelector
                        selectedModel={selectedModel}
                        setSelectedModel={setSelectedModel}
                      />
                      <LanguageSelector
                        selectedLanguage={selectedLanguage}
                        setSelectedLanguage={setSelectedLanguage}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </header>
              <div className="flex-1 overflow-y-auto">
              {isChatRateLimited ? (
              <ChatRateLimit rateLimitInfo={rateLimitInfo!} />
            ) : (
                <BottomChatBar 
                  isOpen={true}
                  setIsOpen={() => {}}
                  messages={messages}
                  currentLlmResponse={currentLlmResponse}
                  handleFollowUpClick={handleFollowUpClick}
                  inputValue={inputValue}
                  setInputValue={setInputValue}
                  handleFormSubmit={handleFormSubmit}
                  onAddLink={handleAddLink}
                  onRefresh={handleRefresh}
                  extractedQuestions={extractedQuestions}
                  randomQuestions={randomQuestions}  
                />
              )}
            </div>
          </motion.div>
        </>
      )}
      {!isDesktop && (
        isChatRateLimited ? (
          <ChatRateLimit rateLimitInfo={rateLimitInfo!} />
        ) : (
          <BottomChatBar 
            isOpen={isChatOpen} 
            setIsOpen={setIsChatOpen}
            messages={messages}
            currentLlmResponse={currentLlmResponse}
            handleFollowUpClick={handleFollowUpClick}
            inputValue={inputValue}
            setInputValue={setInputValue}
            handleFormSubmit={handleFormSubmit}
            onAddLink={handleAddLink}
            onRefresh={handleRefresh}
            extractedQuestions={extractedQuestions}
            randomQuestions={randomQuestions} 
          />
        )
      )}
      </div>
      <LeftSidebar 
        ref={sidebarRef}
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        youtubeLinks={youtubeLinks}
        setYoutubeLinks={setYoutubeLinks}
        onCardClick={handleCardClick}
        currentIndex={currentYoutubeIndex}
        onCardsUpdate={handleCardsUpdate}
      />
      {/* <UserSharedLinks 
        onAddLink={handleAddLink} 
        showUFO={showUFO}
        mainContentRef={mainContentRef}
      /> */}
    </div>
  );
}