import React, { useState, useRef, useEffect } from 'react';

interface PopoverProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'bottom';
}

export const Popover: React.FC<PopoverProps> = ({ children, content, position = 'bottom' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && contentRef.current && popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (position === 'top' || (position === 'bottom' && rect.bottom + contentRect.height > viewportHeight)) {
        contentRef.current.style.bottom = `${popoverRef.current.offsetHeight}px`;
        contentRef.current.style.top = 'auto';
      } else {
        contentRef.current.style.top = `${popoverRef.current.offsetHeight}px`;
        contentRef.current.style.bottom = 'auto';
      }
    }
  }, [isOpen, position]);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{children}</div>
      {isOpen && (
        <div 
          ref={contentRef}
          className={`absolute z-10 w-64 bg-background dark:bg-background border border-border rounded-md shadow-lg ${
            position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export const PopoverTrigger: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const PopoverContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="p-4 text-foreground">{children}</div>;
};
