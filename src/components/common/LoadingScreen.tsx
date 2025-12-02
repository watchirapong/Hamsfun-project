import React from 'react';

interface LoadingScreenProps {
  theme?: 'light' | 'dark';
}

const LoadingScreen: React.FC<LoadingScreenProps> = () => {
  return (
    <div 
      className="min-h-screen flex items-center justify-center transition-colors duration-300 bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white"
      suppressHydrationWarning
    >
      <div className="text-center">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 border-indigo-600 dark:border-indigo-500"
          suppressHydrationWarning
        ></div>
        <p 
          className="font-medium text-gray-600 dark:text-gray-300"
          suppressHydrationWarning
        >
          Loading...
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
