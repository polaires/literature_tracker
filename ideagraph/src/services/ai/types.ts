// AI Service Types for IdeaGraph Phase 3

import type { ConnectionType, ThesisRole, Argument, Evidence } from '../../types';

// =============================================================================
// Provider Types
// =============================================================================

export type AIProviderType = 'claude' | 'openai' | 'ollama' | 'mock';
export type AIModelTier = 'fast' | 'standard' | 'advanced';

export interface AIModelConfig {
  provider: AIProviderType;
  model: string;
  maxTokens: number;
  temperature: number;
}

// Available Claude models with descriptions
export const CLAUDE_MODELS = {
  'claude-3-5-sonnet-20241022': {
    name: 'Claude 3.5 Sonnet',
    description: 'Best balance of speed and quality',
    tier: 'standard' as const,
    contextWindow: 200000,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
  },
  'claude-3-opus-20240229': {
    name: 'Claude 3 Opus',
    description: 'Most capable, best for complex analysis',
    tier: 'advanced' as const,
    contextWindow: 200000,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.075,
  },
  'claude-3-haiku-20240307': {
    name: 'Claude 3 Haiku',
    description: 'Fastest, most cost-effective',
    tier: 'fast' as const,
    contextWindow: 200000,
    costPer1kInput: 0.00025,
    costPer1kOutput: 0.00125,
  },
} as const;

export type ClaudeModelId = keyof typeof CLAUDE_MODELS;

// Model configurations for different tasks
export const AI_MODELS = {
  // Fast tasks: takeaway refinement, evidence classification
  fast: {
    provider: 'claude' as const,
    model: 'claude-3-haiku-20240307' as ClaudeModelId,
    maxTokens: 1024,
    temperature: 0.3,
  },
  // Standard tasks: connection suggestions, argument extraction
  standard: {
    provider: 'claude' as const,
    model: 'claude-3-5-sonnet-20241022' as ClaudeModelId,
    maxTokens: 2048,
    temperature: 0.3,
  },
  // Advanced tasks: gap analysis, review generation
  advanced: {
    provider: 'claude' as const,
    model: 'claude-3-5-sonnet-20241022' as ClaudeModelId,
    maxTokens: 4096,
    temperature: 0.4,
  },
} as const;

// Task-specific model assignment (user can override)
export type AITaskModelAssignment = {
  connectionSuggestions: ClaudeModelId;
  takeawaySuggestions: ClaudeModelId;
  argumentExtraction: ClaudeModelId;
  gapAnalysis: ClaudeModelId;
  reviewGeneration: ClaudeModelId;
};

export const DEFAULT_TASK_MODELS: AITaskModelAssignment = {
  connectionSuggestions: 'claude-3-5-sonnet-20241022',
  takeawaySuggestions: 'claude-3-haiku-20240307',
  argumentExtraction: 'claude-3-haiku-20240307',
  gapAnalysis: 'claude-3-5-sonnet-20241022',
  reviewGeneration: 'claude-3-5-sonnet-20241022',
};

// =============================================================================
// Completion Types
// =============================================================================

export interface CompletionOptions {
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
  systemPrompt?: string;
  signal?: AbortSignal; // For cancellation support
}

export interface CompletionResult {
  text: string;
  tokensUsed: {
    input: number;
    output: number;
  };
  finishReason: 'complete' | 'length' | 'stop' | 'error';
  model: string;
  latencyMs: number;
}

// =============================================================================
// Suggestion Types
// =============================================================================

export interface ConnectionSuggestion {
  id: string;
  targetPaperId: string;
  suggestedPaperId: string;
  suggestedPaperTitle: string;
  connectionType: ConnectionType;
  confidence: number; // 0.0 - 1.0
  reasoning: string;
  evidence: SuggestionEvidence[];
  source: 'citation-network' | 'takeaway-similarity' | 'argument-match' | 'combined';
  createdAt: string;
}

export interface SuggestionEvidence {
  type: 'takeaway' | 'argument' | 'citation' | 'abstract';
  paperId: string;
  text: string;
  relevance: string;
}

export interface TakeawaySuggestion {
  id: string;
  paperId: string;
  suggestion: string;
  confidence: number;
  reasoning: string;
  alternatives: string[];
  basedOn: {
    thesis: boolean;
    abstract: boolean;
    relatedPapers: string[];
    highlights?: boolean;
  };
  createdAt: string;
}

export interface ArgumentSuggestion {
  id: string;
  paperId: string;
  claim: string;
  strengthSuggestion: 'strong' | 'moderate' | 'weak' | null;
  confidence: number;
  evidenceSnippets: string[];
  evidenceType: 'experimental' | 'computational' | 'theoretical' | 'meta-analysis' | 'other';
  source: 'abstract' | 'highlights' | 'combined';
}

export interface GapSuggestion {
  id: string;
  thesisId: string;
  type: 'knowledge' | 'methodological' | 'population' | 'theoretical' | 'temporal' | 'geographic' | 'contradictory';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  relatedPaperIds: string[];
  futureResearchQuestion: string;
  evidenceSource: 'rule-based' | 'ai-inferred' | 'combined';
  createdAt: string;
}

export interface ReviewSectionDraft {
  id: string;
  themeId: string;
  themeName: string;
  content: string;
  citationsUsed: string[]; // "Author, Year" format
  wordCount: number;
  confidence: number;
  expansionSuggestions: string[];
  createdAt: string;
}

// =============================================================================
// Context Types (for prompt assembly)
// =============================================================================

