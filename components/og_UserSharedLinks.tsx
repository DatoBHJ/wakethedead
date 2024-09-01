import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { ArrowRight } from "@phosphor-icons/react";

const exampleLinks = [
  { url: "https://www.youtube.com/watch?v=bLJ-zfBmChA", title: "Album Review: Charli XCX's BRAT", duration: "14 mins", category: "Short Video" },
  { url: "https://www.youtube.com/watch?v=oFtjKbXKqbg", title: "Deep Dive: AI & Digital Nomad Life", duration: "3h 43m", category: "Long Video" },
  { url: "https://www.deeplearning.ai/the-batch/issue-264/", title: "Read: LLM Token Prices Decline", duration: "5 mins", category: "Article" },
];

const UserSharedLinks = ({ onAddLink, showUFO, mainContentRef }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const dragControls = useDragControls();

  useEffect(() => {
    if (showUFO && mainContentRef.current) {
      const setRandomPosition = () => {
        const mainRect = mainContentRef.current.getBoundingClientRect();
        
        let randomX, randomY;
        do {
          randomX = Math.random() * window.innerWidth;
          randomY = Math.random() * window.innerHeight;
        } while (
          randomX > mainRect.left &&
          randomX < mainRect.right &&
          randomY > mainRect.top &&
          randomY < mainRect.bottom
        );
        
        setPosition({ x: randomX, y: randomY });
      };

      setRandomPosition();
    }
  }, [showUFO, mainContentRef]);

  const handleLinkClick = (url) => {
    onAddLink(url);
    setIsOpen(false);
  };

  if (!showUFO || !position) return null;

  return (
    <>
      <motion.div
        drag
        dragControls={dragControls}
        dragMomentum={false}
        dragElastic={0}
        onDragEnd={(event, info) => {
          setPosition({ x: info.point.x, y: info.point.y });
        }}
        initial={position}
        animate={position}
        className="fixed z-0"
        style={{ touchAction: 'none' }}
      >
        <button
          onPointerDown={(e) => dragControls.start(e)}
          onClick={() => setIsOpen(!isOpen)}
          className="text-4xl sm:text-5xl md:text-6xl hover:scale-110 transition-transform duration-200 cursor-move"
          aria-label="Show shared links"
        >
          🛸
        </button>
      </motion.div>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 backdrop-blur-xl bg-background/90 dark:bg-background/50 z-50"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 flex items-center justify-center z-50"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="text-black dark:text-white p-4 md:p-8 w-full max-w-5xl md:max-w-6xl mx-auto  overflow-y-auto backdrop-blur-sm bg-card-foreground/[3%] dark:bg-card-foreground/5 rounded-xl "
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl md:text-4xl font-bold mb-2 text-center font-handwriting">🔗 Community Picks</h2>
              <p className="text-center mb-3 text-sm md:text-lg font-handwriting">Discover what others are exploring!</p>
              <div className="text-center mb-3 md:mb-6">
                <p className="text-sm md:text-lg italic">
                  Our platform supports various <span className="text-purple-600 dark:text-purple-400 font-semibold">content types</span>.
                  Here are some examples:
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                {exampleLinks.map((link, index) => (
                  <div
                    key={index}
                    className="font-handwriting  p-4 md:p-6 transition-all hover:shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="inline-block px-2 py-1 md:px-3 rounded-full text-xs md:text-sm font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                          {link.category}
                        </span>
                        {link.duration && (
                          <span className="inline-block px-2 py-1 md:px-3 rounded-full text-xs md:text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" title="Estimated time to consume this content">
                            {link.duration}
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium text-base md:text-xl mb-2 md:mb-3">{link.title}</h3>
                    </div>
                    <button 
                      className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 flex items-center text-sm md:text-lg"
                      onClick={() => handleLinkClick(link.url)}
                    >
                      Beam me up ⚡️<ArrowRight size={16} className="ml-1 md:ml-2" />
                    </button>
                  </div>
                ))}
              </div>
              {/* <p className="mt-4 text-sm text-center italic sm:text-base">
                👆 Explore these examples or add your own link on the home page!
              </p> */}
              <p className="mt-6 md:mt-8 text-sm md:text-lg text-center italic">
                👆 Explore these examples of supported <span className="text-purple-600 dark:text-purple-400 font-semibold">content types</span> or add your own link on the home page!
              </p>
            </motion.div>
          </motion.div>
        </>
      )}
    </>
  );
};

export default UserSharedLinks;