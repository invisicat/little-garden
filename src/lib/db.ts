/* ============================================================
   db.ts — local-first storage. Everything lives on this device.
   IndexedDB holds entries and their photos (as Blobs).
   Nothing here ever leaves the phone.
   ============================================================ */

import type { MoodKey, WeatherKey } from "./mood";

export type Entry = {
  date: string; // "YYYY-MM-DD" — the primary key, one entry per day
  text: string;
  mood: MoodKey;
  goodThing: string;
  weather: WeatherKey | null;
  photos: Blob[];
  createdAt: number;
  updatedAt: number;
};

const DB_NAME = "little-garden";
const STORE = "entries";
const VERSION = 1;

let dbp: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "date" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export async function getAllEntries(): Promise<Entry[]> {
  const all = await tx<Entry[]>("readonly", (s) => s.getAll());
  return all.sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
}

export async function getEntry(date: string): Promise<Entry | undefined> {
  return tx<Entry | undefined>("readonly", (s) => s.get(date));
}

export async function putEntry(entry: Entry): Promise<void> {
  await tx("readwrite", (s) => s.put(entry));
}

export async function deleteEntry(date: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(date));
}

/* ============================================================
   Small key/value prefs in localStorage (name, reminder time…).
   ============================================================ */
export type ThemePref = "day" | "night" | "auto";

export type Prefs = {
  name: string;
  reminderTime: string; // "HH:MM" local
  remindersOn: boolean;
  theme: ThemePref;
};

const PREFS_KEY = "little-garden-prefs";

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...defaultPrefs(), ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return defaultPrefs();
}

export function savePrefs(p: Prefs): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(p));
}

function defaultPrefs(): Prefs {
  return { name: "", reminderTime: "20:00", remindersOn: false, theme: "auto" };
}

/** Object URLs for a set of blobs, with a disposer. */
export function photoUrls(photos: Blob[]): { urls: string[]; revoke: () => void } {
  const urls = photos.map((b) => URL.createObjectURL(b));
  return { urls, revoke: () => urls.forEach((u) => URL.revokeObjectURL(u)) };
}
