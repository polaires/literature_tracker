// Suggestion Manager
// Orchestrates AI suggestions across all feature types

import type {
  AIProvider,
  AISettings,
  ConnectionSuggestion,
  TakeawaySuggestion,
  ArgumentSuggestion,
  GapSuggestion,
  SuggestionRecord,
  CompletionOptions,
} from '../types';
import { AI_MODELS, AIError } from '../types';
import { getAIProvider } from '../providers';
import {
  buildAIContext,
  getRelevantPapers,
  trimContextToBudget,
} from '../context';
import {
  CONNECTION_SYSTEM_PROMPT,
  buildConnectionSuggestionPrompt,
  parseConnectionSuggestions,
  TAKEAWAY_SYSTEM_PROMPT,
  buildTakeawaySuggestionPrompt,
  buildTakeawayRefinementPrompt,
  parseTakeawaySuggestion,
  ARGUMENT_SYSTEM_PROMPT,
  buildArgumentExtractionPrompt,
  parseArgumentSuggestions,
  GAP_ANALYSIS_SYSTEM_PROMPT,
  buildGapAnalysisPrompt,
  parseGapSuggestions,
  PAPER_INTAKE_SYSTEM_PROMPT,
  buildPaperIntakePrompt,
  parsePaperIntakeAnalysis,
  type PaperIntakeAnalysis,
  SCREENING_SYSTEM_PROMPT,
  buildScreeningPrompt,
  parseScreeningSuggestions,
  type ScreeningSuggestion,
} from '../prompts';
import type { Thesis, Paper, Connection, PDFAnnotation } from '../../../types';

// Maximum context tokens for different operations
const MAX_CONTEXT_TOKENS = {
  connection: 8000,
  takeaway: 4000,
  argument: 4000,
  gap: 12000,
  intake: 6000,
  screening: 8000,
};

/**
 * AI Suggestion Manager
 * Central orchestrator for all AI-powered suggestion features
 */
export class SuggestionManager {
  private settings: AISettings;
  private provider: AIProvider;
  private suggestionHistory: SuggestionRecord[] = [];

  constructor(settings: AISettings) {
    this.settings = settings;
    this.provider = getAIProvider(settings);
  }

  /**
   * Update settings and refresh provider
   */
  updateSettings(settings: AISettings): void {
    this.settings = settings;
    this.provider = getAIProvider(settings);
  }

  /**
   * Check if AI features are available
   */
  isAvailable(): boolean {
    return this.provider.isConfigured();
  }

  /**
   * Test the AI connection
   */
  async testConnection(): Promise<boolean> {
    return this.provider.testConnection();
  }

  // ===========================================================================
  // CONNECTION SUGGESTIONS
  // ===========================================================================

  /**
   * Suggest connections for a specific paper
   */
  async suggestConnectionsForPaper(params: {
    thesis: Thesis;
    papers: Paper[];
    connections: Connection[];
    targetPaperId: string;
    annotations?: PDFAnnotation[];
    maxSuggestions?: number;
  }): Promise<ConnectionSuggestion[]> {
    if (!this.settings.enableConnectionSuggestions) {
      throw new AIError('FEATURE_DISABLED', 'Connection suggestions are disabled in settings', false);
    }

    const { thesis, papers, connections, targetPaperId, annotations, maxSuggestions } = params;

    // Find the target paper
    const targetPaper = papers.find(p => p.id === targetPaperId);
    if (!targetPaper) {
      throw new AIError('INVALID_INPUT', `Target paper not found: ${targetPaperId}`, false);
    }

    // Get relevant papers for context (this excludes target paper)
    const relevantPapers = getRelevantPapers(targetPaperId, papers, connections, 15);

    // Include target paper in the papers array for context building
    const papersForContext = [targetPaper, ...relevantPapers.filter(p => p.id !== targetPaperId)];

    // Build context
    let context = buildAIContext({
      thesis,
      papers: papersForContext,
      connections,
      targetPaperId,
      annotations,
    });

    // Trim to budget
    context = trimContextToBudget(context, MAX_CONTEXT_TOKENS.connection);

    // Build prompt
    const prompt = buildConnectionSuggestionPrompt(context);

    // Get completion
    const options: CompletionOptions = {
      systemPrompt: CONNECTION_SYSTEM_PROMPT,
      maxTokens: AI_MODELS.standard.maxTokens,
      temperature: AI_MODELS.standard.temperature,
    };

    const { data } = await this.provider.completeJSON<unknown[]>(prompt, options);

    // Parse and filter suggestions
    let suggestions = parseConnectionSuggestions(
      data,
      targetPaperId,
      papers.map(p => ({ id: p.id, title: p.title }))
    );

    // Apply confidence threshold
    suggestions = suggestions.filter(
      s => s.confidence >= this.settings.suggestionConfidenceThreshold
    );

    // Limit suggestions
    const limit = maxSuggestions ?? this.settings.maxSuggestionsPerRequest;
    return suggestions.slice(0, limit);
  }

