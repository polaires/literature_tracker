// Storage Module - Data persistence and migration for IdeaGraph
export {
  CURRENT_VERSION,
  VERSION_KEY,
  STORAGE_KEY,
  type StorageVersion,
  type Migration,
  type MigrationResult,
  getStorageVersion,
  setStorageVersion,
  runMigrations,
  needsMigration,
  getPendingMigrations,
  resetVersion,
  ensureMigrated,
  getMigrationResult,
} from './migrations';

export {
  storageQuotaMonitor,
  type StorageQuotaInfo,
  type StorageBreakdown,
  type QuotaWarning,
} from './quotaMonitor';

export {
  multiTabSync,
  type TabSyncMessage,
  type TabSyncHandler,
} from './multiTabSync';
