// Semantic Scholar API Service
// Docs: https://api.semanticscholar.org/api-docs

import {
  cacheManager,
  getCachedSimilarPapers as getCachedSimilar,
  cacheSimilarPapers as cacheSimilar,
  cacheEmbedding as cacheEmbed,
  getCachedEmbedding as getCachedEmbed,
} from '../cache';

export interface SemanticScholarAuthor {
  name: string;
  authorId: string;
}

export interface SemanticScholarPaper {
  paperId: string;
  title: string;
  authors: SemanticScholarAuthor[];
  year: number | null;
  venue: string | null;
  abstract: string | null;
  citationCount: number | null;
  openAccessPdf: { url: string } | null;
  externalIds: {
    DOI?: string;
    ArXiv?: string;
    PubMed?: string;
  };
  tldr?: { text: string } | null;
  // Citation network fields
  references?: SemanticScholarPaper[];
  citations?: SemanticScholarPaper[];
  referenceCount?: number;
  fieldsOfStudy?: string[];
  publicationTypes?: string[];
  publicationDate?: string;
  // SPECTER embedding (768-dimensional vector)
  embedding?: {
    model: string;
    vector: number[];
  };
}

export interface SearchFilters {
  year?: string; // e.g., "2020-2024" or "2023"
  minCitationCount?: number;
  openAccessOnly?: boolean;
  fieldsOfStudy?: string[];
  publicationTypes?: string[]; // Review, JournalArticle, Conference, etc.
}

export interface SearchResult {
  papers: SemanticScholarPaper[];
  total: number;
  offset: number;
  next?: number;
}

// In development, use Vite proxy to avoid CORS issues
// In production, use the direct API URL (will need a backend proxy or CORS-enabled deployment)
const isDev = import.meta.env.DEV;
const API_BASE = isDev ? '/api/semanticscholar' : 'https://api.semanticscholar.org';
const BASE_URL = `${API_BASE}/graph/v1`;
const RECOMMENDATIONS_BASE_URL = `${API_BASE}/recommendations/v1/papers`;
const FIELDS = 'paperId,title,authors,year,venue,abstract,citationCount,openAccessPdf,externalIds,tldr,fieldsOfStudy,publicationTypes,publicationDate';

// Fields including SPECTER embedding (768-dimensional vector)
const FIELDS_WITH_EMBEDDING = FIELDS + ',embedding.specter_v2';

// Fields to request for nested citation/reference objects
// These need to be prefixed with citations. or references.
// Note: Some fields like 'abstract' and 'venue' can cause 400 errors in nested contexts
// Using minimal fields that are reliably available
const CITATION_FIELDS = 'paperId,title,authors,year,citationCount';

// ============================================================================
// Similarity Cache - Now using centralized cache manager
// Legacy functions provided for backwards compatibility
// ============================================================================

// Local wrapper functions that delegate to centralized cache manager
function getCachedSimilarPapers(paperId: string): SemanticScholarPaper[] | null {
  const result = getCachedSimilar(paperId);
  if (result) {
    console.log('[SimilarityCache] Cache hit for:', paperId);
  }
  return result;
}

function cacheSimilarPapers(paperId: string, papers: SemanticScholarPaper[]): void {
  cacheSimilar(paperId, papers);
  console.log('[SimilarityCache] Cached', papers.length, 'papers for:', paperId);
}

// Export for manual cache management
export function clearSimilarityCache(): void {
  cacheManager.clear('similarity');
  console.log('[SimilarityCache] Cache cleared');
}

export function getSimilarityCacheStats(): { entries: number; oldestDays: number; newestDays: number } {
  const stats = cacheManager.getStats('similarity');
  return {
    entries: stats.entryCount,
    oldestDays: Math.round(stats.oldestEntryAge / (24 * 60 * 60 * 1000)),
    newestDays: Math.round(stats.newestEntryAge / (24 * 60 * 60 * 1000)),
  };
}

