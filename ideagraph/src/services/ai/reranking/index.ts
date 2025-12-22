// LLM Re-Ranking Service
// Uses LLM to re-rank initial candidates for higher quality suggestions
// Based on PaperQA2's re-ranking approach

import { getSuggestionManager, AI_MODELS, type AISettings } from '../index';
import type { Thesis, Paper, ConnectionType } from '../../../types';

/**
 * Re-ranking result with adjusted scores and reasoning
 */
export interface RerankedItem<T> {
  original: T;
  adjustedScore: number;
  originalScore: number;
  rankChange: number; // Positive = moved up, negative = moved down
  reasoning: string;
}

/**
 * Connection candidate for re-ranking
 */
export interface ConnectionCandidate {
  fromPaperId: string;
  toPaperId: string;
  fromPaperTitle: string;
  toPaperTitle: string;
  connectionType: ConnectionType;
  initialScore: number;
  initialReasoning: string;
}

/**
 * Paper candidate for re-ranking (discovery results)
 */
export interface PaperCandidate {
  paperId: string;
  title: string;
  abstract: string | null;
  year: number | null;
  initialScore: number;
  suggestedRole?: string;
}

/**
 * System prompt for connection re-ranking
 */
const CONNECTION_RERANK_SYSTEM_PROMPT = `You are an expert research librarian helping validate and re-rank suggested connections between academic papers.

Your role is to:
1. Evaluate if the suggested connection type is appropriate
2. Assess the strength and validity of the connection
3. Re-score connections based on how useful they would be for the researcher's thesis

Scoring guidelines:
- 90-100: Essential connection, directly impacts thesis understanding
- 70-89: Strong connection, provides valuable intellectual link
- 50-69: Moderate connection, adds some value but not critical
- 30-49: Weak connection, questionable value
- 0-29: Incorrect or unhelpful connection`;

/**
 * System prompt for paper re-ranking
 */
const PAPER_RERANK_SYSTEM_PROMPT = `You are an expert research librarian helping validate and re-rank candidate papers for a researcher's thesis.

Your role is to:
1. Evaluate how well each paper fits the researcher's thesis
2. Consider if the paper adds unique value vs existing collection
3. Re-score papers based on their potential contribution

Scoring guidelines:
- 90-100: Essential reading, directly addresses core thesis question
- 70-89: Highly relevant, provides valuable evidence or methods
- 50-69: Relevant, useful context for thesis
- 30-49: Marginally relevant, limited direct value
- 0-29: Not relevant to this specific thesis`;

/**
 * LLM Re-Ranking Service
 * Takes initial candidates from simpler methods and uses LLM to refine rankings
 */
