// Data Migration System for IdeaGraph
// Uses the VERSION key to track schema versions and apply migrations

import type { AISettings } from '../ai/types';

// =============================================================================
// Version Management
// =============================================================================

export const CURRENT_VERSION = 4;
export const VERSION_KEY = 'ideagraph_version';
export const STORAGE_KEY = 'ideagraph-storage';

export interface StorageVersion {
  version: number;
  migratedAt: string;
  previousVersion?: number;
}

/**
 * Get the current storage version
 */
export function getStorageVersion(): number {
  try {
    const stored = localStorage.getItem(VERSION_KEY);
    if (!stored) return 0; // No version = initial state
    const versionData: StorageVersion = JSON.parse(stored);
    return versionData.version;
  } catch {
    return 0;
  }
}

/**
 * Set the storage version
 */
export function setStorageVersion(version: number, previousVersion?: number): void {
  const versionData: StorageVersion = {
    version,
    migratedAt: new Date().toISOString(),
    previousVersion,
  };
  localStorage.setItem(VERSION_KEY, JSON.stringify(versionData));
}

// =============================================================================
// Migration Types
// =============================================================================

export interface Migration {
  version: number;
  name: string;
  description: string;
  migrate: (data: unknown) => unknown;
}

export interface MigrationResult {
  success: boolean;
  fromVersion: number;
  toVersion: number;
  migrationsApplied: string[];
  errors: string[];
}

// =============================================================================
// Migration Definitions
// =============================================================================

/**
 * Migration 1: Initial schema setup
 * - Ensures all required fields exist
 * - Adds default values for new fields
 */
const migration1: Migration = {
  version: 1,
  name: 'initial-schema',
  description: 'Initial schema setup with all required fields',
  migrate: (data: unknown) => {
    const state = data as Record<string, unknown>;

    // Ensure all required arrays exist
    return {
      ...state,
      theses: state.theses || [],
      papers: state.papers || [],
      connections: state.connections || [],
      annotations: state.annotations || [],
      reviewSections: state.reviewSections || [],
      synthesisThemes: state.synthesisThemes || [],
      researchGaps: state.researchGaps || [],
      evidenceSyntheses: state.evidenceSyntheses || [],
      clusters: state.clusters || [],
      activeThesisId: state.activeThesisId ?? null,
      selectedPaperId: state.selectedPaperId ?? null,
      settings: {
        defaultView: 'list',
        graphLayout: 'force',
        theme: 'system',
        autoSave: true,
        showAiSuggestions: true,
        ...(state.settings as Record<string, unknown> || {}),
      },
    };
  },
};

/**
 * Migration 2: Add AI settings to store
 * - Consolidates AI settings from separate localStorage key
 * - Migrates from old useAI hook storage
 */
const migration2: Migration = {
  version: 2,
  name: 'consolidate-ai-settings',
  description: 'Consolidate AI settings into main store',
  migrate: (data: unknown) => {
    const state = data as Record<string, unknown>;

    // Default AI settings
    const defaultAISettings: AISettings = {
      provider: 'claude',
      apiKey: null,
      apiBaseUrl: null,
      customModelName: null,
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
      taskModels: {
        connectionSuggestions: 'claude-3-5-sonnet-20241022',
        takeawaySuggestions: 'claude-3-haiku-20240307',
        argumentExtraction: 'claude-3-haiku-20240307',
        gapAnalysis: 'claude-3-5-sonnet-20241022',
        reviewGeneration: 'claude-3-5-sonnet-20241022',
      },
    };

    // Try to migrate from old AI settings storage
    let migratedAISettings = defaultAISettings;
    try {
      const oldAISettings = localStorage.getItem('ideagraph_ai_settings');
      if (oldAISettings) {
        const parsed = JSON.parse(oldAISettings);
        migratedAISettings = {
          ...defaultAISettings,
          ...parsed,
          taskModels: {
            ...defaultAISettings.taskModels,
            ...(parsed.taskModels || {}),
          },
        };
        // Remove old storage key after successful migration
        console.log('[Migration 2] Migrated AI settings from old storage');
        // Note: We don't remove the old key immediately to allow rollback if needed
      }
    } catch (e) {
      console.warn('[Migration 2] Failed to migrate old AI settings:', e);
    }

    return {
      ...state,
      aiSettings: state.aiSettings || migratedAISettings,
    };
  },
};

/**
 * Migration 3: Add Paper IdeaGraph support
 * - Adds paperGraphs array for storing extracted knowledge graphs
 */
