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
