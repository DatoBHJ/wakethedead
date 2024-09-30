// import React from 'react';
// import { IconPlus } from '@/components/ui/icons';

// interface InitialQueriesProps {
//   questions: string[];
//   handleFollowUpClick: (question: string) => void;
// }

// const InitialQueries: React.FC<InitialQueriesProps> = ({ questions, handleFollowUpClick }) => {
//   const handleQuestionClick = (question: string) => {
//     handleFollowUpClick(question);
//   };

//   const formatSummary = (summary: string) => {
//     return summary.replace(/^\*\*|\*\*$/g, '');
//   };

//   const renderItem = (item: string, index: number) => {
//     const isSummary = item.startsWith('**Part');
//     const formattedItem = isSummary ? formatSummary(item) : item;

//     return (
//       <li
//         key={index}
//         className={`flex items-center p-3 my-1 md:my-5 ${isSummary ? 'backdrop-blur-sm bg-card-foreground/[3%] dark:bg-card-foreground/5 rounded-xl px-6' : 'bg-transparent'}`}
//       >
//         {!isSummary && (
//           <span
//             role="img"
//             aria-label="link"
//             className="mr-2 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 cursor-pointer"
//             onClick={() => handleQuestionClick(item)}
//           >
//             <IconPlus className='flex h-5 w-5 pb-1' />
//           </span>
//         )}
//         <p className={`${isSummary ? 'font-bold text-lg text-gray-700 dark:text-gray-300' : 'text-base text-black dark:text-gray-200 cursor-pointer'} font-handwriting`}
//            onClick={() => !isSummary && handleQuestionClick(item)}>
//           {formattedItem}
//         </p>
//       </li>
//     );
//   };

//   const renderSeparator = (index: number) => (
//     <li key={`separator-${index}`} className="my-2">
//       <div className="w-full h-px bg-gray-200 dark:bg-gray-700 opacity-50"></div>
//     </li>
//   );

//   const groupedItems = questions.reduce((acc, item, index) => {
//     if (item.startsWith('**Part')) {
//       acc.push([item]);
//     } else if (acc.length > 0) {
//       acc[acc.length - 1].push(item);
//     } else {
//       acc.push([item]);
//     }
//     return acc;
//   }, [] as string[][]);

//   return (
//     <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
//       <ul className="mt-2 md:mr-10 mr-0">
//         {groupedItems.map((group, groupIndex) => (
//           <React.Fragment key={groupIndex}>
//             {group.map(renderItem)}
//             {groupIndex < groupedItems.length - 1 && renderSeparator(groupIndex)}
//           </React.Fragment>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default InitialQueries;



import React, { useState } from 'react';
import { IconPlus, IconCheck } from '@/components/ui/icons';

interface InitialQueriesProps {
  questions: string[];
  handleFollowUpClick: (question: string) => void;
}

const InitialQueries: React.FC<InitialQueriesProps> = ({ questions, handleFollowUpClick }) => {
  const [clickedQuestions, setClickedQuestions] = useState<Set<string>>(new Set());

  const handleQuestionClick = (question: string) => {
    handleFollowUpClick(question);
    setClickedQuestions(prev => new Set(prev).add(question));
  };

  const formatSummary = (summary: string) => {
    return summary.replace(/^\*\*|\*\*$/g, '');
  };

  const renderItem = (item: string, index: number) => {
    const isSummary = item.startsWith('**Part');
    const formattedItem = isSummary ? formatSummary(item) : item;
    const isClicked = clickedQuestions.has(item);

    return (
      <li
        key={index}
        className={`flex items-center p-3 my-1 md:my-5 ${
          isSummary ? 'backdrop-blur-sm bg-card-foreground/[3%] dark:bg-card-foreground/5 rounded-xl px-6' : 'bg-transparent'
        } ${isClicked ? 'opacity-70' : ''}`}
      >
        {!isSummary && (
          <span
            role="img"
            aria-label="link"
            className="mr-2 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 cursor-pointer"
            onClick={() => handleQuestionClick(item)}
          >
            {isClicked ? <IconCheck className='flex h-5 w-5 pb-1' /> : <IconPlus className='flex h-5 w-5 pb-1' />}
          </span>
        )}
        <p className={`${
          isSummary ? 'font-bold text-lg text-gray-700 dark:text-gray-300' : 'text-base text-black dark:text-gray-200 cursor-pointer'
        } ${isClicked ? 'text-blue-600 dark:text-blue-400' : ''} font-handwriting`}
           onClick={() => !isSummary && handleQuestionClick(item)}>
          {formattedItem}
        </p>
      </li>
    );
  };

  const renderSeparator = (index: number) => (
    <li key={`separator-${index}`} className="my-2">
      <div className="w-full h-px bg-gray-200 dark:bg-gray-700 opacity-50"></div>
    </li>
  );

  const groupedItems = questions.reduce((acc, item, index) => {
    if (item.startsWith('**Part')) {
      acc.push([item]);
    } else if (acc.length > 0) {
      acc[acc.length - 1].push(item);
    } else {
      acc.push([item]);
    }
    return acc;
  }, [] as string[][]);

  return (
    <div className="h-full overflow-y-auto">
      <ul className="mt-2 md:mr-10 mr-0">
        {groupedItems.map((group, groupIndex) => (
          <React.Fragment key={groupIndex}>
            {group.map(renderItem)}
            {groupIndex < groupedItems.length - 1 && renderSeparator(groupIndex)}
          </React.Fragment>
        ))}
      </ul>
    </div>
  );
};

export default InitialQueries;