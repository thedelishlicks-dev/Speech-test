import React from 'react';

const SplashScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-800 p-4 font-sans overflow-hidden">
      {/* Main content area that grows to push the button down and centers the content */}
      <main className="flex-grow flex flex-col items-center justify-center text-center">
        
        {/* Logo and Tagline */}
        <div className="mb-4">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white">
            <span className="mx-4">=</span>
            <span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-red-500 to-yellow-400">
                  ക
              </span>
              <span>ണക്ക്</span>
            </span>
            <span className="mx-4">+</span>
          </h1>
        </div>
        <p className="text-lg md:text-xl text-gray-300 font-semibold">
          Your Family Finance Intelligence
        </p>
      </main>
      
      {/* Button container with padding to lift it from the bottom edge */}
      <div className="pb-16 sm:pb-24">
        <button
          onClick={onStart}
          className="bg-gray-200 text-gray-800 font-bold py-3 px-10 text-lg rounded-full shadow-lg hover:bg-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-all duration-300 ease-in-out"
          aria-label="Start using the application"
        >
          start here
        </button>
      </div>
    </div>
  );
};

export default SplashScreen;