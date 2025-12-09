/**
 * Offline storage utility for interview feedback
 * Uses IndexedDB for reliable offline data persistence
 */

const DB_NAME = 'OracleRecruitmentOffline';
const DB_VERSION = 1;
const FEEDBACK_STORE = 'pendingFeedback';

export interface PendingFeedback {
  id: string;
  interviewId: number;
  candidateId: number;
  interviewerId: number;
  overallRating: number;
  technicalSkillsRating?: number;
  communicationRating?: number;
  problemSolvingRating?: number;
  cultureFitRating?: number;
  recommendation: string;
  strengths?: string;
  weaknesses?: string;
  detailedNotes?: string;
  timestamp: number;
  synced: boolean;
}

/**
 * Initialize IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store for pending feedback
      if (!db.objectStoreNames.contains(FEEDBACK_STORE)) {
        const store = db.createObjectStore(FEEDBACK_STORE, { keyPath: 'id' });
        store.createIndex('synced', 'synced', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Save feedback to offline storage
 */
export async function saveFeedbackOffline(
  feedback: Omit<PendingFeedback, 'id' | 'timestamp' | 'synced'>
): Promise<string> {
  const db = await openDatabase();
  const id = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const feedbackData: PendingFeedback = {
    ...feedback,
    id,
    timestamp: Date.now(),
    synced: false,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FEEDBACK_STORE], 'readwrite');
    const store = transaction.objectStore(FEEDBACK_STORE);
    const request = store.add(feedbackData);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all pending (unsynced) feedback
 */
export async function getPendingFeedback(): Promise<PendingFeedback[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FEEDBACK_STORE], 'readonly');
    const store = transaction.objectStore(FEEDBACK_STORE);
    const index = store.index('synced');
    const request = index.getAll(false);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Mark feedback as synced
 */
export async function markFeedbackAsSynced(id: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FEEDBACK_STORE], 'readwrite');
    const store = transaction.objectStore(FEEDBACK_STORE);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const feedback = getRequest.result;
      if (feedback) {
        feedback.synced = true;
        const updateRequest = store.put(feedback);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        resolve();
      }
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Delete synced feedback older than specified days
 */
export async function cleanupOldFeedback(daysOld: number = 7): Promise<number> {
  const db = await openDatabase();
  const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FEEDBACK_STORE], 'readwrite');
    const store = transaction.objectStore(FEEDBACK_STORE);
    const index = store.index('timestamp');
    const request = index.openCursor();
    let deletedCount = 0;

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const feedback = cursor.value as PendingFeedback;
        if (feedback.synced && feedback.timestamp < cutoffTime) {
          cursor.delete();
          deletedCount++;
        }
        cursor.continue();
      } else {
        resolve(deletedCount);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Get count of pending feedback items
 */
export async function getPendingFeedbackCount(): Promise<number> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FEEDBACK_STORE], 'readonly');
    const store = transaction.objectStore(FEEDBACK_STORE);
    const index = store.index('synced');
    const request = index.count(false);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Check if browser supports offline storage
 */
export function isOfflineStorageSupported(): boolean {
  return 'indexedDB' in window && 'serviceWorker' in navigator;
}
