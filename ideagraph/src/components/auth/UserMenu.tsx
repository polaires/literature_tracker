import { useState } from 'react';
import { User, LogOut, RefreshCw, ChevronDown, Cloud, CloudOff, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { AdminDashboard } from './AdminDashboard';

// Admin user email
const ADMIN_EMAIL = 'ww2607@columbia.edu';

export function UserMenu() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
  };

  const handleSyncClick = () => {
    // Coming soon - just show a message
    alert('Cloud Sync coming soon!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <RefreshCw className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <button
          onClick={() => setShowAuthModal(true)}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          <User className="h-4 w-4" />
          Sign In
        </button>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
          {user?.username?.charAt(0).toUpperCase()}
        </div>
        <span className="max-w-[100px] truncate">{user?.username}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.username}</p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              {!user?.email_verified && (
                <p className="mt-1 text-xs text-orange-500">Email not verified</p>
              )}
            </div>

            <div className="border-b border-gray-200 py-1 dark:border-gray-700">
              <button
                onClick={handleSyncClick}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
                disabled
              >
                <Cloud className="h-4 w-4" />
                Sync to Cloud
                <span className="ml-auto text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">Soon</span>
              </button>
              <button
                onClick={handleSyncClick}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
                disabled
              >
                <CloudOff className="h-4 w-4" />
                Sync from Cloud
                <span className="ml-auto text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">Soon</span>
              </button>
            </div>

            {isAdmin && (
              <div className="border-b border-gray-200 py-1 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowAdminDashboard(true);
                    setShowDropdown(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
                >
                  <Shield className="h-4 w-4" />
                  Admin Dashboard
                </button>
              </div>
            )}

            <div className="py-1">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      {showAdminDashboard && (
        <AdminDashboard onClose={() => setShowAdminDashboard(false)} />
      )}
    </div>
  );
}
