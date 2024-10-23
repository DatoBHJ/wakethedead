'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image'
import Link from 'next/link'
import { House, Coffee, ChatCircleDots, Gear, Globe, Lightning, X } from "@phosphor-icons/react";
import ReactMarkdown from 'react-markdown'

// Modal component for zoomed image
const ImageModal = ({ src, alt, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-white">
        <X size={24} />
      </button>
      <Image
        src={src}
        alt={alt}
        width={900}
        height={600}
        className="rounded-lg max-w-[90vw] max-h-[90vh] object-contain"
      />
    </div>
  </div>
);

const TipsPage = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [modalImage, setModalImage] = useState(null)

  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setIsDarkMode(isDark)
  }, [])

  const tabs = [
    { id: 'overview', title: 'Overview', icon: House },
    { id: 'skim', title: 'Smart Skimming', icon: Lightning },
    { id: 'community', title: 'Community Knowledge', icon: Globe },
    { id: 'qa', title: 'Q&A Experience', icon: ChatCircleDots },
    { id: 'customize', title: 'Customize', icon: Gear },
    { id: 'support', title: 'Support Us', icon: Coffee },
  ]

  const content = {
    overview: '> Welcome to **Wake The Dead**! We\'re breathing new life into content consumption with more engaging ways to discover and learn:\n\n- AI-powered smart skimming\n- Community knowledge\n- AI-powered search engine',
    skim: "🚀 **Smart Skimming in Action**\n\n1. Paste any URL or click titles with the ⚡ icon\n2. Our smart reader generates an instant skimmable version\n\n*Globally Cached*: \n- Content is cached globally for immediate access by all users!\n- No waiting time for repeat visits to the same link\n\n*About Skimmable Version*:\n- Quickly grasp the content by reading headlines or skimming the entire text\n- Unlike websites offering just AI summaries, our format allows you to quickly grasp not only the main points but also specific details\n- For YouTube videos, click on timestamps to interact with specific parts of the content\n- Explore auto-generated questions or conduct further searches after reading\n- Skim rapidly and explore more content shared by our users on similar topics in the **Shared by our users 🤝** section at the bottom of the generated notes",
    community: "🌐 **Power of Community Knowledge**\n\n**Every link you explore or share enriches our knowledge base**\n- All accessed content becomes relevant sources in chat responses\n- Your interactions help recommend similar content to others\n\n*Your curiosity fuels faster learning for everyone! Together, we build a smarter platform!*",
    qa: "🤖 **Engage with RAG-Powered Chatbot with internet access**\n\n- Ask specific questions about skimmed content\n- Leverage general LLM-powered search for broader inquiries\n\n*Get answers tailored to your needs!*",
    customize: "⚙️ **Tailor the AI to Your Needs**\n\n- **Default 'llama3-8b-8192' model: Great for most tasks**\n\n**For Complex Tasks**: \n- Explore other advanced models or models with larger parameters\n\n**Less Restricted Content**: \n- Try the Mixtral model\n\n Useful when your selected model refuses to answer your input.\n *Switch to mixtral and AI will answer to questions like 'how to make crack cocaine' lol*\n\n**Language Options**:\n- Choose between English and your preferred language\n- Note: English typically yields the best results\n\n*Tip*: Experiment to find your perfect fit. Larger models may require more processing time.\n\n⚠️ Rate limits or errors? Wait a moment and retry or switch models.",
    support: "☕ **Support Wake The Dead**\n\n- We operate solely on donations\n- Find value in our service? Consider buying us a coffee!\n- Every contribution helps keep the project alive and improving\n\n*Your support makes a difference!*",
  } 

  const imageMap = {
    overview: 'Home.png',
    skim: 'smart-skimming.png',
    qa: 'qa-experience.png',
    customize: ['customize.png', 'language.png'], 
    support: 'support-mission.png',
    community: 'community.png',
  }

  const handleImageClick = (src, alt) => {
    setModalImage({ src, alt });
  };

  const closeModal = () => {
    setModalImage(null);
  };

  const getImages = (tab) => {
    return Array.isArray(imageMap[tab]) ? imageMap[tab] : [imageMap[tab]];
  };

  return (
    <div className={`container mx-auto px-4 py-8 max-w-4xl ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex justify-between items-center mb-6 px-2">
        <h1 className="text-2xl font-bold text-foreground">Wake The Dead Guide</h1>
        <Link href="/" className="flex items-center space-x-2 text-primary hover:bg-primary hover:text-white dark:hover:text-black rounded-lg px-3 py-2 cursor-pointer transition-all">
          <House size={20} />
          <span className="hidden md:inline">Back to Home</span>
        </Link>
      </div>
      
      <div className="flex flex-col md:flex-row md:space-x-4">
        <div className="md:w-1/3 mb-4 md:mb-0">
          <ul className="space-y-2">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-muted'
                  }`}
                >
                  {tab.icon && <tab.icon className="mr-2" size={20} />}
                  {tab.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="md:w-2/3">
        <div className="bg-card text-card-foreground rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            {tabs.find(tab => tab.id === activeTab)?.icon && 
              React.createElement(tabs.find(tab => tab.id === activeTab)!.icon, { size: 24, className: "mr-2" })}
            {tabs.find(tab => tab.id === activeTab)?.title}
          </h2>
          
          {getImages(activeTab).map((image, index) => (
            <div 
              key={index}
              onClick={() => handleImageClick(`/images/${image}`, `${tabs.find(tab => tab.id === activeTab)?.title} ${getImages(activeTab).length > 1 ? index + 1 : ''}`)}
              className="cursor-pointer mb-4"
            >
              <Image
                src={`/images/${image}`}
                alt={`${tabs.find(tab => tab.id === activeTab)?.title} ${getImages(activeTab).length > 1 ? index + 1 : ''}`}
                width={600}
                height={400}
                layout="responsive"
                className="rounded-lg"
              />
            </div>
          ))}

          <ReactMarkdown 
            className="mb-4 text-muted-foreground prose dark:prose-invert"
            components={{
              p: ({ node, ...props }) => <p className="mb-4" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4" {...props} />,
            }}
          >
            {content[activeTab]}
          </ReactMarkdown>
        </div>
      </div>
      </div>

      <div className="mt-8 p-4 bg-accent text-accent-foreground rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Support Wake The Dead</h3>
        <p className="text-sm">Wake The Dead runs purely on donations. If you find value in our service, consider buying us a coffee!</p>
        <a href="https://buymeacoffee.com/KingBob" target="_blank" rel="noopener noreferrer" className="inline-block mt-4 px-4 py-2 bg-primary rounded text-white dark:text-black hover:bg-white dark:hover:bg-black hover:text-black dark:hover:text-white  transition-colors">
          Buy Me A Coffee
        </a>
      </div>

      {modalImage && (
        <ImageModal
          src={modalImage.src}
          alt={modalImage.alt}
          onClose={closeModal}
        />
      )}
    </div>
  )
}

export default TipsPage