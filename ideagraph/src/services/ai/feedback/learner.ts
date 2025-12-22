// Feedback-Driven Learning
// Uses recorded user feedback to adjust AI suggestions (ASReview-style active learning)

import type { ThesisRole } from '../../../types';
import { getFeedbackService, type AIFeedbackRecord, type FeedbackType } from './index';

/**
 * Role transition pattern learned from feedback
 */
export interface RoleTransitionPattern {
  fromRole: ThesisRole;
  toRole: ThesisRole;
  frequency: number; // How often this correction happens
  contexts: string[]; // Paper titles/topics where this occurred
}

/**
 * Learned preferences for a thesis
 */
export interface ThesisPreferences {
  thesisId: string;
  rolePreferences: {
    roleTransitions: RoleTransitionPattern[];
    roleBiases: Record<ThesisRole, number>; // Adjustment to confidence
  };
  takeawayStyle: {
    averageLength: number;
    prefersConcise: boolean;
    commonPhrases: string[];
  };
  screeningThreshold: number; // Learned relevance threshold
  acceptanceRates: Record<FeedbackType, number>;
  lastUpdated: string;
  // Computed summary fields for UI
  totalFeedback: number;
  acceptanceRate: number; // Overall acceptance rate (0-1)
  preferredRoles: ThesisRole[]; // Most commonly used roles
}

/**
 * Prompt adjustment based on learned patterns
 */
export interface PromptAdjustment {
  roleGuidance: string | null;
  takeawayGuidance: string | null;
  confidenceAdjustments: Partial<Record<ThesisRole, number>>;
  additionalContext: string[];
}

/**
 * Feedback Learner
 * Analyzes feedback patterns and generates adjustments for AI behavior
 */
export class FeedbackLearner {
  private static instance: FeedbackLearner | null = null;
  private preferencesCache: Map<string, ThesisPreferences> = new Map();

  private constructor() {}

  static getInstance(): FeedbackLearner {
    if (!FeedbackLearner.instance) {
      FeedbackLearner.instance = new FeedbackLearner();
    }
    return FeedbackLearner.instance;
  }

  /**
   * Learn preferences from feedback history
   */
  learnThesisPreferences(thesisId: string): ThesisPreferences {
    // Check cache first
    const cached = this.preferencesCache.get(thesisId);
    const cacheAge = cached ? Date.now() - new Date(cached.lastUpdated).getTime() : Infinity;
    if (cached && cacheAge < 5 * 60 * 1000) { // 5 minute cache
      return cached;
    }

    const feedbackService = getFeedbackService();
    const records = feedbackService.exportData().filter(r => r.thesisId === thesisId);

    // Learn role transition patterns
    const roleTransitions = this.learnRoleTransitions(records);

    // Learn role biases (adjust confidence based on correction patterns)
    const roleBiases = this.calculateRoleBiases(roleTransitions);

    // Learn takeaway style
    const takeawayStyle = this.learnTakeawayStyle(records);

    // Learn screening threshold
    const screeningThreshold = this.learnScreeningThreshold(records);

    // Calculate acceptance rates per type
    const acceptanceRates = this.calculateAcceptanceRates(records);

    // Compute summary fields for UI
    const totalFeedback = records.length;
    const acceptedCount = records.filter(r => r.userAction === 'accepted').length;
    const acceptanceRate = totalFeedback > 0 ? acceptedCount / totalFeedback : 0;

    // Find most commonly used roles from feedback
    const roleUsage = new Map<ThesisRole, number>();
    for (const record of records) {
      if (record.type === 'intake-role' && record.userValue) {
        const role = record.userValue as ThesisRole;
        roleUsage.set(role, (roleUsage.get(role) || 0) + 1);
      }
    }
    const preferredRoles = Array.from(roleUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([role]) => role);

    const preferences: ThesisPreferences = {
      thesisId,
      rolePreferences: {
        roleTransitions,
        roleBiases,
      },
      takeawayStyle,
      screeningThreshold,
      acceptanceRates,
      lastUpdated: new Date().toISOString(),
      totalFeedback,
      acceptanceRate,
      preferredRoles,
    };

    this.preferencesCache.set(thesisId, preferences);
    return preferences;
  }

