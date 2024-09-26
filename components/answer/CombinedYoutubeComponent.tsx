import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { getYouTubeVideoId } from '@/lib/youtube-transcript';
import Skeleton, { LoadingIndicator } from './Skeleton';
import EditableArticleView from './VideoSummaryView';
import { Copy, Check, ArrowsCounterClockwise, CaretRight, CaretLeft, VideoCamera, Article, PencilSimple, FloppyDisk } from "@phosphor-icons/react";
import { useArticleGenerator } from './useYoutubeHooks';
import { useToast } from "@/components/ui/use-toast";

interface YouTubeCard {
  id: string;
  title: string;
  thumbnail: string;
  isYouTube: boolean;
  link: string;
}


interface CombinedYoutubeComponentProps {
  youtubeLinks: string[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  selectedModel: string;
  selectedLanguage: string;
  cards: YouTubeCard[];
  onLinkClick: (link: string) => void;
  onExtractQuestions: (questions: string[]) => void;

}

const CombinedYoutubeComponent: React.FC<CombinedYoutubeComponentProps> = React.memo(({
  youtubeLinks,
  currentIndex,
  setCurrentIndex,
  selectedModel,
  selectedLanguage,
  cards,
  onLinkClick,
  onExtractQuestions,

}) => {
  const { toast } = useToast();

  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  const [showVideo, setShowVideo] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const videoRef = useRef<HTMLIFrameElement>(null);

  const videoIds = useMemo(() => youtubeLinks.map(getYouTubeVideoId), [youtubeLinks]);

  const { 
    articles, 
    streamingContent, 
    isGenerating, 
    error: articleError, 
    generateArticle 
  } = useArticleGenerator(youtubeLinks, selectedModel, selectedLanguage);

  const [editedArticles, setEditedArticles] = useState<{ [key: string]: string }>({});


  const extractQuestionsFromContent = (content: string): string[] => {
    const parts = content.split(/# Part \d+\/\d+/).filter(Boolean);
    const extractedContent: string[] = [];
  
    parts.forEach((part, index) => {
      const partMatch = content.match(new RegExp(`# Part (\\d+/\\d+)${part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
      const partNumber = partMatch ? partMatch[1] : `${index + 1}/?`;
  
      const summaryMatch = part.match(/##\s*(.+?)(?=\n|$)/);
      if (summaryMatch) {
        const summary = summaryMatch[1].trim();
        extractedContent.push(`**Part ${partNumber}: ${summary}**`);
      }
  
      const questionMatches = part.match(/>\s*([^\n]+)/g);
      if (questionMatches) {
        questionMatches.forEach(match => {
          extractedContent.push(match.replace(/^>\s*/, '').trim());
        });
      }
    });
  
    return extractedContent;
  };

  useEffect(() => {
    const currentVideoId = videoIds[currentIndex];
    const contentToAnalyze = editedArticles[currentVideoId] || articles[currentVideoId] || streamingContent[currentVideoId];
    
    if (contentToAnalyze) {
      const extractedQuestions = extractQuestionsFromContent(contentToAnalyze);
      onExtractQuestions(extractedQuestions);
    }
  }, [currentIndex, videoIds, editedArticles, articles, streamingContent, onExtractQuestions]);

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

  const toggleVideoVisibility = useCallback(() => {
    setShowVideo(prev => !prev);
  }, []);

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

  const currentVideoId = videoIds[currentIndex];
  
  const renderContent = () => {
    if (isGenerating[currentVideoId]) {
      return (
        <>
          {streamingContent[currentVideoId] && (
            <EditableArticleView 
              content={streamingContent[currentVideoId]}
              onTimestampClick={handleTimestampClick}
              onEdit={(editedContent) => handleEdit(currentVideoId, editedContent)}
              isEditing={false}
            />
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
      <EditableArticleView 
        content={contentToShow}
        onTimestampClick={handleTimestampClick}
        onEdit={(editedContent) => handleEdit(currentVideoId, editedContent)}
        isEditing={isEditing}
      />
    );
  };

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

  return (
    <div className="flex flex-col pb-8 mt-2 md:py-10 py-0 h-full overflow-hidden bg-background dark:bg-background text-foreground dark:text-foreground">
      <div className="flex-1 flex flex-col overflow-hidden">
        {showVideo && (
          // <div className="w-full max-w-4xl mx-auto">
          //   <div className="relative pb-[56.25%] h-0 overflow-hidden">
          //     <div className="absolute top-0 left-0 w-full h-full">
          //       {renderMediaContent()}
          //     </div>
          //   </div>
          // </div>
          <div className="w-full px-6">
          <div className="max-w-4xl mx-auto">
            <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-xl">
              <div className="absolute top-0 left-0 w-full h-full">
                {renderMediaContent()}
              </div>
            </div>
          </div>
        </div>
        )}
        <div className="flex-1 overflow-y-auto">
          <div className="py-4 px-2 max-w-4xl mx-auto">
            <div className="bg-card dark:bg-card text-card-foreground dark:text-gray-200 px-4">
              {renderContent()}
            </div>
            {articleError}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between py-1 pt-2 md:pt-16 px-4 pl-3 bg-card dark:bg-card text-card-foreground dark:text-card-foreground">
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
        
        <div className="flex items-center space-x-2">
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
        </div>
      </div>
    </div>
  );
});

CombinedYoutubeComponent.displayName = 'CombinedYoutubeComponent';

export default CombinedYoutubeComponent;