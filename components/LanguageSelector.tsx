import React, { useState, useRef, useEffect } from 'react';
import { CaretRight } from "@phosphor-icons/react";

interface LanguageSelectorProps {
  selectedLanguage: string;
  setSelectedLanguage: (language: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, setSelectedLanguage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTextSemibold, setIsTextSemibold] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const preferredLanguage = navigator.language || 'en';

  const languages = {
    'en': 'American English',
    [preferredLanguage]: `${new Intl.DisplayNames([preferredLanguage], { type: 'language' }).of(preferredLanguage)} (Preferred Language)`
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
      <div className="flex items-center px-3 py-2">
        <span className={`truncate text-black dark:text-white transition-all duration-200 ${isTextSemibold ? 'font-semibold' : 'font-normal'}`}>
          {languages[selectedLanguage as keyof typeof languages]}
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
        className={`absolute -top-1 w-full bg-white/90 dark:bg-white/[2%] backdrop-blur-3xl pt-1 rounded-xl overflow-hidden z-50 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div ref={contentRef}>
          {selectorButton}
          <div className="max-h-80 overflow-auto mt-1">
            {Object.entries(languages).map(([code, name]) => (
              <div
                key={code}
                className={`py-1 cursor-pointer transition-colors duration-200 ${
                  code === selectedLanguage ? 'bg-black/[5%] dark:bg-white/[5%]' : ''
                }`}
                onClick={() => {
                  setSelectedLanguage(code);
                  setIsOpen(false);
                  setIsTextSemibold(false);
                }}
              >
                <div className="px-5 py-1">{name}</div>
              </div>
            ))}
            <div className="px-4 pb-5 pt-2 text-xs font-extralight text-muted-foreground">
              Note: Some language models may not support your preferred language.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;