  // ===========================================================================
  // TAKEAWAY SUGGESTIONS
  // ===========================================================================

  /**
   * Suggest a takeaway for a paper
   */
  async suggestTakeaway(params: {
    thesis: Thesis;
    papers: Paper[];
    targetPaper: Partial<Paper> & { title: string; abstract?: string | null };
    annotations?: PDFAnnotation[];
  }): Promise<TakeawaySuggestion> {
    if (!this.settings.enableTakeawaySuggestions) {
      throw new AIError('FEATURE_DISABLED', 'Takeaway suggestions are disabled in settings', false);
    }

    const { thesis, papers, targetPaper, annotations } = params;

    // Create a temporary paper context
    const tempPaper: Paper = {
      id: targetPaper.id || 'temp-paper',
      thesisId: thesis.id,
      title: targetPaper.title,
      authors: targetPaper.authors || [],
      year: targetPaper.year || null,
      doi: targetPaper.doi || null,
      journal: targetPaper.journal || null,
      volume: null,
      issue: null,
      pages: null,
      abstract: this.settings.sendAbstractsToAI ? (targetPaper.abstract || null) : null,
      url: null,
      pdfUrl: null,
      citationCount: null,
      takeaway: '',
      arguments: [],
      evidence: [],
      assessment: null,
      thesisRole: targetPaper.thesisRole || 'background',
      readingStatus: 'reading',
      tags: [],
      addedAt: new Date().toISOString(),
      readAt: null,
      lastAccessedAt: new Date().toISOString(),
      source: 'manual',
      rawBibtex: null,
      // Screening workflow fields
      screeningDecision: 'pending',
      exclusionReason: null,
      exclusionNote: null,
      screenedAt: null,
      semanticScholarId: null,
    };

    // Build context with related papers only
    const context = buildAIContext({
      thesis,
      papers: [...papers.slice(0, 5), tempPaper],
      connections: [],
      targetPaperId: tempPaper.id,
      annotations: this.settings.sendHighlightsToAI ? annotations : undefined,
    });

    // Build prompt
    const prompt = buildTakeawaySuggestionPrompt(context);

    // Use fast model for takeaway suggestions
    const options: CompletionOptions = {
      systemPrompt: TAKEAWAY_SYSTEM_PROMPT,
      maxTokens: AI_MODELS.fast.maxTokens,
      temperature: AI_MODELS.fast.temperature,
    };

    const { data } = await this.provider.completeJSON<Record<string, unknown>>(prompt, options);

    return parseTakeawaySuggestion(data, tempPaper.id, context);
  }

  /**
   * Refine an existing takeaway
   */
  async refineTakeaway(params: {
    thesis: Thesis;
    papers: Paper[];
    targetPaper: Paper;
    currentTakeaway: string;
  }): Promise<TakeawaySuggestion> {
    if (!this.settings.enableTakeawaySuggestions) {
      throw new AIError('FEATURE_DISABLED', 'Takeaway suggestions are disabled in settings', false);
    }

    const { thesis, papers, targetPaper, currentTakeaway } = params;

    const context = buildAIContext({
      thesis,
      papers: papers.slice(0, 5),
      connections: [],
      targetPaperId: targetPaper.id,
    });

    const prompt = buildTakeawayRefinementPrompt(context, currentTakeaway);

    const options: CompletionOptions = {
      systemPrompt: TAKEAWAY_SYSTEM_PROMPT,
      maxTokens: AI_MODELS.fast.maxTokens,
      temperature: AI_MODELS.fast.temperature,
    };

    const { data } = await this.provider.completeJSON<Record<string, unknown>>(prompt, options);

    return parseTakeawaySuggestion(data, targetPaper.id, context);
  }

