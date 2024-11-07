import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { getYouTubeVideoId } from '@/lib/youtube-transcript';
import Skeleton, { LoadingIndicator } from './Skeleton';
import EditableArticleView from './VideoSummaryView';
import { 
  Copy, 
  Check, 
  ArrowsCounterClockwise, 
  CaretRight, 
  CaretLeft, 
  VideoCamera, 
  Article, 
  Rows, 
  TextAlignLeft, 
  PencilSimple, 
  FloppyDisk 
} from "@phosphor-icons/react";
import { useArticleGenerator } from './useYoutubeHooks';
import { useToast } from "@/components/ui/use-toast";
import ExtractedQuestionsModal from './ExtractedQuestionsModal';
import ReadingTime from './ReadingTime';
import RateLimit from '@/components/answer/RateLimit';
import SimilarContent from './SimilarContent';

interface YouTubeCard {
  id: string;
  title: string;
  thumbnail: string;
  isYouTube: boolean;
  link: string;
}

interface SimilarDocument {
  title: string;
  pageContent: string;
  url: string;
}

interface CombinedYoutubeComponentProps {
  youtubeLinks: string[];          // Array of YouTube video URLs
  currentIndex: number;            // Current active video index
  setCurrentIndex: (index: number) => void;
  selectedModel: string;           // Selected AI model for processing
  selectedLanguage: string;        // Selected language for content
  cards: YouTubeCard[];           // Array of video metadata
  onLinkClick: (link: string) => void;
  onExtractQuestions: (questions: string[]) => void;
  onQuestionSelected: (question: string) => void;
  setIsChatOpen: (isOpen: boolean) => void;
  onAddLink: (link: string) => void;
}

/**
 * Combined YouTube Component
 * 
 * A comprehensive component that handles YouTube video playback, content generation,
 * and related functionality like question extraction and similar content discovery.
 */
