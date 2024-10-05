// import React, { useState, useEffect } from 'react';
// import { IconPlay, IconClock, IconChevronUpDown, IconClose, IconCheck, IconArrowRight } from '@/components/ui/icons';

// interface Video {
//   title: string;
//   link: string;
//   imageUrl: string;
//   duration?: string;
// }

// interface VideosComponentProps {
//   videos: Video[];
//   onAddLink: (link: string) => void;
// }

// const VideosComponent: React.FC<VideosComponentProps> = ({ videos, onAddLink }) => {
//   const [isExpanded, setIsExpanded] = useState(false);
//   const [visibleVideos, setVisibleVideos] = useState(3);
//   const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
//   const [loadedImages, setLoadedImages] = useState<boolean[]>([]);
//   const [isMobile, setIsMobile] = useState(false);
//   const [isDarkMode, setIsDarkMode] = useState(false);
//   const [addedLinks, setAddedLinks] = useState<Set<string>>(new Set());
//   const [showTooltip, setShowTooltip] = useState<string | null>(null);

//   useEffect(() => {
//     setLoadedImages(Array(videos.length).fill(false));
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768);
//     };
//     const checkDarkMode = () => {
//       setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
//     };

//     checkMobile();
//     checkDarkMode();

//     window.addEventListener('resize', checkMobile);
//     window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', checkDarkMode);

//     return () => {
//       window.removeEventListener('resize', checkMobile);
//       window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', checkDarkMode);
//     };
//   }, [videos]);

//   const handleImageLoad = (index: number) => {
//     setLoadedImages((prevLoadedImages) => {
//       const updatedLoadedImages = [...prevLoadedImages];
//       updatedLoadedImages[index] = true;
//       return updatedLoadedImages;
//     });
//   };

//   const handleVideoClick = (video: Video) => {
//     setSelectedVideo(video);
//   };

//   const handleCloseModal = (event: React.MouseEvent<HTMLDivElement>) => {
//     if (event.target === event.currentTarget) {
//       setSelectedVideo(null);
//     }
//   };

//   const handleAddLink = (url: string) => {
//     onAddLink(url);
//     setAddedLinks(prev => new Set(prev).add(url));
//     setShowTooltip(url);
//     setTimeout(() => setShowTooltip(null), 2000);
//   };

//   const handleExpand = () => {
//     setIsExpanded(!isExpanded);
//     if (!isExpanded) {
//       setVisibleVideos(6);
//     } else {
//       setVisibleVideos(3);
//     }
//   };

//   const handleShowMore = () => {
//     setVisibleVideos(prevVisible => Math.min(prevVisible + 6, videos.length));
//   };

//   const VideosSkeleton = () => (
//     <>
//       {Array.from({ length: 3 }).map((_, index) => (
//         <div key={index} className="w-1/3 p-1">
//           <div className="w-full overflow-hidden aspect-video rounded-lg">
//             <div className="w-full h-24 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse"></div>
//           </div>
//         </div>
//       ))}
//     </>
//   );

//   const renderVideos = () => {
//     return videos.slice(0, visibleVideos).map((video, index) => (
//       <div
//         key={index}
//         className={`${isMobile ? 'w-full' : 'w-1/3'} p-1 cursor-pointer`}
//         onClick={() => handleVideoClick(video)}
//       >
//         <div className={`relative group ${isMobile && isExpanded ? 'flex items-center' : ''}`}>
//           <div className={`${isMobile && isExpanded ? 'w-2/5' : 'w-full'} overflow-hidden rounded-lg`}>
//             {!loadedImages[index] && (
//               <div className="w-full h-24 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse"></div>
//             )}
//             <img
//               src={video.imageUrl}
//               alt={video.title}
//               className={`w-full h-auto object-center object-cover aspect-video rounded-lg ${loadedImages[index] ? 'block' : 'hidden'}`}
//               onLoad={() => handleImageLoad(index)}
//             />
//             <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-lg">
//               <IconPlay className="w-12 h-12 text-white" />
//             </div>
//           </div>
//           <div className={`
//             ${isMobile 
//               ? isExpanded
//                 ? 'w-3/5 pl-2' 
//                 : 'w-full mt-1'
//               : 'absolute bottom-0 left-0 right-0 bg-black bg-opacity-70'
//             } 
//             ${isMobile && !isDarkMode ? 'text-black' : 'text-white'} 
//             p-2 
//             ${!isMobile || !isExpanded ? 'rounded-b-lg' : ''}
//           `}>
//             <h3 className={`font-medium ${isMobile ? 'text-sm line-clamp-2' : 'text-base line-clamp-1'}`}>{video.title}</h3>
//             {video.duration && (
//               <div className="flex items-center mt-1 text-xs">
//                 <IconClock className="w-3 h-3 mr-1" />
//                 <span>{video.duration}</span>
//               </div>
//             )}
//             {addedLinks.has(video.link) && (
//               <IconCheck className="w-4 h-4 text-green-500 ml-2" />
//             )}
//           </div>
//         </div>
//       </div>
//     ));
//   };

