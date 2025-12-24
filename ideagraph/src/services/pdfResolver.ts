/**
 * PDF Resolver Service
 *
 * Multi-source PDF URL resolution with institutional access support.
 * Resolution chain:
 * 1. Semantic Scholar openAccessPdf (already in metadata)
 * 2. Unpaywall API (free, 100k calls/day)
 * 3. CORE API (free tier: 5 req/10s)
 * 4. arXiv direct link (if arXiv ID available)
 * 5. PubMed Central (if PMC ID available)
 * 6. DOI redirect for institutional access
 */

import { pdfStorage } from './pdfStorage';

// API configuration
const isDev = import.meta.env.DEV;

// Unpaywall requires email for identification
const UNPAYWALL_EMAIL = 'ideagraph-app@users.noreply.github.com';

// API base URLs (proxied in dev to avoid CORS)
const UNPAYWALL_BASE = isDev ? '/api/unpaywall' : 'https://api.unpaywall.org';
const CORE_BASE = isDev ? '/api/core' : 'https://api.core.ac.uk';

export interface PDFSource {
  url: string;
  source: 'semantic_scholar' | 'unpaywall' | 'core' | 'arxiv' | 'pmc' | 'doi_redirect';
  isOpenAccess: boolean;
  version?: 'published' | 'accepted' | 'submitted';
  license?: string;
}

export interface PDFResolutionResult {
  sources: PDFSource[];
  bestSource: PDFSource | null;
  requiresAuth: boolean;
  doiRedirectUrl: string | null;
}

export interface PaperIdentifiers {
  doi?: string | null;
  semanticScholarPdfUrl?: string | null;
  arxivId?: string | null;
  pmcId?: string | null;
  pmid?: string | null;
}

// Rate limiting for CORE API (5 req per 10 seconds for free tier)
let coreLastRequest = 0;
const CORE_MIN_INTERVAL = 2100; // 2.1s between requests (5 per 10s = 2s each, with margin)
const CORE_TIMEOUT = 10000; // 10 second timeout for CORE requests

async function rateLimitedCoreFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - coreLastRequest;

  if (timeSinceLastRequest < CORE_MIN_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, CORE_MIN_INTERVAL - timeSinceLastRequest));
  }

  coreLastRequest = Date.now();

  // Add timeout using AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CORE_TIMEOUT);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('CORE API request timed out');
    }
    throw error;
  }
}

/**
 * Resolve PDF URL from Unpaywall
 * Free API, 100k calls/day limit
 */
async function resolveFromUnpaywall(doi: string): Promise<PDFSource | null> {
  try {
    const url = `${UNPAYWALL_BASE}/v2/${encodeURIComponent(doi)}?email=${UNPAYWALL_EMAIL}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.log('[PDFResolver] Unpaywall returned', response.status, 'for', doi);
      return null;
    }

    const data = await response.json();

    // Check best_oa_location first
    if (data.best_oa_location?.url_for_pdf) {
      return {
        url: data.best_oa_location.url_for_pdf,
        source: 'unpaywall',
        isOpenAccess: true,
        version: data.best_oa_location.version || undefined,
        license: data.best_oa_location.license || undefined,
      };
    }

    // Check other OA locations
    if (data.oa_locations && data.oa_locations.length > 0) {
      for (const location of data.oa_locations) {
        if (location.url_for_pdf) {
          return {
            url: location.url_for_pdf,
            source: 'unpaywall',
            isOpenAccess: true,
            version: location.version || undefined,
            license: location.license || undefined,
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error('[PDFResolver] Unpaywall error:', error);
    return null;
  }
}

/**
 * Resolve PDF URL from CORE
 * Free tier: 5 requests per 10 seconds
 */
async function resolveFromCore(doi: string): Promise<PDFSource | null> {
  try {
    // CORE search by DOI
    const url = `${CORE_BASE}/v3/search/works?q=doi:"${encodeURIComponent(doi)}"&limit=1`;
    const response = await rateLimitedCoreFetch(url);

    if (!response.ok) {
      // Only log non-timeout errors (504 is common when CORE is overloaded)
      if (response.status !== 504) {
        console.log('[PDFResolver] CORE returned', response.status, 'for', doi);
      }
      return null;
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const work = data.results[0];

      // CORE provides downloadUrl for full text
      if (work.downloadUrl) {
        return {
          url: work.downloadUrl,
          source: 'core',
          isOpenAccess: true,
        };
      }

      // Some entries have links array
      if (work.links && work.links.length > 0) {
        const pdfLink = work.links.find((l: { type?: string; url?: string }) =>
          l.type === 'download' || l.url?.endsWith('.pdf')
        );
        if (pdfLink?.url) {
          return {
            url: pdfLink.url,
            source: 'core',
            isOpenAccess: true,
          };
        }
      }
    }

    return null;
  } catch (error) {
    // Timeout errors are expected for slow/overloaded CORE servers
    if (error instanceof Error && error.message.includes('timed out')) {
      // Silent fail - CORE timeouts are common
      return null;
    }
    console.error('[PDFResolver] CORE error:', error);
    return null;
  }
}

/**
 * Generate arXiv PDF URL from arXiv ID
 */
function resolveFromArxiv(arxivId: string): PDFSource {
  // arXiv IDs can be in format "1234.56789" or "hep-th/9901001"
  const cleanId = arxivId.replace('arXiv:', '').trim();
  return {
    url: `https://arxiv.org/pdf/${cleanId}.pdf`,
    source: 'arxiv',
    isOpenAccess: true,
    version: 'submitted',
  };
}