export class RerankingService {
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
   * Re-rank connection suggestions using LLM
   */
  async rerankConnections(params: {
    thesis: Thesis;
    candidates: ConnectionCandidate[];
    papers: Paper[];
    maxResults?: number;
  }): Promise<RerankedItem<ConnectionCandidate>[]> {
    const { thesis, candidates, papers, maxResults = 10 } = params;

    if (candidates.length === 0) return [];

    const manager = getSuggestionManager(this.settings);
    if (!manager.isAvailable()) {
      // Return with original scores if AI unavailable
      return candidates.map((c) => ({
        original: c,
        adjustedScore: c.initialScore,
        originalScore: c.initialScore,
        rankChange: 0,
        reasoning: 'AI re-ranking unavailable',
      }));
    }

    // Build paper context map
    const paperMap = new Map(papers.map(p => [p.id, p]));

    // Format candidates for prompt
    const candidatesText = candidates.map((c, i) => {
      const fromPaper = paperMap.get(c.fromPaperId);
      const toPaper = paperMap.get(c.toPaperId);
      return `
Connection ${i + 1}:
  From: "${c.fromPaperTitle}"
  ${fromPaper ? `  Takeaway: "${fromPaper.takeaway}"` : ''}
  To: "${c.toPaperTitle}"
  ${toPaper ? `  Takeaway: "${toPaper.takeaway}"` : ''}
  Suggested Type: ${c.connectionType}
  Initial Score: ${c.initialScore}
  Initial Reasoning: ${c.initialReasoning}`;
    }).join('\n');

    const prompt = `RESEARCHER'S THESIS:
"${thesis.title}"
${thesis.description}

CANDIDATE CONNECTIONS TO RE-RANK:
${candidatesText}

Re-rank these connection suggestions. For each connection:
1. Verify the connection type is appropriate
2. Assess how valuable this connection is for the thesis
3. Provide an adjusted score (0-100) and brief reasoning

Return JSON array:
[
  {
    "index": 0,
    "adjustedScore": 0-100,
    "reasoning": "Brief explanation of score adjustment..."
  }
]

Focus on thesis relevance. Be discriminating - not all initial suggestions are good.`;

    try {
      const provider = manager['provider'];
      const { data } = await provider.completeJSON<Array<{
        index: number;
        adjustedScore: number;
        reasoning: string;
      }>>(prompt, {
        systemPrompt: CONNECTION_RERANK_SYSTEM_PROMPT,
        maxTokens: AI_MODELS.fast.maxTokens,
        temperature: 0.3, // Lower temperature for more consistent scoring
      });

      // Build result map
      const scoreMap = new Map(data.map(d => [d.index, d]));

      // Create reranked results
      const reranked: RerankedItem<ConnectionCandidate>[] = candidates.map((c, i) => {
        const score = scoreMap.get(i);
        return {
          original: c,
          adjustedScore: score?.adjustedScore ?? c.initialScore,
          originalScore: c.initialScore,
          rankChange: 0, // Will calculate after sorting
          reasoning: score?.reasoning ?? 'No re-ranking feedback',
        };
      });

      // Sort by adjusted score
      reranked.sort((a, b) => b.adjustedScore - a.adjustedScore);

      // Calculate rank changes
      const originalOrder = candidates.map(c => c);
      reranked.forEach((item, newRank) => {
        const oldRank = originalOrder.findIndex(c =>
          c.fromPaperId === item.original.fromPaperId &&
          c.toPaperId === item.original.toPaperId
        );
        item.rankChange = oldRank - newRank; // Positive = moved up
      });

      return reranked.slice(0, maxResults);
    } catch (error) {
      console.error('[RerankingService] Failed to re-rank connections:', error);
      return candidates.map(c => ({
        original: c,
        adjustedScore: c.initialScore,
        originalScore: c.initialScore,
        rankChange: 0,
        reasoning: 'Re-ranking failed',
      }));
    }
  }

  /**
   * Re-rank paper candidates using LLM
   */
  async rerankPapers(params: {
    thesis: Thesis;
    existingPapers: Paper[];
    candidates: PaperCandidate[];
    maxResults?: number;
  }): Promise<RerankedItem<PaperCandidate>[]> {
    const { thesis, existingPapers, candidates, maxResults = 20 } = params;

    if (candidates.length === 0) return [];

    const manager = getSuggestionManager(this.settings);
    if (!manager.isAvailable()) {
      return candidates.map(c => ({
        original: c,
        adjustedScore: c.initialScore,
        originalScore: c.initialScore,
        rankChange: 0,
        reasoning: 'AI re-ranking unavailable',
      }));
    }

    // Format existing papers for context
    const existingContext = existingPapers
      .slice(0, 10)
      .map(p => `- [${p.thesisRole}] "${p.title}": ${p.takeaway}`)
      .join('\n');

    // Format candidates
    const candidatesText = candidates.map((c, i) => `
Paper ${i + 1}:
  Title: "${c.title}"
  Year: ${c.year || 'Unknown'}
  Initial Score: ${c.initialScore}
  Suggested Role: ${c.suggestedRole || 'Unknown'}
  Abstract: ${c.abstract ? (c.abstract.length > 300 ? c.abstract.substring(0, 300) + '...' : c.abstract) : 'No abstract'}`
    ).join('\n');

    const prompt = `RESEARCHER'S THESIS:
"${thesis.title}"
${thesis.description}

EXISTING PAPERS IN COLLECTION:
${existingContext || 'No papers yet'}

CANDIDATE PAPERS TO RE-RANK:
${candidatesText}

Re-rank these paper candidates. For each paper:
1. How well does it address the thesis question?
2. Does it add unique value vs existing collection?
3. Is the suggested role appropriate?

Return JSON array:
[
  {
    "index": 0,
    "adjustedScore": 0-100,
    "reasoning": "Brief explanation..."
  }
]

Be discriminating - prefer papers that fill gaps in the existing collection.`;

    try {
      const provider = manager['provider'];
      const { data } = await provider.completeJSON<Array<{
        index: number;
        adjustedScore: number;
        reasoning: string;
      }>>(prompt, {
        systemPrompt: PAPER_RERANK_SYSTEM_PROMPT,
        maxTokens: AI_MODELS.standard.maxTokens,
        temperature: 0.3,
      });

      const scoreMap = new Map(data.map(d => [d.index, d]));

      const reranked: RerankedItem<PaperCandidate>[] = candidates.map((c, i) => {
        const score = scoreMap.get(i);
        return {
          original: c,
          adjustedScore: score?.adjustedScore ?? c.initialScore,
          originalScore: c.initialScore,
          rankChange: 0,
          reasoning: score?.reasoning ?? 'No re-ranking feedback',
        };
      });

      reranked.sort((a, b) => b.adjustedScore - a.adjustedScore);

      const originalOrder = [...candidates];
      reranked.forEach((item, newRank) => {
        const oldRank = originalOrder.findIndex(c => c.paperId === item.original.paperId);
        item.rankChange = oldRank - newRank;
      });

      return reranked.slice(0, maxResults);
    } catch (error) {
      console.error('[RerankingService] Failed to re-rank papers:', error);
      return candidates.map(c => ({
        original: c,
        adjustedScore: c.initialScore,
        originalScore: c.initialScore,
        rankChange: 0,
        reasoning: 'Re-ranking failed',
      }));
    }
  }

