// Retraction Checking Service
// Checks papers for retraction status during intake and periodically
// Uses OpenAlex API for retraction data

import { checkRetraction as openAlexCheck, getWorkByDOI } from '../api/openAlex';
import type { Paper } from '../../types';

/**
 * Retraction check result
 */
export interface RetractionCheckResult {
  paperId: string;
  doi: string;
  isRetracted: boolean;
  wasRetracted: boolean; // True if status changed from non-retracted to retracted
  checkedAt: string;
  source: 'openalex' | 'crossref' | 'cache';
  details?: {
    retractionNotice?: string;
    retractionDate?: string;
    reason?: string;
  };
}

/**
 * Batch check result
 */
export interface BatchRetractionResult {
  checked: number;
  retracted: RetractionCheckResult[];
  failed: string[]; // DOIs that couldn't be checked
  duration: number; // ms
}

// Cache retraction checks to avoid repeated API calls
const RETRACTION_CACHE_KEY = 'ideagraph_retraction_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface RetractionCacheEntry {
  doi: string;
  isRetracted: boolean;
  checkedAt: string;
}

interface RetractionCache {
  entries: RetractionCacheEntry[];
  version: number;
}

/**
 * Get retraction cache
 */
function getCache(): RetractionCache {
  try {
    const cached = localStorage.getItem(RETRACTION_CACHE_KEY);
    if (!cached) return { entries: [], version: 1 };
    return JSON.parse(cached);
  } catch {
    return { entries: [], version: 1 };
  }
}

/**
 * Save to cache
 */
function saveCache(cache: RetractionCache): void {
  try {
    // Limit cache size
    if (cache.entries.length > 500) {
      cache.entries = cache.entries
        .sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime())
        .slice(0, 500);
    }
    localStorage.setItem(RETRACTION_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('[RetractionCheck] Failed to save cache:', e);
  }
}

/**
 * Get cached result if fresh
 */
function getCached(doi: string): RetractionCacheEntry | null {
  const cache = getCache();
  const entry = cache.entries.find(e => e.doi.toLowerCase() === doi.toLowerCase());

  if (!entry) return null;

  // Check if expired
  const age = Date.now() - new Date(entry.checkedAt).getTime();
  if (age > CACHE_TTL_MS) {
    return null;
  }

  return entry;
}

/**
 * Update cache with new result
 */
function updateCache(doi: string, isRetracted: boolean): void {
  const cache = getCache();

  // Remove old entry if exists
  cache.entries = cache.entries.filter(e => e.doi.toLowerCase() !== doi.toLowerCase());

  // Add new entry
  cache.entries.push({
    doi: doi.toLowerCase(),
    isRetracted,
    checkedAt: new Date().toISOString(),
  });

  saveCache(cache);
}

/**
 * Check a single paper for retraction
 */
export async function checkPaperRetraction(
  doi: string,
  options: { skipCache?: boolean } = {}
): Promise<RetractionCheckResult | null> {
  const { skipCache = false } = options;

  if (!doi) {
    return null;
  }

  // Check cache first
  if (!skipCache) {
    const cached = getCached(doi);
    if (cached) {
      return {
        paperId: '',
        doi,
        isRetracted: cached.isRetracted,
        wasRetracted: false,
        checkedAt: cached.checkedAt,
        source: 'cache',
      };
    }
  }

  // Query OpenAlex
  const result = await openAlexCheck(doi);

  if (!result) {
    console.warn('[RetractionCheck] Could not check DOI:', doi);
    return null;
  }

  // Update cache
  updateCache(doi, result.isRetracted);

  return {
    paperId: '',
    doi,
    isRetracted: result.isRetracted,
    wasRetracted: false,
    checkedAt: result.checkedAt,
    source: result.source,
  };
}

/**
 * Check multiple papers for retraction in batch
 */
