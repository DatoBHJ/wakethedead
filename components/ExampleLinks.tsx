import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { url } from 'inspector';

const exampleLinks = [
  { url: "https://www.youtube.com/watch?v=FNnK1J-BdiM", label: "😂 Marques is checking out the world's largest fake iPhone lol", duration: "55s video -> 9s skim", source: "youtube.com" },
  { url: "https://www.youtube.com/watch?v=oFtjKbXKqbg", label: "🎙️ Lex Fridman Podcast - Pieter Levels: AI & Digital Nomad Life", duration: "3h 43m video -> 6m skim", source: "youtube.com" },
  { url: "https://www.youtube.com/watch?v=SBGG4WNweEc", label: "🏆 Announcement of the 2024 Nobel Prize in Physics", duration: "37m video -> 26s skim", source: "youtube.com" },
  { url: "https://www.youtube.com/watch?v=MRtg6A1f2Ko", label: "📱 Marques Brownlee dives into the iPhone 16 and 16 Pro", duration: "21m video -> 39s skim", source: "youtube.com" },
  { url: "https://www.youtube.com/watch?v=qTmHuavOXNg", label: "🎵 Kendrick Lamar - To Pimp A Butterfly ALBUM REVIEW", duration: "22m video -> 33s skim", source: "youtube.com" },
  
  { url: "https://buymeacoffee.com/kingbob", label: "🐐 Meet King Bob, the Creator of Wake The Dead!! 🤔💡", duration: "3m read -> 4s skim", source: "buymeacoffee.com" },
  { url: "https://www.instagram.com/reel/DA_CMaMhpQr/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==", label: "🎉🔩️ The Rigging stage is the most crucial part of the animation process! 🔩️ If you don't get it right, your animation won't be smooth 🤯.", duration: "4m read -> 9s skim", source: "instagram.com" },
  { url: "https://x.com/marionawfal/status/1846670359766225163?s=46&t=MxpeeAIbwxH0FrxYoc0KFA", label: "🚀 Elon's Team Achieves the Impossible! - NVIDIA CEO ", duration: "4m read -> 8s skim", source: "x.com"},
  { url: "https://www.chipstrat.com/p/groqs-business-model-part-1-inference", label: "🧠 Groq's Business Model: Part 1 - Inference", duration: "14m read -> 12s skim", source: "chipstrat.com" },
  { url: "https://www.nytimes.com/athletic/5739705/2024/10/13/footballers-esports-david-beckham-neymar-casemiro/", label: "⚽ Footballers are investing in esport 🎮", duration: "7m read -> 11s skim", source: "nytimes.com" },
  { url: "https://www.deeplearning.ai/the-batch/issue-264/", label: "🤖 AI Roundup: Pricing, Breakthroughs, Lobbying, and Models", duration: "14m read -> 32s skim", source: "deeplearning.ai" },
  { url: "https://www.psychiatrictimes.com/view/are-we-overdiagnosing-and-overtreating-adhd", label: "💊 Are We Overdiagnosing and Overtreating ADHD?", duration: "11m read -> 20s skim", source: "psychiatrictimes.com" },
  { url: "https://x.com/JonathanRoss321/status/1845548327963926678", label: "🚀 Unlock the Secrets of the Generative Age: 5 Unlocks to Artificial General Intelligence 🤖", duration: "3m read -> 5s skim", source: "x.com" },
  { url: "https://www.summitdetox.com/blog/what-is-lean-drink/#:~:text=Lean%20consists%20of%20a%20combination,to%20give%20it%20more%20flavor.", label: "🫗 What is Lean Drink?", duration: "12m read -> 30s skim", source: "summitdetox.com" },
  { url: "https://aws.amazon.com/ko/blogs/machine-learning/vision-use-cases-with-llama-3-2-11b-and-90b-models-from-meta/", label: "👀 Vision Use Cases with Llama 3.2 11B and 90B Models", duration: "14m read -> 16s skim", source: "aws.amazon.com" },
  { url: "https://arxiv.org/pdf/2405.04828", label: "📄 CHUXIN: 1.6B TECHNICAL REPORT", duration: "26m read -> 28s skim", source: "arxiv.org/pdf" },
  { url: "https://www.arxiv.org/pdf/2409.19924", label: "📄 Planning Abilities of OpenAI’s o1 Models", duration: "43m read -> 41s skim", source: "arxiv.org/pdf" },
  { url: "https://x.com/smokeawayyy/status/1841215305751937156?s=46&t=MxpeeAIbwxH0FrxYoc0KFA", label: "OpenAI's issues 🚨: No DevDay livestream + compromised accounts 🤔", duration: "2m read -> 4s skim", source: "x.com" },
];

const ExampleLinks = ({ onAddLink }) => {
  const [randomLinks, setRandomLinks] = useState([]);

  useEffect(() => {
    const shuffled = [...exampleLinks].sort(() => 0.5 - Math.random());
    setRandomLinks(shuffled.slice(0, 4));
  }, []);

  return (
    <motion.div 
      className="mt-4 pr-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.5 }}
    >
      <p className="text-sm text-blue-500 dark:text-blue-400 mb-2 pl-2">
        {/* Or try these random examples: */}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {randomLinks.map((link, index) => (
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