  /**
   * Quick validation of a single connection suggestion
   * Returns whether the connection should be shown to user
   */
  async validateConnection(params: {
    thesis: Thesis;
    fromPaper: Paper;
    toPaper: Paper;
    suggestedType: ConnectionType;
    initialReasoning: string;
  }): Promise<{
    isValid: boolean;
    adjustedScore: number;
    suggestedType: ConnectionType;
    reasoning: string;
  }> {
    const { thesis, fromPaper, toPaper, suggestedType, initialReasoning } = params;

    const manager = getSuggestionManager(this.settings);
    if (!manager.isAvailable()) {
      return {
        isValid: true,
        adjustedScore: 50,
        suggestedType,
        reasoning: 'AI validation unavailable',
      };
    }

    const prompt = `THESIS: "${thesis.title}"

CONNECTION TO VALIDATE:
From Paper: "${fromPaper.title}"
  Takeaway: "${fromPaper.takeaway}"
  Role: ${fromPaper.thesisRole}

To Paper: "${toPaper.title}"
  Takeaway: "${toPaper.takeaway}"
  Role: ${toPaper.thesisRole}

Suggested Connection Type: ${suggestedType}
Initial Reasoning: ${initialReasoning}

Is this connection valid and useful? Return JSON:
{
  "isValid": true/false,
  "score": 0-100,
  "correctType": "the correct connection type if different",
  "reasoning": "brief explanation"
}`;

    try {
      const provider = manager['provider'];
      const { data } = await provider.completeJSON<{
        isValid: boolean;
        score: number;
        correctType?: string;
        reasoning: string;
      }>(prompt, {
        systemPrompt: CONNECTION_RERANK_SYSTEM_PROMPT,
        maxTokens: AI_MODELS.fast.maxTokens,
        temperature: 0.2,
      });

      return {
        isValid: data.isValid && data.score >= 40,
        adjustedScore: data.score,
        suggestedType: (data.correctType || suggestedType) as ConnectionType,
        reasoning: data.reasoning,
      };
    } catch (error) {
      console.error('[RerankingService] Validation failed:', error);
      return {
        isValid: true,
        adjustedScore: 50,
        suggestedType,
        reasoning: 'Validation failed',
      };
    }
  }
}

// Singleton instance
let serviceInstance: RerankingService | null = null;

/**
 * Get or create re-ranking service
 */
export function getRerankingService(settings: AISettings): RerankingService {
  if (!serviceInstance) {
    serviceInstance = new RerankingService(settings);
  } else {
    serviceInstance.updateSettings(settings);
  }
  return serviceInstance;
}
