/**
 * Persist job search results so they stay when user navigates away.
 * Valid for 7 days. New search overwrites cache.
 */

const CACHE_KEY = 'jobSearchResultsCache';
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function getJobSearchCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.savedAt) return null;
    if (Date.now() - data.savedAt > TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function setJobSearchCache(payload) {
  try {
    const data = {
      ...payload,
      savedAt: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to cache job search results:', e);
  }
}

export function clearJobSearchCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (e) {
    console.warn('Failed to clear job search cache:', e);
  }
}
