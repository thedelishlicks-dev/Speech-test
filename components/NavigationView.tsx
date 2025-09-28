import React from 'react';

interface NavigationViewProps {
  currentView: 'voice' | 'camera';
  onViewChange: (view: 'voice' | 'camera') => void;
}

const NavigationView: React.FC<NavigationViewProps> = ({ currentView, onViewChange }) => {
  const getButtonClasses = (view: 'voice' | 'camera') => {
    const baseClasses = 'px-6 py-2 text-sm font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200';
    if (currentView === view) {
      return `${baseClasses} bg-indigo-600 text-white shadow`;
    }
    return `${baseClasses} bg-gray-200 text-gray-700 hover:bg-gray-300`;
  };

  return (
    <div className="flex justify-center items-center p-2 mb-4 bg-gray-100 rounded-lg">
      <div className="flex space-x-2">
        <button onClick={() => onViewChange('voice')} className={getButtonClasses('voice')}>
          Voice Input
        </button>
        <button onClick={() => onViewChange('camera')} className={getButtonClasses('camera')}>
          Camera Input
        </button>
      </div>
    </div>
  );
};

export default NavigationView;