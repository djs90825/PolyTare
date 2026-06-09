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

    if (!workerRef.current) {
      workerRef.current = new OptimisationWorker();
    }

    workerRef.current.onmessage = (event: MessageEvent) => {
      const { status, stage, progress, blob, metrics, error } = event.data;

      if (status === 'progress') {
        setProcessingState(true, stage, progress);
      } else if (status === 'complete') {
        const url = URL.createObjectURL(blob);
        setOptimisedAsset(blob, url, metrics); // Inject new metrics here
        setProcessingState(false, 'idle', 100);
      } else if (status === 'error') {
        console.error('PolyTare Architecture Error: Worker Thread Execution Failed.', error);
        setProcessingState(false, 'idle', 0);
        alert(`Optimisation engine failed: ${error}`);
      }
    };

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