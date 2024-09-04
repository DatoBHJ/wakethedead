'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const AddToHomeScreen: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    console.log('AddToHomeScreen component mounted');

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
      console.log('beforeinstallprompt event fired');
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleAddToHomeScreen = () => {
    console.log('Add to Home Screen button clicked');
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        setDeferredPrompt(null);
      });
    } else {
      console.log('No deferred prompt available');
    }
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-50 flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold mb-1">Add to Home Screen</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Install our app for a better experience!
        </p>
      </div>
      <div className="flex items-center">
        <button
          onClick={handleAddToHomeScreen}
          className="bg-blue-500 text-white px-4 py-2 rounded-md mr-2 hover:bg-blue-600 transition-colors"
        >
          Add
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
};

export default AddToHomeScreen;