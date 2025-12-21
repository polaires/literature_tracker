// Semantic Scholar API Service
// Docs: https://api.semanticscholar.org/

export interface SemanticScholarPaper {
  paperId: string;
  title: string;
  authors: { name: string; authorId: string }[];
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
}

const BASE_URL = 'https://api.semanticscholar.org/graph/v1';
const FIELDS = 'paperId,title,authors,year,venue,abstract,citationCount,openAccessPdf,externalIds,tldr';

export async function fetchPaperByDOI(doi: string): Promise<SemanticScholarPaper> {
  const response = await fetch(
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
  const response = await fetch(
    `${BASE_URL}/paper/${encodeURIComponent(paperId)}?fields=${FIELDS}`
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function searchPapers(query: string, limit = 10): Promise<SemanticScholarPaper[]> {
  const response = await fetch(
    `${BASE_URL}/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=${FIELDS}`
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}