  /**
   * Learn role transition patterns from overrides
   */
  private learnRoleTransitions(records: AIFeedbackRecord[]): RoleTransitionPattern[] {
    const transitions = new Map<string, RoleTransitionPattern>();

    for (const record of records) {
      if (record.type !== 'intake-role' || record.userAction !== 'overridden') {
        continue;
      }

      const fromRole = record.aiSuggestion.value as ThesisRole;
      const toRole = record.userValue as ThesisRole;
      const key = `${fromRole}->${toRole}`;

      if (!transitions.has(key)) {
        transitions.set(key, {
          fromRole,
          toRole,
          frequency: 0,
          contexts: [],
        });
      }

      const pattern = transitions.get(key)!;
      pattern.frequency++;

      // Add context (paper title if available)
      if (record.paperId && pattern.contexts.length < 5) {
        pattern.contexts.push(record.paperId);
      }
    }

    return Array.from(transitions.values())
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Calculate role confidence biases from transition patterns
   * If the AI frequently gets overridden on a role, lower confidence for that role
   */
  private calculateRoleBiases(transitions: RoleTransitionPattern[]): Record<ThesisRole, number> {
    const biases: Record<ThesisRole, number> = {
      supports: 0,
      contradicts: 0,
      method: 0,
      background: 0,
      other: 0,
    };

    // Count how often each AI-suggested role was wrong
    const wrongCounts: Record<ThesisRole, number> = {
      supports: 0,
      contradicts: 0,
      method: 0,
      background: 0,
      other: 0,
    };

    for (const transition of transitions) {
      wrongCounts[transition.fromRole] += transition.frequency;
    }

    // Apply negative bias proportional to error frequency
    // Max penalty of -0.2 for roles frequently corrected
    const maxErrors = Math.max(...Object.values(wrongCounts), 1);
    for (const role of Object.keys(biases) as ThesisRole[]) {
      if (wrongCounts[role] > 0) {
        biases[role] = -0.2 * (wrongCounts[role] / maxErrors);
      }
    }

    return biases;
  }

  /**
   * Learn takeaway style preferences from edits
   */
  private learnTakeawayStyle(records: AIFeedbackRecord[]): ThesisPreferences['takeawayStyle'] {
    const takeawayRecords = records.filter(r => r.type === 'intake-takeaway');
    const editedRecords = takeawayRecords.filter(r => r.userAction === 'edited');

    // Analyze edited takeaways
    const userTakeaways = editedRecords
      .map(r => r.userValue as string)
      .filter(Boolean);

    if (userTakeaways.length === 0) {
      return {
        averageLength: 150,
        prefersConcise: false,
        commonPhrases: [],
      };
    }

    const avgLength = userTakeaways.reduce((sum, t) => sum + t.length, 0) / userTakeaways.length;

    // Extract common starting phrases
    const phraseCounts = new Map<string, number>();
    for (const takeaway of userTakeaways) {
      const words = takeaway.split(/\s+/).slice(0, 3).join(' ').toLowerCase();
      phraseCounts.set(words, (phraseCounts.get(words) || 0) + 1);
    }

    const commonPhrases = Array.from(phraseCounts.entries())
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([phrase]) => phrase);

    return {
      averageLength: Math.round(avgLength),
      prefersConcise: avgLength < 100,
      commonPhrases,
    };
  }

  /**
   * Learn screening threshold from screening overrides
   */
  private learnScreeningThreshold(records: AIFeedbackRecord[]): number {
    const screeningRecords = records.filter(r => r.type === 'screening');
    if (screeningRecords.length === 0) return 50; // Default threshold

    // Find patterns where AI said exclude but user included
    const falseNegatives = screeningRecords.filter(r =>
      r.aiSuggestion.value === 'exclude' &&
      r.userValue === 'include'
    );

    // Find patterns where AI said include but user excluded
    const falsePositives = screeningRecords.filter(r =>
      r.aiSuggestion.value === 'include' &&
      r.userValue === 'exclude'
    );

    // Adjust threshold based on error types
    // If too many false negatives, lower threshold (include more)
    // If too many false positives, raise threshold (be more selective)
    let threshold = 50;
    if (falseNegatives.length > falsePositives.length * 1.5) {
      threshold = Math.max(30, 50 - falseNegatives.length * 2);
    } else if (falsePositives.length > falseNegatives.length * 1.5) {
      threshold = Math.min(70, 50 + falsePositives.length * 2);
    }

    return threshold;
  }