const migration3: Migration = {
  version: 3,
  name: 'add-paper-ideagraph',
  description: 'Add Paper IdeaGraph support for knowledge extraction',
  migrate: (data: unknown) => {
    const state = data as Record<string, unknown>;

    return {
      ...state,
      // Add paperGraphs array if not exists
      paperGraphs: state.paperGraphs || [],
    };
  },
};

/**
 * Migration 4: Add AI Chat History to Paper IdeaGraphs
 * - Adds chatHistory field to all existing paperGraphs
 * - Enables persisting AI assistant results (summarize, key-findings, etc.)
 */
const migration4: Migration = {
  version: 4,
  name: 'add-paper-chat-history',
  description: 'Add AI chat history to Paper IdeaGraphs for persisting AI assistant results',
  migrate: (data: unknown) => {
    const state = data as Record<string, unknown>;
    const paperGraphs = (state.paperGraphs as Array<Record<string, unknown>>) || [];

    // Add chatHistory to all existing paperGraphs
    const migratedPaperGraphs = paperGraphs.map((graph) => ({
      ...graph,
      chatHistory: graph.chatHistory || {
        summarize: null,
        keyFindings: null,
        thesisRelevance: null,
        methodology: null,
        takeaway: null,
        lastUpdated: new Date().toISOString(),
      },
    }));

    return {
      ...state,
      paperGraphs: migratedPaperGraphs,
    };
  },
};

// All migrations in order
const MIGRATIONS: Migration[] = [
  migration1,
  migration2,
  migration3,
  migration4,
];

// =============================================================================
// Migration Runner
// =============================================================================

/**
 * Run all pending migrations
 */
export function runMigrations(): MigrationResult {
  const currentVersion = getStorageVersion();
  const result: MigrationResult = {
    success: true,
    fromVersion: currentVersion,
    toVersion: currentVersion,
    migrationsApplied: [],
    errors: [],
  };

  if (currentVersion >= CURRENT_VERSION) {
    console.log(`[Migrations] Already at version ${currentVersion}, no migrations needed`);
    return result;
  }

  console.log(`[Migrations] Running migrations from v${currentVersion} to v${CURRENT_VERSION}`);

  // Get current data from Zustand persist storage
  let data: unknown = {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      data = parsed.state || parsed;
    }
  } catch (e) {
    console.warn('[Migrations] Failed to load existing data:', e);
  }

  // Apply each pending migration
  for (const migration of MIGRATIONS) {
    if (migration.version <= currentVersion) {
      continue; // Skip already applied migrations
    }

    try {
      console.log(`[Migrations] Applying migration ${migration.version}: ${migration.name}`);
      data = migration.migrate(data);
      result.migrationsApplied.push(`${migration.version}: ${migration.name}`);
      result.toVersion = migration.version;
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      console.error(`[Migrations] Migration ${migration.version} failed:`, error);
      result.errors.push(`Migration ${migration.version} failed: ${error}`);
      result.success = false;
      break;
    }
  }

  if (result.success) {
    // Save migrated data back to storage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.state = data;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }

      // Update version
      setStorageVersion(result.toVersion, currentVersion);
      console.log(`[Migrations] Successfully migrated from v${currentVersion} to v${result.toVersion}`);

      // Clean up old AI settings storage after successful migration
      if (currentVersion < 2 && result.toVersion >= 2) {
        try {
          localStorage.removeItem('ideagraph_ai_settings');
          console.log('[Migrations] Cleaned up old AI settings storage');
        } catch {
          // Ignore cleanup errors
        }
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      console.error('[Migrations] Failed to save migrated data:', error);
      result.errors.push(`Failed to save migrated data: ${error}`);
      result.success = false;
    }
  }

  return result;
}

/**
 * Check if migrations are needed
 */
export function needsMigration(): boolean {
  return getStorageVersion() < CURRENT_VERSION;
}

/**
 * Get pending migrations
 */
export function getPendingMigrations(): Migration[] {
  const currentVersion = getStorageVersion();
  return MIGRATIONS.filter(m => m.version > currentVersion);
}

/**
 * Reset version (for debugging/testing)
 */
export function resetVersion(): void {
  localStorage.removeItem(VERSION_KEY);
  console.log('[Migrations] Version reset');
}

// =============================================================================
// Auto-migration on module load
// =============================================================================

// Run migrations automatically when this module is imported
// This ensures data is always up-to-date when the app starts
let migrationResult: MigrationResult | null = null;

export function ensureMigrated(): MigrationResult {
  if (migrationResult === null) {
    migrationResult = runMigrations();
  }
  return migrationResult;
}

// Export migration result getter
export function getMigrationResult(): MigrationResult | null {
  return migrationResult;
}
