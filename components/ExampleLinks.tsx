import React from 'react';
import { motion } from 'framer-motion';

const exampleLinks = [
  { url: "https://www.deeplearning.ai/the-batch/issue-264/", label: "🤖 AI Roundup: Pricing, Breakthroughs, Lobbying, and Models", duration: "14m read -> 32s scan", category: "Article" },
  { url: "https://www.youtube.com/watch?v=FNnK1J-BdiM", label: "📱 Marques is checking out the world's largest fake iPhone lol", duration: "55s video -> 12s scan", category: "Short YouTube Video" },
  { url: "https://www.youtube.com/watch?v=bLJ-zfBmChA", label: "🎵 Album Review - Charli XCX's BRAT", duration: "14m video -> 27s scan", category: "Medium YouTube Video" },
  { url: "https://www.youtube.com/watch?v=oFtjKbXKqbg", label: "🎙️ Lex Fridman Podcast - Pieter Levels: AI & Digital Nomad Life", duration: "3h 43m video -> 5m scan", category: "Long YouTube Video" },
];

const ExampleLinks = ({ onAddLink }) => {
  return (
    <motion.div 
      className="mt-4 pr-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.5 }}
    >
      <p className="text-sm text-blue-500 dark:text-blue-400 mb-2 pl-2">
        Or try these examples:
      </p>
      <div className="grid grid-cols-2 gap-2">
        {exampleLinks.map((link, index) => (
          <motion.button
            key={index}
            onClick={() => onAddLink(link.url)}
            className="text-left p-2 rounded-md backdrop-blur-sm bg-card-foreground/[3%] dark:bg-card-foreground/5 hover:bg-card-foreground/[10%] dark:hover:bg-card-foreground/20 transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-sm text-gray-700 dark:text-gray-300 font-handwriting line-clamp-2">
              {link.label}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              {link.duration}
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default ExampleLinks;