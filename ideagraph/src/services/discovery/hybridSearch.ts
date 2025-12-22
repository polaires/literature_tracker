// Hybrid Search Service
// Combines keyword search with SPECTER embedding similarity for better discovery
// Inspired by RAG best practices: keyword for precision, embeddings for semantic coverage

import {
  searchPapers,
  getPaperWithEmbedding,
  cosineSimilarity,
  getCachedEmbedding,
  cacheEmbedding,
  type SemanticScholarPaper,
} from '../api/semanticScholar';
import type { Paper } from '../../types';

/**
 * Hybrid search result with combined scoring
 */
export interface HybridSearchResult {
  paper: SemanticScholarPaper;
  keywordScore: number; // 0-1 from keyword search ranking
  embeddingScore: number; // 0-1 from embedding similarity
  combinedScore: number; // Weighted combination
  source: 'keyword' | 'embedding' | 'both';
}

/**
 * Search configuration
 */
export interface HybridSearchConfig {
  keywordWeight: number; // Weight for keyword results (0-1)
  embeddingWeight: number; // Weight for embedding results (0-1)
  minKeywordResults: number; // Minimum papers from keyword search
  maxEmbeddingCandidates: number; // Max papers to check for embedding similarity
  embeddingThreshold: number; // Minimum embedding similarity to include
}

const DEFAULT_CONFIG: HybridSearchConfig = {
  keywordWeight: 0.6,
  embeddingWeight: 0.4,
  minKeywordResults: 10,
  maxEmbeddingCandidates: 30,
  embeddingThreshold: 0.5,
};

/**
 * Hybrid Search Service
 * Combines keyword and embedding-based search for better recall and precision
 */
export class HybridSearchService {
  private config: HybridSearchConfig;

  constructor(config: Partial<HybridSearchConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Perform hybrid search combining keyword and embedding approaches
   */
  async search(params: {
    query: string;
    seedPapers?: Paper[]; // Papers to use for embedding similarity
    limit?: number;
    onProgress?: (status: string, progress: number) => void;
  }): Promise<HybridSearchResult[]> {
    const { query, seedPapers = [], limit = 20, onProgress } = params;

    const results = new Map<string, HybridSearchResult>();

    // Step 1: Keyword search
    onProgress?.('Searching by keywords...', 0.2);
    const keywordResults = await this.keywordSearch(query, this.config.minKeywordResults);

    // Add keyword results with scores
    keywordResults.forEach((paper, index) => {
      const keywordScore = 1 - (index / keywordResults.length); // Higher rank = higher score
      results.set(paper.paperId, {
        paper,
        keywordScore,
        embeddingScore: 0,
        combinedScore: keywordScore * this.config.keywordWeight,
        source: 'keyword',
      });
    });

    // Step 2: Embedding-based search (if we have seed papers)
    if (seedPapers.length > 0) {
      onProgress?.('Finding semantically similar papers...', 0.5);
      const embeddingResults = await this.embeddingSearch(
        seedPapers,
        keywordResults,
        this.config.maxEmbeddingCandidates
      );

      // Merge embedding results
      for (const result of embeddingResults) {
        const existing = results.get(result.paper.paperId);
        if (existing) {
          // Paper found by both methods - combine scores
          existing.embeddingScore = result.embeddingScore;
          existing.combinedScore =
            existing.keywordScore * this.config.keywordWeight +
            result.embeddingScore * this.config.embeddingWeight;
          existing.source = 'both';
        } else {
          // Paper only found by embedding
          results.set(result.paper.paperId, {
            paper: result.paper,
            keywordScore: 0,
            embeddingScore: result.embeddingScore,
            combinedScore: result.embeddingScore * this.config.embeddingWeight,
            source: 'embedding',
          });
        }
      }
    }

    // Step 3: Sort by combined score and return top results
    onProgress?.('Ranking results...', 0.9);
    const sortedResults = Array.from(results.values())
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, limit);

    onProgress?.('Complete', 1.0);
    return sortedResults;
  }

  /**
   * Keyword-based search using Semantic Scholar
   */
  private async keywordSearch(query: string, limit: number): Promise<SemanticScholarPaper[]> {
    try {
      const result = await searchPapers(query, { limit });
      return result.papers;
    } catch (error) {
      console.warn('[HybridSearch] Keyword search failed:', error);
      return [];
    }
  }

