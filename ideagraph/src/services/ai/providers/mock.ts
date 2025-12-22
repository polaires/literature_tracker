// Mock AI Provider for Development and Testing
// Returns deterministic responses based on prompt patterns

import { BaseAIProvider } from './base';
import type { CompletionOptions, CompletionResult, ConnectionSuggestion, TakeawaySuggestion, ArgumentSuggestion, GapSuggestion } from '../types';

export class MockAIProvider extends BaseAIProvider {
  name = 'Mock';
  private delay: number;
  private shouldFail: boolean;

  constructor(options?: { delay?: number; shouldFail?: boolean }) {
    super();
    this.delay = options?.delay ?? 500; // Simulate network delay
    this.shouldFail = options?.shouldFail ?? false;
  }

  isConfigured(): boolean {
    return true; // Mock is always configured
  }

  async complete(prompt: string, _options?: CompletionOptions): Promise<CompletionResult> {
    const startTime = Date.now();

    // Simulate network delay
    await this.sleep(this.delay);

    if (this.shouldFail) {
      throw this.createError('PROVIDER_ERROR', 'Mock provider configured to fail', true);
    }

    // Generate response based on prompt content
    const response = this.generateMockResponse(prompt);
    const latencyMs = Date.now() - startTime;

    return {
      text: response,
      tokensUsed: {
        input: this.estimateTokens(prompt),
        output: this.estimateTokens(response),
      },
      finishReason: 'complete',
      model: 'mock-model',
      latencyMs,
    };
  }

  async testConnection(): Promise<boolean> {
    await this.sleep(100);
    return !this.shouldFail;
  }

  /**
   * Generate mock responses based on prompt patterns
   */
  private generateMockResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();

    // Connection suggestions
    if (lowerPrompt.includes('connection') && lowerPrompt.includes('suggest')) {
      return JSON.stringify(this.mockConnectionSuggestions());
    }

    // Takeaway suggestions
    if (lowerPrompt.includes('takeaway') || lowerPrompt.includes('key insight')) {
      return JSON.stringify(this.mockTakeawaySuggestion());
    }

    // Argument extraction
    if (lowerPrompt.includes('argument') || lowerPrompt.includes('claim')) {
      return JSON.stringify(this.mockArgumentSuggestions());
    }

    // Gap analysis
    if (lowerPrompt.includes('gap') && lowerPrompt.includes('analyz')) {
      return JSON.stringify(this.mockGapSuggestions());
    }

    // Review generation
    if (lowerPrompt.includes('literature review') || lowerPrompt.includes('review section')) {
      return JSON.stringify(this.mockReviewSection());
    }

    // Default response
    return JSON.stringify({
      message: 'Mock response generated',
      prompt_length: prompt.length,
    });
  }

  private mockConnectionSuggestions(): Partial<ConnectionSuggestion>[] {
    return [
      {
        suggestedPaperId: 'mock-paper-1',
        suggestedPaperTitle: 'Related Study on Similar Methods',
        connectionType: 'extends',
        confidence: 0.85,
        reasoning: 'Both papers use similar methodological approaches and the second paper builds upon findings from the first.',
        evidence: [
          {
            type: 'takeaway',
            paperId: 'mock-paper-1',
            text: 'This paper extends the methodology...',
            relevance: 'Direct methodological extension',
          },
        ],
        source: 'takeaway-similarity',
      },
      {
        suggestedPaperId: 'mock-paper-2',
        suggestedPaperTitle: 'Contradicting Findings in Field X',
        connectionType: 'contradicts',
        confidence: 0.72,
        reasoning: 'The takeaways indicate opposing conclusions about the primary research question.',
        evidence: [
          {
            type: 'argument',
            paperId: 'mock-paper-2',
            text: 'The authors claim the opposite effect...',
            relevance: 'Direct contradiction of main finding',
          },
        ],
        source: 'argument-match',
      },
    ];
  }

  private mockTakeawaySuggestion(): Partial<TakeawaySuggestion> {
    return {
      suggestion: 'This paper demonstrates a novel approach to solving the research problem, providing evidence that directly supports the thesis hypothesis through rigorous experimental validation.',
      confidence: 0.82,
      reasoning: 'Based on the abstract\'s emphasis on methodology and results, combined with your thesis focus on experimental validation.',
      alternatives: [
        'The study provides key evidence supporting the hypothesis through controlled experiments.',
        'A methodological advancement is presented that enables more accurate measurements in the field.',
      ],
      basedOn: {
        thesis: true,
        abstract: true,
        relatedPapers: ['paper-1', 'paper-2'],
      },
    };
  }

  private mockArgumentSuggestions(): Partial<ArgumentSuggestion>[] {
    return [
      {
        claim: 'The proposed method achieves significantly better results than baseline approaches.',
        strengthSuggestion: 'strong',
        confidence: 0.88,
        evidenceSnippets: [
          'Results show a 25% improvement over existing methods',
          'Statistical significance was confirmed (p < 0.01)',
        ],
        evidenceType: 'experimental',
        source: 'abstract',
      },
      {
        claim: 'The approach generalizes well to unseen data.',
        strengthSuggestion: 'moderate',
        confidence: 0.65,
        evidenceSnippets: [
          'Cross-validation results indicate reasonable generalization',
        ],
        evidenceType: 'computational',
        source: 'abstract',
      },
    ];
  }

  private mockGapSuggestions(): Partial<GapSuggestion>[] {
    return [
      {
        type: 'methodological',
        title: 'Lack of Computational Validation Studies',
        description: 'Your literature collection contains primarily experimental studies. Adding computational modeling papers could strengthen the theoretical framework and provide additional validation.',
        priority: 'medium',
        confidence: 0.75,
        relatedPaperIds: ['paper-1', 'paper-3'],
        futureResearchQuestion: 'How do computational models compare to experimental observations in predicting the phenomenon?',
        evidenceSource: 'ai-inferred',
      },
      {
        type: 'temporal',
        title: 'Limited Recent Publications',
        description: 'Most papers in your collection are from before 2020. Recent advances in the field may not be represented.',
        priority: 'low',
        confidence: 0.68,
        relatedPaperIds: [],
        futureResearchQuestion: 'What recent developments have occurred in this field since 2020?',
        evidenceSource: 'ai-inferred',
      },
    ];
  }

  private mockReviewSection(): object {
    return {
      content: `The literature on this topic reveals several key themes. First, multiple studies have demonstrated the effectiveness of the proposed approach (Smith et al., 2022; Jones, 2023). These findings are supported by both experimental and computational evidence.

However, some contradictory findings exist. While the majority of research supports the hypothesis, alternative interpretations have been proposed (Brown, 2021). This suggests that further investigation may be warranted to resolve these discrepancies.

Methodologically, the field has converged on several standard approaches, though recent innovations continue to expand the toolkit available to researchers.`,
      citationsUsed: ['Smith et al., 2022', 'Jones, 2023', 'Brown, 2021'],
      wordCount: 89,
      confidence: 0.78,
      expansionSuggestions: [
        'Consider adding more detail about the methodological innovations mentioned.',
        'The contradiction with Brown (2021) could be explored in more depth.',
      ],
    };
  }
}

/**
 * Factory function to create mock provider
 */
export function createMockProvider(options?: {
  delay?: number;
  shouldFail?: boolean;
}): MockAIProvider {
  return new MockAIProvider(options);
}
