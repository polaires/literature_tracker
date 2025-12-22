// Auto-Connect Service
// Automatically queues and creates connection suggestions when papers are added

import type { Paper, Connection, Thesis } from '../../../types';
import type { AISettings, ConnectionSuggestion } from '../types';
import { getSuggestionManager } from '../suggestions';
import { getCollectionTier } from '../context';

/**
 * Auto-connection job
 */
interface ConnectionJob {
  id: string;
  paperId: string;
  thesisId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  suggestions?: ConnectionSuggestion[];
  error?: string;
}

/**
 * Auto-connect service configuration
 */
interface AutoConnectConfig {
  enabled: boolean;
  minPapersRequired: number; // Minimum papers before auto-connect activates
  maxQueueSize: number; // Maximum pending jobs
  processingDelay: number; // Delay between processing jobs (ms)
  autoApplyConfidence: number; // Auto-apply connections above this confidence
}

const DEFAULT_CONFIG: AutoConnectConfig = {
  enabled: true,
  minPapersRequired: 3,
  maxQueueSize: 10,
  processingDelay: 2000,
  autoApplyConfidence: 0.9, // Only auto-apply very high confidence suggestions
};

/**
 * Auto-Connect Service
 * Manages automatic connection analysis queue
 */
class AutoConnectService {
  private queue: ConnectionJob[] = [];
  private isProcessing = false;
  private config: AutoConnectConfig = DEFAULT_CONFIG;
  private onSuggestionsReady?: (
    paperId: string,
    suggestions: ConnectionSuggestion[]
  ) => void;

  /**
   * Configure the service
   */
  configure(config: Partial<AutoConnectConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set callback for when suggestions are ready
   */
  onSuggestions(
    callback: (paperId: string, suggestions: ConnectionSuggestion[]) => void
  ): void {
    this.onSuggestionsReady = callback;
  }

  /**
   * Queue a paper for auto-connection analysis
   */
  queuePaper(params: {
    paper: Paper;
    thesis: Thesis;
    allPapers: Paper[];
    connections: Connection[];
    aiSettings: AISettings;
  }): string | null {
    const { paper, thesis, allPapers } = params;

    // Check if enabled
    if (!this.config.enabled) {
      return null;
    }

    // Check collection tier
    const tier = getCollectionTier(allPapers.length);
    if (tier === 'cold-start') {
      console.log('[AutoConnect] Cold start - skipping auto-connection');
      return null;
    }

    // Check minimum papers
    if (allPapers.length < this.config.minPapersRequired) {
      console.log('[AutoConnect] Not enough papers for auto-connection');
      return null;
    }

    // Check queue size
    if (this.queue.length >= this.config.maxQueueSize) {
      console.log('[AutoConnect] Queue full - removing oldest pending job');
      const oldestPending = this.queue.findIndex(j => j.status === 'pending');
      if (oldestPending >= 0) {
        this.queue.splice(oldestPending, 1);
      }
    }

    // Check if paper already queued
    if (this.queue.some(j => j.paperId === paper.id && j.status === 'pending')) {
      console.log('[AutoConnect] Paper already queued');
      return null;
    }

    // Create job
    const job: ConnectionJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      paperId: paper.id,
      thesisId: thesis.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.queue.push(job);
    console.log('[AutoConnect] Queued paper:', paper.title.slice(0, 50));

    // Start processing if not already
    if (!this.isProcessing) {
      this.processQueue(params);
    }

    return job.id;
  }

  /**
   * Process the queue
   */
  private async processQueue(params: {
    thesis: Thesis;
    allPapers: Paper[];
    connections: Connection[];
    aiSettings: AISettings;
  }): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const { thesis, allPapers, connections, aiSettings } = params;

    while (this.queue.some(j => j.status === 'pending')) {
      const job = this.queue.find(j => j.status === 'pending');
      if (!job) break;

      job.status = 'processing';
      console.log('[AutoConnect] Processing:', job.paperId);

      try {
        // Add delay to avoid rate limiting
        await new Promise(r => setTimeout(r, this.config.processingDelay));

        // Get the manager
        const manager = getSuggestionManager(aiSettings);

        // Get suggestions
        const suggestions = await manager.suggestConnectionsForPaper({
          thesis,
          papers: allPapers,
          connections,
          targetPaperId: job.paperId,
          maxSuggestions: 5,
        });

        job.status = 'completed';
        job.completedAt = new Date().toISOString();
        job.suggestions = suggestions;

        console.log('[AutoConnect] Found', suggestions.length, 'suggestions');

        // Notify callback
        if (this.onSuggestionsReady && suggestions.length > 0) {
          this.onSuggestionsReady(job.paperId, suggestions);
        }
      } catch (error) {
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : 'Unknown error';
        console.error('[AutoConnect] Failed:', job.error);
      }
    }

    this.isProcessing = false;

    // Clean up completed jobs older than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    this.queue = this.queue.filter(
      j => j.status === 'pending' || j.status === 'processing' || (j.completedAt && j.completedAt > fiveMinutesAgo)
    );
  }

  /**
   * Get pending suggestions for a paper
   */
  getSuggestionsForPaper(paperId: string): ConnectionSuggestion[] | null {
    const job = this.queue.find(
      j => j.paperId === paperId && j.status === 'completed'
    );
    return job?.suggestions || null;
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    return {
      pending: this.queue.filter(j => j.status === 'pending').length,
      processing: this.queue.filter(j => j.status === 'processing').length,
      completed: this.queue.filter(j => j.status === 'completed').length,
      failed: this.queue.filter(j => j.status === 'failed').length,
    };
  }

  /**
   * Clear the queue
   */
  clearQueue(): void {
    this.queue = [];
  }

  /**
   * Cancel a pending job
   */
  cancelJob(jobId: string): boolean {
    const index = this.queue.findIndex(
      j => j.id === jobId && j.status === 'pending'
    );
    if (index >= 0) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }
}

// Singleton instance
let serviceInstance: AutoConnectService | null = null;

/**
 * Get the auto-connect service singleton
 */
export function getAutoConnectService(): AutoConnectService {
  if (!serviceInstance) {
    serviceInstance = new AutoConnectService();
  }
  return serviceInstance;
}

/**
 * Reset the service (for testing)
 */
export function resetAutoConnectService(): void {
  if (serviceInstance) {
    serviceInstance.clearQueue();
  }
  serviceInstance = null;
}

export type { ConnectionJob, AutoConnectConfig };
