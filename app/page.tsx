'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useActions, readStreamableValue } from 'ai/rsc';
import { type AI } from './action';
import CombinedYoutubeComponent from '@/components/answer/CombinedYoutubeComponent';
import LeftSidebar from '@/components/LeftSidebar';
import BottomChatBar from '@/components/BottomChatBar';
import { List, ArrowRight, Gear, Coffee, ChatCircleDots } from "@phosphor-icons/react";
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ModelSelector from '@/components/ModelSelector';
import LanguageSelector from '@/components/LanguageSelector';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import ExampleLinks from '@/components/ExampleLinks';
import { initialQuestions } from '@/components/initialQuestions';
import ChatRateLimit from '@/components/answer/ChatRateLimit';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Represents user data fetched from external sources
 */
interface UserDataResult {
  title: string;
  link: string;
}

/**
 * Structure for YouTube video card information
 */
interface YouTubeCard {
  id: string;
  title: string;
  thumbnail: string;
  isYouTube: boolean;
  link: string;
}

/**
 * Structure for relevant link information
 */
interface RelevantLink {
  title: string;
  url: string;
}

/**
 * Structure for search result information
 */
interface SearchResult {
  title: string;
  url: string;
  pageContent: string;
}

/**
 * Structure for image data
 */
interface Image {
  link: string;
}

/**
 * Structure for video data
 */
interface Video {
  link: string;
  imageUrl: string;
}

/**
 * Structure for chat messages
 */
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

/**
 * Structure for rate limit information
 */
interface RateLimitInfo {
  limit: number;
  reset: number;
  remaining: number;
}

/**
 * Structure for streamed message data
 */
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
  rateLimitInfo?: RateLimitInfo;
}

/**
 * Structure for follow-up messages
 */
interface FollowUp {
  choices: {
    message: {
      content: string;
    };
  }[];
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Validates if a given string is a valid URL
 * @param string - The string to validate as URL
 * @returns boolean indicating if string is valid URL
 */
const isValidUrl = (string: string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// =============================================================================
// Main Component
// =============================================================================


export default function Page() {
  // -----------------------------
  // State Management
  // -----------------------------
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);          // Controls sidebar visibility
  const [isChatOpen, setIsChatOpen] = useState(false);                // Controls chat interface visibility
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);        // Controls settings dialog visibility
  const [isInitialMessage, setIsInitialMessage] = useState(true);     // Tracks if it's user's first message
  const [showLinkInput, setShowLinkInput] = useState(true);           // Controls link input field visibility
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Input and Message State
  const [inputValue, setInputValue] = useState('');                   // Current input field value
  const [messages, setMessages] = useState<Message[]>([]);            // Chat message history
  const [currentLlmResponse, setCurrentLlmResponse] = useState('');   // Current LLM response being streamed
  const [inputLinks, setInputLinks] = useState('');                   // Current link input value

  // YouTube Related State
  const [youtubeLinks, setYoutubeLinks] = useState<string[]>([]);     // List of added YouTube links
  const [currentYoutubeIndex, setCurrentYoutubeIndex] = useState(0);  // Index of currently selected YouTube video
  const [currentLink, setCurrentLink] = useState<string | null>(null); // Currently active link
  const [cards, setCards] = useState<YouTubeCard[]>([]);              // YouTube video cards data

  // Settings and Configuration State
  const [selectedModel, setSelectedModel] = useState('llama3-8b-8192');// Selected LLM model
  const [selectedLanguage, setSelectedLanguage] = useState('en');      // Selected interface language

