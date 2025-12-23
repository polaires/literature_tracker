// Cache Module - Centralized caching for IdeaGraph
export {
  cacheManager,
  type CacheConfig,
  type CacheEntry,
  type CacheStats,
  type CacheType,
  CACHE_CONFIGS,
  // Convenience functions
  cacheSimilarPapers,
  getCachedSimilarPapers,
  cacheEmbedding,
  getCachedEmbedding,
  cachePaperMetadata,
  getCachedPaperMetadata,
  cacheSearchResults,
  getCachedSearchResults,
} from './cacheManager';
