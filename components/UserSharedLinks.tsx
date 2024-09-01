import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { ArrowRight } from "@phosphor-icons/react";

const exampleLinks = [
  { url: "https://www.youtube.com/watch?v=bLJ-zfBmChA", label: "🎵 Album Review: Charli XCX's BRAT", duration: "14 mins", category: "Short YouTube Video" },
  { url: "https://www.youtube.com/watch?v=oFtjKbXKqbg", label: "🎙️ Deep Dive: AI & Digital Nomad Life", duration: "3h 43m", category: "Long YouTube Video" },
  { url: "https://www.deeplearning.ai/the-batch/issue-264/", label: "📊 Read: LLM Token Prices Decline", duration: "14 min read", category: "Article" },
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
        className="fixed z-50"
        style={{ touchAction: 'none' }}
      >
        <button
          onPointerDown={(e) => dragControls.start(e)}
          onClick={() => setIsOpen(!isOpen)}
          className="text-4xl sm:text-5xl hover:scale-110 transition-transform duration-200 cursor-move "
          aria-label="Activate interstellar communication portal"
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
              className="text-black dark:text-white p-6 max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4 text-center font-handwriting sm:text-3xl">🔗 Community Picks</h2>
              <p className="text-center mb-6 text-sm font-handwriting sm:text-base">
                Our platform supports various <span className="text-purple-600 dark:text-purple-400 font-semibold">content types</span>.
                Here are some examples:
              </p>
              <div className="space-y-4">
                {exampleLinks.map((link, index) => (
                  <div
                    key={index}
                    className="font-handwriting flex items-center justify-between py-2 px-4 text-sm sm:text-base"
                  >
                    <a
                      href="#"
                      className="flex-grow pr-4"
                      onClick={(e) => {
                        e.preventDefault();
                        handleLinkClick(link.url);
                      }}
                    >
                      <span className="text-purple-600 dark:text-purple-400">{link.category}</span>
                      <span className="text-gray-500 ml-2">({link.duration})</span>
                      <span className="text-xs block font-medium mt-1">
                        {link.label}
                      </span>
                    </a>
                    <ArrowRight 
                      size={20} 
                      className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 flex-shrink-0"
                      onClick={() => handleLinkClick(link.url)}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-center italic sm:text-base">
                👆 Explore these examples or add your own link on the home page!
              </p>
            </motion.div>
          </motion.div>
        </>
      )}
    </>
  );
};

export default UserSharedLinks;