// IdeaGraph Extraction Prompts - Index
// Export all prompt modules for the 3-stage extraction pipeline

// Types and validators
export * from './types';

// Stage 1: Classification
export {
  CLASSIFICATION_SYSTEM_PROMPT,
  buildClassificationPrompt,
  parseClassificationResponse,
  estimatePageCount,
  estimateWordCount,
  detectOCRIssues,
} from './classification';

// Stage 2: Extraction
export {
  getExtractionSystemPrompt,
  buildExtractionPrompt,
  parseExtractionResponse,
  parseReviewExtractionResponse,
} from './extraction';

// Stage 3: Thesis Integration
export {
  THESIS_INTEGRATION_SYSTEM_PROMPT,
  buildThesisIntegrationPrompt,
  parseThesisIntegrationResponse,
  getRelevanceLabel,
  getRoleDescription,
  getRecommendedAction,
} from './thesisIntegration';

// Re-export useful constants and validators
export {
  VALID_GAP_TYPES,
  VALID_INTRA_CONNECTION_TYPES,
  VALID_CROSS_CONNECTION_TYPES,
  EXTRACTION_LIMITS,
  isValidGapType,
  validateGapType,
  isValidIntraConnectionType,
  isValidCrossConnectionType,
} from './types';
