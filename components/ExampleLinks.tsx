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
  
  { url: "https://www.wakethedead.ai/tips", label: "🌟 Wake The Dead", duration: "3m read -> 12s skim", source: "wakethedead.ai" },
  
  { url: "https://arxiv.org/pdf/1904.00605v1", label: "📄 Relative Attributing Propagation (RAP)", duration: "38m read -> 53s skim", source: "arxiv.org/pdf" },
  { url: "https://en.m.wikipedia.org/wiki/Lionel_Messi", label: "🐐 ⚽ Lionel Messi's Wikipedia page", duration: "2h 16m read -> 3m skim", source: "wikipedia.org" },
  { url: "https://buymeacoffee.com/kingbob", label: "👑 Meet King Bob, the Creator of Wake The Dead!! 🤔💡", duration: "3m read -> 4s skim", source: "buymeacoffee.com" },
  { url: "https://www.instagram.com/reel/DA_CMaMhpQr/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==", label: "🎉🔩️ The Rigging stage is the most crucial part of the animation process! 🔩️ If you don't get it right, your animation won't be smooth 🤯.", duration: "4m read -> 9s skim", source: "instagram.com" },
  { url: "https://x.com/marionawfal/status/1846670359766225163?s=46&t=MxpeeAIbwxH0FrxYoc0KFA", label: "🚀 Elon's Team Achieves the Impossible! - NVIDIA CEO ", duration: "4m read -> 8s skim", source: "x.com"},
  { url: "https://www.chipstrat.com/p/groqs-business-model-part-1-inference", label: "🧠 Groq's Business Model: Part 1 - Inference", duration: "14m read -> 12s skim", source: "chipstrat.com" },
  { url: "https://www.nytimes.com/athletic/5739705/2024/10/13/footballers-esports-david-beckham-neymar-casemiro/", label: "⚽ Footballers are investing in esport 🎮", duration: "7m read -> 11s skim", source: "nytimes.com" },
  { url: "https://www.deeplearning.ai/the-batch/issue-264/", label: "🤖 AI Roundup: Pricing, Breakthroughs, Lobbying, and Models", duration: "14m read -> 32s skim", source: "deeplearning.ai" },
  { url: "https://www.psychiatrictimes.com/view/are-we-overdiagnosing-and-overtreating-adhd", label: "💊 Are We Overdiagnosing and Overtreating ADHD?", duration: "11m read -> 20s skim", source: "psychiatrictimes.com" },
  { url: "https://x.com/JonathanRoss321/status/1845548327963926678", label: "🚀 Unlock the Secrets of the Generative Age: 5 Unlocks to Artificial General Intelligence 🤖", duration: "3m read -> 5s skim", source: "x.com" },
  { url: "https://summitdetox.com/blog/what-is-lean-drink/#:~:text=Lean%20consists%20of%20a%20combination,to%20give%20it%20more%20flavor.", label: "🫗 What is Lean Drink?", duration: "12m read -> 30s skim", source: "summitdetox.com" },
  { url: "https://aws.amazon.com/ko/blogs/machine-learning/vision-use-cases-with-llama-3-2-11b-and-90b-models-from-meta/", label: "👀 Vision Use Cases with Llama 3.2 11B and 90B Models", duration: "14m read -> 16s skim", source: "aws.amazon.com" },
  // { url: "https://arxiv.org/pdf/2405.04828", label: "📄 CHUXIN: 1.6B TECHNICAL REPORT", duration: "26m read -> 28s skim", source: "arxiv.org/pdf" },
  { url: "https://www.arxiv.org/pdf/2409.19924", label: "📄 Planning Abilities of OpenAI’s o1 Models", duration: "43m read -> 41s skim", source: "arxiv.org/pdf" },
  { url: "https://x.com/smokeawayyy/status/1841215305751937156?s=46&t=MxpeeAIbwxH0FrxYoc0KFA", label: "OpenAI's issues 🚨: No DevDay livestream + compromised accounts 🤔", duration: "2m read -> 4s skim", source: "x.com" },
];


const XLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1227" width="12" height="12">
    <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" 
    fill="currentColor"/>
  </svg>
);

const InstagramLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12">
    <linearGradient id="instagramGradient" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#feda75" />
      <stop offset="20%" stopColor="#fa7e1e" />
      <stop offset="40%" stopColor="#d62976" />
      <stop offset="60%" stopColor="#962fbf" />
      <stop offset="80%" stopColor="#4f5bd5" />
    </linearGradient>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" 
    fill="currentColor"/>
    {/* fill="url(#instagramGradient)"/> */}
  </svg>
);

const YouTubeLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12">
    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" 
    fill="currentColor"/>
    {/* fill="#FF0000"/> */}
  </svg>
);

const BuyMeACoffeeLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12">
    <path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.119.352-.054.578-.513.474-.834-.124-.383-.457-.531-.834-.473-.466.074-.96.108-1.382.146-1.177.08-2.358.082-3.536.006a22.228 22.228 0 01-1.157-.107c-.086-.01-.18-.025-.258-.036-.243-.036-.484-.08-.724-.13-.111-.027-.111-.185 0-.212h.005c.277-.06.557-.108.838-.147h.002c.131-.009.263-.032.394-.048a25.076 25.076 0 013.426-.12c.674.019 1.347.067 2.017.144l.228.031c.267.04.533.088.798.145.392.085.895.113 1.07.542.055.137.08.288.111.431l.319 1.484a.237.237 0 01-.199.284h-.003c-.037.006-.075.01-.112.015a36.704 36.704 0 01-4.743.295 37.059 37.059 0 01-4.699-.304c-.14-.017-.293-.042-.417-.06-.326-.048-.649-.108-.973-.161-.393-.065-.768-.032-1.123.161-.29.16-.527.404-.675.701-.154.316-.199.66-.267 1-.069.34-.176.707-.135 1.056.087.753.613 1.365 1.37 1.502a39.69 39.69 0 0011.343.376.483.483 0 01.535.53l-.071.697-1.018 9.907c-.041.41-.047.832-.125 1.237-.122.637-.553 1.028-1.182 1.171-.577.131-1.165.2-1.756.205-.656.004-1.31-.025-1.966-.022-.699.004-1.556-.06-2.095-.58-.475-.458-.54-1.174-.605-1.793l-.731-7.013-.322-3.094c-.037-.351-.286-.695-.678-.678-.336.015-.718.3-.678.679l.228 2.185.949 9.112c.147 1.344 1.174 2.068 2.446 2.272.742.12 1.503.144 2.257.156.966.016 1.942.053 2.892-.122 1.408-.258 2.465-1.198 2.616-2.657.34-3.332.683-6.663 1.024-9.995l.215-2.087a.484.484 0 01.39-.426c.402-.078.787-.212 1.074-.518.455-.488.546-1.124.385-1.766zm-1.478.772c-.145.137-.363.201-.578.233-2.416.359-4.866.54-7.308.46-1.748-.06-3.477-.254-5.207-.498-.17-.024-.353-.055-.47-.18-.22-.236-.111-.71-.054-.995.052-.26.152-.609.463-.646.484-.057 1.046.148 1.526.22.577.088 1.156.159 1.737.212 2.48.226 5.002.19 7.472-.14.45-.06.899-.13 1.345-.21.399-.072.84-.206 1.08.206.166.281.188.657.162.974a.544.544 0 01-.169.364zm-6.159 3.9c-.862.37-1.84.788-3.109.788a5.884 5.884 0 01-1.569-.217l.877 9.004c.065.78.717 1.38 1.5 1.38 0 0 1.243.065 1.658.065.447 0 1.786-.065 1.786-.065.783 0 1.434-.6 1.499-1.38l.94-9.95a3.996 3.996 0 00-1.322-.238c-.826 0-1.491.284-2.26.613z" 
    // fill="currentColor"/>
    fill="#FFDD00"/>
  </svg>
);


const PDFLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12">
    <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z" 
    fill="currentColor"/>
  </svg>
);


const DefaultLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" 
    fill="currentColor"/>
  </svg>
);

const getLogo = (source) => {
  switch (source) {
    case 'x.com':
      return { logo: <XLogo />, bgColor: 'bg-black' };
    case 'instagram.com':
      return { logo: <InstagramLogo />, bgColor: 'bg-white' };
    case 'youtube.com':
      return { logo: <YouTubeLogo />, bgColor: 'bg-white' };
    case 'buymeacoffee.com':
      return { logo: <BuyMeACoffeeLogo />, bgColor: 'bg-[#FFDD00]' };
    case 'arxiv.org/pdf':
      return { logo: <PDFLogo />, bgColor: 'bg-white' };
    default:
      return { logo: <DefaultLogo />, bgColor: 'bg-white' };
  }
};

const ExampleLinks = ({ onAddLink }) => {
  const [displayLinks, setDisplayLinks] = useState([]);

  useEffect(() => {
    const kingBobLink = exampleLinks.find(link => link.url.includes("wakethedead.ai/tips"));
    const otherLinks = exampleLinks.filter(link => !link.url.includes("wakethedead.ai/tips"));
    const shuffled = [...otherLinks].sort(() => 0.5 - Math.random());
    setDisplayLinks([kingBobLink, ...shuffled.slice(0, 3)]);
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
        {displayLinks.map((link, index) => (
          <motion.button
            key={index}
            onClick={() => onAddLink(link.url)}
            className="text-left p-3 sm:p-4 rounded-md backdrop-blur-sm bg-card-foreground/[3%] dark:bg-backgroundsecond hover:bg-card-foreground/[10%] dark:hover:bg-backgroundsecond/30 transition-colors duration-200 relative"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-xs text-gray-400 dark:text-gray-600 absolute top-2 left-3 sm:top-4 sm:left-4 flex items-center"> 
              {getLogo(link.source).logo}
              <span className="ml-1 sm:ml-2">{link.source}</span>
            </div>
            <div className="text-xs sm:text-sm font-handwriting text-gray-700 dark:text-zinc-300  line-clamp-2 mt-5 sm:mt-7">
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