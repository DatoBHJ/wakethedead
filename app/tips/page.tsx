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
    { id: 'qa', title: 'Ask & Search', icon: ChatCircleDots },
    { id: 'customize', title: 'Customize', icon: Gear },
    { id: 'support', title: 'Support Us', icon: Coffee },
  ]

  const content = {
    overview: '> Hey there! 👋 Welcome to **Wake The Dead**! We\'re making content discovery and learning way more fun with:\n\n- **Smart Skimming** powered by AI ⚡\n- **Community knowledge sharing** 🤝\n- **Quick Search** that actually works 🔍',
  
    skim: "⚡ **Here's How Smart Skimming Works**\n\n1. Just paste any URL or look for titles with the ⚡ icon\n2. Our smart reader whips up an easy-to-skim version instantly\n\n*Global Caching Magic* 🚀\n- Everything's cached globally, so it's super quick\n- No waiting around if someone's already checked the link\n- We keep separate versions for different languages and AI models\n\n*What Makes Our Skimmable Version Special* 💫\n- Get the good stuff by just scanning through headlines or the whole text\n- Unlike boring summary tools, you get all the important details, not just the basics\n- For YouTube videos, just click timestamps to jump to the parts you care about 🎥\n- Feeling curious? Try out auto-generated questions or search for more\n- Check out what others are reading in the **Shared by our users** 🤝 section at the bottom",
  
    community: "🌐 **Let's Learn Together!**\n\n**Every link you check out makes our community smarter**\n- All the content you explore helps make AI answers better\n- Your interests help others find cool stuff they might like\n\n*Your curiosity helps everyone learn faster - pretty cool, right?* 🙌",
  
    qa: "🤖 **Got Questions? We've Got Answers!**\n\n- Ask anything specific about what you're reading\n- Or just use our AI search for general questions\n\n*It's like having a super smart study buddy* 💡",
  
    customize: "⚙️ **Make It Work Just Right for You**\n\n- **Starting with 'llama3-8b'**: Perfect for most stuff you'll do\n\n**Need More Brain Power?** 🧠\n- Try out some of our beefier models\n\n**Want More Freedom?** 🎯\n- Give the Mixtral model a shot\n\nHelpful when other models are being too careful with your questions\n*Switch to mixtral for those spicier questions* 😉\n\n**Language Options** 🌍\n- Pick between English or your favorite language\n- FYI: English usually works best right now\n\n*Pro tip*: Play around and find what works best for you! Just remember, bigger models might take a sec longer.\n\n⚠️ Running into limits or errors? Take a quick break or try a different model!",
  
    support: "☕ **Help Keep Us Going!**\n\n- We run purely on coffee and good vibes (aka donations)\n- Love what we're doing? Maybe buy us a coffee!\n- Every little bit helps us keep making this thing better\n\n*Your support means the world to us!* 💝"
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