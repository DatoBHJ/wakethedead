import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

const exampleLinks = [
  { url: "https://youtu.be/oXbqFvAr0tw?si=Id4VyXSbl8F-VKt0", label: "Example YouTube Video 1" },
  { url: "https://youtu.be/oFtjKbXKqbg?si=Z8RQHG6M7bV-kFZh", label: "Example YouTube Video 2" },
  { url: "https://www.deeplearning.ai/the-batch/issue-264/", label: "DeepLearning.ai Article" },
];

const UserSharedLinks = ({ onAddLink, showUFO, setShowUFO, mainContentRef }) => {
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
        className="fixed z-20"
        style={{ touchAction: 'none' }}
      >
        <button
          onPointerDown={(e) => dragControls.start(e)}
          onClick={() => setIsOpen(!isOpen)}
          className="text-4xl hover:scale-110 transition-transform duration-200 cursor-move"
          aria-label="Show shared links"
        >
          🛸
        </button>
      </motion.div>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-2xl z-40"
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
              className="bg-white/50 dark:bg-white/[2%] rounded-lg shadow-lg p-6 w-80"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">Shared Links</h2>
              <div className="space-y-2">
                {exampleLinks.map((link, index) => (
                  <a
                    key={index}
                    href="#"
                    className="block p-2 rounded text-sm text-black dark:text-white hover:bg-black/[5%] dark:hover:bg-white/[5%] transition-colors duration-150"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLinkClick(link.url);
                    }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </>
  );
};

export default UserSharedLinks;