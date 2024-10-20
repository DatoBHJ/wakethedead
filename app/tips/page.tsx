'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image'
import Link from 'next/link'
import { House, Coffee, ChatCircleDots, Gear, Globe, Lightning, X } from "@phosphor-icons/react";

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
    overview:'"Absorb in seconds what use to take minutes." Welcome to Wake The Dead. Redefining content consumption with AI-powered smart skimming, community knowledge, and AI-powered search engine.',
    skim: "Paste any URL or click on titles with the ⚡ icon in the chat. Our smart reader instantly generates a skimmable version, allowing you to digest content in seconds. Once processed, content is cached globally for immediate access by all users!",
    community: "Every link you explore or share contributes to our knowledge base. Your curiosity helps both you and others learn faster, as all accessed content serves as relevant sources in chat responses.",
    qa: "Engage with content through our RAG-powered chatbot. Ask specific questions about what you've skimmed or leverage general LLM-powered search for broader inquiries.",
    customize: "Tailor the AI to your needs. The default 'llama3-8b-8192' model excels at most tasks, offering a great balance of speed and capability. For more complex, multilingual support, consider switching to other models. Experiment to find your perfect fit. If you encounter rate limits or errors, please wait a moment and try again or switch to a different model.",
    support: "Wake The Dead operates on donations. If you find value in our service, consider buying us a coffee!",
  }

  const imageMap = {
    overview: 'Home.png',
    skim: 'smart-skimming.png',
    qa: 'qa-experience.png',
    customize: 'customize-experience.png',
    support: 'support-mission.png',
    community: 'community.png',
  }

  const handleImageClick = (src, alt) => {
    setModalImage({ src, alt });
  };

  const closeModal = () => {
    setModalImage(null);
  };

  return (
    <div className={`container mx-auto px-4 py-8 max-w-4xl ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex justify-between items-center mb-6 px-2">
        <h1 className="text-2xl font-bold text-foreground">Wake The Dead Guide</h1>
        <Link href="/" className="flex items-center space-x-2 text-primary hover:text-primary-foreground transition-colors">
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
            <p className="mb-4 text-muted-foreground">{content[activeTab]}</p>
            <div 
              onClick={() => handleImageClick(`/images/${imageMap[activeTab]}`, tabs.find(tab => tab.id === activeTab)?.title || '')}
              className="cursor-pointer"
            >
              <Image
                src={`/images/${imageMap[activeTab]}`}
                alt={tabs.find(tab => tab.id === activeTab)?.title || ''}
                width={600}
                height={400}
                layout="responsive"
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-accent text-accent-foreground rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Support Wake The Dead</h3>
        <p className="text-sm">Every donation helps keep the project alive and improving.</p>
        <a href="https://buymeacoffee.com/KingBob" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-muted transition-colors">
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