//   return (
//     <div className="bg-card-foreground/[3%] dark:bg-card-foreground/5 shadow-lg rounded-lg p-4 mt-4 w-full">
//       <div className="flex items-center mb-4">
//         <h2 className="text-lg font-semibold flex-grow text-black dark:text-white">Videos</h2>
//         {videos.length > 3 && (
//           <button
//             className="text-black dark:text-white focus:outline-none"
//             onClick={handleExpand}
//           >
//             {isExpanded ? <IconClose className="w-6 h-6" /> : <IconChevronUpDown className="w-6 h-6" />}
//           </button>
//         )}
//       </div>
//       <div className={`flex flex-wrap -mx-1 ${
//         isExpanded 
//           ? '' 
//           : isMobile 
//             ? 'max-h-[250px]'
//             : 'max-h-[280px]'
//       } overflow-hidden`}>
//         {videos.length === 0 ? <VideosSkeleton /> : renderVideos()}
//       </div>
//       {isExpanded && visibleVideos < videos.length && (
//         <div className="flex justify-center mt-4">
//           <button
//             className="py-2 text-center text-xs sm:text-sm text-gray-400 dark:text-gray-400"
//             onClick={handleShowMore}
//           >
//             Show More
//           </button>
//         </div>
//       )}
//       {selectedVideo && (
//         <div
//           className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
//           onClick={handleCloseModal}
//         >
//           <div className="relative w-full max-w-4xl max-h-full bg-black rounded-lg shadow-lg">
//             <iframe
//               src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedVideo.link)}?autoplay=1`}
//               title="YouTube Video"
//               allowFullScreen
//               className="w-full aspect-video rounded-lg"
//               allow="autoplay"
//             ></iframe>
//             <button
//               className="absolute top-2 right-2 p-2 rounded-full bg-white hover:bg-gray-200 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 focus:outline-none group"
//               onClick={(e) => {
//                 e.stopPropagation();
//                 handleAddLink(selectedVideo.link);
//               }}
//             >
//               {addedLinks.has(selectedVideo.link) ? (
//                 <IconCheck className="w-6 h-6 text-green-500" />
//               ) : (
//                 <IconArrowRight className="w-6 h-6" />
//               )}
//               <span className="absolute bottom-full right-0 transform translate-y-[-10px] bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
//                 {addedLinks.has(selectedVideo.link) ? 'Video beamed up!⚡️' : 'Beam me up!🚀'}
//               </span>
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// const getYouTubeVideoId = (url: string) => {
//   const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(?:embed\/)?(?:v\/)?(?:shorts\/)?(?:\S+)/);
//   return match ? match[0].split('/').pop()?.split('=').pop() : '';
// };

// export default VideosComponent;


import React, { useState, useEffect } from 'react';
import { IconPlay, IconClock, IconChevronUpDown, IconClose, IconCheck, IconArrowRight } from '@/components/ui/icons';

interface Video {
  title: string;
  link: string;
  imageUrl: string;
  duration?: string;
}

interface VideosComponentProps {
  videos: Video[];
  onAddLink: (link: string) => void;
}

