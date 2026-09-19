export const DB_NAME = 'CivicPulseDB';
export const STORE_NAME = 'audioRecords';
export const MEDIA_STORE = 'mediaRecords';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        db.createObjectStore(MEDIA_STORE, { keyPath: 'id' });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveAudioBlob = async (id: string, blob: Blob): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ id, blob });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAudioBlob = async (id: string): Promise<Blob | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onsuccess = () => {
      resolve(request.result ? request.result.blob : null);
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteAudioBlob = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const saveMediaBlob = async (id: string, data: string | Blob): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MEDIA_STORE], 'readwrite');
    const store = transaction.objectStore(MEDIA_STORE);
    const request = store.put({ id, data });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getMediaBlob = async (id: string): Promise<string | Blob | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MEDIA_STORE], 'readonly');
    const store = transaction.objectStore(MEDIA_STORE);
    const request = store.get(id);
    
    request.onsuccess = () => {
      resolve(request.result ? request.result.data : null);
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteMediaBlob = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MEDIA_STORE], 'readwrite');
    const store = transaction.objectStore(MEDIA_STORE);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
