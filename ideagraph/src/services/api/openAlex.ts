// OpenAlex API Service
// Free, open academic metadata for 209M+ works
// Docs: https://docs.openalex.org/

const OPENALEX_BASE = 'https://api.openalex.org';

// Polite pool: include email for higher rate limits
const USER_AGENT = 'IdeaGraph/1.0 (https://github.com/ideagraph; contact@ideagraph.app)';

/**
 * OpenAlex Work (paper) object
 */
export interface OpenAlexWork {
  id: string;
  doi: string | null;
  title: string;
  display_name: string;
  publication_year: number | null;
  publication_date: string | null;
  cited_by_count: number;
  is_retracted: boolean;
  is_oa: boolean;
  type: string;
  primary_location?: {
    source?: {
      id: string;
      display_name: string;
      type: string;
    };
    pdf_url?: string;
    is_oa: boolean;
  };
  authorships: Array<{
    author: {
      id: string;
      display_name: string;
      orcid?: string;
    };
    institutions: Array<{
      display_name: string;
      country_code?: string;
    }>;
  }>;
  abstract_inverted_index?: Record<string, number[]>;
  concepts: Array<{
    id: string;
    display_name: string;
    level: number;
    score: number;
  }>;
  topics?: Array<{
    id: string;
    display_name: string;
    score: number;
  }>;
  open_access?: {
    is_oa: boolean;
    oa_status: 'gold' | 'green' | 'hybrid' | 'bronze' | 'closed';
    oa_url?: string;
  };
  referenced_works?: string[];
  related_works?: string[];
  counts_by_year?: Array<{
    year: number;
    cited_by_count: number;
  }>;
}

/**
 * OpenAlex search result
 */
export interface OpenAlexSearchResult {
  meta: {
    count: number;
    db_response_time_ms: number;
    page: number;
    per_page: number;
  };
  results: OpenAlexWork[];
}

/**
 * Reconstruct abstract from inverted index
 */
export function reconstructAbstract(invertedIndex: Record<string, number[]>): string {
  if (!invertedIndex || Object.keys(invertedIndex).length === 0) {
    return '';
  }

  const words: [string, number][] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words.push([word, pos]);
    }
  }
  words.sort((a, b) => a[1] - b[1]);
  return words.map(w => w[0]).join(' ');
}

/**
 * Clean DOI for OpenAlex lookup
 */
function cleanDOI(doi: string): string {
  // Remove URL prefix if present
  return doi
    .replace(/^https?:\/\/doi\.org\//i, '')
    .replace(/^doi:/i, '')
    .trim();
}

/**
 * Get a work by DOI
 */
export async function getWorkByDOI(doi: string): Promise<OpenAlexWork | null> {
  const cleanedDOI = cleanDOI(doi);
  const url = `${OPENALEX_BASE}/works/doi:${encodeURIComponent(cleanedDOI)}`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`OpenAlex API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.warn('[OpenAlex] Failed to get work by DOI:', error);
    return null;
  }
}

/**
 * Get a work by OpenAlex ID
 */
export async function getWorkById(openAlexId: string): Promise<OpenAlexWork | null> {
  const url = `${OPENALEX_BASE}/works/${openAlexId}`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.warn('[OpenAlex] Failed to get work by ID:', error);
    return null;
  }
}

/**
 * Search for works
 */
export async function searchWorks(
  query: string,
  options: {
    limit?: number;
    page?: number;
    filter?: string;
    sort?: string;
  } = {}
): Promise<OpenAlexSearchResult> {
  const { limit = 20, page = 1, filter, sort } = options;

  const params = new URLSearchParams({
    search: query,
    per_page: String(limit),
    page: String(page),
  });

  if (filter) {
    params.set('filter', filter);
  }

  if (sort) {
    params.set('sort', sort);
  }

  const url = `${OPENALEX_BASE}/works?${params}`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) {
      throw new Error(`OpenAlex search failed: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.warn('[OpenAlex] Search failed:', error);
    return {
      meta: { count: 0, db_response_time_ms: 0, page: 1, per_page: limit },
      results: [],
    };
  }
}

/**
 * Search with common filters
 */
