
import React from 'react';
import { AppState } from '../types';

interface RecordButtonProps {
  appState: AppState;
  onClick: () => void;
}

const MicIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3ZM11 5a1 1 0 0 1 2 0v6a1 1 0 0 1-2 0V5Z"></path>
    <path d="M12 15a5 5 0 0 0 5-5h-2a3 3 0 0 1-6 0H7a5 5 0 0 0 5 5Z"></path>
    <path d="M19 10h-1.541a6.938 6.938 0 0 1-.362 2.062 8.948 8.948 0 0 1-1.636 3.208A7 7 0 0 1 7.539 12H6a8 8 0 0 0 7 7.938V22h-3v-2h8v2h-3v-2.062A8 8 0 0 0 19 10Z"></path>
  </svg>
);


const RecordButton: React.FC<RecordButtonProps> = ({ appState, onClick }) => {
  const isListening = appState === AppState.LISTENING;

  const buttonClasses = `
    relative flex items-center justify-center w-24 h-24 rounded-full shadow-lg
    transition-all duration-300 ease-in-out
    focus:outline-none focus:ring-4
    ${isListening
      ? 'bg-red-500 text-white focus:ring-red-300'
      : 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-300'
    }
  `;

  return (
    <button onClick={onClick} className={buttonClasses} aria-label={isListening ? 'Stop Recording' : 'Start Recording'}>
      {isListening && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
      )}
      <MicIcon className="w-10 h-10 z-10" />
    </button>
  );
};

export default RecordButton;
