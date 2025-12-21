// CrossRef API Service (Fallback)
// Docs: https://api.crossref.org/

export interface CrossRefPaper {
  DOI: string;
  title: string[];
  author?: { given?: string; family: string }[];
  published?: { 'date-parts': number[][] };
  'container-title'?: string[];
  volume?: string;
  issue?: string;
  page?: string;
  abstract?: string;
  URL?: string;
  'is-referenced-by-count'?: number;
}

const BASE_URL = 'https://api.crossref.org/works';

export async function fetchPaperByDOI(doi: string): Promise<CrossRefPaper> {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(doi)}`, {
    headers: {
      'User-Agent': 'IdeaGraph/1.0 (mailto:ideagraph@example.com)',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Paper not found');
    }
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data.message;
}

export async function searchPapers(query: string, limit = 10): Promise<CrossRefPaper[]> {
  const response = await fetch(
    `${BASE_URL}?query=${encodeURIComponent(query)}&rows=${limit}`,
    {
      headers: {
        'User-Agent': 'IdeaGraph/1.0 (mailto:ideagraph@example.com)',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data.message.items || [];
}
