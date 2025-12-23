// Centralized Cache Manager for IdeaGraph
// Consolidates all localStorage caching strategies into a single, unified interface

import type { SemanticScholarPaper } from '../api/semanticScholar';

// =============================================================================
// Cache Configuration
// =============================================================================

export interface CacheConfig {
  /** Time-to-live in milliseconds */
  ttlMs: number;
  /** Maximum number of entries */
  maxEntries: number;
  /** Storage key prefix */
  keyPrefix: string;
}

export interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
  accessCount: number;
  lastAccessedAt: number;
}

export interface CacheStats {
  entryCount: number;
  totalSizeBytes: number;
  oldestEntryAge: number; // in ms
  newestEntryAge: number; // in ms
  hitRate: number; // 0-1
}

// Default cache configurations for different data types
export const CACHE_CONFIGS = {
  similarity: {
    ttlMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 100,
    keyPrefix: 'ideagraph_similarity_cache',
  },
  embedding: {
    ttlMs: 30 * 24 * 60 * 60 * 1000, // 30 days (embeddings rarely change)
    maxEntries: 200,
    keyPrefix: 'ideagraph_embedding_cache',
  },
  paperMetadata: {
    ttlMs: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 500,
    keyPrefix: 'ideagraph_paper_cache',
  },
  searchResults: {
    ttlMs: 60 * 60 * 1000, // 1 hour
    maxEntries: 50,
    keyPrefix: 'ideagraph_search_cache',
  },
  aiSuggestions: {
    ttlMs: 4 * 60 * 60 * 1000, // 4 hours
    maxEntries: 100,
    keyPrefix: 'ideagraph_ai_cache',
  },
} as const;

export type CacheType = keyof typeof CACHE_CONFIGS;

// =============================================================================
// Cache Statistics Tracking
// =============================================================================

interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  lastCleanup: number;
}

const METRICS_KEY = 'ideagraph_cache_metrics';

