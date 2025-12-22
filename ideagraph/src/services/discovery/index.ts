// Discovery Service
// Combines AI-generated search strategies with Semantic Scholar for thesis-aware paper discovery

import { getSuggestionManager, AI_MODELS, type AISettings } from '../ai';
import {
  DISCOVERY_SYSTEM_PROMPT,
  buildSearchStrategyPrompt,
  buildRelevanceScoringPrompt,
  parseSearchStrategies,
  parseRelevanceScores,
  type SearchStrategy,
  type PaperRelevanceScore,
} from '../ai/prompts/discovery';
import {
  searchPapers,
  getRecommendedPapers,
  getSimilarPapers,
  type SemanticScholarPaper,
  type SearchResult,
} from '../api/semanticScholar';
import type { Thesis, Paper, ThesisRole } from '../../types';
import type { GapSuggestion } from '../ai/types';

/**
 * Discovery result with relevance scoring
 */
export interface DiscoveryResult {
  paper: SemanticScholarPaper;
  relevanceScore: number;
  suggestedRole: ThesisRole;
  reasoning: string;
  keyInsight: string;
  source: 'search' | 'similar' | 'recommended' | 'citation';
  searchQuery?: string;
}

/**
 * Discovery session state
 */
export interface DiscoverySession {
  id: string;
  thesisId: string;
  strategies: SearchStrategy[];
  results: DiscoveryResult[];
  status: 'idle' | 'generating-strategies' | 'searching' | 'scoring' | 'complete' | 'error';
  error?: string;
  createdAt: string;
}

/**
 * Discovery Service
 * Orchestrates thesis-aware paper discovery using AI and Semantic Scholar
 */
export class DiscoveryService {
  private settings: AISettings;

  constructor(settings: AISettings) {
    this.settings = settings;
  }

  /**
   * Update settings
   */
  updateSettings(settings: AISettings): void {
    this.settings = settings;
  }

  /**
   * Generate AI-powered search strategies based on thesis and gaps
   */
  async generateSearchStrategies(params: {
    thesis: Thesis;
    papers: Paper[];
    gaps?: GapSuggestion[];
  }): Promise<SearchStrategy[]> {
    const manager = getSuggestionManager(this.settings);

    if (!manager.isAvailable()) {
      // Return default strategies without AI
      return this.getDefaultStrategies(params.thesis);
    }

    const prompt = buildSearchStrategyPrompt({
      thesis: {
        title: params.thesis.title,
        description: params.thesis.description,
      },
      existingPapers: params.papers.map(p => ({
        title: p.title,
        takeaway: p.takeaway,
        thesisRole: p.thesisRole,
        year: p.year,
      })),
      existingGaps: params.gaps?.map(g => ({
        type: g.type,
        title: g.title,
        description: g.description,
      })),
    });

    try {
      const provider = manager['provider']; // Access provider through manager
      const { data } = await provider.completeJSON<unknown[]>(prompt, {
        systemPrompt: DISCOVERY_SYSTEM_PROMPT,
        maxTokens: AI_MODELS.standard.maxTokens,
        temperature: AI_MODELS.standard.temperature,
      });

      return parseSearchStrategies(data);
    } catch (error) {
      console.error('[DiscoveryService] Failed to generate strategies:', error);
      return this.getDefaultStrategies(params.thesis);
    }
  }

  /**
   * Score candidate papers for thesis relevance
   */
  async scoreRelevance(params: {
    thesis: Thesis;
    existingPapers: Paper[];
    candidatePapers: Array<{
      id: string;
      title: string;
      abstract: string | null;
      authors?: string;
      year?: number | null;
    }>;
  }): Promise<PaperRelevanceScore[]> {
    const manager = getSuggestionManager(this.settings);

    if (!manager.isAvailable()) {
      // Return default scores without AI
      return params.candidatePapers.map(p => ({
        paperId: p.id,
        relevanceScore: 50,
        suggestedRole: 'background' as ThesisRole,
        reasoning: 'AI scoring unavailable',
        keyInsight: p.title,
      }));
    }

    const prompt = buildRelevanceScoringPrompt({
      thesis: {
        title: params.thesis.title,
        description: params.thesis.description,
      },
      candidatePapers: params.candidatePapers,
      existingPapers: params.existingPapers.map(p => ({
        title: p.title,
        takeaway: p.takeaway,
        thesisRole: p.thesisRole,
      })),
    });

    try {
      const provider = manager['provider'];
      const { data } = await provider.completeJSON<unknown[]>(prompt, {
        systemPrompt: DISCOVERY_SYSTEM_PROMPT,
        maxTokens: AI_MODELS.advanced.maxTokens,
        temperature: AI_MODELS.fast.temperature,
      });

      return parseRelevanceScores(data);
    } catch (error) {
      console.error('[DiscoveryService] Failed to score relevance:', error);
      return params.candidatePapers.map(p => ({
        paperId: p.id,
        relevanceScore: 50,
        suggestedRole: 'background' as ThesisRole,
        reasoning: 'Scoring failed',
        keyInsight: p.title,
      }));
    }
  }

