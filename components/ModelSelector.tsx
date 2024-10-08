// import React, { useState, useRef, useEffect } from 'react';
// import { CaretRight } from "@phosphor-icons/react";

// const modelGroups = {
//   // 'Google': ['gemma2-9b-it', 'gemma-7b-it'],
//   'Meta': [
//     // 'llama-3.2-90b-text-preview',
//     // 'llama-3.2-11b-text-preview',
//     // 'llama-3.2-3b-preview',
//     // 'llama-3.2-1b-preview',
//     'llama-3.1-70b-versatile', 
//     // 'llama-3.1-8b-instant', 
//     // 'llama3-70b-8192', 
//     'llama3-8b-8192',
//     //  'llama-guard-3-8b'
//     ],
//   // 'Mixtral': ['mixtral-8x7b-32768'],
// };

// interface ModelSelectorProps {
//   selectedModel: string;
//   setSelectedModel: (model: string) => void;
// }

// const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, setSelectedModel }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [isTextBold, setIsTextBold] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);
//   const contentRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setIsOpen(false);
//         setIsTextBold(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   const handleSelectorClick = () => {
//     setIsOpen(!isOpen);
//     setIsTextBold(!isTextBold);
//   };

//   const selectorButton = (
//     <div
//       onClick={handleSelectorClick}
//       className="flex items-center justify-between w-full text-left bg-transparent cursor-pointer transition-colors duration-200"
//     >
//       <div className="flex items-center px-3 py-2">
//         <span className={`truncate text-black dark:text-white transition-all duration-200 ${isTextBold ? 'font-semibold' : 'font-normal'}`}>
//           {selectedModel}
//         </span>
//       </div>
//       <CaretRight
//         size={20} 
//         weight="bold"
//         className={`absolute right-2 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 focus:outline-none bg-transparent transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} 
//       />
//     </div>
//   );

//   return (
//     <div className="relative" ref={dropdownRef}>
//       {selectorButton}
//       <div 
//         className={`absolute -top-1 w-full bg-white/90 dark:bg-white/[2%] backdrop-blur-3xl pt-1 rounded-xl z-50 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
//       >
//         <div ref={contentRef}>
//           {selectorButton}
//           <div className="max-h-80 overflow-auto mt-1 pb-2">
//             {Object.entries(modelGroups).map(([group, models], index, array) => (
//               <React.Fragment key={group}>
//                 <div>
//                   <div className="px-5 text-sm text-groupcolor p-1">{group}</div>
//                   {models.map((model) => (
//                     <div
//                       key={model}
//                       className={`py-2 cursor-pointer transition-colors duration-200 ${
//                         model === selectedModel ? 'bg-black/[5%] dark:bg-white/[5%] ' : ' text-muted-foreground'
//                       }`}
//                       onClick={() => {
//                         setSelectedModel(model);
//                         setIsOpen(false);
//                         setIsTextBold(false);
//                       }}
//                     >
//                       <div className="px-7">{model}</div>
//                     </div>
//                   ))}
//                 </div>
//                 {index < array.length - 1 && (
//                   <div className="my-2 border-t border-input" />
//                 )}
//               </React.Fragment>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ModelSelector;






import React, { useState, useRef, useEffect } from 'react';
import { CaretRight } from "@phosphor-icons/react";

const modelGroups = {
  'Google': [
    {
      name: 'gemma2-9b-it',
      description: 'Smarter than Llama 3-8b but slower'
    },    // 'gemma-7b-it',
  ],
  'Meta': [
    {
      name: 'llama-3.2-90b-text-preview',
      description: 'Latest and largest Llama model'
    },
    // 'llama-3.2-11b-text-preview',
    // 'llama-3.2-3b-preview',
    // 'llama-3.2-1b-preview',
    {
      name: 'llama-3.1-70b-versatile',
      description: 'Outperforms Llama 3-70B in most tasks, but slower'
    },
    // 'llama-3.1-8b-instant', 
    {
      name: 'llama3-70b-8192',
      description: 'Smarter than gemma2-9b-it but slower'
    },
    {
      name: 'llama3-8b-8192',
      description: 'Smart and super fast'
    },
    //  'llama-guard-3-8b'
  ],
  // 'Mixtral': ['mixtral-8x7b-32768'],
};

interface ModelSelectorProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, setSelectedModel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTextBold, setIsTextBold] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsTextBold(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectorClick = () => {
    setIsOpen(!isOpen);
    setIsTextBold(!isTextBold);
  };

  const selectorButton = (
    <div
      onClick={handleSelectorClick}
      className="flex items-center justify-between w-full text-left bg-transparent cursor-pointer transition-colors duration-200"
    >
      <div className="flex items-center px-3 py-2">
        <span className={`truncate text-black dark:text-white transition-all duration-200 ${isTextBold ? 'font-semibold' : 'font-normal'}`}>
          {selectedModel}
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
          <div className="max-h-80 overflow-auto mt-1 pb-2">
            {Object.entries(modelGroups).map(([group, models], index, array) => (
              <React.Fragment key={group}>
                <div>
                  <div className="px-5 text-sm text-groupcolor p-1">{group}</div>
                  {models.map((model) => (
                    <div
                      key={typeof model === 'string' ? model : model.name}
                      className={`py-2 cursor-pointer transition-colors duration-200 ${
                        (typeof model === 'string' ? model : model.name) === selectedModel ? 'bg-black/[5%] dark:bg-white/[5%] ' : ' text-muted-foreground'
                      }`}
                      onClick={() => {
                        setSelectedModel(typeof model === 'string' ? model : model.name);
                        setIsOpen(false);
                        setIsTextBold(false);
                      }}
                    >
                      <div className="px-7">
                        {typeof model === 'string' ? model : model.name}
                        {typeof model !== 'string' && (
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelSelector;