import { useState } from 'react';
import { User, LogOut, RefreshCw, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthModal } from './AuthModal';

export function UserMenu() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
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
    </div>
  );
}
