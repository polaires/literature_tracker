import { useState, useEffect } from 'react';
import { X, Users, Settings, Cloud, Trash2, RefreshCw, Shield, Ban, Check } from 'lucide-react';
import { getToken } from '../../services/auth/api';

const API_URL = import.meta.env.VITE_API_URL || 'https://laudable-appreciation-production.up.railway.app';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  email_verified: boolean;
  created_at: string;
}

interface AdminSettings {
  syncEnabled: boolean;
  defaultApiProvider: 'claude' | 'openai' | 'ollama';
  defaultApiKey: string;
  allowPublicRegistration: boolean;
}

interface AdminDashboardProps {
  onClose: () => void;
}

export function AdminDashboard({ onClose }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'settings'>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [settings, setSettings] = useState<AdminSettings>({
    syncEnabled: false,
    defaultApiProvider: 'claude',
    defaultApiKey: '',
    allowPublicRegistration: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch users
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Admin privileges required.');
        }
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch admin settings
  const fetchSettings = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/admin/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || settings);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  // Save admin settings
  const saveSettings = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/admin/settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSuccessMessage('Settings saved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    }
  };

  // Delete user
  const deleteUser = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This cannot be undone.`)) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      setUsers(users.filter(u => u.id !== userId));
      setSuccessMessage(`User "${username}" deleted successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSettings();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Users className="h-4 w-4" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-6 mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-4 rounded-md bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/30 dark:text-green-400">
            {successMessage}
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {activeTab === 'users' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Registered Users ({users.length})
                </h3>
                <button
                  onClick={fetchUsers}
                  className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No users found. The admin API endpoints may not be set up yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Username</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Verified</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Created</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700">
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{user.id}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{user.username}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{user.email}</td>
                          <td className="px-4 py-3">
                            {user.email_verified ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                <Check className="h-3 w-3" />
                                Yes
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                <Ban className="h-3 w-3" />
                                No
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => deleteUser(user.id, user.username)}
                              className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Sync Settings */}
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <Cloud className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sync Settings</h3>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.syncEnabled}
                      onChange={(e) => setSettings({ ...settings, syncEnabled: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Enable cloud sync for all users
                    </span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.allowPublicRegistration}
                      onChange={(e) => setSettings({ ...settings, allowPublicRegistration: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Allow public user registration
                    </span>
                  </label>
                </div>
              </div>

              {/* Default API Settings */}
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <Settings className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Default API Settings</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Default AI Provider
                    </label>
                    <select
                      value={settings.defaultApiProvider}
                      onChange={(e) => setSettings({ ...settings, defaultApiProvider: e.target.value as 'claude' | 'openai' | 'ollama' })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="claude">Claude (Anthropic)</option>
                      <option value="openai">OpenAI</option>
                      <option value="ollama">Ollama (Local)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Default API Key (for users without their own key)
                    </label>
                    <input
                      type="password"
                      value={settings.defaultApiKey}
                      onChange={(e) => setSettings({ ...settings, defaultApiKey: e.target.value })}
                      placeholder="sk-..."
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      This key will be used when users don't have their own API key configured.
                    </p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={saveSettings}
                  className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                >
                  Save Settings
                </button>
              </div>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> These settings require the admin API endpoints to be added to the Protein Engineering Tools server.
                  Until then, changes will only be saved locally.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