export async function searchWorksFiltered(
  query: string,
  options: {
    limit?: number;
    yearFrom?: number;
    yearTo?: number;
    openAccessOnly?: boolean;
    excludeRetracted?: boolean;
    minCitations?: number;
    type?: 'article' | 'review' | 'book-chapter' | 'proceedings-article';
  } = {}
): Promise<OpenAlexWork[]> {
  const {
    limit = 20,
    yearFrom,
    yearTo,
    openAccessOnly = false,
    excludeRetracted = true,
    minCitations,
    type,
  } = options;

  // Build filter string
  const filters: string[] = [];

  if (yearFrom && yearTo) {
    filters.push(`publication_year:${yearFrom}-${yearTo}`);
  } else if (yearFrom) {
    filters.push(`publication_year:>${yearFrom - 1}`);
  } else if (yearTo) {
    filters.push(`publication_year:<${yearTo + 1}`);
  }

  if (openAccessOnly) {
    filters.push('is_oa:true');
  }

  if (excludeRetracted) {
    filters.push('is_retracted:false');
  }

  if (minCitations !== undefined) {
    filters.push(`cited_by_count:>${minCitations - 1}`);
  }

  if (type) {
    filters.push(`type:${type}`);
  }

  const result = await searchWorks(query, {
    limit,
    filter: filters.length > 0 ? filters.join(',') : undefined,
    sort: 'cited_by_count:desc',
  });

  return result.results;
}

/**
 * Get related works for a paper
 */
export async function getRelatedWorks(
  openAlexId: string,
  limit = 10
): Promise<OpenAlexWork[]> {
  const work = await getWorkById(openAlexId);
  if (!work?.related_works || work.related_works.length === 0) {
    return [];
  }

  // Fetch first N related works
  const relatedIds = work.related_works.slice(0, limit);
  const works: OpenAlexWork[] = [];

  for (const id of relatedIds) {
    const relatedWork = await getWorkById(id);
    if (relatedWork) {
      works.push(relatedWork);
    }
  }

  return works;
}

/**
 * Get concepts/topics for auto-tagging
 */
export function extractConcepts(
  work: OpenAlexWork,
  minScore = 0.3
): Array<{ name: string; score: number }> {
  const concepts = work.concepts
    .filter(c => c.score >= minScore)
    .map(c => ({ name: c.display_name, score: c.score }))
    .sort((a, b) => b.score - a.score);

  return concepts.slice(0, 5);
}

/**
 * Check if a paper is retracted
 */
export async function checkRetraction(doi: string): Promise<{
  isRetracted: boolean;
  checkedAt: string;
  source: 'openalex';
} | null> {
  const work = await getWorkByDOI(doi);

  if (!work) {
    return null;
  }

  return {
    isRetracted: work.is_retracted,
    checkedAt: new Date().toISOString(),
    source: 'openalex',
  };
}

/**
 * Get open access URL if available
 */
export function getOpenAccessUrl(work: OpenAlexWork): string | null {
  // Try primary location first
  if (work.primary_location?.pdf_url) {
    return work.primary_location.pdf_url;
  }

  // Try open_access field
  if (work.open_access?.oa_url) {
    return work.open_access.oa_url;
  }

  return null;
}

/**
 * Convert OpenAlex work to a simpler format matching our Paper type
 */
export function convertToSimplePaper(work: OpenAlexWork): {
  title: string;
  authors: Array<{ name: string }>;
  year: number | null;
  doi: string | null;
  abstract: string | null;
  venue: string | null;
  citationCount: number;
  isRetracted: boolean;
  isOpenAccess: boolean;
  openAccessUrl: string | null;
  concepts: string[];
} {
  return {
    title: work.display_name || work.title,
    authors: work.authorships.map(a => ({ name: a.author.display_name })),
    year: work.publication_year,
    doi: work.doi,
    abstract: work.abstract_inverted_index
      ? reconstructAbstract(work.abstract_inverted_index)
      : null,
    venue: work.primary_location?.source?.display_name || null,
    citationCount: work.cited_by_count,
    isRetracted: work.is_retracted,
    isOpenAccess: work.is_oa,
    openAccessUrl: getOpenAccessUrl(work),
    concepts: extractConcepts(work).map(c => c.name),
  };
}
