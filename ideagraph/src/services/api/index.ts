// Unified Paper Metadata Service
import * as semanticScholar from './semanticScholar';
import * as crossref from './crossref';
import type { Author } from '../../types';

// Re-export for convenience
export {
  searchPapers,
  getCitingPapers,
  getReferencedPapers,
  getRecommendedPapers,
  extractKeywords,
  generateSearchSuggestions,
  type SemanticScholarPaper,
  type SearchFilters,
  type SearchResult,
} from './semanticScholar';

export interface PaperMetadata {
  doi: string | null;
  title: string;
  authors: Author[];
  year: number | null;
  journal: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  abstract: string | null;
  url: string | null;
  pdfUrl: string | null;
  citationCount: number | null;
  tldr: string | null;
}

// Extract DOI from various input formats
export function extractDOI(input: string): string | null {
  // Clean the input
  const cleaned = input.trim();

  // Pattern for DOI: 10.xxxx/xxxxx
  const doiPattern = /10\.\d{4,}\/[^\s]+/i;

  // Direct DOI
  const match = cleaned.match(doiPattern);
  if (match) {
    return match[0];
  }

  // URL formats
  if (cleaned.includes('doi.org/')) {
    const urlMatch = cleaned.match(/doi\.org\/(10\.\d{4,}\/[^\s]+)/i);
    if (urlMatch) {
      return urlMatch[1];
    }
  }

  return null;
}

// Fetch paper metadata, trying Semantic Scholar first, then CrossRef
export async function fetchPaperMetadata(identifier: string): Promise<PaperMetadata> {
  const doi = extractDOI(identifier);

  if (!doi) {
    throw new Error('Could not extract DOI from input');
  }

  // Try Semantic Scholar first (better abstracts and TLDRs)
  try {
    const paper = await semanticScholar.fetchPaperByDOI(doi);
    return {
      doi,
      title: paper.title,
      authors: paper.authors.map((a) => ({ name: a.name })),
      year: paper.year,
      journal: paper.venue,
      volume: null,
      issue: null,
      pages: null,
      abstract: paper.abstract,
      url: `https://doi.org/${doi}`,
      pdfUrl: paper.openAccessPdf?.url || null,
      citationCount: paper.citationCount,
      tldr: paper.tldr?.text || null,
    };
  } catch (e) {
    console.log('Semantic Scholar failed, trying CrossRef...', e);
  }

  // Fallback to CrossRef
  try {
    const paper = await crossref.fetchPaperByDOI(doi);
    return {
      doi,
      title: paper.title?.[0] || 'Unknown Title',
      authors:
        paper.author?.map((a) => ({
          name: a.given ? `${a.given} ${a.family}` : a.family,
        })) || [],
      year: paper.published?.['date-parts']?.[0]?.[0] || null,
      journal: paper['container-title']?.[0] || null,
      volume: paper.volume || null,
      issue: paper.issue || null,
      pages: paper.page || null,
      abstract: paper.abstract || null,
      url: paper.URL || `https://doi.org/${doi}`,
      pdfUrl: null,
      citationCount: paper['is-referenced-by-count'] || null,
      tldr: null,
    };
  } catch (e) {
    console.log('CrossRef also failed', e);
    throw new Error('Could not fetch paper metadata from any source');
  }
}
