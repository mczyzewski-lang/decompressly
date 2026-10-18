import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export type BlobKind = "sfx" | "tts" | "session" | "import" | "cue" | "variant";

export interface StoredBlob {
  id: string;
  blob: Blob;
  mime: string;
  kind: BlobKind;
  label: string;
  createdAt: number;
  bytes: number;
  meta?: Record<string, unknown>;
}

interface DecompresslyDB extends DBSchema {
  kv: { key: string; value: unknown };
  blobs: { key: string; value: StoredBlob; indexes: { kind: string } };
}

let dbPromise: Promise<IDBPDatabase<DecompresslyDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<DecompresslyDB>("decompressly", 1, {
      upgrade(db) {
        db.createObjectStore("kv");
        const blobs = db.createObjectStore("blobs", { keyPath: "id" });
        blobs.createIndex("kind", "kind");
      },
    });
  }
  return dbPromise;
}

export async function kvGet<T>(key: string): Promise<T | undefined> {
  return (await (await getDB()).get("kv", key)) as T | undefined;
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  await (await getDB()).put("kv", value, key);
}

export function newId(prefix = "id"): string {
  const rnd = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${rnd}`;
}

export async function putBlob(blob: Blob, kind: BlobKind, label: string, meta?: Record<string, unknown>, id = newId(kind)): Promise<string> {
  // Safari can lose Blob payloads stored in IDB when the source was a fetch stream; store an ArrayBuffer-backed copy.
  const buf = await blob.arrayBuffer();
  const copy = new Blob([buf], { type: blob.type || "audio/mpeg" });
  const rec: StoredBlob = { id, blob: copy, mime: copy.type, kind, label, createdAt: Date.now(), bytes: buf.byteLength, meta };
  await (await getDB()).put("blobs", rec);
  return id;
}

export async function getBlob(id: string): Promise<StoredBlob | undefined> {
  return (await getDB()).get("blobs", id);
}

export async function deleteBlob(id: string): Promise<void> {
  await (await getDB()).delete("blobs", id);
}

export async function listBlobs(): Promise<StoredBlob[]> {
  return (await getDB()).getAll("blobs");
}

export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true;
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {
    /* ignore */
  }
  return false;
}

export async function storageEstimate(): Promise<{ usage: number; quota: number; persisted: boolean } | null> {
  try {
    if (!navigator.storage?.estimate) return null;
    const e = await navigator.storage.estimate();
    const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;
    return { usage: e.usage ?? 0, quota: e.quota ?? 0, persisted };
  } catch {
    return null;
  }
}

const urlCache = new Map<string, string>();

/** Object URL for a stored blob, cached for the session. */
export async function blobUrl(id: string): Promise<string | null> {
  const cached = urlCache.get(id);
  if (cached) return cached;
  const rec = await getBlob(id);
  if (!rec) return null;
  const url = URL.createObjectURL(rec.blob);
  urlCache.set(id, url);
  return url;
}

export function forgetBlobUrl(id: string) {
  const u = urlCache.get(id);
  if (u) URL.revokeObjectURL(u);
  urlCache.delete(id);
}
