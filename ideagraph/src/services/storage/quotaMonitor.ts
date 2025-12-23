// Storage Quota Monitor for IdeaGraph
// Monitors localStorage and IndexedDB usage, warns when approaching limits

// =============================================================================
// Types
// =============================================================================

export interface StorageQuotaInfo {
  /** Total storage used in bytes */
  used: number;
  /** Estimated quota in bytes (may not be accurate on all browsers) */
  quota: number;
  /** Percentage of quota used (0-100) */
  usagePercent: number;
  /** Whether usage is approaching the limit */
  isWarning: boolean;
  /** Whether usage is critical */
  isCritical: boolean;
  /** Last check timestamp */
  lastChecked: number;
}

export interface StorageBreakdown {
  /** localStorage usage */
  localStorage: {
    used: number;
    /** Breakdown by key prefix */
    byPrefix: Record<string, number>;
  };
  /** IndexedDB usage (estimated) */
  indexedDB: {
    used: number;
    /** Breakdown by database */
    byDatabase: Record<string, number>;
  };
  /** Total across all storage types */
  total: number;
}

export interface QuotaWarning {
  level: 'info' | 'warning' | 'critical';
  message: string;
  usagePercent: number;
  suggestions: string[];
}

// =============================================================================
// Constants
// =============================================================================

/** Warning threshold (75% of quota) */
const WARNING_THRESHOLD = 0.75;

/** Critical threshold (90% of quota) */
const CRITICAL_THRESHOLD = 0.90;

/** Typical localStorage limit (5MB for most browsers) */
const TYPICAL_LOCALSTORAGE_LIMIT = 5 * 1024 * 1024;

/** IdeaGraph storage prefixes to track */
const STORAGE_PREFIXES = [
  'ideagraph-storage',      // Main Zustand store
  'ideagraph_',             // Various caches
  'ideagraph-pdfs',         // PDF storage (IndexedDB)
];

// =============================================================================
// Storage Quota Monitor Class
// =============================================================================

class StorageQuotaMonitor {
  private lastQuotaInfo: StorageQuotaInfo | null = null;
  private listeners: Set<(info: StorageQuotaInfo) => void> = new Set();
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Get current localStorage usage
   */
  getLocalStorageUsage(): { used: number; byPrefix: Record<string, number> } {
    let totalUsed = 0;
    const byPrefix: Record<string, number> = {};

    // Initialize prefix counters
    for (const prefix of STORAGE_PREFIXES) {
      byPrefix[prefix] = 0;
    }
    byPrefix['other'] = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const value = localStorage.getItem(key);
      const size = (key.length + (value?.length || 0)) * 2; // UTF-16 = 2 bytes per char
      totalUsed += size;

      // Categorize by prefix
      let matched = false;
      for (const prefix of STORAGE_PREFIXES) {
        if (key.startsWith(prefix)) {
          byPrefix[prefix] += size;
          matched = true;
          break;
        }
      }
      if (!matched) {
        byPrefix['other'] += size;
      }
    }

