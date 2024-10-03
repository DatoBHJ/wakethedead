import React from 'react';
import { motion } from 'framer-motion';

const exampleLinks = [
  { url: "https://www.deeplearning.ai/the-batch/issue-264/", label: "🤖 AI Roundup: Pricing, Breakthroughs, Lobbying, and Models", duration: "14 min read", category: "Article" },
  { url: "https://www.youtube.com/watch?v=FNnK1J-BdiM", label: "📱 Marques is checking out the world's largest fake iPhone lol", duration: "55s", category: "Short YouTube Video" },
  { url: "https://www.youtube.com/watch?v=bLJ-zfBmChA", label: "🎵 Album Review - Charli XCX's BRAT", duration: "14 mins", category: "Medium YouTube Video" },
  { url: "https://www.youtube.com/watch?v=oFtjKbXKqbg", label: "🎙️ Lex Fridman Podcast - Pieter Levels: AI & Digital Nomad Life", duration: "3h 43m", category: "Long YouTube Video" },
];

const ExampleLinks = ({ onAddLink }) => {
  return (
    <motion.div 
      className="mt-4 space-y-2 pl-5 pr-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.5 }}
    >
      <p className="text-sm text-blue-500 dark:text-blue-400 mb-2 pl-2 "> ㄴ Or try these examples:</p>
      {exampleLinks.map((link, index) => (
        <motion.button
          key={index}
          onClick={() => onAddLink(link.url)}
          className="w-full text-left p-2 rounded-md hover:bg-card-foreground/[3%] dark:hover:bg-card-foreground/5 transition-colors duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-handwriting">{link.label}</div>
          <div className="text-xs text-gray-500 dark:text-gray-500">{link.duration} • {link.category}</div>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default ExampleLinks;