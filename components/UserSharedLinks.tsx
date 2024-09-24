import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { ArrowRight } from "@phosphor-icons/react";
import { IconMessage } from '@/components/ui/icons';

const exampleLinks = [
  { url: "https://www.deeplearning.ai/the-batch/issue-264/", label: "🤖 AI Roundup: Pricing, Breakthroughs, Lobbying, and Models", duration: "14 min read", category: "Article" },
  {url: "https://www.youtube.com/watch?v=FNnK1J-BdiM", label: "📱 Marques is checking out the world's largest fake iPhone lol", duration: "55s", category: "Short YouTube Video"},
  { url: "https://www.youtube.com/watch?v=bLJ-zfBmChA", label: "🎵 Album Review - Charli XCX's BRAT", duration: "14 mins", category: "Medium YouTube Video" },
  { url: "https://www.youtube.com/watch?v=oFtjKbXKqbg", label: "🎙️ Lex Fridman Podcast - Pieter Levels: AI & Digital Nomad Life", duration: "3h 43m", category: "Long YouTube Video" },
];

const UserSharedLinks = ({ onAddLink, showUFO, mainContentRef }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const dragControls = useDragControls();
  const dragStartTime = useRef(0);
  const isDragging = useRef(false);

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

  const handleDragStart = () => {
    isDragging.current = true;
    dragStartTime.current = Date.now();
  };

  const handleDragEnd = (event, info) => {
    setPosition({ x: info.point.x, y: info.point.y });
    const dragDuration = Date.now() - dragStartTime.current;
    
    // 짧은 드래그는 클릭으로 간주
    if (dragDuration < 200 && !isDragging.current) {
      setIsOpen(!isOpen);
    }
    
    isDragging.current = false;
  };

  const handleClick = () => {
    if (!isDragging.current) {
      setIsOpen(!isOpen);
    }
  };

  if (!showUFO || !position) return null;

  return (
    <>
      <motion.div
        drag
        dragControls={dragControls}
        dragMomentum={false}
        dragElastic={0}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        initial={position}
        animate={position}
        className="fixed z-0"
        style={{ touchAction: 'none' }}
      >
        <button
          onPointerDown={(e) => dragControls.start(e)}
          onClick={handleClick}
          className="text-4xl sm:text-5xl hover:scale-110 transition-transform duration-200 cursor-move"
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
              <h2 className="text-2xl font-bold mb-4 text-center font-handwriting sm:text-3xl">👽</h2>
              <p className="text-center mb-4 text-sm font-handwriting sm:text-base">
                Boring Earth hyperlinks? We've got you covered. <br />
                We support various <span className="text-purple-600 dark:text-purple-400 font-semibold">content types</span> 📡✨🌌:
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
                      <span className="text-purple-600 dark:text-purple-400 font-semibold">{link.category}</span>
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
              👆 Dig these examples or transmit your own link on the home portal
              and let us cook! 🍳🛸
             </p>

            </motion.div>
          </motion.div>
        </>
      )}
    </>
  );
};

export default UserSharedLinks;