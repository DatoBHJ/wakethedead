'use client';

import React from 'react';
import { useAddToHomeScreen } from './addToHomeScreen';

export const AddToHomeScreenPrompt: React.FC = () => {
  const { showInstallPrompt, handleInstallClick } = useAddToHomeScreen();

  if (!showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4">Add to Home Screen</h2>
        <p className="mb-4">
          Add this application to your home screen for easier video downloads and less advertising.
        </p>
        <button
          onClick={handleInstallClick}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200"
        >
          Add to Home Screen
        </button>
      </div>
    </div>
  );
};