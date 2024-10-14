import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { url } from 'inspector';

const exampleLinks = [
  { url: "https://www.deeplearning.ai/the-batch/issue-264/", label: "🤖 AI Roundup: Pricing, Breakthroughs, Lobbying, and Models", duration: "14m read -> 32s skim", source: "deeplearning.ai" },
  { url: "https://www.youtube.com/watch?v=FNnK1J-BdiM", label: "📱 Marques is checking out the world's largest fake iPhone lol", duration: "55s video -> 9s skim", source: "youtube.com" },
  { url: "https://www.youtube.com/watch?v=bLJ-zfBmChA", label: "🎵 Album Review - Charli XCX's BRAT", duration: "14m video -> 28s skim", source: "youtube.com" },
  { url: "https://www.youtube.com/watch?v=oFtjKbXKqbg", label: "🎙️ Lex Fridman Podcast - Pieter Levels: AI & Digital Nomad Life", duration: "3h 43m video -> 4m skim", source: "youtube.com" },
  
  // candidates
  // { url: "https://x.com/smokeawayyy/status/1841215305751937156?s=46&t=MxpeeAIbwxH0FrxYoc0KFA", label: "OpenAI's issues 🚨: No DevDay livestream + compromised accounts 🤔", duration: "2m read -> 4s skim", source: "x.com" },
  // { url: "https://www.psychiatrictimes.com/view/are-we-overdiagnosing-and-overtreating-adhd", label: "Are We Overdiagnosing and Overtreating ADHD?", duration: "11m read -> 20s skim", source: "youtube.com" },
  // { url: "https://x.com/JonathanRoss321/status/1845548327963926678", label: "🚀 Unlock the Secrets of the Generative Age: 5 Unlocks to Artificial General Intelligence 🤖", duration: "3m read -> 5s skim", source: "youtube.com" },
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
        {/* Or try these examples:  */}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {exampleLinks.map((link, index) => (
          <motion.button
            key={index}
            onClick={() => onAddLink(link.url)}
            className="text-left p-2 sm:p-4 rounded-md backdrop-blur-sm bg-card-foreground/[3%] dark:bg-card-foreground/5 hover:bg-card-foreground/[10%] dark:hover:bg-card-foreground/20 transition-colors duration-200 relative"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-xs text-gray-400 dark:text-gray-600 absolute top-1 left-2">
              {link.source}
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-400 line-clamp-2 mt-4">
              {link.label}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              {link.duration}
            </div>
          </motion.button>
        ))}
     </div>
      
      <div className="mt-10 sm:mt-16 text-center">
        <Link href="/tips" className="text-xs text-gray-400 underline hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400 transition-colors duration-200">
          Wake The Dead: User Guide
        </Link>
      </div>
    </motion.div>
  );
};

export default ExampleLinks;