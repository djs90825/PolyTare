// A lightweight wrapper for IndexedDB to track cumulative data savings over time.
const DB_NAME = 'PolyTareTelemetry';
const DB_VERSION = 1;
const STORE_NAME = 'optimisationLogs';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

export const logOptimisationEvent = async (originalSize: number, newSize: number, fileName: string) => {
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const record = {
      timestamp: new Date().toISOString(),
      fileName,
      originalSize,
      newSize,
      savedBytes: originalSize - newSize,
    };

    store.add(record);
  } catch (error) {
    console.warn('PolyTare Telemetry: Failed to log event to IndexedDB.', error);
  }
};