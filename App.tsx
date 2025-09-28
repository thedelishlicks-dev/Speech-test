import React, { useState, useRef, useCallback, useEffect } from 'react';
// FIX: Removed `LiveSession` as it is not an exported member of `@google/genai`.
import { GoogleGenAI, Modality, LiveServerMessage, Blob } from "@google/genai";
import { AppState, Transaction, TransactionType } from './types';
import { parseTransactionFromSpeech, parseTransactionFromImage } from './services/geminiService';
import TransactionTable from './components/TransactionTable';
import RecordButton from './components/RecordButton';
import StatusIndicator from './components/StatusIndicator';
import ConfirmationView from './components/ConfirmationView';
import EditTransactionForm from './components/EditTransactionForm';
import SplashScreen from './components/SplashScreen';
import AnimatedView from './components/AnimatedView';
import NavigationView from './components/NavigationView';
import CameraInputView from './components/CameraInputView';

// --- LocalStorage Utility Functions ---
const LOCAL_STORAGE_KEY = 'voice-transactions-app';

const saveTransactionsToLocalStorage = (transactions: Transaction[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error("Failed to save transactions to localStorage", error);
  }
};

const loadTransactionsFromLocalStorage = (): Transaction[] => {
  try {
    const savedTransactions = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedTransactions) {
      const transactions = JSON.parse(savedTransactions);
      // Migration for older data structures to the new English-only format
      return transactions.map((tx: any) => ({
        id: tx.id,
        date: tx.date,
        description: tx.descriptionEn || tx.description, // Prioritize English translation if available, fallback to old description
        category: tx.category,
        amount: tx.amount,
        type: tx.type,
      }));
    }
  } catch (error) {
    console.error("Failed to parse transactions from localStorage", error);
    return []; // Return empty array on parsing error
  }
  return []; // Return empty array if nothing is stored
};
// --- End of LocalStorage Utilities ---


