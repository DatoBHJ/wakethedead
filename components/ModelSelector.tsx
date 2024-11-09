import React, { useState, useRef, useEffect } from 'react';
import { CaretRight } from "@phosphor-icons/react";

const modelGroups = {
  'Google': [
    {
      name: 'gemma2-9b-it',
      displayName: 'gemma2-9b',
      description: 'Smarter than Llama 3-8b but slower'
    },    
  ],
  'Meta': [
    {
      name: 'llama-3.2-90b-text-preview',
      displayName: 'llama-3.2-90b',
      description: 'Latest and largest Llama model'
    },
    {
      name: 'llama-3.2-11b-text-preview',
      displayName: 'llama-3.2-11b'
    },
    {
      name: 'llama-3.2-3b-preview',
      displayName: 'llama-3.2-3b'
    },
    {
      name: 'llama-3.1-70b-versatile',
      displayName: 'llama-3.1-70b',
      description: 'Outperforms Llama 3-70B in most tasks, but slower'
    },
    {
      name: 'llama-3.1-8b-instant',
      displayName: 'llama-3.1-8b'
    },
    {
      name: 'llama3-70b-8192',
      displayName: 'llama3-70b',
      description: 'Smarter than gemma2-9b-it but slower'
    },
    {
      name: 'llama3-8b-8192',
      displayName: '⭐ llama3-8b',
      description: 'Smart and super fast'
    },
  ],
  'Mixtral': [
    {
      name: 'mixtral-8x7b-32768',
      displayName: 'mixtral-8x7b',
      description: 'kinda uncensored compared to other models'
    }
  ],
  'xAI': [
    {
      name: "grok-beta",
      displayName: "⭐ grok-beta",
      description: 'Uncensored. Comparable performance to Grok 2 but with improved efficiency, speed and capabilities.'
    }
  ],
};

interface ModelSelectorProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, setSelectedModel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTextSemibold, setIsTextSemibold] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const getDisplayName = (modelName: string) => {
    for (const group of Object.values(modelGroups)) {
      const model = group.find(m => (typeof m === 'string' ? m : m.name) === modelName);
      if (model && typeof model !== 'string') {
        return model.displayName;
      }
    }
    return modelName;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsTextSemibold(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectorClick = () => {
    setIsOpen(!isOpen);
    setIsTextSemibold(!isTextSemibold);
  };

  const selectorButton = (
    <div
      onClick={handleSelectorClick}
      className="flex items-center justify-between w-full text-left bg-transparent cursor-pointer transition-colors duration-200"
    >
      <div className="flex items-center px-3 py-2 max-w-[calc(100%-28px)]">
        <span className={`break-words text-black dark:text-white transition-all duration-200 ${isTextSemibold ? 'font-semibold' : 'font-normal'}`}>
          {getDisplayName(selectedModel)}
        </span>
      </div>
      <CaretRight
        size={20} 
        weight="bold"
        className={`absolute right-2 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 focus:outline-none bg-transparent transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} 
      />
    </div>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {selectorButton}
      <div 
        className={`absolute -top-1 w-full bg-white/90 dark:bg-white/[2%] backdrop-blur-3xl pt-1 rounded-xl z-50 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div ref={contentRef}>
          {selectorButton}
          <div className="max-h-80 overflow-auto mt-1">
            {Object.entries(modelGroups).map(([group, models], index, array) => (
              <React.Fragment key={group}>
                <div>
                  <div className="px-5 text-sm text-groupcolor p-1">{group}</div>
                  {models.map((model) => (
                    <div
                      key={typeof model === 'string' ? model : model.name}
                      className={`py-1 cursor-pointer transition-colors duration-200 ${
                        (typeof model === 'string' ? model : model.name) === selectedModel ? 'bg-black/[5%] dark:bg-white/[5%]' : ''
                      }`}
                      onClick={() => {
                        setSelectedModel(typeof model === 'string' ? model : model.name);
                        setIsOpen(false);
                        setIsTextSemibold(false);
                      }}
                    >
                      <div className="px-5 py-1">
                        {typeof model === 'string' ? model : model.displayName}
                        {typeof model !== 'string' && model.description && (
                          <div className="text-xs text-zinc-500 mt-1">
                            {model.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {index < array.length - 1 && (
                  <div className="my-2 border-t border-input" />
                )}
              </React.Fragment>
            ))}
            <div className="px-4 pb-5 pt-2 text-xs font-extralight text-muted-foreground">
              Note: Models marked with ⭐ are recommended for their optimal balance of performance and speed.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelSelector;