// AI Service Layer - Main Entry Point
// IdeaGraph Phase 3: AI-Powered Suggestions

/**
 * AI Service Architecture
 * =======================
 *
 * This module provides AI-powered features for IdeaGraph:
 *
 * 1. Connection Suggestions - Identify intellectual relationships between papers
 * 2. Takeaway Suggestions - Generate context-aware paper insights
 * 3. Argument Extraction - Extract claims and evidence from abstracts
 * 4. Gap Analysis - Identify missing perspectives in literature
 *
 * Key Principles:
 * - AI suggestions are grounded in user's own synthesis (takeaways, arguments)
 * - All suggestions require human confirmation before being saved
 * - Privacy controls allow users to limit what data is sent to AI
 * - Supports multiple providers (Claude, OpenAI, Ollama)
 *
 * Usage:
 * ```typescript
 * import { getSuggestionManager, DEFAULT_AI_SETTINGS } from './services/ai';
 *
 * // Get the suggestion manager
 * const manager = getSuggestionManager(settings);
 *
 * // Check if AI is available
 * if (manager.isAvailable()) {
 *   // Get connection suggestions
 *   const suggestions = await manager.suggestConnectionsForPaper({
 *     thesis,
 *     papers,
 *     connections,
 *     targetPaperId: 'paper-123',
 *   });
 * }
 * ```
 */

// Types
export type {
  // Provider types
  AIProviderType,
  AIModelTier,
  AIModelConfig,

  // Completion types
  CompletionOptions,
  CompletionResult,

  // Suggestion types
  ConnectionSuggestion,
  TakeawaySuggestion,
  ArgumentSuggestion,
  GapSuggestion,
  ReviewSectionDraft,
  SuggestionEvidence,

  // Context types
  AIRequestContext,
  ThesisContext,
  PaperContext,
  ConnectionContext,
  HighlightContext,

  // Settings types
  AISettings,
  ClaudeModelId,
  AITaskModelAssignment,

  // Feedback types
  SuggestionAction,
  SuggestionType,
  SuggestionRecord,

  // Task types
  AITaskType,
  AITaskStatus,
  AITask,

  // Error types
  AIErrorCode,

  // Provider interface
  AIProvider,
} from './types';

export {
  AI_MODELS,
  DEFAULT_AI_SETTINGS,
  AIError,
  CLAUDE_MODELS,
  DEFAULT_TASK_MODELS,
} from './types';

// Providers
export {
  getAIProvider,
  createAIProvider,
  clearProviderCache,
  isProviderAvailable,
  getProviderDisplayName,
  getAvailableProviders,
  ClaudeProvider,
  createClaudeProvider,
  MockAIProvider,
  createMockProvider,
} from './providers';

// Context Assembly
export {
  buildAIContext,
  buildPaperContext,
  buildConnectionContext,
  buildHighlightContext,
  estimateContextTokens,
  trimContextToBudget,
  getRelevantPapers,
} from './context';

// Suggestion Manager
export {
  SuggestionManager,
  getSuggestionManager,
  resetSuggestionManager,
} from './suggestions';

// Prompts (for advanced usage / customization)
export {
  CONNECTION_SYSTEM_PROMPT,
  buildConnectionSuggestionPrompt,
  buildBulkConnectionPrompt,
  parseConnectionSuggestions,
  TAKEAWAY_SYSTEM_PROMPT,
  buildTakeawaySuggestionPrompt,
  buildTakeawayRefinementPrompt,
  parseTakeawaySuggestion,
  ARGUMENT_SYSTEM_PROMPT,
  buildArgumentExtractionPrompt,
  buildEvidenceClassificationPrompt,
  parseArgumentSuggestions,
  GAP_ANALYSIS_SYSTEM_PROMPT,
  buildGapAnalysisPrompt,
  parseGapSuggestions,
} from './prompts';