function loadMetrics(): Record<CacheType, CacheMetrics> {
  try {
    const stored = localStorage.getItem(METRICS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore errors
  }

  const defaultMetrics: CacheMetrics = { hits: 0, misses: 0, evictions: 0, lastCleanup: Date.now() };
  return {
    similarity: { ...defaultMetrics },
    embedding: { ...defaultMetrics },
    paperMetadata: { ...defaultMetrics },
    searchResults: { ...defaultMetrics },
    aiSuggestions: { ...defaultMetrics },
  };
}

function saveMetrics(metrics: Record<CacheType, CacheMetrics>): void {
  try {
    localStorage.setItem(METRICS_KEY, JSON.stringify(metrics));
  } catch {
    // Ignore storage errors
  }
}

// =============================================================================
// Core Cache Manager Class
// =============================================================================

class CacheManager {
  private metrics = loadMetrics();

  /**
   * Get a value from cache
   */
  get<T>(cacheType: CacheType, key: string): T | null {
    const config = CACHE_CONFIGS[cacheType];
    const storageKey = `${config.keyPrefix}_${key}`;

    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) {
        this.recordMiss(cacheType);
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(stored);
      const now = Date.now();

      // Check if expired
      if (now > entry.expiresAt) {
        localStorage.removeItem(storageKey);
        this.recordMiss(cacheType);
        return null;
      }

      // Update access stats
      entry.accessCount++;
      entry.lastAccessedAt = now;
      localStorage.setItem(storageKey, JSON.stringify(entry));

      this.recordHit(cacheType);
      return entry.data;
    } catch {
      this.recordMiss(cacheType);
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  set<T>(cacheType: CacheType, key: string, data: T): boolean {
    const config = CACHE_CONFIGS[cacheType];
    const storageKey = `${config.keyPrefix}_${key}`;
    const now = Date.now();

    const entry: CacheEntry<T> = {
      data,
      cachedAt: now,
      expiresAt: now + config.ttlMs,
      accessCount: 1,
      lastAccessedAt: now,
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(entry));

      // Trigger cleanup if we might be over the limit
      this.maybeCleanup(cacheType);
      return true;
    } catch (e) {
      // Storage might be full, try cleanup and retry
      console.warn(`[CacheManager] Storage error for ${cacheType}, attempting cleanup:`, e);
      this.cleanup(cacheType, true); // Force aggressive cleanup

      try {
        localStorage.setItem(storageKey, JSON.stringify(entry));
        return true;
      } catch {
        console.error(`[CacheManager] Failed to cache ${key} even after cleanup`);
        return false;
      }
    }
  }

  /**
   * Remove a specific entry from cache
   */
  remove(cacheType: CacheType, key: string): void {
    const config = CACHE_CONFIGS[cacheType];
    const storageKey = `${config.keyPrefix}_${key}`;
    localStorage.removeItem(storageKey);
  }

  /**
   * Clear all entries for a specific cache type
   */
  clear(cacheType: CacheType): number {
    const config = CACHE_CONFIGS[cacheType];
    let cleared = 0;

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(config.keyPrefix)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      localStorage.removeItem(key);
      cleared++;
    }

    console.log(`[CacheManager] Cleared ${cleared} entries from ${cacheType} cache`);
    return cleared;
  }

  /**
   * Clear all caches
   */
  clearAll(): number {
    let totalCleared = 0;
    for (const cacheType of Object.keys(CACHE_CONFIGS) as CacheType[]) {
      totalCleared += this.clear(cacheType);
    }

    // Also clear metrics
    localStorage.removeItem(METRICS_KEY);
    this.metrics = loadMetrics();

    return totalCleared;
  }

  /**
   * Get statistics for a specific cache type
   */
  getStats(cacheType: CacheType): CacheStats {
    const config = CACHE_CONFIGS[cacheType];
    const now = Date.now();

    let entryCount = 0;
    let totalSizeBytes = 0;
    let oldestAge = 0;
    let newestAge = Infinity;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(config.keyPrefix)) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            entryCount++;
            totalSizeBytes += key.length + value.length;

            const entry: CacheEntry<unknown> = JSON.parse(value);
            const age = now - entry.cachedAt;
            oldestAge = Math.max(oldestAge, age);
            newestAge = Math.min(newestAge, age);
          }
        } catch {
          // Skip invalid entries
        }
      }
    }

    const metrics = this.metrics[cacheType];
    const totalRequests = metrics.hits + metrics.misses;

    return {
      entryCount,
      totalSizeBytes,
      oldestEntryAge: oldestAge,
      newestEntryAge: newestAge === Infinity ? 0 : newestAge,
      hitRate: totalRequests > 0 ? metrics.hits / totalRequests : 0,
    };
  }

  /**
   * Get combined statistics for all caches
   */
  getAllStats(): Record<CacheType, CacheStats> {
    const stats: Partial<Record<CacheType, CacheStats>> = {};
    for (const cacheType of Object.keys(CACHE_CONFIGS) as CacheType[]) {
      stats[cacheType] = this.getStats(cacheType);
    }
    return stats as Record<CacheType, CacheStats>;
  }

  /**
   * Perform cleanup on a specific cache type
   */
  cleanup(cacheType: CacheType, aggressive = false): number {
    const config = CACHE_CONFIGS[cacheType];
    const now = Date.now();

    // Collect all entries for this cache type
    const entries: Array<{ key: string; entry: CacheEntry<unknown> }> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(config.keyPrefix)) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const entry: CacheEntry<unknown> = JSON.parse(value);
            entries.push({ key, entry });
          }
        } catch {
          // Remove invalid entries
          if (key) localStorage.removeItem(key);
        }
      }
    }

    let removed = 0;

    // Remove expired entries
    for (const { key, entry } of entries) {
      if (now > entry.expiresAt) {
        localStorage.removeItem(key);
        removed++;
      }
    }

    // If still over limit or aggressive cleanup requested, remove LRU entries
    const remainingEntries = entries.filter(e => now <= e.entry.expiresAt);
    const targetCount = aggressive ? Math.floor(config.maxEntries * 0.5) : config.maxEntries;

    if (remainingEntries.length > targetCount) {
      // Sort by last access time (oldest first)
      remainingEntries.sort((a, b) => a.entry.lastAccessedAt - b.entry.lastAccessedAt);

      const toRemove = remainingEntries.slice(0, remainingEntries.length - targetCount);
      for (const { key } of toRemove) {
        localStorage.removeItem(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`[CacheManager] Cleaned up ${removed} entries from ${cacheType} cache`);
      this.metrics[cacheType].evictions += removed;
      this.metrics[cacheType].lastCleanup = now;
      saveMetrics(this.metrics);
    }

    return removed;
  }

  /**
   * Perform cleanup on all caches
   */
  cleanupAll(): number {
    let totalRemoved = 0;
    for (const cacheType of Object.keys(CACHE_CONFIGS) as CacheType[]) {
      totalRemoved += this.cleanup(cacheType);
    }
    return totalRemoved;
  }

  /**
   * Maybe trigger cleanup based on last cleanup time
   */
  private maybeCleanup(cacheType: CacheType): void {
    const metrics = this.metrics[cacheType];
    const timeSinceCleanup = Date.now() - metrics.lastCleanup;

    // Cleanup every hour at most
    if (timeSinceCleanup > 60 * 60 * 1000) {
      this.cleanup(cacheType);
    }
  }

  private recordHit(cacheType: CacheType): void {
    this.metrics[cacheType].hits++;
    saveMetrics(this.metrics);
  }

  private recordMiss(cacheType: CacheType): void {
    this.metrics[cacheType].misses++;
    saveMetrics(this.metrics);
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const cacheManager = new CacheManager();

// =============================================================================
// Specialized Cache Functions (for backwards compatibility and convenience)
// =============================================================================

/**
 * Cache similar papers for a given paper ID
 */
export function cacheSimilarPapers(paperId: string, papers: SemanticScholarPaper[]): boolean {
  return cacheManager.set('similarity', paperId, papers);
}

/**
 * Get cached similar papers
 */
export function getCachedSimilarPapers(paperId: string): SemanticScholarPaper[] | null {
  return cacheManager.get<SemanticScholarPaper[]>('similarity', paperId);
}

/**
 * Cache paper embedding
 */
export function cacheEmbedding(paperId: string, embedding: number[]): boolean {
  return cacheManager.set('embedding', paperId, embedding);
}

/**
 * Get cached embedding
 */
export function getCachedEmbedding(paperId: string): number[] | null {
  return cacheManager.get<number[]>('embedding', paperId);
}

/**
 * Cache paper metadata
 */
export function cachePaperMetadata(paperId: string, paper: SemanticScholarPaper): boolean {
  return cacheManager.set('paperMetadata', paperId, paper);
}

/**
 * Get cached paper metadata
 */
export function getCachedPaperMetadata(paperId: string): SemanticScholarPaper | null {
  return cacheManager.get<SemanticScholarPaper>('paperMetadata', paperId);
}

/**
 * Cache search results
 */
export function cacheSearchResults(query: string, results: SemanticScholarPaper[]): boolean {
  // Normalize query for consistent caching
  const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, ' ');
  return cacheManager.set('searchResults', normalizedQuery, results);
}

/**
 * Get cached search results
 */
export function getCachedSearchResults(query: string): SemanticScholarPaper[] | null {
  const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, ' ');
  return cacheManager.get<SemanticScholarPaper[]>('searchResults', normalizedQuery);
}

// =============================================================================
// Exports
// =============================================================================

export default cacheManager;
