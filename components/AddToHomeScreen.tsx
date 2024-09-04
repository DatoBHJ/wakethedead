'use client';

import React, { useState, useEffect } from 'react';

const AddToHomeScreen: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        setDeferredPrompt(null);
        setShowPrompt(false);
      });
    }
  };

  // 개발 모드에서 프롬프트를 강제로 표시하는 함수
  const forceShowPrompt = () => {
    setShowPrompt(true);
  };

  if (!showPrompt && process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-50">
      <p className="text-sm mb-2">Add Wake The Dead to your home screen for quick access!</p>
      <button
        onClick={handleInstall}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
      >
        Add to Home Screen
      </button>
      
      {process.env.NODE_ENV === 'development' && !showPrompt && (
        <button
          onClick={forceShowPrompt}
          className="ml-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        >
          Test Prompt
        </button>
      )}
    </div>
  );
};

export default AddToHomeScreen;