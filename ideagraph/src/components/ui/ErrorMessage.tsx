import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  details?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

// User-friendly error messages
const ERROR_MESSAGES: Record<string, string> = {
  'Failed to fetch': 'Network connection failed. Please check your internet connection.',
  '404': 'The requested resource was not found. Please check your input.',
  '429': 'Too many requests. Please wait a moment and try again.',
  '500': 'Server error. Please try again later.',
  'DOI not found': 'We couldn\'t find a paper with this DOI. Check the format or try manual entry.',
  'Network error': 'Connection failed. Check your internet and try again.',
  'Invalid JSON': 'The data format is invalid. Please check your file.',
};

function getFriendlyMessage(error: string): string {
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (error.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  return error;
}

export function ErrorMessage({ message, details, onRetry, retryLabel = 'Try Again' }: ErrorMessageProps) {
  const friendlyMessage = getFriendlyMessage(message);

  return (
    <div
      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            {friendlyMessage}
          </p>
          {details && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {details}
            </p>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors"
            >
              <RefreshCw size={14} />
              {retryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
