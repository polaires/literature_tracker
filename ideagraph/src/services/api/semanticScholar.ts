// Semantic Scholar API Service
// Docs: https://api.semanticscholar.org/api-docs

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

const BASE_URL = 'https://api.semanticscholar.org/graph/v1';
const FIELDS = 'paperId,title,authors,year,venue,abstract,citationCount,openAccessPdf,externalIds,tldr,fieldsOfStudy,publicationTypes,publicationDate';

// Rate limiting helper
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // 100ms between requests (10 req/sec for safety)

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();
  return fetch(url);
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
export async function getRecommendedPapers(
  paperId: string,
  options: { limit?: number } = {}
): Promise<SemanticScholarPaper[]> {
  const { limit = 20 } = options;

  const response = await rateLimitedFetch(
    `${BASE_URL}/recommendations/v1/papers/forpaper/${encodeURIComponent(paperId)}?fields=${FIELDS}&limit=${limit}`
  );

  if (!response.ok) {
    // Recommendations endpoint may not be available - return empty
    console.warn('Recommendations not available');
    return [];
  }

  const data = await response.json();
  return data.recommendedPapers || [];
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
