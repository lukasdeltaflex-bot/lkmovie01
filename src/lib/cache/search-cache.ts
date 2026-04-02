"use client";

import { SearchResponse } from "../youtube/search-videos";

const CACHE_NAME = "lkmovie_search_cache";
const CACHE_EXPIRATION_MS = 3600000; // 1 hora

interface CacheEntry {
  data: SearchResponse;
  timestamp: number;
}

export const getCachedSearch = (query: string, filters: any): SearchResponse | null => {
  if (typeof window === 'undefined') return null;
  const key = `${query}_${JSON.stringify(filters)}`;
  const cached = localStorage.getItem(`${CACHE_NAME}_${key}`);
  
  if (cached) {
    const entry: CacheEntry = JSON.parse(cached);
    if (Date.now() - entry.timestamp < CACHE_EXPIRATION_MS) {
      return entry.data;
    }
    localStorage.removeItem(`${CACHE_NAME}_${key}`);
  }
  return null;
};

export const saveSearchToCache = (query: string, filters: any, data: SearchResponse) => {
  if (typeof window === 'undefined') return;
  const key = `${query}_${JSON.stringify(filters)}`;
  const entry: CacheEntry = {
    data,
    timestamp: Date.now()
  };
  localStorage.setItem(`${CACHE_NAME}_${key}`, JSON.stringify(entry));
};
