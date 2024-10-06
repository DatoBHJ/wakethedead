import React from 'react';
import Link from 'next/link';
import { Coffee, MessageSquare, Settings, Globe } from 'lucide-react';

const TipsPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start p-4 overflow-y-auto">
      <div className="max-w-3xl w-full p-2 sm:p-8 my-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-blue-500 mb-6 sm:mb-8 text-center">Wake The Dead: User Guide</h1>
        
        <ul className="space-y-6 sm:space-y-8  dark:text-gray-600">
          <li className="flex items-start">
            <span className="text-2xl mr-3 sm:mr-4 flex-shrink-0 mt-1">⚡</span>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Instant Access to Content</h2>
              <p className="text-sm sm:text-base">Paste any URL or click on titles with the ⚡ icon in the chat. Our smart reader instantly generates a skimmable version, allowing you to digest content in seconds. Once processed, content is cached globally for immediate access by all users!</p>
            </div>
          </li>
          <li className="flex items-start">
            <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 mr-3 sm:mr-4 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Community-Powered Knowledge</h2>
              <p className="text-sm sm:text-base">Every link you explore or share contributes to our knowledge base. Your curiosity helps both you and others learn faster, as all accessed content serves as relevant sources in chat responses.</p>
            </div>
          </li>
          <li className="flex items-start">
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mr-3 sm:mr-4 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Powerful Q&A Experience</h2>
              <p className="text-sm sm:text-base">Engage with content through our RAG-powered chatbot. Ask specific questions about what you've skimmed or leverage general LLM-powered search for broader inquiries.</p>
            </div>
          </li>
          <li className="flex items-start">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 mr-3 sm:mr-4 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Customize Your Experience</h2>
              <p className="text-sm sm:text-base">Tailor the AI to your needs. The default 'llama3-8b-8192' model offers quick responses for simpler queries. For more complex, multilingual support, switch to the 'llama-3.1-70b-versatile' model. Experiment to find your perfect balance of speed and capability.</p>
            </div>
          </li>
          <li className="flex items-start">
            <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-brown-500 mr-3 sm:mr-4 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Support Our Mission</h2>
              <p className="text-sm sm:text-base">Wake The Dead operates on donations. If you find value in our service, consider buying us a coffee! Click the coffee icon in the left sidebar to contribute. Your support helps us continue providing this resource to learners worldwide.</p>
            </div>
          </li>
        </ul>
        
        <div className="mt-8 sm:mt-10 text-center">
          <Link href="/" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TipsPage;