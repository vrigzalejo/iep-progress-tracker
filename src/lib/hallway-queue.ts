const DB_NAME = "iep-hallway";
const STORE = "queue";

export type QueuedSession = {
  id: string;
  queuedAt: string;
  payload: Record<string, unknown>;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const queueListeners = new Set<() => void>();
let queuedCount = 0;

export function subscribeQueuedCount(listener: () => void) {
  queueListeners.add(listener);
  return () => {
    queueListeners.delete(listener);
  };
}

export function getQueuedCountSnapshot() {
  return queuedCount;
}

export function getQueuedCountServerSnapshot() {
  return 0;
}

async function refreshQueuedCount() {
  if (typeof indexedDB === "undefined") {
    queuedCount = 0;
  } else {
    queuedCount = (await listQueuedSessions()).length;
  }
  queueListeners.forEach((listener) => listener());
  return queuedCount;
}

export async function enqueueSession(payload: Record<string, unknown>) {
  const db = await openDb();
  const item: QueuedSession = {
    id: crypto.randomUUID(),
    queuedAt: new Date().toISOString(),
    payload,
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  await refreshQueuedCount();
  return item;
}

export async function listQueuedSessions() {
  const db = await openDb();
  return new Promise<QueuedSession[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result as QueuedSession[]);
    request.onerror = () => reject(request.error);
  });
}

export async function removeQueuedSession(id: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function flushQueuedSessions() {
  const items = await listQueuedSessions();
  const failed: QueuedSession[] = [];
  for (const item of items) {
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload),
      });
      if (!response.ok) {
        failed.push(item);
        continue;
      }
      await removeQueuedSession(item.id);
    } catch {
      failed.push(item);
    }
  }
  await refreshQueuedCount();
  return { flushed: items.length - failed.length, failed };
}

export { refreshQueuedCount };
