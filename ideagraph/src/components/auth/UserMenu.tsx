import { useState } from 'react';
import { User, LogOut, RefreshCw, Cloud, CloudOff, Shield } from 'lucide-react';
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
      <div className="flex items-center gap-2 text-stone-400">
        <RefreshCw className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <button
          onClick={() => setShowAuthModal(true)}
          className="flex items-center gap-2 rounded-full bg-orange-500 px-3 py-1.5 text-sm text-white hover:bg-orange-600 font-medium"
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
        className="flex items-center gap-2 cursor-pointer hover:bg-stone-100 p-1 rounded-md transition-colors pr-2"
      >
        <div className="w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold border border-orange-200">
          {user?.username?.charAt(0).toUpperCase()}{user?.username?.charAt(1)?.toUpperCase() || ''}
        </div>
        <span className="text-xs font-medium text-stone-600 hidden sm:block max-w-[100px] truncate">{user?.username}</span>
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-stone-200 bg-white py-1.5 shadow-lg">
            <div className="border-b border-stone-200 px-4 py-2.5">
              <p className="text-sm font-medium text-stone-800">{user?.username}</p>
              <p className="truncate text-xs text-stone-500">{user?.email}</p>
              {!user?.email_verified && (
                <p className="mt-1 text-xs text-orange-500">Email not verified</p>
              )}
            </div>

            <div className="border-b border-stone-200 py-1">
              <button
                onClick={handleSyncClick}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-stone-400 cursor-not-allowed"
                disabled
              >
                <Cloud className="h-4 w-4" />
                Sync to Cloud
                <span className="ml-auto text-xs bg-stone-100 px-1.5 py-0.5 rounded">Soon</span>
              </button>
              <button
                onClick={handleSyncClick}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-stone-400 cursor-not-allowed"
                disabled
              >
                <CloudOff className="h-4 w-4" />
                Sync from Cloud
                <span className="ml-auto text-xs bg-stone-100 px-1.5 py-0.5 rounded">Soon</span>
              </button>
            </div>

            {isAdmin && (
              <div className="border-b border-stone-200 py-1">
                <button
                  onClick={() => {
                    setShowAdminDashboard(true);
                    setShowDropdown(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-purple-600 hover:bg-purple-50"
                >
                  <Shield className="h-4 w-4" />
                  Admin Dashboard
                </button>
              </div>
            )}

            <div className="py-1">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