export async function checkPapersRetraction(
  papers: Paper[],
  options: {
    skipCache?: boolean;
    onProgress?: (checked: number, total: number) => void;
  } = {}
): Promise<BatchRetractionResult> {
  const { skipCache = false, onProgress } = options;
  const startTime = Date.now();

  const papersWithDOI = papers.filter(p => p.doi);
  const results: RetractionCheckResult[] = [];
  const failed: string[] = [];

  for (let i = 0; i < papersWithDOI.length; i++) {
    const paper = papersWithDOI[i];

    try {
      const result = await checkPaperRetraction(paper.doi!, { skipCache });

      if (result) {
        result.paperId = paper.id;
        // wasRetracted would require tracking previous state, which we don't have
        // For now, just mark it as a new finding
        result.wasRetracted = result.isRetracted;

        if (result.isRetracted) {
          results.push(result);
        }
      } else {
        failed.push(paper.doi!);
      }
    } catch (error) {
      console.warn('[RetractionCheck] Failed to check:', paper.doi, error);
      failed.push(paper.doi!);
    }

    onProgress?.(i + 1, papersWithDOI.length);

    // Small delay to be nice to API
    if (i < papersWithDOI.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return {
    checked: papersWithDOI.length - failed.length,
    retracted: results,
    failed,
    duration: Date.now() - startTime,
  };
}

/**
 * Check a new paper during intake (with full details from OpenAlex)
 */
export async function checkIntakePaper(params: {
  doi: string;
  title: string;
}): Promise<{
  isRetracted: boolean;
  warning: string | null;
  details: {
    citationCount?: number;
    isOpenAccess?: boolean;
    concepts?: string[];
  } | null;
}> {
  const { doi } = params;

  if (!doi) {
    return {
      isRetracted: false,
      warning: null,
      details: null,
    };
  }

  try {
    const work = await getWorkByDOI(doi);

    if (!work) {
      return {
        isRetracted: false,
        warning: null,
        details: null,
      };
    }

    // Check for retraction
    if (work.is_retracted) {
      return {
        isRetracted: true,
        warning: `⚠️ This paper has been RETRACTED. Adding retracted papers may undermine your thesis.`,
        details: {
          citationCount: work.cited_by_count,
          isOpenAccess: work.is_oa,
          concepts: work.concepts.slice(0, 5).map(c => c.display_name),
        },
      };
    }

    // Return enriched data
    return {
      isRetracted: false,
      warning: null,
      details: {
        citationCount: work.cited_by_count,
        isOpenAccess: work.is_oa,
        concepts: work.concepts.slice(0, 5).map(c => c.display_name),
      },
    };
  } catch (error) {
    console.warn('[RetractionCheck] Intake check failed:', error);
    return {
      isRetracted: false,
      warning: null,
      details: null,
    };
  }
}

/**
 * Get retraction check statistics
 */
export function getRetractionCheckStats(): {
  cacheEntries: number;
  retractedCount: number;
  oldestCheckDays: number;
} {
  const cache = getCache();
  const entries = cache.entries;

  if (entries.length === 0) {
    return { cacheEntries: 0, retractedCount: 0, oldestCheckDays: 0 };
  }

  const retracted = entries.filter(e => e.isRetracted).length;
  const oldest = entries.reduce((min, e) => {
    const time = new Date(e.checkedAt).getTime();
    return time < min ? time : min;
  }, Date.now());

  return {
    cacheEntries: entries.length,
    retractedCount: retracted,
    oldestCheckDays: Math.round((Date.now() - oldest) / (24 * 60 * 60 * 1000)),
  };
}

/**
 * Clear retraction cache
 */
export function clearRetractionCache(): void {
  localStorage.removeItem(RETRACTION_CACHE_KEY);
  console.log('[RetractionCheck] Cache cleared');
}

/**
 * Schedule periodic retraction checks for a collection
 * Returns an interval ID that can be cleared with clearInterval
 */
export function scheduleRetractionChecks(
  getPapers: () => Paper[],
  onRetractionsFound: (results: RetractionCheckResult[]) => void,
  intervalMs: number = 24 * 60 * 60 * 1000 // Default: daily
): number {
  const check = async () => {
    console.log('[RetractionCheck] Running scheduled check...');
    const papers = getPapers();
    const result = await checkPapersRetraction(papers, { skipCache: true });

    if (result.retracted.length > 0) {
      console.log('[RetractionCheck] Found', result.retracted.length, 'retracted papers');
      onRetractionsFound(result.retracted);
    }
  };

  // Run initial check
  check();

  // Schedule periodic checks
  return window.setInterval(check, intervalMs);
}
