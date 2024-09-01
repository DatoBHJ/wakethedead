import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { ArrowRight } from "@phosphor-icons/react";

const exampleLinks = [
  { url: "https://www.youtube.com/watch?v=bLJ-zfBmChA", title: "Album Review: Charli XCX's BRAT", duration: "14 mins", category: "Short Video" },
  { url: "https://www.youtube.com/watch?v=oFtjKbXKqbg", title: "Deep Dive: AI & Digital Nomad Life", duration: "3h 43m", category: "Long Video" },
  { url: "https://www.deeplearning.ai/the-batch/issue-264/", title: "Read: LLM Token Prices Decline", category: "Article" },
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
          className="text-4xl sm:text-5xl hover:scale-110 transition-transform duration-200 cursor-move"
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
              className="text-black dark:text-white p-6 w-full max-w-4xl mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4 text-center font-handwriting sm:text-3xl">🔗 Community Picks</h2>
              <p className="text-center mb-6 text-sm font-handwriting sm:text-base">Discover what others are exploring!</p>
              <div className="text-center mb-6">
                <p className="text-xs italic">
                  Our platform supports various <span className="text-purple-600 dark:text-purple-400 font-semibold">content types</span>.
                </p>
                <p className="text-xs italic mt-1">
                  Here are some examples:
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exampleLinks.map((link, index) => (
                  <div
                    key={index}
                    className="font-handwriting bg-background dark:bg-backgroundsecond rounded-lg shadow-2xl shadow-black/10 p-4 transition-all hover:shadow-lg"
                  >
                    <a
                      href="#"
                      className="block"
                      onClick={(e) => {
                        e.preventDefault();
                        handleLinkClick(link.url);
                      }}
                    >
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold mb-2 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                        {link.category}
                      </span>
                      <h3 className="font-medium text-lg mb-2">{link.title}</h3>
                      <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                        {link.duration && <span title="Estimated time to consume this content">{link.duration}</span>}
                      </div>
                    </a>
                    <button 
                      className="mt-4 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 flex items-center"
                      onClick={() => handleLinkClick(link.url)}
                    >
                      Beam me up ⚡️<ArrowRight size={16} className="ml-1" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-sm text-center italic">
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