  /**
   * Run full discovery pipeline
   * 1. Generate search strategies from thesis + gaps
   * 2. Execute searches on Semantic Scholar
   * 3. Score results for thesis relevance
   * 4. Return ranked, deduplicated results
   */
  async discoverPapers(params: {
    thesis: Thesis;
    papers: Paper[];
    gaps?: GapSuggestion[];
    seedPaperId?: string; // Paper to use for similarity search
    maxResults?: number;
    onProgress?: (status: string, progress: number) => void;
  }): Promise<DiscoveryResult[]> {
    const { thesis, papers, gaps, seedPaperId, maxResults = 30, onProgress } = params;

    const existingDOIs = new Set(papers.map(p => p.doi).filter(Boolean));
    const existingTitles = new Set(papers.map(p => p.title.toLowerCase()));
    const allCandidates: Map<string, { paper: SemanticScholarPaper; source: DiscoveryResult['source']; query?: string }> = new Map();

    // Step 1: Generate search strategies
    onProgress?.('Generating search strategies...', 0.1);
    const strategies = await this.generateSearchStrategies({ thesis, papers, gaps });

    // Step 2: Execute searches
    onProgress?.('Searching for papers...', 0.3);

    // Run top 5 strategy searches in parallel
    const searchPromises = strategies.slice(0, 5).map(async (strategy) => {
      try {
        const result = await searchPapers(strategy.query, { limit: 15 });
        return { result, strategy };
      } catch (error) {
        console.warn(`[DiscoveryService] Search failed for "${strategy.query}":`, error);
        return { result: { papers: [], total: 0, offset: 0 } as SearchResult, strategy };
      }
    });

    const searchResults = await Promise.all(searchPromises);

    for (const { result, strategy } of searchResults) {
      for (const paper of result.papers) {
        if (!this.isDuplicate(paper, existingDOIs, existingTitles, allCandidates)) {
          allCandidates.set(paper.paperId, { paper, source: 'search', query: strategy.query });
        }
      }
    }

    // Step 3: Add similar papers if seed paper provided
    if (seedPaperId) {
      onProgress?.('Finding similar papers...', 0.5);
      try {
        const similarPapers = await getSimilarPapers(seedPaperId);
        for (const paper of similarPapers.slice(0, 10)) {
          if (!this.isDuplicate(paper, existingDOIs, existingTitles, allCandidates)) {
            allCandidates.set(paper.paperId, { paper, source: 'similar' });
          }
        }
      } catch (error) {
        console.warn('[DiscoveryService] Similar papers failed:', error);
      }
    }

    // Step 4: Add recommended papers for high-value existing papers
    onProgress?.('Getting recommendations...', 0.6);
    const highValuePapers = papers
      .filter(p => p.semanticScholarId && (p.thesisRole === 'supports' || p.thesisRole === 'method'))
      .slice(0, 3);

    for (const paper of highValuePapers) {
      try {
        const recs = await getRecommendedPapers(paper.semanticScholarId!, { limit: 5 });
        for (const rec of recs) {
          if (!this.isDuplicate(rec, existingDOIs, existingTitles, allCandidates)) {
            allCandidates.set(rec.paperId, { paper: rec, source: 'recommended' });
          }
        }
      } catch (error) {
        console.warn('[DiscoveryService] Recommendations failed:', error);
      }
    }

    // Step 5: Score candidates for thesis relevance
    onProgress?.('Scoring relevance...', 0.8);
    const candidateList = Array.from(allCandidates.values());

    // Score in batches of 10
    const scoredResults: DiscoveryResult[] = [];
    const batchSize = 10;

    for (let i = 0; i < candidateList.length; i += batchSize) {
      const batch = candidateList.slice(i, i + batchSize);

      const scores = await this.scoreRelevance({
        thesis,
        existingPapers: papers,
        candidatePapers: batch.map(({ paper }) => ({
          id: paper.paperId,
          title: paper.title,
          abstract: paper.abstract,
          authors: paper.authors?.map(a => a.name).join(', '),
          year: paper.year,
        })),
      });

      // Merge scores with candidate data
      for (const { paper, source, query } of batch) {
        const score = scores.find(s => s.paperId === paper.paperId);
        scoredResults.push({
          paper,
          relevanceScore: score?.relevanceScore ?? 50,
          suggestedRole: score?.suggestedRole ?? 'background',
          reasoning: score?.reasoning ?? '',
          keyInsight: score?.keyInsight ?? paper.title,
          source,
          searchQuery: query,
        });
      }
    }

    // Step 6: Sort by relevance and return top results
    onProgress?.('Finalizing results...', 0.95);
    const finalResults = scoredResults
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);

