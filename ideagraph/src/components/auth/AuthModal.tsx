import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login({
          username: formData.username,
          password: formData.password,
        });
        onClose();
      } else if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setIsSubmitting(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          setIsSubmitting(false);
          return;
        }
        await register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });
        onClose();
      } else if (mode === 'forgot') {
        // TODO: Implement forgot password
        setSuccess('If an account exists with this email, a reset link has been sent.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-sm rounded-xl bg-[#FDFBF7] p-5 shadow-xl dark:bg-slate-800 border border-stone-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-stone-400 hover:text-stone-600 dark:hover:text-slate-300"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5">
          <h2 className="text-xl font-semibold text-stone-800 dark:text-white">
            {mode === 'login' && 'Sign In'}
            {mode === 'register' && 'Create Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
          <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">
            {mode === 'login' && 'Sign in to sync your data across devices'}
            {mode === 'register' && 'Create an account to enable cloud sync'}
            {mode === 'forgot' && 'Enter your email to receive a reset link'}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/30 dark:text-green-400">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode !== 'forgot' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-slate-300">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>
          )}

          {(mode === 'register' || mode === 'forgot') && (
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-slate-300">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>
          )}

          {mode !== 'forgot' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-9 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-slate-300">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-stone-800 py-2 text-sm font-medium text-white hover:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-stone-700 dark:hover:bg-stone-600 mt-1"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {mode === 'login' && 'Signing in...'}
                {mode === 'register' && 'Creating account...'}
                {mode === 'forgot' && 'Sending...'}
              </span>
            ) : (
              <>
                {mode === 'login' && 'Sign In'}
                {mode === 'register' && 'Create Account'}
                {mode === 'forgot' && 'Send Reset Link'}
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-stone-500 dark:text-slate-400">
          {mode === 'login' && (
            <>
              <button
                onClick={() => setMode('forgot')}
                className="text-stone-600 hover:underline dark:text-slate-300"
              >
                Forgot password?
              </button>
              <span className="mx-2">|</span>
              <span>
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('register')}
                  className="text-stone-600 hover:underline dark:text-slate-300"
                >
                  Sign up
                </button>
              </span>
            </>
          )}
          {mode === 'register' && (
            <span>
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-stone-600 hover:underline dark:text-slate-300"
              >
                Sign in
              </button>
            </span>
          )}
          {mode === 'forgot' && (
            <button
              onClick={() => setMode('login')}
              className="text-stone-600 hover:underline dark:text-slate-300"
            >
              Back to sign in
            </button>
          )}
        </div>

        <div className="mt-3 border-t border-stone-200 pt-3 dark:border-slate-700">
          <p className="text-center text-xs text-stone-400 dark:text-slate-500">
            Your account works across IdeaGraph and Protein Engineering Tools
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
