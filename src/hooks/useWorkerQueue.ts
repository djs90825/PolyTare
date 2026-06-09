import { useCallback, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import OptimisationWorker from '../core/optimisation/worker?worker';

export function useWorkerQueue() {
  const sourceFile = useAppStore((state) => state.sourceFile);
  const settings = useAppStore((state) => state.settings);
  const setProcessingState = useAppStore((state) => state.setProcessingState);
  const setOptimisedAsset = useAppStore((state) => state.setOptimisedAsset);
  
  const workerRef = useRef<Worker | null>(null);

  const startOptimisation = useCallback(async () => {
    if (!sourceFile) return;

    setProcessingState(true, 'parsing', 0);

    // Instantiate the worker using Vite's robust compilation syntax
    if (!workerRef.current) {
      workerRef.current = new OptimisationWorker();
    }

    workerRef.current.onmessage = (event: MessageEvent) => {
      const { status, stage, progress, blob, error } = event.data;

      if (status === 'progress') {
        setProcessingState(true, stage, progress);
      } else if (status === 'complete') {
        const url = URL.createObjectURL(blob);
        setOptimisedAsset(blob, url);
        setProcessingState(false, 'idle', 100);
      } else if (status === 'error') {
        console.error('PolyTare Architecture Error: Worker Thread Execution Failed.', error);
        setProcessingState(false, 'idle', 0);
        alert(`Optimisation engine failed: ${error}`);
      }
    };

    // Extract the raw ArrayBuffer and immediately transfer ownership to the background thread
    // The [arrayBuffer] argument guarantees zero-copy memory offloading
    const arrayBuffer = await sourceFile.arrayBuffer();
    workerRef.current.postMessage({ fileBuffer: arrayBuffer, settings }, [arrayBuffer]);

  }, [sourceFile, settings, setProcessingState, setOptimisedAsset]);

  const terminateWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      setProcessingState(false, 'idle', 0);
    }
  }, [setProcessingState]);

  return { startOptimisation, terminateWorker };
}