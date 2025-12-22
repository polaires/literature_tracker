// AI Feedback Service
// Tracks user decisions on AI suggestions to improve future recommendations

import type { ThesisRole } from '../../../types';

const FEEDBACK_STORAGE_KEY = 'ideagraph_ai_feedback';
const MAX_FEEDBACK_RECORDS = 500;

/**
 * Types of AI suggestions that can receive feedback
 */
export type FeedbackType =
  | 'intake-role'      // User overrode suggested thesis role
  | 'intake-takeaway'  // User edited suggested takeaway
  | 'connection'       // Connection suggestion accepted/dismissed
  | 'screening'        // Screening decision overridden
  | 'gap'              // Gap analysis feedback
  | 'discovery';       // Discovery result feedback

/**
 * User action on a suggestion
 */
export type FeedbackAction =
  | 'accepted'         // Used suggestion as-is
  | 'edited'           // Modified and used
  | 'dismissed'        // Rejected suggestion
  | 'overridden';      // Made opposite choice

/**
 * Feedback record
 */
export interface AIFeedbackRecord {
  id: string;
  type: FeedbackType;
  thesisId: string;
  paperId?: string;

  // What AI suggested
  aiSuggestion: {
    value: unknown;
    confidence: number;
    reasoning?: string;
  };

  // What user did
  userAction: FeedbackAction;
  userValue?: unknown;

  // Context
  timestamp: string;
  sessionId?: string;
}

/**
 * Role override tracking
 */
export interface RoleOverrideStats {
  aiRole: ThesisRole;
  userRole: ThesisRole;
  count: number;
}

/**
 * Feedback summary for a thesis
 */
export interface ThesisFeedbackSummary {
  thesisId: string;
  totalFeedback: number;
  acceptanceRate: number;
  roleOverrides: RoleOverrideStats[];
  commonEdits: {
    type: FeedbackType;
    pattern: string;
    count: number;
  }[];
}

/**
 * Feedback Service
 * Persists and analyzes user feedback on AI suggestions
 */
class FeedbackService {
  private records: AIFeedbackRecord[] = [];
  private loaded = false;

  /**
   * Load feedback from storage
   */
  private load(): void {
    if (this.loaded) return;

    try {
      const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      if (stored) {
        this.records = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[FeedbackService] Failed to load feedback:', e);
      this.records = [];
    }

    this.loaded = true;
  }

  /**
   * Save feedback to storage
   */
  private save(): void {
    try {
      // Trim to max records
      if (this.records.length > MAX_FEEDBACK_RECORDS) {
        this.records = this.records.slice(-MAX_FEEDBACK_RECORDS);
      }

      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(this.records));
    } catch (e) {
      console.warn('[FeedbackService] Failed to save feedback:', e);
    }
  }