  // Rate Limiting State
  const [isChatRateLimited, setIsChatRateLimited] = useState(false); // Tracks if chat is rate limited
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null); // Rate limit details

  // Questions State
  const [extractedQuestions, setExtractedQuestions] = useState<string[]>([]); // Questions extracted from content

  // -----------------------------
  // Refs & Custom Hooks
  // -----------------------------
  const inputRef = useRef<HTMLTextAreaElement>(null);         // Reference to input textarea
  const sidebarRef = useRef<HTMLDivElement>(null);           // Reference to sidebar component
  const settingsButtonRef = useRef<HTMLButtonElement>(null);  // Reference to settings button
  const mainContentRef = useRef(null);                       // Reference to main content area
  
  const { myAction } = useActions<typeof AI>();              // Custom hook for AI actions
  const isDesktop = useMediaQuery("(min-width: 1024px)");   // Responsive layout detection

  // Random questions memoization
  const randomQuestions = useMemo(() => {
    const shuffled = [...initialQuestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
  }, []);

  // =============================================================================
  // Callback Handlers Section
  // Contains all callback functions for user interactions and event handling
  // =============================================================================

  /**
   * Extracts and processes questions from content
   * @param questions - Array of extracted questions
   */
  const handleExtractQuestions = useCallback((questions: string[]) => {
    setExtractedQuestions(questions);
  }, []);

  /**
   * Primary submission handler for user messages
   * @param payload - Contains message and YouTube links
   */
  const handleSubmit = async (payload: { message: string; youtubeLinks: string[] }) => {
    if (!payload.message) return;
    await handleUserMessageSubmission(payload);
  };

  /**
   * Form submission handler for chat input
   * Processes the input value and creates submission payload
   * @param e - Form event
   */
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setInputValue('');
  
    const payload = {
      message: inputValue.trim(),
      youtubeLinks: youtubeLinks  
    };
  
    await handleSubmit(payload);
  };

  /**
   * Core message processing and streaming handler
   * Manages message state updates and AI response streaming
   * @param payload - Contains message content and related YouTube links
   */
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

  /**
   * Handles YouTube link form submissions
   * Validates and processes new YouTube URLs
   * @param e - Form event
   */
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

  /**
   * Handles YouTube card selection
   * Updates the current video index when a card is clicked
   * @param index - Selected card index
   */
  const handleCardClick = useCallback((index: number) => {
    setCurrentYoutubeIndex(index);
  }, []);

  /**
   * Handles clicks outside the sidebar
   * Closes sidebar when clicking outside its bounds
   * @param event - Mouse event
   */
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (sidebarRef.current && 
        !sidebarRef.current.contains(event.target as Node) && 
        !(event.target as Element).closest('.sidebar-toggle-button')) {
      setIsSidebarOpen(false);
    }
  }, []);

  /**
   * Toggles sidebar visibility
   * Prevents event propagation to avoid handleClickOutside interference
   * @param event - Mouse event
   */
  const toggleSidebar = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setIsSidebarOpen(!isSidebarOpen);
  }, [isSidebarOpen]);

  /**
   * Updates YouTube card data
   * Manages the card state when new cards are added or updated
   * @param updatedCards - Array of new/updated YouTube cards
   */
  const handleCardsUpdate = useCallback((updatedCards: YouTubeCard[]) => {
    setCards(updatedCards);
  }, []);

  /**
   * Handles external link clicks
   * Opens links in new tab with security considerations
   * @param link - URL to open
   */
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

  /**
   * Processes follow-up question clicks
   * Submits the selected question as a new message
   * @param question - Selected follow-up question
   */
  const handleFollowUpClick = useCallback(async (question: string) => {
    setCurrentLlmResponse('');
    await handleUserMessageSubmission({ message: question, youtubeLinks: []});
  }, []);

  /**
   * Handles question selection from suggestions
   * Processes selected questions and manages UI state
   * @param question - Selected question
   */
  const handleQuestionSelected = useCallback((question: string) => {
    handleFollowUpClick(question);
    if (!isDesktop) {
      setIsChatOpen(true);
    }
  }, [handleFollowUpClick, isDesktop]);

  /**
   * Adds new YouTube links to the list
   * Prevents duplicate links from being added
   * @param link - YouTube URL to add
   */
  const handleAddLink = useCallback((link: string) => {
    setYoutubeLinks(prevLinks => {
      if (!prevLinks.includes(link)) {
        return [...prevLinks, link];
      }
      return prevLinks;
    });
  }, []);

  /**
   * Memoizes the YouTube component
   * Prevents unnecessary re-renders of the complex YouTube component
   */
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
      onAddLink={handleAddLink}
    />
  ), [youtubeLinks, currentYoutubeIndex, selectedModel, selectedLanguage, cards, 
      handleLinkClick, handleExtractQuestions, handleQuestionSelected]);

  /**
   * Handles message refresh/retry
   * Reprocesses a specific message with updated parameters
   * @param index - Index of message to refresh
   */
  const handleRefresh = useCallback(async (index: number) => {
    const messageToRefresh = messages[index];
    if (!messageToRefresh) return;

    // Reset message state for refresh
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

    // Reprocess message
    let lastAppendedResponse = "";
    try {
      const streamableValue = await myAction(
        messageToRefresh.userMessage, 
        selectedModel, 
        selectedLanguage, 
        true
      );
      
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

 
  // =============================================================================
  // Effect Hooks Section
  // =============================================================================

  /**
   * YouTube Link Management Effect
   * Updates currentYoutubeIndex and UI state when links change
   */
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
  
  /**
   * Keyboard Shortcuts Effect
   * Handles global keyboard interactions
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/') {
        if (e.target && ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).nodeName)) {
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
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [inputRef]);

  /**
   * Link Input Visibility Effect
   * Controls link input display based on existing links
   */
  useEffect(() => {
    setShowLinkInput(youtubeLinks.length === 0);
  }, [youtubeLinks]);

  /**
   * Click Outside Handler Effect
   * Manages sidebar closure on outside clicks
   */
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);


  return (
    <>
      <div className="flex h-screen overflow-hidden bg-background">
      <div className={`flex-1 flex ${isDesktop ? 'flex-row' : 'flex-col'} overflow-hidden`}>
        <div className={`${isDesktop ? 'w-1/2' : 'w-full h-full'} flex flex-col overflow-hidden`}>
          <header className="flex justify-start items-center p-4">
            <button 
              onClick={toggleSidebar}
              className="sidebar-toggle-button text-textlight dark:text-textdark  z-50 hover:text-foreground transition-colors duration-200 focus:outline-none"
            >
              <List size={24} />
            </button>
            <a href="/" className=" text-textlight dark:text-textdark font-light uppercase px-4 z-50">
              {isDesktop ? 'Wake The Dead' : 'WTD'}
              <span className="ml-2 text-xs font-normal text-bluelight dark:text-bluedark">beta</span>
            </a>
            {!isDesktop && (
              <div className="flex items-center space-x-4 ml-auto">
                <a
                  href="https://buymeacoffee.com/KingBob"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-textlight dark:text-textdark  hover:text-foreground transition-colors duration-200 focus:outline-none"
                >
                  <Coffee size={24} />
                </a>
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                  <DialogTrigger asChild>
                    <button 
                      ref={settingsButtonRef}
                      className="text-textlight dark:text-textdark  hover:text-foreground transition-colors duration-200 focus:outline-none"
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
                  className="text-textlight dark:text-textdark hover:text-foreground transition-colors duration-200 focus:outline-none pb-0.5"
                >
                  <ChatCircleDots className="w-6 h-6" />
                  {/* <IconMessage className="w-6 h-6" /> */}
                </button>
              </div>
            )}
          </header>
          <main 
            ref={mainContentRef}
            className={`flex-1 flex flex-col overflow-y-auto ${isDesktop ? 'pl-48 md:pl-32 py-10 sm:py-0 pr-10' : 'overflow-y-auto'}`}
          >
            {showLinkInput ? (
             <div className="flex-grow flex items-center justify-center w-full">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ duration: 0.5 }}
               className="w-full max-w-xl justify-center flex flex-col item-center sm:items-start"
             >
               <div className="w-full flex flex-col items-start gap-y-8">
               <motion.div
                className="p-8 sm:p-12 w-40 h-40 sm:w-60 sm:h-60 justify-center mx-auto relative"
                initial={{ opacity: 1 }}
                animate={{ 
                  scale: isInputFocused ? 1.2 : [1, 1.2, 1],
                }}
                transition={{
                  duration: isInputFocused ? 0 : 2,
                  repeat: isInputFocused ? 0 : Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="w-full h-full rounded-full bg-bluelight dark:bg-bluedark blur-lg sm:blur-xl" />
              </motion.div>
           
                 <div className="w-full mt-0 sm:mt-16 px-4 sm:px-8">
                  <div className="max-w-lg mx-auto"> 
                    <motion.form 
                      onSubmit={handleLinksSubmit} 
                      className="w-full relative"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                    >
                      <p className='uppercase text-lg font-light pl-8 pb-1'>Paste any link</p>
                      <div className="relative flex items-center px-6">
                      <input
                          type="text"
                          value={inputLinks}
                          onChange={(e) => {
                            setInputLinks(e.target.value);
                            if (e.target.value) {
                              setIsInputFocused(true);
                            } else {
                              setIsInputFocused(false);
                            }
                          }}
                          placeholder=""
                          className="w-full rounded-none pl-2 pb-2 bg-transparent text-secondarylight dark:text-secondarydark font-light"
                        />
                        <div className="absolute bottom-0 left-6 right-6 bg-transparent border-b-[1px] border-bluelight dark:border-bluedark"></div>
                        <motion.button 
                          type="submit" 
                          className="pb-1 text-textlight dark:text-textdark "
                        >
                          <ArrowRight size={22} weight="bold" />
                        </motion.button>
                      </div>
                    </motion.form>
                  </div>
                  <ExampleLinks onAddLink={handleAddLink} />
                </div>
               </div>
             </motion.div>
           </div>
            ) : (
              <div className="h-full w-full">
                {memoizedCombinedYoutubeComponent}
              </div>
            )}
          </main>
          
        </div>
        {isDesktop && (
          <>
            <motion.div
              className="w-px bg-boxlight dark:bg-boxdark my-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            />
            <motion.div
              className="w-1/2 flex flex-col overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <header className="flex justify-end items-center p-4 space-x-4">
                <a
                  href="https://buymeacoffee.com/KingBob"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-textlight dark:text-textdark  hover:text-foreground transition-colors duration-200 focus:outline-none"
                >
                  <Coffee size={24} />
                </a>
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                  <DialogTrigger asChild>
                    <button 
                      ref={settingsButtonRef}
                      className="text-textlight dark:text-textdark  hover:text-foreground transition-colors duration-200 focus:outline-none"
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
                console.log('rateLimitInfo', rateLimitInfo),
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
    </div>
    </>
  );
}