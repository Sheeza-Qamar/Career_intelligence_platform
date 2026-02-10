/**
 * Persist latest Job Fitness analysis so it survives navigation.
 * Reset when: new CV upload, or after 7 days (user re-analyzes then).
 */

const CACHE_KEY = 'latestJobFitnessAnalysis';
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function getCachedAnalysis(resumeId) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached?.analysisId || cached.resumeId == null) return null;
    if (String(cached.resumeId) !== String(resumeId)) return null;
    const savedAt = cached.savedAt ? new Date(cached.savedAt).getTime() : 0;
    if (Date.now() - savedAt > TTL_MS) return null;
    return { analysisId: cached.analysisId, resumeId: cached.resumeId };
  } catch {
    return null;
  }
}

export function setCachedAnalysis(analysisId, resumeId) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        analysisId,
        resumeId,
        savedAt: new Date().toISOString(),
      })
    );
  } catch (e) {
    console.warn('Failed to cache job fitness analysis:', e);
  }
}

export function clearCachedAnalysis() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (e) {
    console.warn('Failed to clear job fitness analysis cache:', e);
  }
}
