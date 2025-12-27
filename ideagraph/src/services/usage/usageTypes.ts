// Usage Tracking Types
// Types for AI credit usage tracking

import type { PDFAIAction } from '../ai/prompts/pdfSummary';

/**
 * User's AI usage credits and history
 */
export interface UserUsage {
  userId: number | null;       // null for unauthenticated users
  totalCredits: number;        // 100 = $3 worth
  usedCredits: number;         // Current usage
  resetDate: string | null;    // When credits reset (ISO date), null for lifetime
  lastUpdated: string;
  history: UsageHistoryEntry[];
}

/**
 * Individual usage record
 */
export interface UsageHistoryEntry {
  id: string;
  action: PDFAIAction;
  creditsUsed: number;
  tokensInput: number;
  tokensOutput: number;
  model: string;
  timestamp: string;
  paperId?: string;
  paperTitle?: string;
  success: boolean;
  error?: string;
}

/**
 * Credit costs per action (out of 100 = $3)
 *
 * Cost calculation:
 * - $3 = 100 credits
 * - 1 credit = $0.03
 *
 * Haiku costs ~$0.001 per 1K tokens = ~0.03 credits per 1K tokens
 * Sonnet costs ~$0.01 per 1K tokens = ~0.33 credits per 1K tokens
 */
export const ACTION_CREDIT_COSTS: Record<PDFAIAction, number> = {
  'summarize': 1,           // ~$0.03, uses Haiku, ~1500 tokens
  'key-findings': 2,        // ~$0.06, uses Haiku, ~2000 tokens
  'thesis-relevance': 4,    // ~$0.12, uses Sonnet, ~3000 tokens
  'methodology': 2,         // ~$0.06, uses Haiku, ~2000 tokens
  'takeaway': 1,            // ~$0.03, uses Haiku, ~1500 tokens
};

/**
 * Display-friendly usage info
 */
export interface UsageDisplay {
  percentageUsed: number;      // 0-100
  percentageRemaining: number; // 0-100
  creditsRemaining: number;
  formattedRemaining: string;  // e.g., "67% remaining"
  isLow: boolean;              // < 20% remaining
  isCritical: boolean;         // < 5% remaining
  isExhausted: boolean;        // 0% remaining
}

/**
 * Admin view of user usage
 */
export interface AdminUserUsage {
  userId: number;
  username: string;
  email: string;
  usage: UserUsage;
  lastActive: string;
}

/**
 * Credit adjustment request (admin)
 */
export interface CreditAdjustment {
  userId: number;
  adjustment: number;      // Can be positive or negative
  reason: string;
  adjustedBy: string;      // Admin username/email
  timestamp: string;
}

/**
 * Default usage for new users
 */
export const DEFAULT_USER_USAGE: UserUsage = {
  userId: null,
  totalCredits: 100,       // $3 worth
  usedCredits: 0,
  resetDate: null,         // No auto-reset for now
  lastUpdated: new Date().toISOString(),
  history: [],
};

/**
 * Usage for unauthenticated users (limited)
 */
export const GUEST_USAGE_LIMIT = 10; // 10 free actions per session

/**
 * Calculate usage display from UserUsage
 */
export function calculateUsageDisplay(usage: UserUsage | null | undefined): UsageDisplay {
  // Handle null/undefined usage gracefully
  if (!usage) {
    return {
      percentageUsed: 0,
      percentageRemaining: 100,
      creditsRemaining: 100,
      formattedRemaining: '100% remaining',
      isLow: false,
      isCritical: false,
      isExhausted: false,
    };
  }

  const totalCredits = usage.totalCredits || 100;
  const usedCredits = usage.usedCredits || 0;
  const percentageUsed = Math.min(100, (usedCredits / totalCredits) * 100);
  const percentageRemaining = Math.max(0, 100 - percentageUsed);
  const creditsRemaining = Math.max(0, totalCredits - usedCredits);

  return {
    percentageUsed: Math.round(percentageUsed),
    percentageRemaining: Math.round(percentageRemaining),
    creditsRemaining,
    formattedRemaining: `${Math.round(percentageRemaining)}% remaining`,
    isLow: percentageRemaining < 20,
    isCritical: percentageRemaining < 5,
    isExhausted: percentageRemaining <= 0,
  };
}

/**
 * Check if user can perform an action
 */
export function canPerformAction(usage: UserUsage, action: PDFAIAction): boolean {
  const cost = ACTION_CREDIT_COSTS[action] ?? 1;
  const usedCredits = usage?.usedCredits ?? 0;
  const totalCredits = usage?.totalCredits ?? 100;
  return usedCredits + cost <= totalCredits;
}

/**
 * Get credit cost for an action
 */
export function getActionCost(action: PDFAIAction): number {
  return ACTION_CREDIT_COSTS[action];
}
