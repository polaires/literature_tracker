// useStorage Hook
// React hook for storage management, quota monitoring, and cache utilities

import { useState, useEffect, useCallback } from 'react';
import {
  storageQuotaMonitor,
  type StorageQuotaInfo,
  type StorageBreakdown,
  type QuotaWarning,
} from '../services/storage/quotaMonitor';
import { cacheManager, type CacheType, type CacheStats } from '../services/cache';
import {
  getStorageVersion,
  needsMigration,
  ensureMigrated,
  type MigrationResult,
} from '../services/storage/migrations';
import { multiTabSync } from '../services/storage/multiTabSync';

// =============================================================================
// Types
// =============================================================================

export interface StorageInfo {
  quotaInfo: StorageQuotaInfo | null;
  breakdown: StorageBreakdown | null;
  warning: QuotaWarning | null;
  cacheStats: Record<CacheType, CacheStats> | null;
  version: number;
  migrationResult: MigrationResult | null;
  isLoading: boolean;
}

export interface UseStorageReturn extends StorageInfo {
  // Refresh storage information
  refresh: () => Promise<void>;

  // Cache operations
  clearCache: (cacheType?: CacheType) => number;
  getCacheStats: (cacheType: CacheType) => CacheStats;

  // Storage report
  getReport: () => Promise<string>;

  // Cleanup suggestions
  getCleanupSuggestions: () => Promise<Array<{ action: string; savings: number; priority: 'high' | 'medium' | 'low' }>>;

  // Multi-tab info
  tabId: string;
  activeTabs: string[];
  isLeader: boolean;

  // Format helpers
  formatBytes: (bytes: number) => string;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useStorage(): UseStorageReturn {
  const [state, setState] = useState<StorageInfo>({
    quotaInfo: null,
    breakdown: null,
    warning: null,
    cacheStats: null,
    version: 0,
    migrationResult: null,
    isLoading: true,
  });

  const [activeTabs, setActiveTabs] = useState<string[]>([]);

  // Refresh storage information
  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const [quotaInfo, breakdown, warning, cacheStats] = await Promise.all([
        storageQuotaMonitor.getQuotaInfo(),
        storageQuotaMonitor.getStorageBreakdown(),
        storageQuotaMonitor.checkForWarnings(),
        Promise.resolve(cacheManager.getAllStats()),
      ]);

      const migrationResult = ensureMigrated();

      setState({
        quotaInfo,
        breakdown,
        warning,
        cacheStats,
        version: getStorageVersion(),
        migrationResult,
        isLoading: false,
      });
    } catch (e) {
      console.error('[useStorage] Failed to refresh:', e);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Clear cache
  const clearCache = useCallback((cacheType?: CacheType): number => {
    if (cacheType) {
      const cleared = cacheManager.clear(cacheType);
      multiTabSync.notifyCacheCleared(cacheType);
      return cleared;
    } else {
      const cleared = cacheManager.clearAll();
      multiTabSync.notifyCacheCleared();
      return cleared;
    }
  }, []);

  // Get cache stats for a specific type
  const getCacheStats = useCallback((cacheType: CacheType): CacheStats => {
    return cacheManager.getStats(cacheType);
  }, []);

  // Get storage report
  const getReport = useCallback(async (): Promise<string> => {
    return storageQuotaMonitor.getStorageReport();
  }, []);

  // Get cleanup suggestions
  const getCleanupSuggestions = useCallback(async () => {
    return storageQuotaMonitor.suggestCleanup();
  }, []);

  // Format bytes helper
  const formatBytes = useCallback((bytes: number): string => {
    return storageQuotaMonitor.formatBytes(bytes);
  }, []);

  // Initial load and subscription
  useEffect(() => {
    // Run migrations on first load
    ensureMigrated();

    // Initial refresh
    refresh();

    // Subscribe to quota updates
    const unsubscribeQuota = storageQuotaMonitor.subscribe((info) => {
      setState((prev) => ({
        ...prev,
        quotaInfo: info,
        warning: info.isCritical || info.isWarning
          ? { level: info.isCritical ? 'critical' : 'warning', message: '', usagePercent: info.usagePercent, suggestions: [] }
          : null,
      }));
    });

    // Start monitoring
    storageQuotaMonitor.startMonitoring(60000); // Check every minute

    // Discover tabs
    multiTabSync.discoverTabs().then(setActiveTabs);

    return () => {
      unsubscribeQuota();
      storageQuotaMonitor.stopMonitoring();
    };
  }, [refresh]);

  // Listen for cache clear events from other tabs
  useEffect(() => {
    const unsubscribe = multiTabSync.on('cache-clear', () => {
      // Refresh cache stats when another tab clears cache
      setState((prev) => ({
        ...prev,
        cacheStats: cacheManager.getAllStats(),
      }));
    });

    return unsubscribe;
  }, []);

  return {
    ...state,
    refresh,
    clearCache,
    getCacheStats,
    getReport,
    getCleanupSuggestions,
    tabId: multiTabSync.getTabId(),
    activeTabs,
    isLeader: multiTabSync.isLeaderTab(),
    formatBytes,
  };
}

export default useStorage;
