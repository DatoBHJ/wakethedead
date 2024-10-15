import React, { useState, useEffect, forwardRef } from 'react';
import { X, Plus } from "@phosphor-icons/react";
import { IconGitHub, IconPlus, IconTwitter, IconBuyMeACoffee } from '@/components/ui/icons';
import EmailContactButton from '@/components/ui/EmailContactButton';
import { getYouTubeVideoId } from '@/lib/youtube-transcript';
import { fetchVideoInfo } from '@/lib/utils/fetchinfo';
import { Button } from '@/components/ui/button';
import { List, ArrowRight, Gear } from "@phosphor-icons/react";
import { Coffee } from 'lucide-react';

interface YouTubeCard {
  id: string;
  title: string;
  thumbnail: string;
  isYouTube: boolean;
  link: string;
}


interface LeftSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  youtubeLinks: string[];
  setYoutubeLinks: React.Dispatch<React.SetStateAction<string[]>>;
  onCardClick: (index: number) => void;
  currentIndex: number;
  onCardsUpdate: (cards: YouTubeCard[]) => void;

}

const LeftSidebar = forwardRef<HTMLDivElement, LeftSidebarProps>(({ 
  isOpen, 
  youtubeLinks, 
  setYoutubeLinks, 
  onCardClick,
  currentIndex,
  onCardsUpdate,

}, ref) => {
  const [cards, setCards] = useState<YouTubeCard[]>([]);
  const [newLink, setNewLink] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const newCards = await Promise.all(
        youtubeLinks.map(async (link) => {
          if (link.includes('youtube') || link.includes('youtu.be')) {
            const videoId = getYouTubeVideoId(link);
            try {
              const videoInfo = await fetchVideoInfo(videoId);
              return {
                id: videoId,
                title: videoInfo.title,
                thumbnail: videoInfo.thumbnail,
                isYouTube: true,
                link: link, 
              };
            } catch (error) {
              console.error('Error fetching video info:', error);
              return null;
            }
          } else {
            try {
              const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(link)}`);
              const data = await response.json();
              return {
                id: link,
                title: data.data.title || 'Unknown Title',
                thumbnail: data.data.image?.url || '/groq.png',
                isYouTube: false,
                link: link, 
              };
            } catch (error) {
              console.error('Error fetching link info:', error);
              return {
                id: link,
                title: 'Unknown Title',
                thumbnail: '/groq.png',
                isYouTube: false,
                link: link, 
              };
            }
          }
        })
      );
      const filteredCards = newCards.filter((card): card is YouTubeCard => card !== null);
      setCards(filteredCards);
      onCardsUpdate(filteredCards);
    };
  
    fetchData();
  }, [youtubeLinks, onCardsUpdate]);

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLink.trim()) {
      setYoutubeLinks(prevLinks => [...prevLinks, newLink.trim()]);
      setNewLink('');
      onCardClick(youtubeLinks.length);
    }
  };

  const handleRemoveLink = (index: number) => {
    setYoutubeLinks(youtubeLinks.filter((_, i) => i !== index));
  };

  return (
    <div 
      ref={ref}
      className={`w-72 bg-background dark:bg-background shadow-lg transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} fixed left-0 top-0 h-full z-50 flex flex-col`}
    >
      <div className="h-16"></div> 
      <div className="flex-grow overflow-y-auto px-6 space-y-4 sm:space-y-6">
        {cards.map((card, index) => (
          <div key={card.id} className="relative group">
            <button 
              onClick={() => onCardClick(index)} 
              className={`w-full text-left focus:outline-none transition-all duration-300 ${index === currentIndex ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
            >
              <img src={card.thumbnail} alt={card.title} className="w-full h-32 object-cover rounded-md shadow-sm" />
              <div className="mt-2">
                <h3 className="text-xs sm:text-sm font-medium text-foreground dark:text-foreground truncate">{card.title}</h3>
              </div>
            </button>
            <button 
              onClick={() => handleRemoveLink(index)}
              className="absolute top-2 right-2 p-1 bg-background/80 text-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 focus:outline-none"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="p-6 mb-8 bg-background dark:bg-background">
        {/* <form onSubmit={handleAddLink} className="flex flex-col mb-5">
          <div className="flex relative items-center pb-2">
            <input
              id="add-link"
              type="text"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="More links? Paste them here!
              "
              className="flex-grow pr-1 rounded-none bg-transparent border-b-[1px] border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors text-black dark:text-white"
            />
            <button 
              type="submit" 
              className="flex text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 focus:outline-none bg-transparent transition-colors duration-200"
            >
             <IconPlus className='w-5 h-5' />
            </button>
          </div>
        </form> */}
        <form onSubmit={handleAddLink} className="flex flex-col mb-5">
          <div className="flex relative items-center pb-2">
            <button 
              type="submit" 
              className="absolute left-0 bottom-2 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 focus:outline-none bg-transparent transition-colors duration-200"
            >
              ⚡
            </button>
            <input
              id="add-link"
              type="text"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="Paste more links here!"
              className="flex-grow pl-6 rounded-none bg-transparent border-b-[1px] placeholder-blue-500 dark:placeholder-blue-400 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors text-black dark:text-white"
            />
                  <button 
              type="submit" 
              className="flex text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 focus:outline-none bg-transparent transition-colors duration-200"
            >
                          <ArrowRight size={22} weight="bold" />
                          </button>
          </div>
        </form>
        <div className="flex justify-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon"
            asChild
            className="text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            <a
              target="_blank"
              href="https://x.com/DatoBHJ"
              rel="noopener noreferrer"
            >
              <IconTwitter className="h-5 w-5" />
            </a>
          </Button>
          <EmailContactButton />
          <Button 
            variant="ghost" 
            size="icon"
            asChild
            className="text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            <a
              target="_blank"
              href="https://buymeacoffee.com/dbhyperdrive"
              rel="noopener noreferrer"
              title="Buy Me a Coffee"
            >
              {/* <IconBuyMeACoffee className="h-5 w-5" /> */}
              <Coffee className="h-5 w-5" />
            </a>
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            asChild
            className="text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            {/* <a
              target="_blank"
              href="https://github.com/DatoBHJ/wakethedead"
              rel="noopener noreferrer"
            >
              <IconGitHub className="h-5 w-5" />
            </a> */}
          </Button>
        </div>
      </div>
    </div>
  );
});

LeftSidebar.displayName = 'LeftSidebar';

export default LeftSidebar;