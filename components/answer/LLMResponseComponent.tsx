import React, { useState } from 'react';
import { type AI } from '../../app/action';
import { useActions } from 'ai/rsc';
import Markdown from 'react-markdown';
import CopyToClipboard from 'react-copy-to-clipboard';
import { Copy, Check, ArrowsCounterClockwise } from "@phosphor-icons/react";
import 'react-tooltip/dist/react-tooltip.css'
import { Tooltip } from 'react-tooltip'
import ChatView from './ChatView';
import { IconAI } from '@/components/ui/icons';


interface LLMResponseComponentProps {
    llmResponse: string;
    currentLlmResponse: string;
    index: number;
    isolatedView: boolean;
    logo?: string;
    onAddLink: (link: string) => void;

}

const SkeletonLoader = () => {
    return (
        <div className="backdrop-blur-md shadow-lg rounded-lg p-6 mt-4 transition-all duration-300">
            <div className="flex items-center mb-4">
                <div className="h-6 w-6 bg-gray-300 rounded-full dark:bg-gray-600 animate-pulse mr-3"></div>
                <div className="h-4 bg-gray-300 rounded-full dark:bg-gray-600 w-32 animate-pulse"></div>
            </div>
            <div className="flex flex-col space-y-3">
                <div className="h-2 bg-gray-300 rounded-full dark:bg-gray-700 w-full animate-pulse delay-75"></div>
                <div className="h-2 bg-gray-300 rounded-full dark:bg-gray-700 w-3/4 animate-pulse delay-100"></div>
                <div className="h-2 bg-gray-300 rounded-full dark:bg-gray-700 w-2/3 animate-pulse delay-150"></div>
            </div>
        </div>
    );
};

const LLMResponseComponent = ({ llmResponse, currentLlmResponse, index, isolatedView, logo, onAddLink,}: LLMResponseComponentProps) => {
    const [copied, setCopied] = useState(false);
    const hasLlmResponse = llmResponse && llmResponse.trim().length > 0;
    const hasCurrentLlmResponse = currentLlmResponse && currentLlmResponse.trim().length > 0;


    return (
        <div className={isolatedView ? 'flex flex-col max-w-[800px] mx-auto' : ''}>
            {hasLlmResponse || hasCurrentLlmResponse ? (
                <>
                        <div className="mt-4 backdrop-blur-sm bg-card-foreground/[3%] dark:bg-card-foreground/5 rounded-xl px-6 pb-6 transition-all duration-300">
                            {/* <div className="flex items-center mb-4"> */}
                                {/* <IconAI className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" /> */}
                                {/* <h2 className="text-xl font-medium flex-grow text-green-700 dark:text-green-200">Response</h2> */}
                            {/* </div> */}
                            <div className="text-card-foreground dark:text-card-foreground leading-relaxed">
                            <ChatView 
                            content={llmResponse} 
                            onAddLink={onAddLink}
                            />                           
                             </div>
                            <div className="flex items-center justify-between mt-6">
                                <div className="flex items-center space-x-4">
                                    <CopyToClipboard text={llmResponse} onCopy={() => setCopied(true)}>
                                        <button className="text-black dark:text-white focus:outline-none transition-colors duration-200 hover:text-gray-600 dark:hover:text-gray-300">
                                            {copied ? <Check size={18} /> : <Copy size={18} />}
                                        </button>
                                    </CopyToClipboard>
                                    {/* {!isolatedView && (
                                        <button id="#not-clickable2" className="text-black dark:text-white focus:outline-none" onClick={handleClearCache}>
                                            <ArrowsCounterClockwise size={20} />
                                        </button>
                                    )} */}
                                </div>
                                {!isolatedView && (
                                    <div className="flex items-center justify-end">
                                        <img src="./powered-by-groq.svg" alt="powered by groq" className='h-5 opacity-70' />
                                    </div>
                                )}
                                {logo && (
                                    <img src={logo} alt="logo" className='h-5 ml-auto opacity-70' />
                                )}
                            </div>
                        </div>
                    
                </>
            ) : (
                <SkeletonLoader />
            )}
        </div>
    );
};

export default LLMResponseComponent;