    onProgress?.('Complete', 1.0);
    return finalResults;
  }

  /**
   * Quick discovery from a specific paper (similarity-based)
   */
  async discoverFromPaper(params: {
    thesis: Thesis;
    existingPapers: Paper[];
    seedPaperId: string;
    maxResults?: number;
  }): Promise<DiscoveryResult[]> {
    const { thesis, existingPapers, seedPaperId, maxResults = 15 } = params;

    const existingDOIs = new Set(existingPapers.map(p => p.doi).filter(Boolean));
    const existingTitles = new Set(existingPapers.map(p => p.title.toLowerCase()));
    const allCandidates: Map<string, SemanticScholarPaper> = new Map();

    // Get similar papers
    try {
      const similarPapers = await getSimilarPapers(seedPaperId);
      for (const paper of similarPapers) {
        const doi = paper.externalIds?.DOI;
        if ((!doi || !existingDOIs.has(doi)) &&
            !existingTitles.has(paper.title.toLowerCase()) &&
            !allCandidates.has(paper.paperId)) {
          allCandidates.set(paper.paperId, paper);
        }
      }
    } catch (error) {
      console.warn('[DiscoveryService] Similar papers failed:', error);
    }

    // Get recommendations
    try {
      const recs = await getRecommendedPapers(seedPaperId, { limit: 10 });
      for (const paper of recs) {
        const doi = paper.externalIds?.DOI;
        if ((!doi || !existingDOIs.has(doi)) &&
            !existingTitles.has(paper.title.toLowerCase()) &&
            !allCandidates.has(paper.paperId)) {
          allCandidates.set(paper.paperId, paper);
        }
      }
    } catch (error) {
      console.warn('[DiscoveryService] Recommendations failed:', error);
    }

    // Score for relevance
    const candidateList = Array.from(allCandidates.values()).slice(0, 20);
    const scores = await this.scoreRelevance({
      thesis,
      existingPapers,
      candidatePapers: candidateList.map(p => ({
        id: p.paperId,
        title: p.title,
        abstract: p.abstract,
        authors: p.authors?.map(a => a.name).join(', '),
        year: p.year,
      })),
    });

    // Build results
    const results: DiscoveryResult[] = candidateList.map(paper => {
      const score = scores.find(s => s.paperId === paper.paperId);
      return {
        paper,
        relevanceScore: score?.relevanceScore ?? 50,
        suggestedRole: score?.suggestedRole ?? 'background',
        reasoning: score?.reasoning ?? '',
        keyInsight: score?.keyInsight ?? paper.title,
        source: 'similar' as const,
      };
    });

    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);
  }

  /**
   * Check if paper is a duplicate
   */
  private isDuplicate(
    paper: SemanticScholarPaper,
    existingDOIs: Set<string | null | undefined>,
    existingTitles: Set<string>,
    candidates: Map<string, unknown>
  ): boolean {
    if (candidates.has(paper.paperId)) return true;
    if (paper.externalIds?.DOI && existingDOIs.has(paper.externalIds.DOI)) return true;
    if (existingTitles.has(paper.title.toLowerCase())) return true;
    return false;
  }

  /**
   * Default search strategies when AI is unavailable
   */
  private getDefaultStrategies(thesis: Thesis): SearchStrategy[] {
    // Extract key terms from thesis title
    const titleWords = thesis.title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !['with', 'from', 'that', 'this', 'have', 'been'].includes(w));

    const mainTerms = titleWords.slice(0, 3).join(' ');

    return [
      {
        query: mainTerms,
        rationale: 'Core thesis topic search',
        expectedRole: 'supports',
        priority: 'high',
        gapType: 'supporting-evidence',
      },
      {
        query: `${mainTerms} review`,
        rationale: 'Find review papers for background',
        expectedRole: 'background',
        priority: 'medium',
        gapType: 'foundational',
      },
      {
        query: `${mainTerms} ${new Date().getFullYear()}`,
        rationale: 'Recent publications',
        expectedRole: 'supports',
        priority: 'medium',
        gapType: 'recent-work',
      },
    ];
  }
}

// Singleton instance
let serviceInstance: DiscoveryService | null = null;

/**
 * Get or create discovery service
 */
export function getDiscoveryService(settings: AISettings): DiscoveryService {
  if (!serviceInstance) {
    serviceInstance = new DiscoveryService(settings);
  } else {
    serviceInstance.updateSettings(settings);
  }
  return serviceInstance;
}

export type { SearchStrategy, PaperRelevanceScore };