  // ===========================================================================
  // ARGUMENT EXTRACTION
  // ===========================================================================

  /**
   * Extract arguments from a paper
   */
  async extractArguments(params: {
    thesis: Thesis;
    paper: Paper;
    annotations?: PDFAnnotation[];
  }): Promise<ArgumentSuggestion[]> {
    if (!this.settings.enableArgumentExtraction) {
      throw new AIError('FEATURE_DISABLED', 'Argument extraction is disabled in settings', false);
    }

    const { thesis, paper, annotations } = params;

    const context = buildAIContext({
      thesis,
      papers: [paper],
      connections: [],
      targetPaperId: paper.id,
      annotations: this.settings.sendHighlightsToAI ? annotations : undefined,
    });

    const prompt = buildArgumentExtractionPrompt(context);

    const options: CompletionOptions = {
      systemPrompt: ARGUMENT_SYSTEM_PROMPT,
      maxTokens: AI_MODELS.fast.maxTokens,
      temperature: AI_MODELS.fast.temperature,
    };

    const { data } = await this.provider.completeJSON<unknown[]>(prompt, options);

    return parseArgumentSuggestions(data, paper.id);
  }

  // ===========================================================================
  // GAP ANALYSIS
  // ===========================================================================

  /**
   * Analyze gaps in literature coverage
   */
  async analyzeGaps(params: {
    thesis: Thesis;
    papers: Paper[];
    connections: Connection[];
  }): Promise<GapSuggestion[]> {
    if (!this.settings.enableGapAnalysis) {
      throw new AIError('FEATURE_DISABLED', 'Gap analysis is disabled in settings', false);
    }

    const { thesis, papers, connections } = params;

    let context = buildAIContext({
      thesis,
      papers,
      connections,
    });

    // Trim to budget for gap analysis (needs more context)
    context = trimContextToBudget(context, MAX_CONTEXT_TOKENS.gap);

    const prompt = buildGapAnalysisPrompt(context);

    // Use advanced model for gap analysis
    const options: CompletionOptions = {
      systemPrompt: GAP_ANALYSIS_SYSTEM_PROMPT,
      maxTokens: AI_MODELS.advanced.maxTokens,
      temperature: AI_MODELS.advanced.temperature,
    };

    const { data } = await this.provider.completeJSON<unknown[]>(prompt, options);

    let gaps = parseGapSuggestions(data, thesis.id);

    // Apply confidence threshold
    gaps = gaps.filter(g => g.confidence >= this.settings.suggestionConfidenceThreshold);

    return gaps;
  }

  // ===========================================================================
  // UNIFIED PAPER INTAKE
  // ===========================================================================

  /**
   * Analyze a new paper comprehensively: role, takeaway, arguments, relevance
   * This is the recommended entry point for adding new papers with AI assistance
   */
  async analyzePaperForIntake(params: {
    thesis: Thesis;
    existingPapers: Paper[];
    newPaper: {
      id?: string;
      title: string;
      abstract: string | null;
      authors?: { name: string }[];
      year?: number | null;
      journal?: string | null;
      tldr?: string | null;
    };
  }): Promise<PaperIntakeAnalysis> {
    const { thesis, existingPapers, newPaper } = params;

    // Build the intake prompt
    const prompt = buildPaperIntakePrompt({
      thesis: {
        title: thesis.title,
        description: thesis.description,
      },
      newPaper: {
        id: newPaper.id,
        title: newPaper.title,
        abstract: this.settings.sendAbstractsToAI ? newPaper.abstract : null,
        authors: newPaper.authors,
        year: newPaper.year,
        journal: newPaper.journal,
        tldr: newPaper.tldr,
      },
      existingPapers: existingPapers.map(p => ({
        id: p.id,
        title: p.title,
        takeaway: p.takeaway,
        thesisRole: p.thesisRole,
        year: p.year,
      })),
    });

    // Use standard model for comprehensive analysis
    const options: CompletionOptions = {
      systemPrompt: PAPER_INTAKE_SYSTEM_PROMPT,
      maxTokens: AI_MODELS.standard.maxTokens,
      temperature: AI_MODELS.standard.temperature,
    };

    const { data } = await this.provider.completeJSON<Record<string, unknown>>(prompt, options);

    return parsePaperIntakeAnalysis(
      data,
      newPaper.id || `temp-${Date.now()}`,
      existingPapers.map(p => ({ id: p.id, title: p.title }))
    );
  }