export interface ThesisContext {
  id: string;
  title: string;
  description: string;
}

export interface PaperContext {
  id: string;
  title: string;
  authors: string;
  year: number | null;
  abstract: string | null;
  takeaway: string;
  thesisRole: ThesisRole;
  arguments: Argument[];
  evidence: Evidence[];
}

export interface ConnectionContext {
  fromPaperId: string;
  fromPaperTitle: string;
  toPaperId: string;
  toPaperTitle: string;
  type: ConnectionType;
  note: string | null;
}

export interface HighlightContext {
  text: string;
  comment: string | null;
  color: string;
  pageNumber?: number;
}

// Full context for AI calls
export interface AIRequestContext {
  thesis: ThesisContext;
  targetPaper?: PaperContext;
  relatedPapers: PaperContext[];
  existingConnections: ConnectionContext[];
  citationData?: {
    papersCitedByTarget: string[];
    papersCitingTarget: string[];
  };
  highlights?: HighlightContext[];
}

// =============================================================================
// Settings Types
// =============================================================================

export interface AISettings {
  // Provider configuration
  provider: AIProviderType;
  apiKey: string | null; // Stored encrypted
  apiBaseUrl: string | null; // Custom API endpoint (for third-party providers like OneAPI)
  customModelName: string | null; // Custom model name for third-party providers (e.g., "claude-3-sonnet")
  ollamaEndpoint: string | null; // For local inference

  // Feature toggles
  enableConnectionSuggestions: boolean;
  enableTakeawaySuggestions: boolean;
  enableArgumentExtraction: boolean;
  enableGapAnalysis: boolean;
  enableReviewGeneration: boolean;

  // Phase 3 feature toggles
  enableRetractionChecking: boolean;
  enableSemanticSearch: boolean;
  enableFeedbackLearning: boolean;
  enablePlanBasedGaps: boolean;

  // Behavior settings
  autoSuggestOnPaperAdd: boolean;
  suggestionConfidenceThreshold: number; // 0.0 - 1.0, default 0.6
  maxSuggestionsPerRequest: number; // default 5

  // Privacy settings
  sendAbstractsToAI: boolean;
  sendHighlightsToAI: boolean;

  // Model preferences
  preferFastModel: boolean; // Use Haiku when possible
  defaultModel: ClaudeModelId; // Default model for all tasks
  taskModels: AITaskModelAssignment; // Per-task model overrides
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'claude',
  apiKey: null,
  apiBaseUrl: null, // null means use official Anthropic API
  customModelName: null, // null means use default model names
  ollamaEndpoint: null,

  enableConnectionSuggestions: true,
  enableTakeawaySuggestions: true,
  enableArgumentExtraction: true,
  enableGapAnalysis: true,
  enableReviewGeneration: true,

  enableRetractionChecking: true,
  enableSemanticSearch: false,
  enableFeedbackLearning: true,
  enablePlanBasedGaps: false,

  autoSuggestOnPaperAdd: false,
  suggestionConfidenceThreshold: 0.6,
  maxSuggestionsPerRequest: 5,

  sendAbstractsToAI: true,
  sendHighlightsToAI: true,

  preferFastModel: false,
  defaultModel: 'claude-3-5-sonnet-20241022',
  taskModels: { ...DEFAULT_TASK_MODELS },
};

// =============================================================================
// Feedback & History Types
// =============================================================================

export type SuggestionAction = 'accepted' | 'edited' | 'dismissed';
export type SuggestionType = 'connection' | 'takeaway' | 'argument' | 'gap' | 'review';

export interface SuggestionRecord {
  id: string;
  type: SuggestionType;
  suggestionId: string;
  action: SuggestionAction;
  originalSuggestion: object;
  editedTo?: object;
  feedbackNote?: string;
  timestamp: string;
}

// =============================================================================
// Task Queue Types
// =============================================================================

export type AITaskType =
  | 'connection-scan'
  | 'takeaway-suggest'
  | 'argument-extract'
  | 'gap-analysis'
  | 'review-generation';

export type AITaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface AITask {
  id: string;
  type: AITaskType;
  thesisId: string;
  targetPaperId?: string;
  status: AITaskStatus;
  progress: number; // 0-100
  result?: object;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

// =============================================================================
// Error Types
// =============================================================================

export type AIErrorCode =
  | 'RATE_LIMITED'
  | 'INVALID_API_KEY'
  | 'CONTEXT_TOO_LONG'
  | 'PARSE_ERROR'
  | 'NETWORK_ERROR'
  | 'PROVIDER_ERROR'
  | 'NOT_CONFIGURED'
  | 'FEATURE_DISABLED'
  | 'INVALID_INPUT';

export class AIError extends Error {
  code: AIErrorCode;
  retryable: boolean;
  retryAfterMs?: number;

  constructor(code: AIErrorCode, message: string, retryable = false, retryAfterMs?: number) {
    super(message);
    this.name = 'AIError';
    this.code = code;
    this.retryable = retryable;
    this.retryAfterMs = retryAfterMs;
  }
}

// =============================================================================
// Provider Interface
// =============================================================================

export interface AIProvider {
  name: string;
  isConfigured(): boolean;

  // Core completion
  complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;

  // Structured JSON output
  completeJSON<T>(
    prompt: string,
    options?: CompletionOptions
  ): Promise<{ data: T; completion: CompletionResult }>;

  // Token estimation
  estimateTokens(text: string): number;

  // Health check
  testConnection(): Promise<boolean>;
}
