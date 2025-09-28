import React from 'react';
import { AppState } from '../types';

interface StatusIndicatorProps {
  state: AppState;
  message?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ state, message }) => {
  const getStatusContent = () => {
    switch (state) {
      case AppState.LISTENING:
        return { text: "Listening... speak now.", color: "blue" };
      case AppState.PROCESSING:
        return { text: "Processing your transaction...", color: "yellow" };
      case AppState.CONFIRMATION:
        return { text: "Please confirm the transaction details below.", color: "blue" };
      case AppState.EDITING:
        return { text: "You can now edit the transaction details.", color: "yellow" };
      case AppState.SUCCESS:
        return { text: message || "Operation successful!", color: "green" };
      case AppState.ERROR:
        return { text: message || "An error occurred.", color: "red" };
      case AppState.IDLE:
      default:
        return { text: "Press the button and speak in Malayalam to add a transaction.", color: "gray" };
    }
  };

  const { text, color } = getStatusContent();
  
  const colorClasses = {
    gray: 'text-gray-600',
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    red: 'text-red-600',
  }[color];

  return (
    <div className={`text-center p-4 min-h-[5rem] flex items-center justify-center transition-all duration-300 ${colorClasses}`}>
      <p className="text-lg font-medium">{text}</p>
    </div>
  );
};

export default StatusIndicator;