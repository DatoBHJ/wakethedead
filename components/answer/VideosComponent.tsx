import React, { useState, useEffect } from 'react';
import { IconPlay, IconClock, IconChevronUpDown, IconClose } from '@/components/ui/icons';

interface Video {
  title: string;
  link: string;
  imageUrl: string;
  duration?: string;
}

interface VideosComponentProps {
  videos: Video[];
}

const VideosComponent: React.FC<VideosComponentProps> = ({ videos }) => {
  const [showMore, setShowMore] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<boolean[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setLoadedImages(Array(videos.length).fill(false));
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    const checkDarkMode = () => {
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    };
    checkMobile();
    checkDarkMode();
    window.addEventListener('resize', checkMobile);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', checkDarkMode);
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', checkDarkMode);
    };
  }, [videos]);

  const handleImageLoad = (index: number) => {
    setLoadedImages((prevLoadedImages) => {
      const updatedLoadedImages = [...prevLoadedImages];
      updatedLoadedImages[index] = true;
      return updatedLoadedImages;
    });
  };

  const handleVideoClick = (link: string) => {
    setSelectedVideo(link);
  };

  const handleCloseModal = () => {
    setSelectedVideo(null);
    setIsFullScreen(false);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const VideosSkeleton = () => (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="w-1/3 p-1">
          <div className="w-full overflow-hidden aspect-video rounded-lg">
            <div className="w-full h-24 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
        </div>
      ))}
    </>
  );

  const renderVideos = () => {
    const videosToShow = showMore ? videos : (isMobile ? videos.slice(0, 3) : videos.slice(0, 3));
    return videosToShow.map((video, index) => (
      <div
        key={index}
        className={`${isMobile ? 'w-full' : 'w-1/3'} p-1 cursor-pointer`}
        onClick={() => handleVideoClick(video.link)}
      >
        <div className={`relative group ${isMobile && showMore ? 'flex items-center' : ''}`}>
          <div className={`${isMobile && showMore ? 'w-2/5' : 'w-full'} overflow-hidden rounded-lg`}>
            {!loadedImages[index] && (
              <div className="w-full h-24 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            )}
            <img
              src={video.imageUrl}
              alt={video.title}
              className={`w-full h-auto  object-center object-cover aspect-video  rounded-lg ${loadedImages[index] ? 'block' : 'hidden'}`}
              onLoad={() => handleImageLoad(index)}
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-lg">
              <IconPlay className="w-12 h-12 text-white" />
            </div>
          </div>
          <div className={`
            ${isMobile 
              ? showMore
                ? 'w-3/5 pl-2' 
                : 'w-full mt-1'
              : 'absolute bottom-0 left-0 right-0 bg-black bg-opacity-70'
            } 
            ${isMobile && !isDarkMode ? 'text-black' : 'text-white'} 
            p-2 
            ${!isMobile || !showMore ? 'rounded-b-lg' : ''}
          `}>
            <h3 className={`font-medium ${isMobile ? 'text-sm  line-clamp-2' : 'text-base  line-clamp-1'}`}>{video.title}</h3>
            {video.duration && (
              <div className="flex items-center mt-1 text-xs">
                <IconClock className="w-3 h-3 mr-1" />
                <span>{video.duration}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="bg-card-foreground/[3%] dark:bg-card-foreground/5 shadow-lg rounded-lg p-4 mt-4 w-full">
      <div className="flex items-center mb-4">
        <h2 className="text-lg font-semibold flex-grow text-black dark:text-white">Videos</h2>
        {videos.length > 3 && (
          <button
            className="text-black dark:text-white focus:outline-none"
            onClick={() => setShowMore(!showMore)}
          >
            {showMore ? <IconClose className="w-6 h-6" /> : <IconChevronUpDown className="w-6 h-6" />}
          </button>
        )}
      </div>
      <div className={`flex flex-wrap -mx-1 ${
        showMore 
          ? '' 
          : isMobile 
            ? 'max-h-[240px]'
            : 'max-h-[280px]'
      } overflow-hidden`}>
        {videos.length === 0 ? <VideosSkeleton /> : renderVideos()}
      </div>
      {selectedVideo && (
        <div
          className={`fixed ${isFullScreen ? 'inset-0' : 'bottom-20 right-0 md:bottom-2 md:right-2'} z-50 ${isFullScreen ? 'w-full h-full' : 'w-full md:w-1/2 lg:w-1/4 h-1/4 md:h-1/4'
            } bg-black bg-opacity-75 flex items-center justify-center rounded-lg shadow-lg border-4 border-white`}
        >
          <div className="relative w-full h-full">
            <iframe
              src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedVideo)}?autoplay=1`}
              title="YouTube Video"
              allowFullScreen
              className="w-full h-full rounded-lg"
              allow='autoplay'
            ></iframe>
            <button
              className="absolute top-2 right-2 p-2 bg-white text-black rounded-full hover:bg-gray-200 focus:outline-none"
              onClick={handleCloseModal}
            >
              <IconClose className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const getYouTubeVideoId = (url: string) => {
  const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(?:embed\/)?(?:v\/)?(?:shorts\/)?(?:\S+)/);
  return match ? match[0].split('/').pop()?.split('=').pop() : '';
};

export default VideosComponent;