  // ===========================================================================
  // SCREENING SUGGESTIONS
  // ===========================================================================

  /**
   * Get screening suggestions for a batch of candidate papers
   */
  async suggestScreeningDecisions(params: {
    thesis: Thesis;
    existingPapers: Paper[];
    candidatePapers: Array<{
      id: string;
      title: string;
      abstract: string | null;
      authors?: string;
      year?: number | null;
    }>;
  }): Promise<ScreeningSuggestion[]> {
    const { thesis, existingPapers, candidatePapers } = params;

    if (candidatePapers.length === 0) {
      return [];
    }

    // Build the screening prompt
    const prompt = buildScreeningPrompt({
      thesis: {
        title: thesis.title,
        description: thesis.description,
      },
      existingPapers: existingPapers.map(p => ({
        title: p.title,
        takeaway: p.takeaway,
        thesisRole: p.thesisRole,
      })),
      candidatePapers: candidatePapers.map(p => ({
        id: p.id,
        title: p.title,
        abstract: this.settings.sendAbstractsToAI ? p.abstract : null,
        authors: p.authors,
        year: p.year,
      })),
    });

    // Use standard model for screening
    const options: CompletionOptions = {
      systemPrompt: SCREENING_SYSTEM_PROMPT,
      maxTokens: AI_MODELS.standard.maxTokens,
      temperature: AI_MODELS.fast.temperature, // Lower temp for consistent decisions
    };

    const { data } = await this.provider.completeJSON<unknown[]>(prompt, options);

    let suggestions = parseScreeningSuggestions(
      data,
      candidatePapers.map(p => p.id)
    );

    // Apply confidence threshold
    suggestions = suggestions.filter(
      s => s.confidence >= this.settings.suggestionConfidenceThreshold
    );

    return suggestions;
  }

  // ===========================================================================
  // FEEDBACK & HISTORY
  // ===========================================================================

  /**
   * Record user feedback on a suggestion
   */
  recordFeedback(
    suggestionId: string,
    type: 'connection' | 'takeaway' | 'argument' | 'gap',
    action: 'accepted' | 'edited' | 'dismissed',
    originalSuggestion: object,
    editedTo?: object,
    note?: string
  ): void {
    const record: SuggestionRecord = {
      id: `feedback-${Date.now()}`,
      type,
      suggestionId,
      action,
      originalSuggestion,
      editedTo,
      feedbackNote: note,
      timestamp: new Date().toISOString(),
    };

    this.suggestionHistory.push(record);

    // Keep only last 100 records in memory
    if (this.suggestionHistory.length > 100) {
      this.suggestionHistory = this.suggestionHistory.slice(-100);
    }

    // Could persist to localStorage or send to analytics
    console.log('[SuggestionManager] Feedback recorded:', record);
  }

  /**
   * Get suggestion history
   */
  getHistory(): SuggestionRecord[] {
    return [...this.suggestionHistory];
  }

  /**
   * Clear suggestion history
   */
  clearHistory(): void {
    this.suggestionHistory = [];
  }
}

// Singleton instance
let managerInstance: SuggestionManager | null = null;

/**
 * Get or create the suggestion manager singleton
 */
export function getSuggestionManager(settings: AISettings): SuggestionManager {
  if (!managerInstance) {
    managerInstance = new SuggestionManager(settings);
  } else {
    managerInstance.updateSettings(settings);
  }
  return managerInstance;
}

/**
 * Reset the manager (useful for testing)
 */
export function resetSuggestionManager(): void {
  managerInstance = null;
}
