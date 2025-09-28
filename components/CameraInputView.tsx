import React, { useRef, useState, useEffect, useCallback } from 'react';
import { AppState } from '../types';

interface CameraInputViewProps {
  onCapture: (imageData: string) => void;
  setAppState: (state: AppState) => void;
  setFeedbackMessage: (message: string | null) => void;
  onClose: () => void;
}

const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
 <svg xmlns="http://www.w.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 10.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
    <path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm3-1.5a1.5 1.5 0 0 0-1.5 1.5v12a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H6Z" clipRule="evenodd" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
  </svg>
);


const CameraInputView: React.FC<CameraInputViewProps> = ({ onCapture, setAppState, setFeedbackMessage, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // onCanPlay is used to set camera ready state
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
       let errorMessage = 'An unexpected error occurred while accessing the camera.';
       if (err instanceof DOMException && err.name === 'NotAllowedError') {
          if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
              errorMessage = "Camera access requires a secure connection (HTTPS).";
          } else {
              errorMessage = "Camera access denied. Please allow camera access in your browser settings.";
          }
       } else if (err instanceof Error) {
        errorMessage = err.message;
       }
      setFeedbackMessage(errorMessage);
      setAppState(AppState.ERROR);
      setIsCameraReady(false);
      onClose(); // Close the view if camera fails
    }
  }, [setAppState, setFeedbackMessage, onClose]);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      onCapture(imageData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-40 flex items-center justify-center">
       <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 ${isCameraReady ? 'opacity-100' : 'opacity-0'}`}
          onCanPlay={() => setIsCameraReady(true)}
        />
        
        {!isCameraReady && (
           <div className="absolute inset-0 flex items-center justify-center">
             <p className="text-white text-lg">Starting camera...</p>
           </div>
        )}
      
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-50 p-3 bg-black bg-opacity-40 rounded-full text-white hover:bg-opacity-60 transition-colors"
        aria-label="Close camera view"
      >
        <XIcon className="w-6 h-6" />
      </button>

      <div className="absolute bottom-10 z-50">
        <button
          onClick={handleCapture}
          disabled={!isCameraReady}
          className="flex items-center justify-center w-20 h-20 rounded-full bg-white text-blue-500 shadow-lg ring-4 ring-white ring-opacity-30 transition-all duration-300 ease-in-out hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          aria-label="Capture Image"
        >
          <CameraIcon className="w-9 h-9" />
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraInputView;