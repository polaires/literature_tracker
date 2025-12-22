// Context Assembly Exports

export {
  buildAIContext,
  buildPaperContext,
  buildConnectionContext,
  buildHighlightContext,
  estimateContextTokens,
  trimContextToBudget,
  getRelevantPapers,
} from './assembler';

export {
  getCollectionTier,
  getAdaptivePromptEnhancements,
  shouldAutoTriggerAI,
  getColdStartMessage,
  type CollectionTier,
  type AdaptiveConfig,
} from './adaptive';