/**
 * Generate PubMed Central PDF URL from PMC ID
 */
function resolveFromPMC(pmcId: string): PDFSource {
  // PMC IDs are like "PMC1234567" or just "1234567"
  const cleanId = pmcId.replace('PMC', '').trim();
  return {
    url: `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${cleanId}/pdf/`,
    source: 'pmc',
    isOpenAccess: true,
    version: 'published',
  };
}

/**
 * Generate DOI redirect URL for institutional access
 * This allows users on institutional networks to access via their subscription
 */
function generateDoiRedirectUrl(doi: string): string {
  return `https://doi.org/${doi}`;
}

/**
 * Resolve PDF URL from multiple sources
 * Returns all found sources and the best one to use
 */
export async function resolvePdfUrl(
  identifiers: PaperIdentifiers
): Promise<PDFResolutionResult> {
  const sources: PDFSource[] = [];

  // 1. Check if we already have a Semantic Scholar PDF URL
  if (identifiers.semanticScholarPdfUrl) {
    sources.push({
      url: identifiers.semanticScholarPdfUrl,
      source: 'semantic_scholar',
      isOpenAccess: true,
    });
  }

  // 2. Check arXiv (instant, no API call needed)
  if (identifiers.arxivId) {
    sources.push(resolveFromArxiv(identifiers.arxivId));
  }

  // 3. Check PubMed Central (instant, no API call needed)
  if (identifiers.pmcId) {
    sources.push(resolveFromPMC(identifiers.pmcId));
  }

  // 4. Try Unpaywall if we have a DOI
  if (identifiers.doi) {
    const unpaywall = await resolveFromUnpaywall(identifiers.doi);
    if (unpaywall) {
      sources.push(unpaywall);
    }
  }

  // 5. Try CORE if we have a DOI and no sources yet
  if (identifiers.doi && sources.length === 0) {
    const core = await resolveFromCore(identifiers.doi);
    if (core) {
      sources.push(core);
    }
  }

  // Determine best source (prefer published versions, then accepted, then submitted)
  const versionPriority: Record<string, number> = {
    'published': 3,
    'accepted': 2,
    'submitted': 1,
  };

  const sortedSources = [...sources].sort((a, b) => {
    const aVersion = a.version ? versionPriority[a.version] || 0 : 0;
    const bVersion = b.version ? versionPriority[b.version] || 0 : 0;
    return bVersion - aVersion;
  });

  // DOI redirect for institutional access
  const doiRedirectUrl = identifiers.doi ? generateDoiRedirectUrl(identifiers.doi) : null;

  return {
    sources: sortedSources,
    bestSource: sortedSources[0] || null,
    requiresAuth: sources.length === 0 && !!identifiers.doi,
    doiRedirectUrl,
  };
}

/**
 * Attempt to download PDF from resolved sources
 * Tries each source in order until one succeeds
 * For institutional access, opens the DOI page in a new tab for manual download
 */
export async function downloadAndStorePdf(
  paperId: string,
  identifiers: PaperIdentifiers,
  options: {
    onProgress?: (status: string, source?: string) => void;
    onSourceTried?: (source: string, success: boolean) => void;
  } = {}
): Promise<{
  success: boolean;
  source?: string;
  requiresManualDownload: boolean;
  doiUrl?: string;
  error?: string;
}> {
  const { onProgress, onSourceTried } = options;

  onProgress?.('Resolving PDF sources...');

  const resolution = await resolvePdfUrl(identifiers);

  if (resolution.sources.length === 0) {
    // No open access sources found
    if (resolution.doiRedirectUrl) {
      onProgress?.('No open access PDF found. Institutional access may be available.');
      return {
        success: false,
        requiresManualDownload: true,
        doiUrl: resolution.doiRedirectUrl,
      };
    }

    return {
      success: false,
      requiresManualDownload: false,
      error: 'No PDF sources found',
    };
  }

  // Try each source in order
  for (const source of resolution.sources) {
    onProgress?.(`Trying ${source.source}...`, source.source);

    try {
      const result = await pdfStorage.storePDFFromUrl(
        paperId,
        source.url,
        `paper-${paperId}.pdf`
      );

      if (result) {
        onSourceTried?.(source.source, true);
        onProgress?.(`Downloaded from ${source.source}`, source.source);
        return {
          success: true,
          source: source.source,
          requiresManualDownload: false,
        };
      }

      onSourceTried?.(source.source, false);
    } catch (error) {
      console.error(`[PDFResolver] Failed to download from ${source.source}:`, error);
      onSourceTried?.(source.source, false);
    }
  }

  // All sources failed - offer institutional access fallback
  if (resolution.doiRedirectUrl) {
    onProgress?.('Open access downloads failed. Try institutional access.');
    return {
      success: false,
      requiresManualDownload: true,
      doiUrl: resolution.doiRedirectUrl,
    };
  }

  return {
    success: false,
    requiresManualDownload: false,
    error: 'All PDF sources failed to download',
  };
}

/**
 * Quick check if any PDF source is available for a paper
 * Useful for showing download button state
 */
export async function hasPdfAvailable(identifiers: PaperIdentifiers): Promise<boolean> {
  // Quick checks first (no API calls)
  if (identifiers.semanticScholarPdfUrl) return true;
  if (identifiers.arxivId) return true;
  if (identifiers.pmcId) return true;

  // If we have a DOI, there might be sources via Unpaywall/CORE
  // or institutional access, so return true
  if (identifiers.doi) return true;

  return false;
}