const CombinedYoutubeComponent: React.FC<CombinedYoutubeComponentProps> = React.memo(({
  youtubeLinks,
  currentIndex,
  setCurrentIndex,
  selectedModel,
  selectedLanguage,
  cards,
  onLinkClick,
  onExtractQuestions,
  onQuestionSelected,
  setIsChatOpen,
  onAddLink,
}) => {
  // Hook initializations
  const { toast } = useToast();
  const videoRef = useRef<HTMLIFrameElement>(null);

  // State management
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  const [showVideo, setShowVideo] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [editedArticles, setEditedArticles] = useState<{ [key: string]: string }>({});
  const [firstSummary, setFirstSummary] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<{[key: string]: boolean}>({});
  const [extractedQuestions, setExtractedQuestions] = useState<string[]>([]);

  // Memoized values
  const videoIds = useMemo(() => youtubeLinks.map(getYouTubeVideoId), [youtubeLinks]);

  // Similar content management
  const [similarDocumentsByVideo, setSimilarDocumentsByVideo] = useState<{
    [videoId: string]: SimilarDocument[]
  }>({});
  const [loadingStatesByVideo, setLoadingStatesByVideo] = useState<{
    [videoId: string]: boolean
  }>({});
  const [errorStatesByVideo, setErrorStatesByVideo] = useState<{
    [videoId: string]: string | null
  }>({});

  // Custom hook for article generation
  const { 
    articles, 
    streamingContent, 
    isGenerating, 
    error: articleError, 
    rateLimitError,
    generateArticle 
  } = useArticleGenerator(youtubeLinks, selectedModel, selectedLanguage);

   /**
   * Extracts questions and summaries from the content
   * @param content - The article content to analyze
   * @returns Array of extracted questions and summaries
   */
   const extractQuestionsFromContent = (content: string): string[] => {
    const parts = content.split(/# (?:Part|PART) \d+\/\d+/i).filter(Boolean);
    const extractedContent: string[] = [];
    let firstSummaryFound = false;
    
    parts.forEach((part, index) => {
      const partMatch = content.match(
        new RegExp(`# (?:Part|PART) (\\d+/\\d+)${part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
      );
      const partNumber = partMatch ? partMatch[1] : `${index + 1}/?`;
  
      const summaryMatch = part.match(/##\s*(.+?)(?=\n|$)/);
      if (summaryMatch && !firstSummaryFound) {
        setFirstSummary(summaryMatch[1].trim());
        firstSummaryFound = true;
      }
  
      if (summaryMatch) {
        extractedContent.push(`**Part ${partNumber}: ${summaryMatch[1].trim()}**`);
      }
  
      const questionMatch = part.match(/>\s*(.+?\?)/);
      if (questionMatch) {
        extractedContent.push(questionMatch[1].trim());
      }
    });
  
    return extractedContent;
  };

  /**
   * Extracts the first summary from content
   */
  const extractFirstSummary = (content: string): string => {
    const summaryMatch = content.match(/##\s*(.+?)(?=\n|$)/);
    return summaryMatch ? summaryMatch[1].trim() : '';
  };

// Effects

  /**
   * Effect to extract questions and summaries when content changes
   */
  useEffect(() => {
    const currentVideoId = videoIds[currentIndex];
    const contentToAnalyze = editedArticles[currentVideoId] || 
                            articles[currentVideoId] || 
                            streamingContent[currentVideoId];
    
    if (contentToAnalyze) {
      const extractedContent = extractQuestionsFromContent(contentToAnalyze);
      setExtractedQuestions(extractedContent);
      onExtractQuestions(extractedContent);
    }
  }, [currentIndex, videoIds, editedArticles, articles, streamingContent, onExtractQuestions]);

  /**
   * Effect to fetch similar documents for the current video
   */
  useEffect(() => {
    const fetchSimilarDocuments = async () => {
      const currentVideoId = videoIds[currentIndex];
      const currentCard = cards[currentIndex];
      
      if (hasSearched[currentVideoId]) return;

      const currentContent = editedArticles[currentVideoId] || 
                           articles[currentVideoId] || 
                           streamingContent[currentVideoId];

      if (!currentContent) return;

      setLoadingStatesByVideo(prev => ({
        ...prev,
        [currentVideoId]: true
      }));
      
      setErrorStatesByVideo(prev => ({
        ...prev,
        [currentVideoId]: null
      }));
      
      try {
        const summary = extractFirstSummary(currentContent);
        const currentUrl = currentCard?.link || youtubeLinks[currentIndex];
        
        const searchPayload = {
          title: currentCard?.title || '',
          summary,
          currentUrl
        };

        if (!searchPayload.title && !summary) {
          throw new Error('No search content available');
        }

        const response = await fetch('/api/similar-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchPayload),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch similar content');
        }

        const data = await response.json();
        
        // Filter out current video from similar content
        const filteredData = data.filter((doc: SimilarDocument) => {
          const docId = getYouTubeVideoId(doc.url);
          return docId !== currentVideoId;
        });
        
        setSimilarDocumentsByVideo(prev => ({
          ...prev,
          [currentVideoId]: filteredData
        }));
        
        setHasSearched(prev => ({
          ...prev,
          [currentVideoId]: true
        }));
      } catch (err) {
        setErrorStatesByVideo(prev => ({
          ...prev,
          [currentVideoId]: 'Error fetching similar content. Please try again later.'
        }));
        console.error('Error fetching similar content:', err);
      } finally {
        setLoadingStatesByVideo(prev => ({
          ...prev,
          [currentVideoId]: false
        }));
      }
    };

    fetchSimilarDocuments();
  }, [
    currentIndex,
    cards,
    youtubeLinks,
    videoIds,
    hasSearched,
    editedArticles,
    articles,
    streamingContent
  ]);

   /**
   * Effect to generate articles for all videos
   */
   useEffect(() => {
    const generateAllArticles = async () => {
      for (const videoId of videoIds) {
        if (!articles[videoId] && !isGenerating[videoId]) {
          await generateArticle(videoId);
        }
      }
    };
    generateAllArticles();
  }, [videoIds, articles, generateArticle, isGenerating]);

  /**
   * Event handler for editing the article content
   * @param videoId - The video ID of the article
   * @param editedContent - The edited content
   */
  const handleEdit = useCallback(async (videoId: string, editedContent: string) => {
    const originalContent = articles[videoId] || streamingContent[videoId];
    
    if (editedContent === originalContent) {
      return;
    }

    setEditedArticles(prev => ({ ...prev, [videoId]: editedContent }));
    
    try {
      const response = await fetch('/api/summarizeVideo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, editedContent, selectedModel, selectedLanguage }),
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          // description: "Your edited article has been saved and cached successfully.",
          description: "Your edits have been saved and cached. Thanks for boosting the quality!",
          duration: 3000,
        });
      } else {
        throw new Error('Failed to update cached article');
      }
    } catch (error) {
      console.error('Error updating cached article:', error);
      toast({
        title: "Error",
        description: "Failed to save and cache your edited article. Please try again.",
        duration: 3000,
        variant: "destructive",
      });
    }
    setIsEditing(false);
  }, [articles, streamingContent, selectedModel, selectedLanguage, toast]);

  // Event handlers
  /*
  * Event handler for regenerating the article content
  * @param videoId - The video ID of the article to regenerate
  * */
  const handleRegenerate = useCallback((videoId: string) => {
      // Clear the edited article before regenerating
      setEditedArticles(prev => {
        const newState = { ...prev };
        delete newState[videoId];
        return newState;
      });
      generateArticle(videoId, true);
    
  }, [generateArticle]);

  const handleCopy = useCallback((videoId: string) => {
    navigator.clipboard.writeText(articles[videoId] || streamingContent[videoId] || '');
    setCopiedStates(prev => ({ ...prev, [videoId]: true }));
    setTimeout(() => setCopiedStates(prev => ({ ...prev, [videoId]: false })), 2000);
  }, [articles, streamingContent]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex, setCurrentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < youtubeLinks.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, setCurrentIndex, youtubeLinks.length]);

  const handleTimestampClick = useCallback((timestamp: number) => {
    if (videoRef.current && videoRef.current.contentWindow) {
      videoRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: 'seekTo',
          args: [timestamp, true]
        }),
        '*'
      );
    }
  }, []);

  const toggleVideoVisibility = useCallback(() => {
    setShowVideo(prev => !prev);
  }, []);
  
  const handleExtractedQuestionClick = (question: string) => {
    onQuestionSelected(question);
  };

  const toggleQuestionsModal = () => {
    setShowQuestionsModal(prev => !prev);
  };

  const currentVideoId = videoIds[currentIndex];
  
  const handleThumbnailClick = useCallback((event: React.MouseEvent<HTMLDivElement>, link: string) => {
    event.preventDefault();
    event.stopPropagation();
    if (link && typeof onLinkClick === 'function') {
      onLinkClick(link);
    }
  }, [onLinkClick]);

  const renderMediaContent = useCallback(() => {
    const currentCard = cards[currentIndex];

    if (!currentCard) {
      return null;
    }

    if (currentCard.isYouTube) {
      return (
        <iframe
          ref={videoRef}
          className="absolute top-0 left-0 w-full h-full"
          src={`https://www.youtube.com/embed/${currentCard.id}?enablejsapi=1`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      );
    } else {
      const linkToUse = currentCard.link || youtubeLinks[currentIndex];
      return (
        <div 
          className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center bg-gray-200 cursor-pointer" 
          onClick={(e) => handleThumbnailClick(e, linkToUse)}
          style={{ zIndex: 10 }}
        >
          <img
            src={currentCard.thumbnail}
            alt={currentCard.title}
            className="max-w-full max-h-[calc(100%-40px)] object-contain"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
            <p className="text-sm truncate">{currentCard.title}</p>
          </div>
        </div>
      );
    }
  }, [cards, currentIndex, youtubeLinks, handleThumbnailClick, videoRef]);

  const extractSubtitles = (content: string): string => {
    const subtitles = content.match(/##[^\n]+/g);
    return subtitles ? subtitles.join('\n') : '';
  };

  const renderReadingTimes = (content: string) => {
    const subtitles = extractSubtitles(content);
    const currentCard = cards[currentIndex];
    const isYouTube = currentCard?.isYouTube ?? false;
  
    return (
      <div className="text-sm text-muted-foreground mt-4 whitespace-normal">
        <ReadingTime 
          content={subtitles} 
          inline={true} 
          label="Headline Skim"
          isYouTube={isYouTube}
        />
        <ReadingTime 
          content={content} 
          inline={true} 
          label="Full Skim"
          isYouTube={isYouTube}
        />
      </div>
    );
  };

  const renderContent = () => {
    if (isGenerating[currentVideoId]) {
      return (
        <>
          {streamingContent[currentVideoId] && (
            <>
              {renderReadingTimes(streamingContent[currentVideoId])}
              <EditableArticleView 
                content={streamingContent[currentVideoId]}
                onTimestampClick={handleTimestampClick}
                onEdit={(editedContent) => handleEdit(currentVideoId, editedContent)}
                isEditing={false}
              />
            </>
          )}
          <LoadingIndicator />
        </>
      );
    }

    if (!articles[currentVideoId] && !streamingContent[currentVideoId]) {
      return <Skeleton />;
    }

    const contentToShow = editedArticles[currentVideoId] || articles[currentVideoId] || streamingContent[currentVideoId];

    return (
      <>
        {renderReadingTimes(contentToShow)}
        <EditableArticleView 
          content={contentToShow}
          onTimestampClick={handleTimestampClick}
          onEdit={(editedContent) => handleEdit(currentVideoId, editedContent)}
          isEditing={isEditing}
        />
      </>
    );
  };

  const renderButtons = () => {
    const currentCard = cards[currentIndex];
    const isSpecialLink = currentCard?.link === 'https://www.wakethedead.ai/tips';

    return (
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleQuestionsModal}
          className="text-foreground/70 hover:text-foreground"
        >
          {showQuestionsModal ? <TextAlignLeft size={20} /> : <Rows size={20} />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleVideoVisibility}
          className="text-foreground/70 hover:text-foreground"
        >
          {showVideo ? <Article size={20} /> : <VideoCamera size={20} />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleCopy(currentVideoId)}
          className="text-foreground/70 hover:text-foreground"
        >
          {copiedStates[currentVideoId] ? <Check size={20} /> : <Copy size={20} />}
        </Button>
        {!isSpecialLink && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleRegenerate(currentVideoId)}
              className="text-foreground/70 hover:text-foreground"
            >
              <ArrowsCounterClockwise size={20} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsEditing(!isEditing)}
              className="text-foreground/70 hover:text-foreground"
              disabled={isGenerating[currentVideoId]}
            >
              {isEditing ? <FloppyDisk size={20} /> : <PencilSimple size={20} />}
            </Button>
          </>
      )}   
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-transparent backdrop-blur-xl text-foreground dark:text-foreground rounded-xl">
      {rateLimitError && <RateLimit />}
      {showVideo && (
        <div className="w-full px-4 sm:px-0 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-xl">
              <div className="absolute top-0 left-0 w-full h-full">
                {renderMediaContent()}
              </div>
            </div>
          </div>
        </div>
      )}
       <div className="flex-grow overflow-y-auto">
        <div className="px-2 max-w-4xl mx-auto">
          <div className=" text-gray-700 dark:text-zinc-300 px-4">
            {showQuestionsModal ? (
              <ExtractedQuestionsModal
                questions={extractedQuestions}
                handleFollowUpClick={handleExtractedQuestionClick}
                setIsChatOpen={setIsChatOpen}
              />
            ) : (
              renderContent()
            )}
            {articleError}
          </div>
          <SimilarContent 
            documents={similarDocumentsByVideo[currentVideoId] || []}
            isLoading={loadingStatesByVideo[currentVideoId] || false}
            error={errorStatesByVideo[currentVideoId] || null}
            onAddLink={onAddLink}
          />
        </div>
      </div>
      <div className="flex-shrink-0 flex items-center justify-between pt-5 pb-0 sm:py-8 px-4 pl-3  text-card-foreground dark:text-card-foreground">
        <div className="flex items-center space-x-1">
          <Button 
            onClick={handlePrevious} 
            variant="outline" 
            size="sm"
            className="flex items-center justify-center px-2"
            disabled={currentIndex === 0}
          >
            <CaretLeft size={20} />
            <span className="sr-only">Previous</span>
          </Button>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            {currentIndex + 1} / {youtubeLinks.length}
          </p>
          <Button 
            onClick={handleNext} 
            variant="outline"
            size="sm"
            className="flex items-center justify-center px-2"
            disabled={currentIndex === youtubeLinks.length - 1}
          >
            <span className="sr-only">Next</span>
            <CaretRight size={20} />
          </Button>
        </div>

        <div>
          {renderButtons()}
        </div>
      </div>
    </div>
  );
});

CombinedYoutubeComponent.displayName = 'CombinedYoutubeComponent';

export default CombinedYoutubeComponent;