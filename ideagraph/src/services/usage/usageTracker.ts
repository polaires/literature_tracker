// Usage Tracker Service
// Client-side tracking of AI credit usage

import { useState } from 'react';
import type { PDFAIAction } from '../ai/prompts/pdfSummary';
import {
  type UserUsage,
  type UsageHistoryEntry,
  type UsageDisplay,
  DEFAULT_USER_USAGE,
  GUEST_USAGE_LIMIT,
  ACTION_CREDIT_COSTS,
  calculateUsageDisplay,
  canPerformAction,
} from './usageTypes';
import { trackUsageOnServer, fetchCurrentUsage } from './usageApi';

const STORAGE_KEY = 'ideagraph_usage';
const GUEST_SESSION_KEY = 'ideagraph_guest_usage_count';

/**
 * Usage Tracker - manages AI credit usage
 */
class UsageTracker {
  private usage: UserUsage;
  private isAuthenticated: boolean = false;
  private guestActionCount: number = 0;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.usage = this.loadFromStorage();
    this.guestActionCount = this.loadGuestCount();
  }

  /**
   * Load usage from localStorage
   */
  private loadFromStorage(): UserUsage {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure all required fields exist with defaults
        return {
          userId: parsed.userId ?? null,
          totalCredits: parsed.totalCredits ?? 100,
          usedCredits: parsed.usedCredits ?? 0,
          resetDate: parsed.resetDate ?? null,
          lastUpdated: parsed.lastUpdated ?? new Date().toISOString(),
          history: Array.isArray(parsed.history) ? parsed.history : [],
        };
      }
    } catch (error) {
      console.error('Failed to load usage from storage:', error);
    }
    return { ...DEFAULT_USER_USAGE };
  }

  /**
   * Save usage to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.usage));
    } catch (error) {
      console.error('Failed to save usage to storage:', error);
    }
  }

  /**
   * Load guest action count from sessionStorage
   */
  private loadGuestCount(): number {
    try {
      const count = sessionStorage.getItem(GUEST_SESSION_KEY);
      return count ? parseInt(count, 10) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Save guest action count to sessionStorage
   */
  private saveGuestCount(): void {
    try {
      sessionStorage.setItem(GUEST_SESSION_KEY, String(this.guestActionCount));
    } catch {
      // Ignore session storage errors
    }
  }

  /**
   * Notify listeners of usage changes
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  /**
   * Initialize tracker with user authentication status
   */
  async initialize(userId: number | null): Promise<void> {
    this.isAuthenticated = userId !== null;

    if (userId) {
      // Fetch usage from server for authenticated users
      try {
        const serverUsage = await fetchCurrentUsage();
        if (serverUsage) {
          // Ensure all required fields exist with defaults
          this.usage = {
            userId: serverUsage.userId ?? userId,
            totalCredits: serverUsage.totalCredits ?? 100,
            usedCredits: serverUsage.usedCredits ?? 0,
            resetDate: serverUsage.resetDate ?? null,
            lastUpdated: serverUsage.lastUpdated ?? new Date().toISOString(),
            history: Array.isArray(serverUsage.history) ? serverUsage.history : [],
          };
          this.saveToStorage();
        }
      } catch (error) {
        console.error('Failed to fetch usage from server:', error);
        // Continue with local storage
      }
    }

    this.usage.userId = userId;
    this.notifyListeners();
  }

  /**
   * Get current usage
   */
  getUsage(): UserUsage {
    return this.usage;
  }

  /**
   * Get usage display info
   */
  getUsageDisplay(): UsageDisplay {
    return calculateUsageDisplay(this.usage);
  }

  /**
   * Check if user can perform an action
   */
  canPerform(action: PDFAIAction): boolean {
    if (!this.isAuthenticated) {
      return this.guestActionCount < GUEST_USAGE_LIMIT;
    }
    return canPerformAction(this.usage, action);
  }

  /**
   * Get remaining guest actions
   */
  getGuestActionsRemaining(): number {
    return Math.max(0, GUEST_USAGE_LIMIT - this.guestActionCount);
  }

  /**
   * Track a usage action
   */
  async trackAction(params: {
    action: PDFAIAction;
    tokensInput: number;
    tokensOutput: number;
    model: string;
    paperId?: string;
    paperTitle?: string;
    success: boolean;
    error?: string;
  }): Promise<void> {
    const { action, tokensInput, tokensOutput, model, paperId, paperTitle, success, error } = params;

    // Guest user tracking
    if (!this.isAuthenticated) {
      this.guestActionCount++;
      this.saveGuestCount();
      return;
    }

    // Authenticated user tracking
    const creditCost = ACTION_CREDIT_COSTS[action];

    const historyEntry: UsageHistoryEntry = {
      id: `usage-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      action,
      creditsUsed: creditCost,
      tokensInput,
      tokensOutput,
      model,
      timestamp: new Date().toISOString(),
      paperId,
      paperTitle,
      success,
      error,
    };

    // Update local state (with defensive checks)
    this.usage.usedCredits = (this.usage.usedCredits ?? 0) + creditCost;
    this.usage.lastUpdated = new Date().toISOString();

    // Ensure history array exists before adding entry
    if (!Array.isArray(this.usage.history)) {
      this.usage.history = [];
    }
    this.usage.history.unshift(historyEntry);

    // Keep only last 100 history entries locally
    if (this.usage.history.length > 100) {
      this.usage.history = this.usage.history.slice(0, 100);
    }

    this.saveToStorage();
    this.notifyListeners();

    // Sync with server in background
    try {
      await trackUsageOnServer({
        action,
        tokensInput,
        tokensOutput,
        model,
        paperId,
        success,
      });
    } catch (error) {
      console.error('Failed to sync usage with server:', error);
      // Continue - local tracking is still valid
    }
  }

  /**
   * Subscribe to usage changes (for useSyncExternalStore)
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Reset usage (for testing or admin actions)
   */
  resetUsage(): void {
    this.usage = {
      ...DEFAULT_USER_USAGE,
      userId: this.usage.userId,
    };
    this.guestActionCount = 0;
    this.saveToStorage();
    this.saveGuestCount();
    this.notifyListeners();
  }

  /**
   * Update usage from server (e.g., after admin adjustment)
   */
  updateFromServer(usage: UserUsage): void {
    this.usage = usage;
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Clear local storage (on logout)
   */
  clearLocal(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.usage = { ...DEFAULT_USER_USAGE };
    this.notifyListeners();
  }
}

// Singleton instance
export const usageTracker = new UsageTracker();

/**
 * React hook for usage tracking
 * Returns a static snapshot of usage - does NOT subscribe to changes
 * to avoid infinite re-render loops.
 *
 * For components that need to display usage, call this hook once.
 * The usage will be current at mount time.
 */
export function useUsage(): UserUsage {
  // Return a static copy of current usage at mount time
  // Using useState with lazy initializer to ensure stable reference
  const [usage] = useState<UserUsage>(() => {
    const current = usageTracker.getUsage();
    // Return a copy to avoid mutation issues
    // Use defensive checks for history in case of corrupted storage
    return {
      userId: current.userId ?? null,
      totalCredits: current.totalCredits ?? 100,
      usedCredits: current.usedCredits ?? 0,
      resetDate: current.resetDate ?? null,
      lastUpdated: current.lastUpdated ?? new Date().toISOString(),
      history: Array.isArray(current.history) ? [...current.history] : [],
    };
  });

  return usage;
}
