/**
 * Safe browser-local storage for user convenience features (Favourites & Recents).
 *
 * Privacy Guarantees:
 * - Stores ONLY canonical calculator slugs (strings).
 * - NEVER stores user inputs, calculated values, timestamps, or personal data.
 * - Handles missing localStorage, QuotaExceededError, SSR, and corrupted JSON gracefully.
 */

import { useSyncExternalStore } from "react";

const FAVOURITES_KEY = "ukcalc_favourites";
const RECENTS_KEY = "ukcalc_recents";
const MAX_RECENTS = 8;

export const STORAGE_EVENT_NAME = "ukcalc_storage_change";

// In-memory cache for stable object references in useSyncExternalStore
let cachedFavouritesRaw: string | null = null;
let cachedFavourites: string[] = [];

let cachedRecentsRaw: string | null = null;
let cachedRecents: string[] = [];

const emptyArray: string[] = [];

function safeGetItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, value);
    window.dispatchEvent(new Event(STORAGE_EVENT_NAME));
    return true;
  } catch {
    return false;
  }
}

function parseSlugs(jsonStr: string | null): string[] {
  if (!jsonStr) return [];
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    }
    return [];
  } catch {
    return [];
  }
}

export function getFavourites(): string[] {
  const raw = safeGetItem(FAVOURITES_KEY);
  if (raw !== cachedFavouritesRaw) {
    cachedFavouritesRaw = raw;
    cachedFavourites = parseSlugs(raw);
  }
  return cachedFavourites;
}

export function isFavourite(slug: string): boolean {
  const norm = slug.trim().toLowerCase();
  return getFavourites().some(s => s.toLowerCase() === norm);
}

export function toggleFavourite(slug: string): boolean {
  const norm = slug.trim().toLowerCase();
  if (!norm) return false;
  const current = getFavourites();
  const index = current.findIndex(s => s.toLowerCase() === norm);
  let next: string[];
  let newState: boolean;

  if (index >= 0) {
    next = current.filter((_, i) => i !== index);
    newState = false;
  } else {
    next = [norm, ...current];
    newState = true;
  }

  safeSetItem(FAVOURITES_KEY, JSON.stringify(next));
  return newState;
}

export function addFavourite(slug: string): void {
  const norm = slug.trim().toLowerCase();
  if (!norm) return;
  const current = getFavourites();
  if (!current.some(s => s.toLowerCase() === norm)) {
    safeSetItem(FAVOURITES_KEY, JSON.stringify([norm, ...current]));
  }
}

export function removeFavourite(slug: string): void {
  const norm = slug.trim().toLowerCase();
  const current = getFavourites();
  const next = current.filter(s => s.toLowerCase() !== norm);
  safeSetItem(FAVOURITES_KEY, JSON.stringify(next));
}

export function clearFavourites(): void {
  safeSetItem(FAVOURITES_KEY, JSON.stringify([]));
}

export function getRecents(): string[] {
  const raw = safeGetItem(RECENTS_KEY);
  if (raw !== cachedRecentsRaw) {
    cachedRecentsRaw = raw;
    cachedRecents = parseSlugs(raw);
  }
  return cachedRecents;
}

export function addRecent(slug: string): void {
  const norm = slug.trim().toLowerCase();
  if (!norm) return;
  const current = getRecents().filter(s => s.toLowerCase() !== norm);
  const next = [norm, ...current].slice(0, MAX_RECENTS);
  safeSetItem(RECENTS_KEY, JSON.stringify(next));
}

export function clearRecents(): void {
  safeSetItem(RECENTS_KEY, JSON.stringify([]));
}

export function subscribeStorage(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(STORAGE_EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(STORAGE_EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useFavourites(): string[] {
  return useSyncExternalStore(
    subscribeStorage,
    getFavourites,
    () => emptyArray
  );
}

export function useRecents(): string[] {
  return useSyncExternalStore(
    subscribeStorage,
    getRecents,
    () => emptyArray
  );
}

export function useIsFavourite(slug: string): boolean {
  const favourites = useFavourites();
  const norm = slug.trim().toLowerCase();
  return favourites.some(s => s.toLowerCase() === norm);
}