    return { used: totalUsed, byPrefix };
  }

  /**
   * Get IndexedDB usage (requires async)
   * Note: This is a rough estimate as exact IDB sizes aren't easily available
   */
  async getIndexedDBUsage(): Promise<{ used: number; byDatabase: Record<string, number> }> {
    const byDatabase: Record<string, number> = {};
    let totalUsed = 0;

    try {
      // Try using the Storage API if available
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        // This includes all origin storage, not just our databases
        // We'll attribute a portion to our known databases
        if (estimate.usage) {
          // Rough estimation: subtract localStorage, rest is mostly IndexedDB
          const localStorageUsage = this.getLocalStorageUsage().used;
          const idbEstimate = Math.max(0, (estimate.usage || 0) - localStorageUsage);
          byDatabase['ideagraph-pdfs'] = idbEstimate;
          totalUsed = idbEstimate;
        }
      }
    } catch {
      // Storage API not available or failed
    }

    return { used: totalUsed, byDatabase };
  }

  /**
   * Get full storage breakdown
   */
  async getStorageBreakdown(): Promise<StorageBreakdown> {
    const localStorageInfo = this.getLocalStorageUsage();
    const indexedDBInfo = await this.getIndexedDBUsage();

    return {
      localStorage: localStorageInfo,
      indexedDB: indexedDBInfo,
      total: localStorageInfo.used + indexedDBInfo.used,
    };
  }

  /**
   * Get storage quota information
   */
  async getQuotaInfo(): Promise<StorageQuotaInfo> {
    const breakdown = await this.getStorageBreakdown();
    let quota = TYPICAL_LOCALSTORAGE_LIMIT;

    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        if (estimate.quota) {
          quota = estimate.quota;
        }
      }
    } catch {
      // Use default quota
    }

    const usagePercent = (breakdown.total / quota) * 100;

    const info: StorageQuotaInfo = {
      used: breakdown.total,
      quota,
      usagePercent,
      isWarning: usagePercent >= WARNING_THRESHOLD * 100,
      isCritical: usagePercent >= CRITICAL_THRESHOLD * 100,
      lastChecked: Date.now(),
    };

    this.lastQuotaInfo = info;
    this.notifyListeners(info);

    return info;
  }

  /**
   * Get cached quota info (non-async)
   */
  getCachedQuotaInfo(): StorageQuotaInfo | null {
    return this.lastQuotaInfo;
  }

  /**
   * Generate warning if storage is running low
   */
  async checkForWarnings(): Promise<QuotaWarning | null> {
    const info = await this.getQuotaInfo();

    if (info.isCritical) {
      return {
        level: 'critical',
        message: `Storage is critically low (${info.usagePercent.toFixed(1)}% used)`,
        usagePercent: info.usagePercent,
        suggestions: [
          'Clear old paper similarity cache',
          'Remove unused paper embeddings',
          'Export and remove old theses',
          'Clear cached search results',
        ],
      };
    }

    if (info.isWarning) {
      return {
        level: 'warning',
        message: `Storage usage is high (${info.usagePercent.toFixed(1)}% used)`,
        usagePercent: info.usagePercent,
        suggestions: [
          'Consider clearing similarity cache',
          'Remove expired cache entries',
        ],
      };
    }

    return null;
  }

  /**
   * Format bytes to human-readable string
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Get human-readable storage report
   */
  async getStorageReport(): Promise<string> {
    const breakdown = await this.getStorageBreakdown();
    const info = await this.getQuotaInfo();

    const lines: string[] = [
      '=== IdeaGraph Storage Report ===',
      '',
      `Total Used: ${this.formatBytes(info.used)} / ${this.formatBytes(info.quota)} (${info.usagePercent.toFixed(1)}%)`,
      '',
      '--- LocalStorage ---',
    ];

    for (const [prefix, size] of Object.entries(breakdown.localStorage.byPrefix)) {
      if (size > 0) {
        lines.push(`  ${prefix}: ${this.formatBytes(size)}`);
      }
    }

    lines.push('');
    lines.push('--- IndexedDB ---');
    for (const [db, size] of Object.entries(breakdown.indexedDB.byDatabase)) {
      lines.push(`  ${db}: ${this.formatBytes(size)}`);
    }

    if (info.isWarning || info.isCritical) {
      lines.push('');
      lines.push(`⚠️ Status: ${info.isCritical ? 'CRITICAL' : 'WARNING'}`);
    }

    return lines.join('\n');
  }

  /**
   * Start periodic monitoring
   */
  startMonitoring(intervalMs = 60000): void {
    if (this.checkInterval) {
      this.stopMonitoring();
    }

    // Initial check
    this.getQuotaInfo().catch(console.error);

    // Periodic checks
    this.checkInterval = setInterval(() => {
      this.getQuotaInfo().catch(console.error);
    }, intervalMs);
  }

  /**
   * Stop periodic monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Subscribe to quota updates
   */
  subscribe(listener: (info: StorageQuotaInfo) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(info: StorageQuotaInfo): void {
    for (const listener of this.listeners) {
      try {
        listener(info);
      } catch (e) {
        console.error('[StorageQuotaMonitor] Listener error:', e);
      }
    }
  }

  /**
   * Suggest cleanup actions based on current usage
   */
  async suggestCleanup(): Promise<Array<{ action: string; savings: number; priority: 'high' | 'medium' | 'low' }>> {
    const breakdown = await this.getStorageBreakdown();
    const suggestions: Array<{ action: string; savings: number; priority: 'high' | 'medium' | 'low' }> = [];

    // Check cache sizes
    for (const [prefix, size] of Object.entries(breakdown.localStorage.byPrefix)) {
      if (prefix.includes('cache') && size > 100 * 1024) { // > 100KB
        suggestions.push({
          action: `Clear ${prefix} cache`,
          savings: size,
          priority: size > 500 * 1024 ? 'high' : 'medium',
        });
      }
    }

    // Check IndexedDB (PDFs)
    if (breakdown.indexedDB.byDatabase['ideagraph-pdfs'] > 10 * 1024 * 1024) { // > 10MB
      suggestions.push({
        action: 'Remove unused PDF files',
        savings: breakdown.indexedDB.byDatabase['ideagraph-pdfs'] * 0.3, // Estimate 30% recoverable
        priority: 'high',
      });
    }

    // Sort by priority and potential savings
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.savings - a.savings;
    });
  }
}

// =============================================================================
// Singleton Export
// =============================================================================

export const storageQuotaMonitor = new StorageQuotaMonitor();
