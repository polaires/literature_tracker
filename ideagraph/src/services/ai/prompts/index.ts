// Prompt Templates Index
// Re-exports all prompt templates and utilities

export {
  CONNECTION_SYSTEM_PROMPT,
  buildConnectionSuggestionPrompt,
  buildBulkConnectionPrompt,
  parseConnectionSuggestions,
} from './connection';

export {
  TAKEAWAY_SYSTEM_PROMPT,
  buildTakeawaySuggestionPrompt,
  buildTakeawayRefinementPrompt,
  parseTakeawaySuggestion,
} from './takeaway';

export {
  ARGUMENT_SYSTEM_PROMPT,
  buildArgumentExtractionPrompt,
  buildEvidenceClassificationPrompt,
  parseArgumentSuggestions,
} from './argument';

export {
  GAP_ANALYSIS_SYSTEM_PROMPT,
  buildGapAnalysisPrompt,
  parseGapSuggestions,
} from './gap';

export {
  PAPER_INTAKE_SYSTEM_PROMPT,
  buildPaperIntakePrompt,
  parsePaperIntakeAnalysis,
  getRelevanceLabel,
  type PaperIntakeAnalysis,
} from './intake';

export {
  DISCOVERY_SYSTEM_PROMPT,
  buildSearchStrategyPrompt,
  buildRelevanceScoringPrompt,
  parseSearchStrategies,
  parseRelevanceScores,
  type SearchStrategy,
  type PaperRelevanceScore,
} from './discovery';

export {
  SCREENING_SYSTEM_PROMPT,
  buildScreeningPrompt,
  parseScreeningSuggestions,
  type ScreeningSuggestion,
} from './screening';
