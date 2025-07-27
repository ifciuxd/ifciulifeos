import { useEffect, useRef, useState } from 'react';

export function useWorker<T = any>(workerPath: string) {
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL(workerPath, import.meta.url));
    
    workerRef.current.onmessage = (e: MessageEvent<{ type: string; payload: any }>) => {
      if (e.data.type === 'error') {
        setError(e.data.payload);
      } else {
        setResult(e.data.payload);
      }
      setIsProcessing(false);
    };
    
    workerRef.current.onerror = (err) => {
      setError('Worker error occurred');
      console.error(err);
      setIsProcessing(false);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [workerPath]);

  const postMessage = (message: any) => {
    if (!workerRef.current) return;
    
    setIsProcessing(true);
    setError(null);
    workerRef.current.postMessage(message);
  };

  return { postMessage, result, error, isProcessing };
}