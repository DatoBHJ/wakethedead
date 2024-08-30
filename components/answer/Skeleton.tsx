import React from 'react';

const Skeleton = () => {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 bg-skeleton dark:bg-skeleton rounded w-1/2 mt-2"></div>
      <div className="space-y-2">
        <div className="h-4 bg-skeleton dark:bg-skeleton rounded"></div>
        <div className="h-4 bg-skeleton dark:bg-skeleton rounded"></div>
        <div className="h-4 bg-skeleton dark:bg-skeleton rounded w-5/6"></div>
      </div>
    </div>
  );
};

export const LoadingIndicator: React.FC = () => (
  <div className="flex items-center justify-center text-sm text-muted-foreground">
    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    Generating article...
  </div>
);

export default Skeleton;