// Helper functions for audio encoding, as per Gemini API documentation
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const App: React.FC = () => {
  const [isAppStarted, setIsAppStarted] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const loaded = loadTransactionsFromLocalStorage();
    if (loaded.length > 0) {
      return loaded;
    }
    return [
      { id: '1', date: '2024-07-20', description: 'Monthly Salary', category: 'Salary', amount: 60000, type: TransactionType.INCOME },
      { id: '2', date: '2024-07-21', description: 'Groceries', category: 'Food', amount: 3500, type: TransactionType.EXPENSE },
      { id: '3', date: '2024-07-22', description: 'Petrol', category: 'Transport', amount: 1500, type: TransactionType.EXPENSE },
    ];
  });
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [currentView, setCurrentView] = useState<'voice' | 'camera'>('voice');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [pendingTransaction, setPendingTransaction] = useState<Omit<Transaction, 'id'> | null>(null);

  useEffect(() => {
    saveTransactionsToLocalStorage(transactions);
  }, [transactions]);


  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const currentTranscriptRef = useRef<string>('');

  const stopListening = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current && sourceNodeRef.current && audioContextRef.current) {
        sourceNodeRef.current.disconnect();
        processorRef.current.disconnect();
        if (audioContextRef.current.state !== 'closed') {
             audioContextRef.current.close();
        }
    }
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
        sessionPromiseRef.current = null;
    }
    audioContextRef.current = null;
    processorRef.current = null;
    sourceNodeRef.current = null;
    currentTranscriptRef.current = '';
    setAppState(current => (current === AppState.LISTENING ? AppState.IDLE : current));
  }, []);

  const processTranscript = useCallback(async (text: string) => {
    if (!text) {
      setAppState(AppState.IDLE);
      return;
    }
    setAppState(AppState.PROCESSING);
    setTranscript(text);
    try {
      const newTransactionData = await parseTransactionFromSpeech(text);
      setPendingTransaction(newTransactionData);
      setAppState(AppState.CONFIRMATION);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setFeedbackMessage(errorMessage);
      setAppState(AppState.ERROR);
      setTimeout(() => {
        setAppState(AppState.IDLE);
        setTranscript('');
        setFeedbackMessage(null);
      }, 5000);
    }
  }, []);
  
  const handleImageCapture = useCallback(async (imageData: string) => {
    setCurrentView('voice'); // Close the full-screen camera view
    setAppState(AppState.PROCESSING);
    try {
      const newTransactionData = await parseTransactionFromImage(imageData);
      setPendingTransaction(newTransactionData);
      setAppState(AppState.CONFIRMATION);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setFeedbackMessage(errorMessage);
      setAppState(AppState.ERROR);
      setTimeout(() => {
        setAppState(AppState.IDLE);
        setFeedbackMessage(null);
      }, 5000);
    }
  }, []);

  const handleConfirmTransaction = () => {
    if (!pendingTransaction) return;
    const newTransaction: Transaction = {
      ...pendingTransaction,
      id: new Date().toISOString(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
    setPendingTransaction(null);
    setFeedbackMessage("Transaction added successfully!");
    setAppState(AppState.SUCCESS);
    setTimeout(() => {
      setAppState(AppState.IDLE);
      setTranscript('');
      setFeedbackMessage(null);
    }, 3000);
  };

  const handleCancelTransaction = () => {
    setPendingTransaction(null);
    setAppState(AppState.IDLE);
    setTranscript('');
  };
  
  const handleStartEdit = () => {
    setAppState(AppState.EDITING);
  };

  const handleSaveEdit = (updatedTransaction: Omit<Transaction, 'id'>) => {
    setPendingTransaction(updatedTransaction);
    setAppState(AppState.CONFIRMATION);
  };
  
  const handleCancelEdit = () => {
    setAppState(AppState.CONFIRMATION);
  };

  const handleManualSave = () => {
    saveTransactionsToLocalStorage(transactions);
    setFeedbackMessage("Transactions saved successfully.");
    setAppState(AppState.SUCCESS);
    setTimeout(() => {
      setAppState(AppState.IDLE);
      setFeedbackMessage(null);
    }, 3000);
  };

  const handleManualLoad = () => {
    const loadedTransactions = loadTransactionsFromLocalStorage();
    setTransactions(loadedTransactions);
    setFeedbackMessage("Transactions loaded from browser storage.");
    setAppState(AppState.SUCCESS);
    setTimeout(() => {
      setAppState(AppState.IDLE);
      setFeedbackMessage(null);
    }, 3000);
  };

  const startListening = useCallback(async () => {
    setAppState(AppState.LISTENING);
    setFeedbackMessage(null);
    setTranscript('');
    currentTranscriptRef.current = '';

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      processorRef.current.onaudioprocess = (audioProcessingEvent) => {
        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
        const pcmBlob = createBlob(inputData);
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
            });
        }
      };

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          systemInstruction: `Your task is to transcribe audio for a finance app. The user is speaking in Malayalam.
The speech will describe an income or expense transaction.
Prioritize recognizing financial categories. Examples include 'ശമ്പളം' (Salary), 'ചായ' (Tea), 'പെട്രോൾ' (Petrol).
CRITICAL: The audio is ALWAYS Malayalam. IGNORE similarities to Tamil or Telugu. Your output MUST be in Malayalam script ONLY.`
        },
        callbacks: {
          onopen: () => {
            if(sourceNodeRef.current && processorRef.current && audioContextRef.current) {
                sourceNodeRef.current.connect(processorRef.current);
                processorRef.current.connect(audioContextRef.current.destination);
            }
          },
          onmessage: (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              currentTranscriptRef.current += text;
              setTranscript(currentTranscriptRef.current);
            }
            if (message.serverContent?.turnComplete && currentTranscriptRef.current) {
              const finalTranscript = currentTranscriptRef.current;
              stopListening();
              processTranscript(finalTranscript);
            }
          },
          onerror: (e: ErrorEvent) => {
            setFeedbackMessage(`Speech recognition error: ${e.message}`);
            setAppState(AppState.ERROR);
            stopListening();
          },
          onclose: () => {},
        },
      });

    } catch (err) {
      let errorMessage = 'An unexpected error occurred.';
       if (err instanceof DOMException && err.name === 'NotAllowedError') {
          if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
              errorMessage = "Microphone access requires a secure connection (HTTPS).";
          } else {
              errorMessage = "Microphone access denied. Please allow microphone access in your browser settings.";
          }
       } else if (err instanceof Error) {
        errorMessage = err.message;
       }
      setFeedbackMessage(errorMessage);
      setAppState(AppState.ERROR);
      stopListening();
    }
  }, [processTranscript, stopListening]);

  const handleRecordButtonClick = () => {
    if (appState === AppState.LISTENING) {
      stopListening();
    } else {
      startListening();
    }
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  const handleStartApp = () => {
    setIsAppStarted(true);
  };
  
  const handleViewChange = (view: 'voice' | 'camera') => {
    if(appState === AppState.LISTENING) {
      stopListening();
    }
    setCurrentView(view);
    setAppState(AppState.IDLE);
    setFeedbackMessage(null);
    setTranscript('');
    setPendingTransaction(null);
  };

  return (
    <>
      <AnimatedView isVisible={!isAppStarted}>
        <SplashScreen onStart={handleStartApp} />
      </AnimatedView>
      
      <AnimatedView isVisible={isAppStarted}>
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
          <header className="bg-white shadow-sm">
            <div className="container mx-auto px-4 py-5">
              <h1 className="text-3xl font-bold text-gray-900 text-center">
                Malayalam Voice Transaction Logger
              </h1>
            </div>
          </header>
          <main className="container mx-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8 relative overflow-hidden min-h-[25rem]">
                
                <AnimatedView isVisible={appState !== AppState.CONFIRMATION && appState !== AppState.EDITING}>
                    <NavigationView currentView={currentView} onViewChange={handleViewChange} />
                </AnimatedView>

                <StatusIndicator state={appState} message={feedbackMessage} />
                
                <AnimatedView isVisible={appState === AppState.EDITING && !!pendingTransaction}>
                    {pendingTransaction && <EditTransactionForm transaction={pendingTransaction} onSave={handleSaveEdit} onCancel={handleCancelEdit} />}
                </AnimatedView>

                <AnimatedView isVisible={appState === AppState.CONFIRMATION && !!pendingTransaction}>
                   {pendingTransaction && <ConfirmationView transaction={pendingTransaction} onConfirm={handleConfirmTransaction} onCancel={handleCancelTransaction} onEdit={handleStartEdit} />}
                </AnimatedView>

                <AnimatedView isVisible={[AppState.IDLE, AppState.LISTENING, AppState.PROCESSING, AppState.ERROR, AppState.SUCCESS].includes(appState) && currentView === 'voice'}>
                  <div className="text-center">
                    <div className="my-6 flex justify-center">
                      <RecordButton appState={appState} onClick={handleRecordButtonClick} />
                    </div>
                    {(transcript || appState === AppState.LISTENING) && (
                      <div className="mt-4 p-3 bg-gray-100 rounded-md min-h-[6rem]">
                        <p className="text-sm text-gray-500">{appState === AppState.PROCESSING ? 'Recognized speech:' : 'Transcript:'}</p>
                        <p className="text-md text-gray-800 italic">"{transcript}"</p>
                      </div>
                    )}
                  </div>
                </AnimatedView>

              </div>
              
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-700">Recent Transactions</h2>
                <div className="space-x-2">
                  <button
                    onClick={handleManualSave}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleManualLoad}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Load
                  </button>
                </div>
              </div>
              <TransactionTable transactions={transactions} />
            </div>
          </main>
          <footer className="text-center py-4 text-sm text-gray-500">
            <p>Powered by Gemini API</p>
          </footer>
        </div>
      </AnimatedView>
      
      <AnimatedView isVisible={isAppStarted && currentView === 'camera'}>
        <CameraInputView
          onCapture={handleImageCapture}
          setAppState={setAppState}
          setFeedbackMessage={setFeedbackMessage}
          onClose={() => handleViewChange('voice')}
        />
      </AnimatedView>
    </>
  );
};

export default App;