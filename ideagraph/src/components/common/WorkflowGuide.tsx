import { useState, useMemo } from 'react';
import {
  Lightbulb,
  X,
  ClipboardCheck,
  BookOpen,
  Grid3X3,
  AlertTriangle,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface WorkflowGuideProps {
  thesisId: string;
  onAction?: (action: WorkflowAction) => void;
}

export type WorkflowAction =
  | 'add-paper'
  | 'search-papers'
  | 'open-screening'
  | 'continue-reading'
  | 'open-matrix'
  | 'open-gaps'
  | 'detect-gaps'
  | 'export-outline';

interface Suggestion {
  id: string;
  icon: React.ReactNode;
  message: string;
  action: WorkflowAction;
  actionLabel: string;
}

export function WorkflowGuide({ thesisId, onAction }: WorkflowGuideProps) {
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  const {
    getPapersForThesis,
    getScreeningStats,
    getThemesForThesis,
    getGapsForThesis,
  } = useAppStore();

  // Generate contextual suggestions based on current state
  const suggestions = useMemo((): Suggestion[] => {
    const papers = getPapersForThesis(thesisId);
    const screeningStats = getScreeningStats(thesisId);
    const themes = getThemesForThesis(thesisId);
    const gaps = getGapsForThesis(thesisId);

    const includedPapers = papers.filter((p) => p.screeningDecision === 'include');
    const pendingScreening = screeningStats.pending + screeningStats.maybe;
    const unreadPapers = includedPapers.filter(
      (p) => p.readingStatus === 'to-read' || p.readingStatus === 'reading'
    );

    const items: Suggestion[] = [];

    // Suggestion: Screen pending papers (high priority)
    if (pendingScreening > 0) {
      items.push({
        id: 'screen-papers',
        icon: <ClipboardCheck size={16} />,
        message: `${pendingScreening} paper${pendingScreening > 1 ? 's need' : ' needs'} screening`,
        action: 'open-screening',
        actionLabel: 'Screen now',
      });
    }

    // Suggestion: Continue reading
    if (unreadPapers.length > 0 && pendingScreening === 0) {
      items.push({
        id: 'read-papers',
        icon: <BookOpen size={16} />,
        message: `${unreadPapers.length} paper${unreadPapers.length > 1 ? 's' : ''} to read`,
        action: 'continue-reading',
        actionLabel: 'Continue',
      });
    }

    // Suggestion: Create themes (only if enough papers and no themes yet)
    if (includedPapers.length >= 5 && themes.length === 0) {
      items.push({
        id: 'create-themes',
        icon: <Grid3X3 size={16} />,
        message: 'Organize papers into themes',
        action: 'open-matrix',
        actionLabel: 'Create themes',
      });
    }

    // Suggestion: Detect gaps (only if enough papers and no gaps)
    if (includedPapers.length >= 5 && gaps.length === 0) {
      items.push({
        id: 'detect-gaps',
        icon: <AlertTriangle size={16} />,
        message: 'Auto-detect research gaps',
        action: 'detect-gaps',
        actionLabel: 'Analyze',
      });
    }

    return items.filter((s) => !dismissedSuggestions.has(s.id));
  }, [
    thesisId,
    getPapersForThesis,
    getScreeningStats,
    getThemesForThesis,
    getGapsForThesis,
    dismissedSuggestions,
  ]);

  const handleDismiss = (id: string) => {
    setDismissedSuggestions((prev) => new Set([...prev, id]));
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb size={14} className="text-amber-500" />
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Suggestions
        </h3>
      </div>

      <div className="space-y-2">
        {suggestions.slice(0, 3).map((suggestion) => (
          <div
            key={suggestion.id}
            className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            <div className="w-6 h-6 rounded flex items-center justify-center bg-stone-100 dark:bg-stone-800/50 text-stone-700 dark:text-stone-400 flex-shrink-0">
              {suggestion.icon}
            </div>
            <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 min-w-0">
              {suggestion.message}
            </span>
            <button
              onClick={() => onAction?.(suggestion.action)}
              className="text-xs text-stone-700 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-300 font-medium flex-shrink-0"
            >
              {suggestion.actionLabel}
            </button>
            <button
              onClick={() => handleDismiss(suggestion.id)}
              className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
              title="Dismiss"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
