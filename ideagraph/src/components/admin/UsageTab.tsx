// Admin Usage Tab Component
// Displays and manages user AI credit usage

import { useState, useEffect, useCallback, Fragment } from 'react';
import {
  RefreshCw,
  TrendingUp,
  Users,
  Zap,
  ChevronDown,
  ChevronUp,
  Plus,
  RotateCcw,
  AlertCircle,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import {
  fetchAllUsersUsage,
  adjustUserCredits,
  resetUserCredits,
  fetchUsageStats,
  type AdminUserUsage,
} from '../../services/usage';
import { calculateUsageDisplay } from '../../services/usage/usageTypes';
import { UsageMeter } from '../pdf/UsageMeter';

interface UsageTabProps {
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

export function UsageTab({ onError, onSuccess }: UsageTabProps) {
  // State
  const [users, setUsers] = useState<AdminUserUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [adjustingUserId, setAdjustingUserId] = useState<number | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);
  const [stats, setStats] = useState<{
    totalUsers: number;
    activeUsers: number;
    totalCreditsUsed: number;
    avgCreditsUsed: number;
  } | null>(null);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersData, statsData] = await Promise.all([
        fetchAllUsersUsage(),
        fetchUsageStats(),
      ]);

      if (usersData) {
        setUsers(usersData);
      }
      if (statsData) {
        setStats(statsData);
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to fetch usage data');
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle credit adjustment
  const handleAdjustCredits = async (userId: number) => {
    const amount = parseInt(adjustAmount, 10);
    if (isNaN(amount) || amount === 0) {
      onError?.('Please enter a valid adjustment amount');
      return;
    }

    if (!adjustReason.trim()) {
      onError?.('Please provide a reason for the adjustment');
      return;
    }

    setIsSubmittingAdjust(true);
    try {
      const result = await adjustUserCredits({
        userId,
        adjustment: amount,
        reason: adjustReason,
      });

      if (result?.success) {
        onSuccess?.(`Credits adjusted successfully. New total: ${result.newTotal}`);
        setAdjustingUserId(null);
        setAdjustAmount('');
        setAdjustReason('');
        fetchUsers(); // Refresh data
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to adjust credits');
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  // Handle credit reset
  const handleResetCredits = async (userId: number, username: string) => {
    if (!confirm(`Reset credits for "${username}" to 100 (default $3)?`)) {
      return;
    }

    try {
      const result = await resetUserCredits(userId);
      if (result?.success) {
        onSuccess?.(`Credits reset for ${username}`);
        fetchUsers();
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to reset credits');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">Total Users</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.totalUsers}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-medium">Active Users</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.activeUsers}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Total Credits Used</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.totalCreditsUsed}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Avg Credits/User</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {(stats.avgCreditsUsed ?? 0).toFixed(1)}
            </p>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            User Usage ({users.length})
          </h3>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No usage data available yet.</p>
            <p className="text-sm mt-1">Users need to use AI features to appear here.</p>
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    Usage
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    Credits
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    Last Active
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {users.map((user) => {
                  const usageDisplay = calculateUsageDisplay(user.usage);
                  const isExpanded = expandedUserId === user.userId;
                  const isAdjusting = adjustingUserId === user.userId;

                  return (
                    <Fragment key={user.userId}>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {user.username}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {user.email}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <UsageMeter
                            usage={usageDisplay}
                            variant="compact"
                            className="w-24"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {user.usage?.usedCredits ?? 0} / {user.usage?.totalCredits ?? 100}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                          {formatDate(user.lastActive)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (isAdjusting) {
                                  // Close form and clear values
                                  setAdjustingUserId(null);
                                  setAdjustAmount('');
                                  setAdjustReason('');
                                } else {
                                  // Open form for this user with cleared values
                                  setAdjustingUserId(user.userId);
                                  setAdjustAmount('');
                                  setAdjustReason('');
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                              title="Adjust credits"
                            >
                              {isAdjusting ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleResetCredits(user.userId, user.username)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                              title="Reset to default"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setExpandedUserId(isExpanded ? null : user.userId)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                              title="View history"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Adjustment Form */}
                      {isAdjusting && (
                        <tr key={`${user.userId}-adjust`} className="bg-indigo-50 dark:bg-indigo-900/20">
                          <td colSpan={5} className="px-4 py-3">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <label className="text-sm text-slate-600 dark:text-slate-400">
                                  Adjust by:
                                </label>
                                <input
                                  type="number"
                                  value={adjustAmount}
                                  onChange={(e) => setAdjustAmount(e.target.value)}
                                  placeholder="+10 or -5"
                                  className="w-24 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-sm"
                                />
                              </div>
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={adjustReason}
                                  onChange={(e) => setAdjustReason(e.target.value)}
                                  placeholder="Reason for adjustment"
                                  className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-sm"
                                />
                              </div>
                              <button
                                onClick={() => handleAdjustCredits(user.userId)}
                                disabled={isSubmittingAdjust}
                                className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded"
                              >
                                <Check className="w-3 h-3" />
                                Apply
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Expanded History */}
                      {isExpanded && (
                        <tr key={`${user.userId}-history`} className="bg-slate-50 dark:bg-slate-800/30">
                          <td colSpan={5} className="px-4 py-3">
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Recent Activity
                            </h4>
                            {(!user.usage?.history || user.usage.history.length === 0) ? (
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                No activity yet
                              </p>
                            ) : (
                              <div className="space-y-1 max-h-48 overflow-y-auto">
                                {(user.usage?.history ?? []).slice(0, 10).map((entry) => (
                                  <div
                                    key={entry.id}
                                    className="flex items-center justify-between text-sm py-1"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                                        entry.success
                                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                      }`}>
                                        {entry.action}
                                      </span>
                                      {entry.paperTitle && (
                                        <span className="text-slate-500 dark:text-slate-400 truncate max-w-xs">
                                          {entry.paperTitle}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                                      <span>-{entry.creditsUsed} credits</span>
                                      <span>{formatDate(entry.timestamp)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
