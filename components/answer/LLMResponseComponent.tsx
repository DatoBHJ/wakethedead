import React, { useState, useEffect } from 'react';
import { type AI } from '../../app/action';
import { useActions } from 'ai/rsc';
import Markdown from 'react-markdown';
import CopyToClipboard from 'react-copy-to-clipboard';
import { Copy, Check, ArrowsCounterClockwise } from "@phosphor-icons/react";
import 'react-tooltip/dist/react-tooltip.css'
import { Tooltip } from 'react-tooltip'
import ChatView from './ChatView';
import { IconAI } from '@/components/ui/icons';
import { useMediaQuery } from '@/lib/hooks/use-media-query';

interface LLMResponseComponentProps {
    llmResponse: string;
    currentLlmResponse: string;
    index: number;
    isolatedView: boolean;
    logo?: string;
    onAddLink: (link: string) => void;
    onRefresh: (index: number) => void;
}

enum LoadingStage {
    Idle,
    SearchingSource,
    WebSearching,
    DataFound,
    AIStarting,
    Responding
}

const LoadingMessage = ({ stage }: { stage: LoadingStage }) => {
    const messages = [
        "Searching source...",
        "Web searching...",
        "Data found!",
        "AI is starting to respond.",
        "Generating response..."
    ];

    return (
        <div className="text-foreground animate-pulse pt-4">
            {messages[stage - 1]}
        </div>
    );
};

const SkeletonLoader = () => {
    return (
        <div className="transition-all duration-300 pt-4">
            <div className="flex items-center mb-4">
                <div className="h-5 bg-gray-300 rounded-lg dark:bg-gray-700/70 w-32 animate-pulse"></div>
            </div>
            <div className="flex flex-col space-y-3">
                <div className="h-2 bg-gray-300 rounded-full dark:bg-gray-700/50 w-full animate-pulse delay-75"></div>
                <div className="h-2 bg-gray-300 rounded-full dark:bg-gray-700/50 w-3/4 animate-pulse delay-100"></div>
                <div className="h-2 bg-gray-300 rounded-full dark:bg-gray-700/50 w-2/3 animate-pulse delay-150"></div>
            </div>
        </div>
    );
};

const LLMResponseComponent = ({ llmResponse, currentLlmResponse, index, isolatedView, logo, onAddLink, onRefresh }: LLMResponseComponentProps) => {
    const [copied, setCopied] = useState(false);
    const [loadingStage, setLoadingStage] = useState<LoadingStage>(LoadingStage.Idle);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const hasLlmResponse = llmResponse && llmResponse.trim().length > 0;
    const hasCurrentLlmResponse = currentLlmResponse && currentLlmResponse.trim().length > 0;
    const isDesktop = useMediaQuery("(min-width: 1024px)");

    useEffect(() => {
        if (!hasLlmResponse && !hasCurrentLlmResponse) {
            startLoadingAnimation();
        }
    }, [hasLlmResponse, hasCurrentLlmResponse]);

    useEffect(() => {
        if (isRefreshing) {
            startLoadingAnimation();
        }
    }, [isRefreshing]);

    useEffect(() => {
        if (hasLlmResponse) {
            setIsRefreshing(false);
        }
    }, [hasLlmResponse]);

    const startLoadingAnimation = () => {
        const stages = [
            LoadingStage.SearchingSource,
            LoadingStage.WebSearching,
            LoadingStage.DataFound,
            LoadingStage.AIStarting,
            LoadingStage.Responding
        ];
        
        stages.forEach((stage, index) => {
            setTimeout(() => setLoadingStage(stage), index * 2000);
        });
    };

    const handleRefresh = () => {
        setCopied(false);
        setIsRefreshing(true);
        onRefresh(index);
    };

    return (
        <div className={isolatedView ? 'flex flex-col max-w-[800px] mx-auto' : ''}>
            {(hasLlmResponse || hasCurrentLlmResponse) && !isRefreshing ? (
                <div className={`mt-4 rounded-xl px-6 pb-6 transition-all duration-300 ${isDesktop ? 'backdrop-blur-sm bg-card-foreground/[3%] dark:bg-card-foreground/5' : 'dark:bg-neutral-900/40'}`}>
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
                            <button 
                                onClick={handleRefresh}
                                className="text-black dark:text-white focus:outline-none transition-colors duration-200 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <ArrowsCounterClockwise size={18} />
                            </button>
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
            ) : (
                <div className="mt-4 backdrop-blur-sm bg-card-foreground/[3%] dark:bg-card-foreground/5 rounded-xl px-5 pb-6 transition-all duration-300">
                    {loadingStage !== LoadingStage.Responding ? (
                        <LoadingMessage stage={loadingStage} />
                    ) : (
                        <SkeletonLoader />
                    )}
                </div>
            )}
        </div>
    );
};

export default LLMResponseComponent;