  /**
   * Calculate acceptance rates per feedback type
   */
  private calculateAcceptanceRates(records: AIFeedbackRecord[]): Record<FeedbackType, number> {
    const rates: Record<FeedbackType, number> = {
      'intake-role': 0,
      'intake-takeaway': 0,
      'connection': 0,
      'screening': 0,
      'gap': 0,
      'discovery': 0,
    };

    for (const type of Object.keys(rates) as FeedbackType[]) {
      const typeRecords = records.filter(r => r.type === type);
      if (typeRecords.length > 0) {
        const accepted = typeRecords.filter(r => r.userAction === 'accepted').length;
        rates[type] = accepted / typeRecords.length;
      }
    }

    return rates;
  }

  /**
   * Generate prompt adjustments based on learned preferences
   */
  getPromptAdjustments(thesisId: string): PromptAdjustment {
    const prefs = this.learnThesisPreferences(thesisId);

    const adjustments: PromptAdjustment = {
      roleGuidance: null,
      takeawayGuidance: null,
      confidenceAdjustments: prefs.rolePreferences.roleBiases,
      additionalContext: [],
    };

    // Generate role guidance from transition patterns
    const topTransitions = prefs.rolePreferences.roleTransitions.slice(0, 3);
    if (topTransitions.length > 0) {
      const transitionHints = topTransitions
        .filter(t => t.frequency >= 2)
        .map(t => `Users often correct "${t.fromRole}" to "${t.toRole}" (${t.frequency}x)`)
        .join('. ');

      if (transitionHints) {
        adjustments.roleGuidance = `Historical correction patterns: ${transitionHints}. Consider this when suggesting roles.`;
      }
    }

    // Generate takeaway guidance from style preferences
    if (prefs.takeawayStyle.prefersConcise) {
      adjustments.takeawayGuidance = `User prefers concise takeaways (avg ${prefs.takeawayStyle.averageLength} chars).`;
    }

    if (prefs.takeawayStyle.commonPhrases.length > 0) {
      adjustments.additionalContext.push(
        `User's takeaways often start with: "${prefs.takeawayStyle.commonPhrases.slice(0, 3).join('", "')}"`
      );
    }

    // Add acceptance rate context
    const roleAcceptance = prefs.acceptanceRates['intake-role'];
    if (roleAcceptance < 0.5) {
      adjustments.additionalContext.push(
        `Role suggestions have low acceptance (${Math.round(roleAcceptance * 100)}%). Be more conservative.`
      );
    }

    return adjustments;
  }

  /**
   * Get adjusted confidence for a role suggestion
   */
  adjustRoleConfidence(thesisId: string, role: ThesisRole, baseConfidence: number): number {
    const prefs = this.learnThesisPreferences(thesisId);
    const bias = prefs.rolePreferences.roleBiases[role] || 0;

    // Apply bias but keep in valid range
    return Math.max(0.1, Math.min(1.0, baseConfidence + bias));
  }

  /**
   * Check if a role suggestion should be reconsidered based on patterns
   */
  shouldReconsiderRole(thesisId: string, suggestedRole: ThesisRole): ThesisRole | null {
    const prefs = this.learnThesisPreferences(thesisId);

    // Find if there's a strong transition pattern away from this role
    const strongTransition = prefs.rolePreferences.roleTransitions.find(
      t => t.fromRole === suggestedRole && t.frequency >= 3
    );

    if (strongTransition) {
      console.log(`[FeedbackLearner] Reconsidering ${suggestedRole} -> ${strongTransition.toRole} (${strongTransition.frequency} corrections)`);
      return strongTransition.toRole;
    }

    return null;
  }

  /**
   * Build prompt context from learned patterns
   * Returns a string to append to AI prompts
   */
  buildPromptContext(thesisId: string): string {
    const adjustments = this.getPromptAdjustments(thesisId);
    const parts: string[] = [];

    if (adjustments.roleGuidance) {
      parts.push(`[User Preference - Role Assignment]\n${adjustments.roleGuidance}`);
    }

    if (adjustments.takeawayGuidance) {
      parts.push(`[User Preference - Takeaway Style]\n${adjustments.takeawayGuidance}`);
    }

    if (adjustments.additionalContext.length > 0) {
      parts.push(`[Additional Context]\n${adjustments.additionalContext.join('\n')}`);
    }

    return parts.join('\n\n');
  }

  /**
   * Clear the preferences cache
   */
  clearCache(): void {
    this.preferencesCache.clear();
  }
}

/**
 * Get feedback learner singleton
 */
export function getFeedbackLearner(): FeedbackLearner {
  return FeedbackLearner.getInstance();
}
