// Usage API Service
// Backend API calls for usage tracking

import type { PDFAIAction } from '../ai/prompts/pdfSummary';
import type { UserUsage, AdminUserUsage } from './usageTypes';
import { getToken } from '../auth/api';

const API_URL = import.meta.env.VITE_API_URL || 'https://laudable-appreciation-production.up.railway.app';

/**
 * Track usage on the server
 */
export async function trackUsageOnServer(params: {
  action: PDFAIAction;
  tokensInput: number;
  tokensOutput: number;
  model: string;
  paperId?: string;
  success: boolean;
}): Promise<{ creditsRemaining: number } | null> {
  const token = getToken();
  if (!token) {
    return null; // Not authenticated, skip server tracking
  }

  try {
    const response = await fetch(`${API_URL}/api/usage/track`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Failed to track usage: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to track usage on server:', error);
    return null;
  }
}

/**
 * Fetch current usage from server
 */
export async function fetchCurrentUsage(): Promise<UserUsage | null> {
  const token = getToken();
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/usage/current`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // User doesn't have usage record yet
        return null;
      }
      throw new Error(`Failed to fetch usage: ${response.status}`);
    }

    const data = await response.json();
    return data.usage;
  } catch (error) {
    console.error('Failed to fetch usage from server:', error);
    return null;
  }
}

/**
 * Fetch usage history from server
 */
export async function fetchUsageHistory(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ history: UserUsage['history']; total: number } | null> {
  const token = getToken();
  if (!token) {
    return null;
  }

  try {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.offset) queryParams.set('offset', String(params.offset));

    const url = `${API_URL}/api/usage/history${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch usage history: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch usage history:', error);
    return null;
  }
}

// =============================================================================
// ADMIN API FUNCTIONS
// =============================================================================

/**
 * Fetch all users' usage (admin only)
 */
export async function fetchAllUsersUsage(): Promise<AdminUserUsage[] | null> {
  const token = getToken();
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/admin/usage`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Access denied. Admin privileges required.');
      }
      throw new Error(`Failed to fetch usage: ${response.status}`);
    }

    const data = await response.json();
    return data.users;
  } catch (error) {
    console.error('Failed to fetch all users usage:', error);
    throw error;
  }
}

/**
 * Fetch specific user's usage (admin only)
 */
export async function fetchUserUsage(userId: number): Promise<UserUsage | null> {
  const token = getToken();
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/admin/usage/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Access denied. Admin privileges required.');
      }
      throw new Error(`Failed to fetch user usage: ${response.status}`);
    }

    const data = await response.json();
    return data.usage;
  } catch (error) {
    console.error('Failed to fetch user usage:', error);
    throw error;
  }
}

/**
 * Adjust user credits (admin only)
 */
export async function adjustUserCredits(params: {
  userId: number;
  adjustment: number;
  reason: string;
}): Promise<{ success: boolean; newTotal: number } | null> {
  const token = getToken();
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/admin/usage/${params.userId}/adjust`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        adjustment: params.adjustment,
        reason: params.reason,
      }),
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Access denied. Admin privileges required.');
      }
      throw new Error(`Failed to adjust credits: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to adjust user credits:', error);
    throw error;
  }
}

/**
 * Reset user credits to default (admin only)
 */
export async function resetUserCredits(userId: number): Promise<{ success: boolean } | null> {
  const token = getToken();
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/admin/usage/${userId}/reset`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Access denied. Admin privileges required.');
      }
      throw new Error(`Failed to reset credits: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to reset user credits:', error);
    throw error;
  }
}

/**
 * Get usage statistics summary (admin only)
 */
export async function fetchUsageStats(): Promise<{
  totalUsers: number;
  activeUsers: number;
  totalCreditsUsed: number;
  avgCreditsUsed: number;
  actionsBreakdown: Record<string, number>;
} | null> {
  const token = getToken();
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/admin/usage/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Access denied. Admin privileges required.');
      }
      throw new Error(`Failed to fetch usage stats: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch usage stats:', error);
    throw error;
  }
}
