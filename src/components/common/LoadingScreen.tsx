import React from 'react';

interface LoadingScreenProps {
  theme?: 'light' | 'dark';
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ theme = 'light' }) => {
  return (
    <div 
      key={theme}
      className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}
      suppressHydrationWarning
    >
      <div className="text-center">
        <div 
          className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 ${theme === 'dark' ? 'border-indigo-500' : 'border-indigo-600'}`}
          suppressHydrationWarning
        ></div>
        <p 
          className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
          suppressHydrationWarning
        >
          Loading...
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
