// import React from 'react';
// import { IconPlus } from '@/components/ui/icons';
// import { Plus } from '@phosphor-icons/react';

// interface InitialQueriesProps {
//   questions: string[];
//   handleFollowUpClick: (question: string) => void;
// }

// const InitialQueries = ({ questions, handleFollowUpClick }: InitialQueriesProps) => {
//   const handleQuestionClick = (question: string) => {
//     handleFollowUpClick(question);
//   };
  
//   return (
//     <div className="">
//       <ul className="mt-2">
//         {questions.map((question, index) => (
//           <li
//             key={index}
//             className="flex items-center cursor-pointer bg-transparent p-4 my-2"
//             onClick={() => handleQuestionClick(question)}
//           >
//             {/* <span role="img" aria-label="link" className="mr-2 dark:text-white text-black"> */}
//             <span role="img" aria-label="link" className="mr-2 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300">

//               <IconPlus className='flex h-6 w-6 pb-1' />
//             </span>
//             <p className="text-md sm:text-lg font-handwriting dark:text-white text-black">{question}</p>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default InitialQueries;