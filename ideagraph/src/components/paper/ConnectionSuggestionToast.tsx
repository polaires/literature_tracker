// ConnectionSuggestionToast - Shows pending connection suggestions
// Appears as a floating notification when auto-connect finds connections

import { useState } from 'react';
import {
  Link2,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import type { ConnectionSuggestion } from '../../services/ai';
import { CONNECTION_TYPE_COLORS } from '../../constants/colors';

interface ConnectionSuggestionToastProps {
  paperTitle: string;
  suggestions: ConnectionSuggestion[];
  onAccept: (suggestion: ConnectionSuggestion) => void;
  onDismiss: (suggestionId: string) => void;
  onDismissAll: () => void;
}

export function ConnectionSuggestionToast({
  paperTitle,
  suggestions,
  onAccept,
  onDismiss,
  onDismissAll,
}: ConnectionSuggestionToastProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (suggestions.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-stone-200 dark:border-stone-800 overflow-hidden max-w-md">
      {/* Header */}
      <div className="p-3 bg-gradient-to-r from-stone-50 to-amber-50 dark:from-stone-900/30 dark:to-amber-900/30 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-stone-100 dark:bg-stone-800 rounded-lg">
              <Sparkles size={14} className="text-stone-700 dark:text-stone-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                {suggestions.length} connection{suggestions.length > 1 ? 's' : ''} found
              </p>
              <p className="text-xs text-stone-700 dark:text-stone-400 truncate">
                for "{paperTitle.slice(0, 40)}..."
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-stone-600 hover:text-stone-800 dark:hover:text-stone-300"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <button
              onClick={onDismissAll}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Collapsed view - show first suggestion */}
      {!isExpanded && (
        <div className="p-3">
          <SuggestionRow
            suggestion={suggestions[0]}
            onAccept={onAccept}
            onDismiss={onDismiss}
            compact
          />
          {suggestions.length > 1 && (
            <button
              onClick={() => setIsExpanded(true)}
              className="mt-2 text-xs text-stone-700 dark:text-stone-400 hover:underline"
            >
              +{suggestions.length - 1} more
            </button>
          )}
        </div>
      )}

      {/* Expanded view - show all suggestions */}
      {isExpanded && (
        <div className="p-3 space-y-3 max-h-60 overflow-y-auto">
          {suggestions.map(suggestion => (
            <SuggestionRow
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={onAccept}
              onDismiss={onDismiss}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SuggestionRowProps {
  suggestion: ConnectionSuggestion;
  onAccept: (suggestion: ConnectionSuggestion) => void;
  onDismiss: (suggestionId: string) => void;
  compact?: boolean;
}

function SuggestionRow({
  suggestion,
  onAccept,
  onDismiss,
  compact,
}: SuggestionRowProps) {
  const typeColors = CONNECTION_TYPE_COLORS[suggestion.connectionType] || {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-600 dark:text-gray-400',
    label: suggestion.connectionType,
  };

  return (
    <div className="flex items-start gap-2">
      <Link2 size={14} className="text-stone-600 mt-1 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${typeColors.bg} ${typeColors.text}`}>
            {typeColors.label}
          </span>
          <span className="text-xs text-gray-500">
            {Math.round(suggestion.confidence * 100)}% confident
          </span>
        </div>
        <p className={`text-gray-700 dark:text-gray-300 truncate ${compact ? 'text-xs' : 'text-sm'}`}>
          {suggestion.suggestedPaperTitle}
        </p>
        {!compact && suggestion.reasoning && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
            {suggestion.reasoning}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onAccept(suggestion)}
          className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
          title="Accept connection"
        >
          <Check size={14} />
        </button>
        <button
          onClick={() => onDismiss(suggestion.id)}
          className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

/**
 * Container for multiple paper suggestion toasts
 */
interface ConnectionSuggestionStackProps {
  suggestions: Array<{
    paperId: string;
    paperTitle: string;
    suggestions: ConnectionSuggestion[];
  }>;
  onAccept: (paperId: string, suggestion: ConnectionSuggestion) => void;
  onDismiss: (paperId: string, suggestionId: string) => void;
  onDismissAll: (paperId: string) => void;
}

export function ConnectionSuggestionStack({
  suggestions,
  onAccept,
  onDismiss,
  onDismissAll,
}: ConnectionSuggestionStackProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {suggestions.slice(0, 3).map(item => (
        <ConnectionSuggestionToast
          key={item.paperId}
          paperTitle={item.paperTitle}
          suggestions={item.suggestions}
          onAccept={s => onAccept(item.paperId, s)}
          onDismiss={id => onDismiss(item.paperId, id)}
          onDismissAll={() => onDismissAll(item.paperId)}
        />
      ))}
      {suggestions.length > 3 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          +{suggestions.length - 3} more papers with suggestions
        </div>
      )}
    </div>
  );
}