// ============================================================================

// Rate limiting helper - Semantic Scholar allows 100 req/sec with API key, 1 req/sec without
// Using conservative limits to avoid 429 errors
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 150; // 150ms between requests (safer than 100ms)

// Exponential backoff for rate limit errors
let backoffMultiplier = 1;
const MAX_BACKOFF = 8;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const interval = MIN_REQUEST_INTERVAL * backoffMultiplier;
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < interval) {
    await new Promise(resolve => setTimeout(resolve, interval - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();
  const response = await fetch(url);

  // Handle rate limiting with exponential backoff
  if (response.status === 429) {
    backoffMultiplier = Math.min(backoffMultiplier * 2, MAX_BACKOFF);
    console.warn(`[rateLimitedFetch] Rate limited, increasing backoff to ${backoffMultiplier}x`);
  } else if (response.ok) {
    // Gradually reduce backoff on successful requests
    backoffMultiplier = Math.max(1, backoffMultiplier * 0.8);
  }

  return response;
}

export async function fetchPaperByDOI(doi: string): Promise<SemanticScholarPaper> {
  const response = await rateLimitedFetch(
    `${BASE_URL}/paper/DOI:${encodeURIComponent(doi)}?fields=${FIELDS}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Paper not found');
    }
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function fetchPaperById(paperId: string): Promise<SemanticScholarPaper> {
  const response = await rateLimitedFetch(
    `${BASE_URL}/paper/${encodeURIComponent(paperId)}?fields=${FIELDS}`
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// Enhanced search with filters and pagination
export async function searchPapers(
  query: string,
  options: {
    limit?: number;
    offset?: number;
    filters?: SearchFilters;
  } = {}
): Promise<SearchResult> {
  const { limit = 20, offset = 0, filters = {} } = options;

  // Build query parameters
  const params = new URLSearchParams({
    query: query,
    limit: limit.toString(),
    offset: offset.toString(),
    fields: FIELDS,
  });

  // Add year filter
  if (filters.year) {
    params.append('year', filters.year);
  }

  // Add minimum citation count
  if (filters.minCitationCount !== undefined) {
    params.append('minCitationCount', filters.minCitationCount.toString());
  }

  // Add open access filter
  if (filters.openAccessOnly) {
    params.append('openAccessPdf', '');
  }

  // Add fields of study
  if (filters.fieldsOfStudy && filters.fieldsOfStudy.length > 0) {
    params.append('fieldsOfStudy', filters.fieldsOfStudy.join(','));
  }

  // Add publication types
  if (filters.publicationTypes && filters.publicationTypes.length > 0) {
    params.append('publicationTypes', filters.publicationTypes.join(','));
  }

  const response = await rateLimitedFetch(
    `${BASE_URL}/paper/search?${params.toString()}`
  );

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    papers: data.data || [],
    total: data.total || 0,
    offset: data.offset || 0,
    next: data.next,
  };
}

// Bulk search - recommended for most use cases
export async function bulkSearchPapers(
  query: string,
  options: {
    limit?: number;
    offset?: number;
    filters?: SearchFilters;
  } = {}
): Promise<SearchResult> {
  const { limit = 100, offset = 0, filters = {} } = options;

  // Build query with advanced operators
  let enhancedQuery = query;

  // Add year filter using query syntax
  if (filters.year) {
    const yearMatch = filters.year.match(/^(\d{4})(?:-(\d{4}))?$/);
    if (yearMatch) {
      const startYear = yearMatch[1];
      const endYear = yearMatch[2] || startYear;
      enhancedQuery += ` year:${startYear}-${endYear}`;
    }
  }

  const params = new URLSearchParams({
    query: enhancedQuery,
    limit: Math.min(limit, 1000).toString(), // Max 1000 per request
    offset: offset.toString(),
    fields: FIELDS,
  });

  const response = await rateLimitedFetch(
    `${BASE_URL}/paper/bulk/search?${params.toString()}`
  );

  if (!response.ok) {
    // Fall back to regular search if bulk fails
    if (response.status === 400) {
      return searchPapers(query, options);
    }
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();

  // Apply client-side filters that bulk search doesn't support
  let papers = data.data || [];

  if (filters.minCitationCount !== undefined) {
    papers = papers.filter((p: SemanticScholarPaper) =>
      (p.citationCount || 0) >= filters.minCitationCount!
    );
  }

  if (filters.openAccessOnly) {
    papers = papers.filter((p: SemanticScholarPaper) => p.openAccessPdf !== null);
  }

  return {
    papers,
    total: data.total || papers.length,
    offset: data.offset || 0,
    next: data.next,
  };
}

// Fetch paper with citation network (references and citations)
export async function fetchPaperWithCitations(
  paperId: string,
  options: {
    includeReferences?: boolean;
    includeCitations?: boolean;
    limit?: number;
  } = {}
): Promise<SemanticScholarPaper> {
  const { includeReferences = true, includeCitations = true, limit = 50 } = options;

  // Build fields based on what we need
  let fields = FIELDS;
  if (includeReferences) {
    fields += `,references.paperId,references.title,references.authors,references.year,references.venue,references.citationCount,references.abstract,references.externalIds`;
  }
  if (includeCitations) {
    fields += `,citations.paperId,citations.title,citations.authors,citations.year,citations.venue,citations.citationCount,citations.abstract,citations.externalIds`;
  }
  fields += ',referenceCount';

  const response = await rateLimitedFetch(
    `${BASE_URL}/paper/${encodeURIComponent(paperId)}?fields=${fields}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// Get papers that cite a specific paper
export async function getCitingPapers(
  paperId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<SearchResult> {
  const { limit = 50, offset = 0 } = options;

  const response = await rateLimitedFetch(
    `${BASE_URL}/paper/${encodeURIComponent(paperId)}/citations?fields=${FIELDS}&limit=${limit}&offset=${offset}`
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    papers: (data.data || []).map((item: { citingPaper: SemanticScholarPaper }) => item.citingPaper),
    total: data.data?.length || 0,
    offset,
    next: data.next,
  };
}

// Get papers referenced by a specific paper
export async function getReferencedPapers(
  paperId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<SearchResult> {
  const { limit = 50, offset = 0 } = options;

  const response = await rateLimitedFetch(
    `${BASE_URL}/paper/${encodeURIComponent(paperId)}/references?fields=${FIELDS}&limit=${limit}&offset=${offset}`
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    papers: (data.data || []).map((item: { citedPaper: SemanticScholarPaper }) => item.citedPaper).filter(Boolean),
    total: data.data?.length || 0,
    offset,
    next: data.next,
  };
}

// Batch fetch multiple papers by ID
export async function fetchPapersBatch(paperIds: string[]): Promise<SemanticScholarPaper[]> {
  if (paperIds.length === 0) return [];

  // API supports up to 500 papers per batch
  const batchSize = 500;
  const results: SemanticScholarPaper[] = [];

  for (let i = 0; i < paperIds.length; i += batchSize) {
    const batch = paperIds.slice(i, i + batchSize);

    // Note: The batch endpoint requires POST with paper IDs in body
    // For now, we fetch papers individually as a fallback
    for (const paperId of batch) {
      try {
        const paper = await fetchPaperById(paperId);
        results.push(paper);
      } catch {
        // Skip papers that fail to fetch
      }
    }
  }

  return results;
}

// Get author's papers
export async function getAuthorPapers(
  authorId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<SearchResult> {
  const { limit = 50, offset = 0 } = options;

  const response = await rateLimitedFetch(
    `${BASE_URL}/author/${encodeURIComponent(authorId)}/papers?fields=${FIELDS}&limit=${limit}&offset=${offset}`
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    papers: data.data || [],
    total: data.data?.length || 0,
    offset,
    next: data.next,
  };
}

// Recommendation: Get similar papers based on a seed paper
// Uses the Semantic Scholar Recommendations API (separate from Graph API)
export async function getRecommendedPapers(
  paperId: string,
  options: { limit?: number } = {}
): Promise<SemanticScholarPaper[]> {
  const { limit = 20 } = options;

  console.log('[getRecommendedPapers] Fetching for paperId:', paperId);

  try {
    // Try the recommendations API first (uses RECOMMENDATIONS_BASE_URL which respects dev proxy)
    const url = `${RECOMMENDATIONS_BASE_URL}/forpaper/${encodeURIComponent(paperId)}?fields=${FIELDS}&limit=${limit}`;
    console.log('[getRecommendedPapers] URL:', url);
    const response = await rateLimitedFetch(url);
    console.log('[getRecommendedPapers] Response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('[getRecommendedPapers] Got', data.recommendedPapers?.length || 0, 'recommendations');
      return data.recommendedPapers || [];
    }

    // Handle rate limiting - wait and retry once
    if (response.status === 429) {
      console.warn('[getRecommendedPapers] Rate limited, waiting 2s before fallback...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // If recommendations API fails, fall back to citations + references
    console.warn('[getRecommendedPapers] Recommendations API not available (status:', response.status, '), falling back to citations/references');
    return await getFallbackSimilarPapers(paperId, limit);
  } catch (error) {
    console.warn('[getRecommendedPapers] Error fetching recommendations, trying fallback:', error);
    // Add a small delay before fallback to avoid immediate rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
    return await getFallbackSimilarPapers(paperId, limit);
  }
}

// Connected Papers-style similarity using co-citation and bibliographic coupling
// Algorithm based on: https://www.connectedpapers.com/about
//
// Two papers are similar if:
// 1. Co-citation: They are frequently cited together by other papers
// 2. Bibliographic coupling: They share many of the same references
//
// We use Jaccard-like similarity coefficients and combine scores
export async function getSimilarPapers(
  paperId: string,
  options: { limit?: number; skipCache?: boolean } = {}
): Promise<SemanticScholarPaper[]> {
  const { limit = 15, skipCache = false } = options;

  // Check cache first (unless explicitly skipped)
  if (!skipCache) {
    const cached = getCachedSimilarPapers(paperId);
    if (cached) {
      // Return cached results, respecting limit
      return cached.slice(0, limit);
    }
  }

  console.log('[getSimilarPapers] Building Connected Papers-style similarity graph for:', paperId);

  try {
    // Step 1: Get source paper's citations and references
    const citationFields = CITATION_FIELDS.split(',').map(f => `citations.${f}`).join(',');
    const referenceFields = CITATION_FIELDS.split(',').map(f => `references.${f}`).join(',');

    const url = `${BASE_URL}/paper/${encodeURIComponent(paperId)}?fields=${citationFields},${referenceFields}`;
    console.log('[getSimilarPapers] Fetching source paper network');

    const response = await rateLimitedFetch(url);
    if (!response.ok) {
      console.warn('[getSimilarPapers] Failed to fetch source paper, status:', response.status);
      return getRecommendedPapers(paperId, options);
    }

    const sourcePaper = await response.json();
    const sourceRefs = new Set((sourcePaper.references || []).map((r: SemanticScholarPaper) => r.paperId).filter(Boolean));
    const sourceCitedBy = new Set((sourcePaper.citations || []).map((c: SemanticScholarPaper) => c.paperId).filter(Boolean));

    console.log('[getSimilarPapers] Source has', sourceRefs.size, 'references and', sourceCitedBy.size, 'citations');

    // Collect all first-degree connected papers
    const allConnected: SemanticScholarPaper[] = [
      ...(sourcePaper.references || []),
      ...(sourcePaper.citations || []),
    ].filter((p: SemanticScholarPaper) => p && p.paperId);

    // Step 2: For better similarity, sample some references to get THEIR references
    // This enables bibliographic coupling (papers citing same sources)
    const refPaperIds = (sourcePaper.references || [])
      .filter((r: SemanticScholarPaper) => r?.paperId)
      .slice(0, 5) // Sample top 5 references to limit API calls
      .map((r: SemanticScholarPaper) => r.paperId);

    // Collect papers that share references with source (bibliographic coupling candidates)
    const bibliographicCouplingScores = new Map<string, number>();

    // For each reference, find other papers that also cite it (co-citations of the reference)
    for (const refId of refPaperIds) {
      try {
        const refUrl = `${BASE_URL}/paper/${encodeURIComponent(refId)}?fields=citations.paperId,citations.title,citations.authors,citations.year,citations.citationCount`;
        const refResponse = await rateLimitedFetch(refUrl);

        if (refResponse.ok) {
          const refData = await refResponse.json();
          const citingPapers = refData.citations || [];

          // Papers that cite the same reference as source = bibliographic coupling
          for (const citingPaper of citingPapers) {
            if (citingPaper?.paperId && citingPaper.paperId !== paperId) {
              const current = bibliographicCouplingScores.get(citingPaper.paperId) || 0;
              bibliographicCouplingScores.set(citingPaper.paperId, current + 1);

              // Add to candidates if not already there
              if (!allConnected.find(p => p.paperId === citingPaper.paperId)) {
                allConnected.push(citingPaper);
              }
            }
          }
        }
      } catch {
        // Continue on error
      }
    }

    console.log('[getSimilarPapers] Found', bibliographicCouplingScores.size, 'papers with bibliographic coupling');

    // Step 3: Score all candidates using Connected Papers-style metrics
    const currentYear = new Date().getFullYear();
    const scoredCandidates = allConnected.map((paper: SemanticScholarPaper) => {
      let score = 0;

      // Bibliographic coupling score (shared references)
      // Higher weight - this is the core of Connected Papers algorithm
      const bcScore = bibliographicCouplingScores.get(paper.paperId) || 0;
      score += bcScore * 15; // Each shared reference adds significant similarity

      // Direct connection bonuses
      const isReference = sourceRefs.has(paper.paperId);
      const isCitation = sourceCitedBy.has(paper.paperId);

      if (isReference) score += 20; // Source cites this paper
      if (isCitation) score += 15; // This paper cites source
      if (isReference && isCitation) score += 25; // Bidirectional = very strong

      // Citation count (log scale, importance proxy)
      score += Math.log10((paper.citationCount || 0) + 1) * 5;

      // Temporal proximity bonus (Connected Papers prefers same "generation")
      if (paper.year) {
        const yearDiff = Math.abs(currentYear - paper.year);
        if (yearDiff <= 3) score += 15;
        else if (yearDiff <= 5) score += 10;
        else if (yearDiff <= 8) score += 5;
        // Older papers get no penalty, just less bonus
      }

      // Recency bonus for discovery (newer papers might be more relevant)
      if (paper.year && paper.year >= currentYear - 2) {
        score += 8;
      }

      return { paper, score, bcScore, isReference, isCitation };
    });

    // Remove duplicates, keeping highest scored version
    const uniqueCandidates = new Map<string, typeof scoredCandidates[0]>();
    for (const candidate of scoredCandidates) {
      if (!candidate.paper.paperId) continue;
      const existing = uniqueCandidates.get(candidate.paper.paperId);
      if (!existing || candidate.score > existing.score) {
        uniqueCandidates.set(candidate.paper.paperId, candidate);
      }
    }

    // Sort by score and get all results (cache more than we return)
    const allResults = Array.from(uniqueCandidates.values())
      .sort((a, b) => b.score - a.score)
      .map((c) => c.paper);

    // Cache the full result set (up to 20 papers for future requests with different limits)
    const toCache = allResults.slice(0, 20);
    if (toCache.length > 0) {
      cacheSimilarPapers(paperId, toCache);
    }

    // Return only what was requested
    const results = allResults.slice(0, limit);

    console.log('[getSimilarPapers] Returning', results.length, 'similar papers (top scores:',
      results.slice(0, 3).map(r => uniqueCandidates.get(r.paperId)?.score.toFixed(1)).join(', '), ')');

    return results;
  } catch (error) {
    console.error('[getSimilarPapers] Error:', error);
    return getRecommendedPapers(paperId, options);
  }
}

// Fallback: Get similar papers from citations and references
async function getFallbackSimilarPapers(
  paperId: string,
  limit: number
): Promise<SemanticScholarPaper[]> {
  try {
    // Build properly formatted nested fields for citations and references
    // Format: citations.paperId,citations.title,...
    const citationFieldList = CITATION_FIELDS.split(',').map(f => `citations.${f}`).join(',');
    const referenceFieldList = CITATION_FIELDS.split(',').map(f => `references.${f}`).join(',');

    // Fetch paper with citations and references
    const url = `${BASE_URL}/paper/${encodeURIComponent(paperId)}?fields=${citationFieldList},${referenceFieldList}`;
    console.log('[getFallbackSimilarPapers] Fetching:', url);

    const response = await rateLimitedFetch(url);

    if (!response.ok) {
      console.warn('[getFallbackSimilarPapers] API returned:', response.status);
      return [];
    }

    const data = await response.json();
    console.log('[getFallbackSimilarPapers] Got citations:', data.citations?.length, 'references:', data.references?.length);

    // Combine citations and references, prioritize by citation count
    const allPapers: SemanticScholarPaper[] = [
      ...(data.citations || []),
      ...(data.references || []),
    ];

    // Remove duplicates and sort by citation count
    const uniquePapers = new Map<string, SemanticScholarPaper>();
    for (const paper of allPapers) {
      if (paper?.paperId && !uniquePapers.has(paper.paperId)) {
        uniquePapers.set(paper.paperId, paper);
      }
    }

    const result = Array.from(uniquePapers.values())
      .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
      .slice(0, limit);

    console.log('[getFallbackSimilarPapers] Returning', result.length, 'unique papers');
    return result;
  } catch (error) {
    console.error('[getFallbackSimilarPapers] Error:', error);
    return [];
  }
}

// Helper: Extract keywords using simple TF-based approach
// (Client-side keyword extraction from abstract)
export function extractKeywords(text: string, maxKeywords = 10): string[] {
  if (!text) return [];

  // Common stop words to filter out
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'this', 'that', 'these', 'those', 'it', 'its', 'we', 'our', 'they', 'their',
    'which', 'who', 'whom', 'what', 'where', 'when', 'why', 'how', 'all', 'each',
    'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
    'same', 'so', 'than', 'too', 'very', 'can', 'just', 'also', 'into', 'over', 'after',
    'before', 'between', 'through', 'during', 'above', 'below', 'up', 'down', 'out',
    'off', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'any', 'about',
    'using', 'used', 'use', 'paper', 'study', 'studies', 'research', 'results', 'show',
    'shows', 'shown', 'based', 'however', 'although', 'therefore', 'thus', 'while',
  ]);

  // Tokenize and clean
  const words = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word) && !/^\d+$/.test(word));

  // Count word frequency
  const wordFreq = new Map<string, number>();
  for (const word of words) {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  }

  // Sort by frequency and return top keywords
  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

// Helper: Generate search suggestions based on paper abstracts
export function generateSearchSuggestions(papers: SemanticScholarPaper[]): string[] {
  const allKeywords: Map<string, number> = new Map();

  for (const paper of papers) {
    const text = [paper.title, paper.abstract, paper.tldr?.text].filter(Boolean).join(' ');
    const keywords = extractKeywords(text, 5);

    for (const keyword of keywords) {
      allKeywords.set(keyword, (allKeywords.get(keyword) || 0) + 1);
    }
  }

  // Return keywords that appear in multiple papers
  return Array.from(allKeywords.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word);
}

// ============================================================================
// SPECTER Embedding Support
// Uses Semantic Scholar's pre-computed SPECTER v2 embeddings (768-dimensional)
// ============================================================================

/**
 * Fetch paper with SPECTER embedding
 * Returns the paper with its 768-dimensional SPECTER v2 embedding vector
 */
export async function getPaperWithEmbedding(paperId: string): Promise<SemanticScholarPaper> {
  const response = await rateLimitedFetch(
    `${BASE_URL}/paper/${encodeURIComponent(paperId)}?fields=${FIELDS_WITH_EMBEDDING}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Paper not found');
    }
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch paper by DOI with SPECTER embedding
 */
export async function fetchPaperByDOIWithEmbedding(doi: string): Promise<SemanticScholarPaper> {
  const response = await rateLimitedFetch(
    `${BASE_URL}/paper/DOI:${encodeURIComponent(doi)}?fields=${FIELDS_WITH_EMBEDDING}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Paper not found');
    }
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Calculate cosine similarity between two embedding vectors
 * Returns a value between -1 and 1, where 1 means identical
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Find papers similar to a target paper using SPECTER embeddings
 * Returns papers sorted by embedding similarity (highest first)
 */
export function findSimilarByEmbedding(
  targetEmbedding: number[],
  candidatePapers: SemanticScholarPaper[],
  options: { threshold?: number; limit?: number } = {}
): Array<{ paper: SemanticScholarPaper; similarity: number }> {
  const { threshold = 0.5, limit = 20 } = options;

  const scored = candidatePapers
    .filter(paper => paper.embedding?.vector && paper.embedding.vector.length === targetEmbedding.length)
    .map(paper => ({
      paper,
      similarity: cosineSimilarity(targetEmbedding, paper.embedding!.vector),
    }))
    .filter(item => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return scored;
}

/**
 * Batch fetch papers with embeddings
 * Useful for building a similarity index for a collection
 */
export async function fetchPapersWithEmbeddings(
  paperIds: string[],
  options: { onProgress?: (completed: number, total: number) => void } = {}
): Promise<SemanticScholarPaper[]> {
  const { onProgress } = options;
  const results: SemanticScholarPaper[] = [];

  for (let i = 0; i < paperIds.length; i++) {
    try {
      const paper = await getPaperWithEmbedding(paperIds[i]);
      results.push(paper);
    } catch (error) {
      console.warn(`[fetchPapersWithEmbeddings] Failed to fetch ${paperIds[i]}:`, error);
    }

    onProgress?.(i + 1, paperIds.length);
  }

  return results;
}

// ============================================================================
// Embedding Cache - Now using centralized cache manager
// Legacy functions provided for backwards compatibility
// ============================================================================

/**
 * Save embedding to cache
 */
export function cacheEmbedding(paperId: string, embedding: number[]): void {
  cacheEmbed(paperId, embedding);
}

/**
 * Get embedding from cache
 */
export function getCachedEmbedding(paperId: string): number[] | null {
  return getCachedEmbed(paperId);
}

/**
 * Clear embedding cache
 */
export function clearEmbeddingCache(): void {
  cacheManager.clear('embedding');
  console.log('[clearEmbeddingCache] Cache cleared');
}

/**
 * Get embedding cache statistics
 */
export function getEmbeddingCacheStats(): {
  entryCount: number;
  estimatedSizeKB: number;
  oldestDays: number;
} {
  const stats = cacheManager.getStats('embedding');
  return {
    entryCount: stats.entryCount,
    estimatedSizeKB: Math.round(stats.entryCount * 6), // ~6KB per embedding
    oldestDays: Math.round(stats.oldestEntryAge / (24 * 60 * 60 * 1000)),
  };
}
