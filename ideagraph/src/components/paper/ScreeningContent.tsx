// ScreeningContent - Inline screening panel for the right sidebar
// Non-modal version that allows reference to graph/list while screening

import { useState, useCallback, useMemo } from 'react';
import {
  Check,
  X,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Calendar,
  Quote,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { cleanAbstract } from '../../utils/textCleaner';
import type { ExclusionReason } from '../../types';

interface ScreeningContentProps {
  thesisId: string;
}

const EXCLUSION_REASONS: { value: ExclusionReason; label: string }[] = [
  { value: 'not-relevant', label: 'Not relevant' },
  { value: 'wrong-study-type', label: 'Wrong study type' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'no-full-text', label: 'No full text' },
  { value: 'wrong-population', label: 'Wrong population' },
  { value: 'wrong-outcome', label: 'Wrong outcome' },
  { value: 'low-quality', label: 'Low quality' },
  { value: 'language', label: 'Wrong language' },
  { value: 'date-range', label: 'Outside date range' },
  { value: 'other', label: 'Other' },
];

export function ScreeningContent({ thesisId }: ScreeningContentProps) {
  const {
    getPapersForScreening,
    getScreeningStats,
    setScreeningDecision,
  } = useAppStore();

  const papersToScreen = getPapersForScreening(thesisId);
  const stats = getScreeningStats(thesisId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showExclusionReasons, setShowExclusionReasons] = useState(false);
  const [customReason, setCustomReason] = useState('');
  const [showMaybeOnly, setShowMaybeOnly] = useState(false);

  const filteredPapers = useMemo(() => {
    if (showMaybeOnly) {
      return papersToScreen.filter((p) => p.screeningDecision === 'maybe');
    }
    return papersToScreen;
  }, [papersToScreen, showMaybeOnly]);

  const currentPaper = filteredPapers[currentIndex];

  const progressPercentage = useMemo(() => {
    const total = stats.pending + stats.include + stats.exclude + stats.maybe;
    if (total === 0) return 100;
    return Math.round(((stats.include + stats.exclude) / total) * 100);
  }, [stats]);

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

  // All done state
  if (filteredPapers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-12 h-12 mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <Check size={24} className="text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {showMaybeOnly ? 'No "Maybe" Papers Left' : 'Screening Complete!'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {showMaybeOnly
            ? 'All papers marked as "Maybe" have been reviewed.'
            : 'You\'ve screened all papers.'}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 w-full mb-4">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {stats.include}
            </div>
            <div className="text-xs text-green-700 dark:text-green-300">Included</div>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-xl font-bold text-red-600 dark:text-red-400">
              {stats.exclude}
            </div>
            <div className="text-xs text-red-700 dark:text-red-300">Excluded</div>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
              {stats.maybe}
            </div>
            <div className="text-xs text-amber-700 dark:text-amber-300">Maybe</div>
          </div>
        </div>

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
            Review "Maybe" Papers ({stats.maybe})
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        {/* Toggle: All / Maybe only */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => { setShowMaybeOnly(false); setCurrentIndex(0); }}
            className={`px-2 py-1 text-xs rounded ${
              !showMaybeOnly
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            All ({papersToScreen.length})
          </button>
          {stats.maybe > 0 && (
            <button
              onClick={() => { setShowMaybeOnly(true); setCurrentIndex(0); }}
              className={`px-2 py-1 text-xs rounded ${
                showMaybeOnly
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              Maybe ({stats.maybe})
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>{currentIndex + 1} / {filteredPapers.length}</span>
          <span>{progressPercentage}% done</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div
            className="bg-indigo-600 h-1.5 rounded-full transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Stats row */}
        <div className="flex justify-between text-xs mt-2">
          <span className="text-green-600 dark:text-green-400">{stats.include} incl</span>
          <span className="text-red-600 dark:text-red-400">{stats.exclude} excl</span>
          <span className="text-amber-600 dark:text-amber-400">{stats.maybe} maybe</span>
        </div>
      </div>

      {/* Paper Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentPaper && (
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
              {currentPaper.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {currentPaper.authors.map((a) => a.name).join(', ')}
            </p>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
              {currentPaper.year && (
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {currentPaper.year}
                </span>
              )}
              {currentPaper.journal && (
                <span className="flex items-center gap-1">
                  <BookOpen size={12} />
                  {currentPaper.journal}
                </span>
              )}
              {currentPaper.citationCount !== null && (
                <span className="flex items-center gap-1">
                  <Quote size={12} />
                  {currentPaper.citationCount.toLocaleString()} cites
                </span>
              )}
              {currentPaper.doi && (
                <a
                  href={`https://doi.org/${currentPaper.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <ExternalLink size={12} />
                  DOI
                </a>
              )}
            </div>

            {/* Abstract */}
            {currentPaper.abstract ? (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase">
                  Abstract
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {cleanAbstract(currentPaper.abstract)}
                </p>
              </div>
            ) : (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-700 dark:text-amber-400">
                No abstract available
              </div>
            )}

            {/* Current takeaway if exists */}
            {currentPaper.takeaway && currentPaper.takeaway !== 'Takeaway to be added after reading' && (
              <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <h4 className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">
                  Takeaway
                </h4>
                <p className="text-sm text-indigo-600 dark:text-indigo-400">
                  {currentPaper.takeaway}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Exclusion Reasons Panel */}
      {showExclusionReasons && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Exclusion reason:
          </h4>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            {EXCLUSION_REASONS.filter(r => r.value !== 'other').map((reason) => (
              <button
                key={reason.value}
                onClick={() => handleExclude(reason.value)}
                className="px-2 py-1.5 text-xs text-left bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                {reason.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Other reason..."
              className="flex-1 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
            className="mt-2 text-xs text-gray-500 dark:text-gray-400 hover:underline"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Action Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Use ← → to navigate
          </span>
          <button
            onClick={goToNext}
            disabled={currentIndex >= filteredPapers.length - 1}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Decision Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="danger"
            onClick={() => setShowExclusionReasons(true)}
            icon={<X size={16} />}
            disabled={showExclusionReasons}
            className="flex-1"
          >
            Exclude
          </Button>
          <button
            onClick={handleMaybe}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
          >
            <HelpCircle size={16} />
            Maybe
          </button>
          <Button
            onClick={handleInclude}
            icon={<Check size={16} />}
            className="flex-1"
          >
            Include
          </Button>
        </div>
      </div>
    </div>
  );
}