const VideosComponent: React.FC<VideosComponentProps> = ({ videos, onAddLink }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleVideos, setVisibleVideos] = useState(3);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loadedImages, setLoadedImages] = useState<boolean[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [addedLinks, setAddedLinks] = useState<Set<string>>(new Set());
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  useEffect(() => {
    setLoadedImages(Array(videos.length).fill(false));
    const checkDarkMode = () => {
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    };

    checkDarkMode();

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', checkDarkMode);

    return () => {
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

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
  };

  const handleCloseModal = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      setSelectedVideo(null);
    }
  };

  const handleAddLink = (url: string) => {
    onAddLink(url);
    setAddedLinks(prev => new Set(prev).add(url));
    setShowTooltip(url);
    setTimeout(() => setShowTooltip(null), 2000);
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setVisibleVideos(6);
    } else {
      setVisibleVideos(3);
    }
  };

  const handleShowMore = () => {
    setVisibleVideos(prevVisible => Math.min(prevVisible + 6, videos.length));
  };

  const VideosSkeleton = () => (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="w-full p-1">
          <div className="w-full overflow-hidden flex rounded-lg">
            <div className="w-2/5 h-24 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="w-3/5 pl-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2 animate-pulse"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
            </div>
          </div>
        </div>
      ))}
    </>
  );

  const renderVideos = () => {
    return videos.slice(0, visibleVideos).map((video, index) => (
      <div
        key={index}
        className="w-full p-1 cursor-pointer"
        onClick={() => handleVideoClick(video)}
      >
        <div className="relative group flex items-center">
          <div className="w-2/5 overflow-hidden rounded-lg">
            {!loadedImages[index] && (
              <div className="w-full h-24 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            )}
            <img
              src={video.imageUrl}
              alt={video.title}
              className={`w-full h-auto object-center object-cover aspect-video rounded-lg ${loadedImages[index] ? 'block' : 'hidden'}`}
              onLoad={() => handleImageLoad(index)}
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-lg">
              <IconPlay className="w-12 h-12 text-white" />
            </div>
          </div>
          <div className="w-3/5 pl-2 text-black dark:text-white">
            <h3 className="font-medium text-sm line-clamp-2">{video.title}</h3>
            {video.duration && (
              <div className="flex items-center mt-1 text-xs">
                <IconClock className="w-3 h-3 mr-1" />
                <span>{video.duration}</span>
              </div>
            )}
            {addedLinks.has(video.link) && (
              <IconCheck className="w-4 h-4 text-green-500 ml-2" />
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
            onClick={handleExpand}
          >
            {isExpanded ? <IconClose className="w-6 h-6" /> : <IconChevronUpDown className="w-6 h-6" />}
          </button>
        )}
      </div>
      <div className={`flex flex-col -mx-1 ${isExpanded ? '' : 'max-h-[250px]'} overflow-hidden`}>
        {videos.length === 0 ? <VideosSkeleton /> : renderVideos()}
      </div>
      {isExpanded && visibleVideos < videos.length && (
        <div className="flex justify-center mt-4">
          <button
            className="py-2 text-center text-xs sm:text-sm text-gray-400 dark:text-gray-400"
            onClick={handleShowMore}
          >
            Show More
          </button>
        </div>
      )}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={handleCloseModal}
        >
          <div className="relative w-full max-w-4xl max-h-full bg-black rounded-lg shadow-lg">
            <iframe
              src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedVideo.link)}?autoplay=1`}
              title="YouTube Video"
              allowFullScreen
              className="w-full aspect-video rounded-lg"
              allow="autoplay"
            ></iframe>
            <button
              className="absolute top-2 right-2 w-10 h-10 rounded-full bg-white hover:bg-gray-200 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 focus:outline-none group flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                handleAddLink(selectedVideo.link);
              }}
            >
              {addedLinks.has(selectedVideo.link) ? (
                <IconCheck className="w-6 h-6 text-green-500" />
              ) : (
                // <IconArrowRight className="w-6 h-6" />
                <span className="text-2xl">⚡️</span>
              )}
              <span className="absolute bottom-full right-0 transform translate-y-[-10px] bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                {addedLinks.has(selectedVideo.link) ? 'Video beamed up!⚡️' : 'Beam me up! 🚀'}
              </span>
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