  /**
   * Record feedback on an AI suggestion
   */
  recordFeedback(params: {
    type: FeedbackType;
    thesisId: string;
    paperId?: string;
    aiSuggestion: {
      value: unknown;
      confidence: number;
      reasoning?: string;
    };
    userAction: FeedbackAction;
    userValue?: unknown;
  }): void {
    this.load();

    const record: AIFeedbackRecord = {
      id: `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: params.type,
      thesisId: params.thesisId,
      paperId: params.paperId,
      aiSuggestion: params.aiSuggestion,
      userAction: params.userAction,
      userValue: params.userValue,
      timestamp: new Date().toISOString(),
    };

    this.records.push(record);
    this.save();

    console.log('[FeedbackService] Recorded:', record);
  }

  /**
   * Record role suggestion feedback
   */
  recordRoleFeedback(params: {
    thesisId: string;
    paperId: string;
    suggestedRole: ThesisRole;
    confidence: number;
    userRole: ThesisRole;
  }): void {
    const action: FeedbackAction =
      params.suggestedRole === params.userRole ? 'accepted' : 'overridden';

    this.recordFeedback({
      type: 'intake-role',
      thesisId: params.thesisId,
      paperId: params.paperId,
      aiSuggestion: {
        value: params.suggestedRole,
        confidence: params.confidence,
      },
      userAction: action,
      userValue: action === 'overridden' ? params.userRole : undefined,
    });
  }

  /**
   * Record takeaway suggestion feedback
   */
  recordTakeawayFeedback(params: {
    thesisId: string;
    paperId: string;
    suggestedTakeaway: string;
    confidence: number;
    userTakeaway: string;
  }): void {
    const isSame = params.suggestedTakeaway.trim() === params.userTakeaway.trim();
    const action: FeedbackAction = isSame ? 'accepted' : 'edited';

    this.recordFeedback({
      type: 'intake-takeaway',
      thesisId: params.thesisId,
      paperId: params.paperId,
      aiSuggestion: {
        value: params.suggestedTakeaway,
        confidence: params.confidence,
      },
      userAction: action,
      userValue: action === 'edited' ? params.userTakeaway : undefined,
    });
  }

  /**
   * Record screening decision feedback
   */
  recordScreeningFeedback(params: {
    thesisId: string;
    paperId: string;
    suggestedDecision: 'include' | 'exclude' | 'maybe';
    confidence: number;
    userDecision: 'include' | 'exclude' | 'maybe';
  }): void {
    const action: FeedbackAction =
      params.suggestedDecision === params.userDecision ? 'accepted' : 'overridden';

    this.recordFeedback({
      type: 'screening',
      thesisId: params.thesisId,
      paperId: params.paperId,
      aiSuggestion: {
        value: params.suggestedDecision,
        confidence: params.confidence,
      },
      userAction: action,
      userValue: action === 'overridden' ? params.userDecision : undefined,
    });
  }

  /**
   * Get feedback summary for a thesis
   */
  getThesisSummary(thesisId: string): ThesisFeedbackSummary {
    this.load();

    const thesisRecords = this.records.filter(r => r.thesisId === thesisId);
    const accepted = thesisRecords.filter(
      r => r.userAction === 'accepted'
    ).length;

    // Calculate role overrides
    const roleOverrides = thesisRecords
      .filter(r => r.type === 'intake-role' && r.userAction === 'overridden')
      .reduce((acc, r) => {
        const key = `${r.aiSuggestion.value}->${r.userValue}`;
        if (!acc[key]) {
          acc[key] = {
            aiRole: r.aiSuggestion.value as ThesisRole,
            userRole: r.userValue as ThesisRole,
            count: 0,
          };
        }
        acc[key].count++;
        return acc;
      }, {} as Record<string, RoleOverrideStats>);

    return {
      thesisId,
      totalFeedback: thesisRecords.length,
      acceptanceRate: thesisRecords.length > 0
        ? accepted / thesisRecords.length
        : 0,
      roleOverrides: Object.values(roleOverrides),
      commonEdits: [], // TODO: Implement pattern detection
    };
  }

  /**
   * Get all feedback for a paper
   */
  getPaperFeedback(paperId: string): AIFeedbackRecord[] {
    this.load();
    return this.records.filter(r => r.paperId === paperId);
  }

  /**
   * Get recent feedback
   */
  getRecentFeedback(limit = 50): AIFeedbackRecord[] {
    this.load();
    return this.records.slice(-limit).reverse();
  }

  /**
   * Clear all feedback (for testing/reset)
   */
  clearAll(): void {
    this.records = [];
    this.save();
  }

  /**
   * Export feedback data
   */
  exportData(): AIFeedbackRecord[] {
    this.load();
    return [...this.records];
  }
}

// Singleton instance
let serviceInstance: FeedbackService | null = null;

/**
 * Get feedback service singleton
 */
export function getFeedbackService(): FeedbackService {
  if (!serviceInstance) {
    serviceInstance = new FeedbackService();
  }
  return serviceInstance;
}

// Types are exported with their interfaces above

// Re-export learner
export { FeedbackLearner, getFeedbackLearner } from './learner';
export type { ThesisPreferences, PromptAdjustment, RoleTransitionPattern } from './learner';
