import { useState, useCallback, useMemo } from 'react';
import {
  Check,
  X,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  BarChart3,
  ExternalLink,
  BookOpen,
  Calendar,
  Quote,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { cleanAbstract } from '../../utils/textCleaner';
import type { ExclusionReason } from '../../types';

interface ScreeningPanelProps {
  thesisId: string;
  onClose: () => void;
}

const EXCLUSION_REASONS: { value: ExclusionReason; label: string }[] = [
  { value: 'not-relevant', label: 'Not relevant to topic' },
  { value: 'wrong-study-type', label: 'Wrong study type' },
  { value: 'duplicate', label: 'Duplicate paper' },
  { value: 'no-full-text', label: 'No full text available' },
  { value: 'wrong-population', label: 'Wrong population/sample' },
  { value: 'wrong-outcome', label: 'Wrong outcome measure' },
  { value: 'low-quality', label: 'Low quality study' },
  { value: 'language', label: 'Wrong language' },
  { value: 'date-range', label: 'Outside date range' },
  { value: 'other', label: 'Other reason' },
];

export function ScreeningPanel({ thesisId, onClose }: ScreeningPanelProps) {
  const {
    getPapersForScreening,
    getScreeningStats,
    setScreeningDecision,
    getPapersForThesis,
  } = useAppStore();

  // Get papers to screen
  const papersToScreen = getPapersForScreening(thesisId);
  const allPapers = getPapersForThesis(thesisId);
  const stats = getScreeningStats(thesisId);

  // Current paper index
  const [currentIndex, setCurrentIndex] = useState(0);

  // Exclusion reason state
  const [showExclusionReasons, setShowExclusionReasons] = useState(false);
  const [customReason, setCustomReason] = useState('');

  // Filter state
  const [showMaybeOnly, setShowMaybeOnly] = useState(false);

  // Filtered papers
  const filteredPapers = useMemo(() => {
    if (showMaybeOnly) {
      return papersToScreen.filter((p) => p.screeningDecision === 'maybe');
    }
    return papersToScreen;
  }, [papersToScreen, showMaybeOnly]);

  const currentPaper = filteredPapers[currentIndex];

  // Navigation
  const goToNext = useCallback(() => {
    if (currentIndex < filteredPapers.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowExclusionReasons(false);
      setCustomReason('');
    }
  }, [currentIndex, filteredPapers.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowExclusionReasons(false);
      setCustomReason('');
    }
  }, [currentIndex]);

  // Screening decisions
  const handleInclude = useCallback(() => {
    if (currentPaper) {
      setScreeningDecision(currentPaper.id, 'include');
      goToNext();
    }
  }, [currentPaper, setScreeningDecision, goToNext]);

  const handleExclude = useCallback(
    (reason: ExclusionReason) => {
      if (currentPaper) {
        setScreeningDecision(
          currentPaper.id,
          'exclude',
          reason,
          reason === 'other' ? customReason : undefined
        );
        setShowExclusionReasons(false);
        setCustomReason('');
        goToNext();
      }
    },
    [currentPaper, setScreeningDecision, customReason, goToNext]
  );

  const handleMaybe = useCallback(() => {
    if (currentPaper) {
      setScreeningDecision(currentPaper.id, 'maybe');
      goToNext();
    }
  }, [currentPaper, setScreeningDecision, goToNext]);

  // Progress percentage
  const progressPercentage = useMemo(() => {
    const total = stats.pending + stats.include + stats.exclude + stats.maybe;
    if (total === 0) return 100;
    return Math.round(((stats.include + stats.exclude) / total) * 100);
  }, [stats]);

  // No papers to screen
  if (filteredPapers.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Check size={32} className="text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {showMaybeOnly ? 'No "Maybe" Papers Left' : 'Screening Complete!'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {showMaybeOnly
              ? 'All papers marked as "Maybe" have been reviewed.'
              : `You've screened all ${allPapers.length} papers in this thesis.`}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.include}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">Included</div>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.exclude}
              </div>
              <div className="text-xs text-red-700 dark:text-red-300">Excluded</div>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {stats.maybe}
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300">Maybe</div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            {showMaybeOnly && stats.pending > 0 && (
              <Button variant="secondary" onClick={() => setShowMaybeOnly(false)}>
                Screen Pending Papers
              </Button>
            )}
            {!showMaybeOnly && stats.maybe > 0 && (
              <Button
                variant="secondary"
                onClick={() => {
                  setShowMaybeOnly(true);
                  setCurrentIndex(0);
                }}
              >
                Review "Maybe" Papers
              </Button>
            )}
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-stone-700 dark:text-stone-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Screening Mode
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {/* Filter toggle */}
              <button
                onClick={() => {
                  setShowMaybeOnly(!showMaybeOnly);
                  setCurrentIndex(0);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  showMaybeOnly
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Filter size={14} />
                {showMaybeOnly ? 'Maybe Only' : 'All Papers'}
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>
                Paper {currentIndex + 1} of {filteredPapers.length}
              </span>
              <span>{progressPercentage}% complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-stone-800 h-2 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span className="text-green-600 dark:text-green-400">
                {stats.include} included
              </span>
              <span className="text-red-600 dark:text-red-400">
                {stats.exclude} excluded
              </span>
              <span className="text-amber-600 dark:text-amber-400">
                {stats.maybe} maybe
              </span>
            </div>
          </div>
        </div>

        {/* Paper Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentPaper && (
            <div>
              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {currentPaper.title}
              </h3>

              {/* Authors */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {currentPaper.authors.map((a) => a.name).join(', ')}
              </p>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-500 dark:text-gray-400">
                {currentPaper.year && (
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {currentPaper.year}
                  </span>
                )}
                {currentPaper.journal && (
                  <span className="flex items-center gap-1">
                    <BookOpen size={14} />
                    {currentPaper.journal}
                  </span>
                )}
                {currentPaper.citationCount !== null && (
                  <span className="flex items-center gap-1">
                    <Quote size={14} />
                    {currentPaper.citationCount.toLocaleString()} citations
                  </span>
                )}
                {currentPaper.doi && (
                  <a
                    href={`https://doi.org/${currentPaper.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-stone-700 dark:text-stone-400 hover:underline"
                  >
                    <ExternalLink size={14} />
                    View Paper
                  </a>
                )}
              </div>

              {/* Abstract */}
              {currentPaper.abstract ? (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Abstract
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {cleanAbstract(currentPaper.abstract)}
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 mb-4 text-sm text-amber-700 dark:text-amber-400">
                  No abstract available. Consider viewing the full paper.
                </div>
              )}

              {/* Current takeaway if exists */}
              {currentPaper.takeaway &&
                currentPaper.takeaway !== 'Takeaway to be added after reading' && (
                  <div className="bg-stone-100 dark:bg-stone-800/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-stone-800 dark:text-stone-300 mb-1">
                      Current Takeaway
                    </h4>
                    <p className="text-sm text-stone-700 dark:text-stone-400">
                      {currentPaper.takeaway}
                    </p>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Exclusion Reasons Panel */}
        {showExclusionReasons && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select exclusion reason:
            </h4>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {EXCLUSION_REASONS.map((reason) => (
                <button
                  key={reason.value}
                  onClick={() =>
                    reason.value === 'other'
                      ? null
                      : handleExclude(reason.value)
                  }
                  className={`px-3 py-2 text-sm text-left rounded-lg transition-colors ${
                    reason.value === 'other'
                      ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                >
                  {reason.label}
                </button>
              ))}
            </div>
            {/* Custom reason input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter custom reason..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleExclude('other')}
                disabled={!customReason.trim()}
              >
                Exclude
              </Button>
            </div>
            <button
              onClick={() => setShowExclusionReasons(false)}
              className="mt-3 text-sm text-gray-500 dark:text-gray-400 hover:underline"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Footer - Decision Buttons */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={goToNext}
                disabled={currentIndex >= filteredPapers.length - 1}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Decision Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="danger"
                onClick={() => setShowExclusionReasons(true)}
                icon={<X size={18} />}
                disabled={showExclusionReasons}
              >
                Exclude
              </Button>
              <button
                onClick={handleMaybe}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
              >
                <HelpCircle size={18} />
                Maybe
              </button>
              <Button onClick={handleInclude} icon={<Check size={18} />}>
                Include
              </Button>
            </div>
          </div>

          {/* Keyboard hints */}
          <div className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
            Tip: Use keyboard shortcuts - <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">←</kbd> <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">→</kbd> to navigate
          </div>
        </div>
      </div>
    </div>
  );
}