  /**
   * Embedding-based search using SPECTER embeddings
   */
  private async embeddingSearch(
    seedPapers: Paper[],
    candidatePapers: SemanticScholarPaper[],
    maxCandidates: number
  ): Promise<Array<{ paper: SemanticScholarPaper; embeddingScore: number }>> {
    // Get embeddings for seed papers
    const seedEmbeddings: number[][] = [];

    for (const paper of seedPapers.slice(0, 5)) { // Use up to 5 seed papers
      if (!paper.semanticScholarId) continue;

      // Check cache first
      let embedding = getCachedEmbedding(paper.semanticScholarId);

      if (!embedding) {
        // Fetch from API
        try {
          const s2Paper = await getPaperWithEmbedding(paper.semanticScholarId);
          if (s2Paper.embedding?.vector) {
            embedding = s2Paper.embedding.vector;
            cacheEmbedding(paper.semanticScholarId, embedding);
          }
        } catch (error) {
          console.warn('[HybridSearch] Failed to get embedding for', paper.semanticScholarId);
          continue;
        }
      }

      if (embedding) {
        seedEmbeddings.push(embedding);
      }
    }

    if (seedEmbeddings.length === 0) {
      console.log('[HybridSearch] No seed embeddings available');
      return [];
    }

    // Calculate average seed embedding (centroid)
    const centroid = this.calculateCentroid(seedEmbeddings);

    // Get embeddings for candidates and score them
    const results: Array<{ paper: SemanticScholarPaper; embeddingScore: number }> = [];

    for (const paper of candidatePapers.slice(0, maxCandidates)) {
      // Check cache
      let embedding = getCachedEmbedding(paper.paperId);

      if (!embedding) {
        try {
          const s2Paper = await getPaperWithEmbedding(paper.paperId);
          if (s2Paper.embedding?.vector) {
            embedding = s2Paper.embedding.vector;
            cacheEmbedding(paper.paperId, embedding);
          }
        } catch (error) {
          continue;
        }
      }

      if (embedding && embedding.length === centroid.length) {
        const similarity = cosineSimilarity(centroid, embedding);
        if (similarity >= this.config.embeddingThreshold) {
          results.push({
            paper,
            embeddingScore: similarity,
          });
        }
      }
    }

    // Sort by embedding score
    results.sort((a, b) => b.embeddingScore - a.embeddingScore);
    return results;
  }

  /**
   * Calculate centroid (average) of multiple embeddings
   */
  private calculateCentroid(embeddings: number[][]): number[] {
    if (embeddings.length === 0) return [];
    if (embeddings.length === 1) return embeddings[0];

    const dim = embeddings[0].length;
    const centroid = new Array(dim).fill(0);

    for (const embedding of embeddings) {
      for (let i = 0; i < dim; i++) {
        centroid[i] += embedding[i];
      }
    }

    for (let i = 0; i < dim; i++) {
      centroid[i] /= embeddings.length;
    }

    return centroid;
  }

  /**
   * Expand query using seed paper titles/abstracts
   */
  async expandQuery(params: {
    baseQuery: string;
    seedPapers: Paper[];
    maxTerms?: number;
  }): Promise<string[]> {
    const { baseQuery, seedPapers, maxTerms = 3 } = params;

    // Extract key terms from seed papers
    const allText = seedPapers
      .slice(0, 5)
      .map(p => `${p.title} ${p.takeaway}`)
      .join(' ')
      .toLowerCase();

    // Simple term extraction (could be enhanced with TF-IDF)
    const words = allText
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 4);

    // Count frequency
    const freq = new Map<string, number>();
    for (const word of words) {
      freq.set(word, (freq.get(word) || 0) + 1);
    }

    // Get top terms not in base query
    const baseWords = new Set(baseQuery.toLowerCase().split(/\s+/));
    const expandedTerms = Array.from(freq.entries())
      .filter(([word]) => !baseWords.has(word))
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxTerms)
      .map(([word]) => word);

    // Generate expanded queries
    const queries = [baseQuery];
    for (const term of expandedTerms) {
      queries.push(`${baseQuery} ${term}`);
    }

    return queries;
  }

  /**
   * Reciprocal Rank Fusion (RRF) for combining multiple result lists
   * More robust than simple score combination
   */
  fuseResults(
    resultLists: SemanticScholarPaper[][],
    k: number = 60 // RRF constant
  ): Array<{ paper: SemanticScholarPaper; fusedScore: number }> {
    const scores = new Map<string, { paper: SemanticScholarPaper; score: number }>();

    for (const list of resultLists) {
      for (let rank = 0; rank < list.length; rank++) {
        const paper = list[rank];
        const rrfScore = 1 / (k + rank + 1);

        const existing = scores.get(paper.paperId);
        if (existing) {
          existing.score += rrfScore;
        } else {
          scores.set(paper.paperId, { paper, score: rrfScore });
        }
      }
    }

    return Array.from(scores.values())
      .map(({ paper, score }) => ({ paper, fusedScore: score }))
      .sort((a, b) => b.fusedScore - a.fusedScore);
  }
}

// Singleton
let serviceInstance: HybridSearchService | null = null;

/**
 * Get hybrid search service
 */
export function getHybridSearchService(config?: Partial<HybridSearchConfig>): HybridSearchService {
  if (!serviceInstance || config) {
    serviceInstance = new HybridSearchService(config);
  }
  return serviceInstance;
}
