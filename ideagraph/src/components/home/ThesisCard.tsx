import { useState } from 'react';
import { MoreVertical, Archive, Trash2 } from 'lucide-react';
import type { Thesis } from '../../types';

interface ScreeningStats {
  pending: number;
  include: number;
  exclude: number;
  maybe: number;
}

interface ThesisCardProps {
  thesis: Thesis;
  paperCount: number;
  screeningStats: ScreeningStats;
  readingProgress: number; // 0-100 percentage
  onOpen: () => void;
  onArchive: (archive: boolean) => void;
  onDelete: () => void;
}

export function ThesisCard({
  thesis,
  paperCount,
  screeningStats,
  readingProgress,
  onOpen,
  onArchive,
  onDelete,
}: ThesisCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const daysAgo = Math.floor(
    (Date.now() - new Date(thesis.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const pendingCount = screeningStats.pending + screeningStats.maybe;

  return (
    <div
      className="p-6 bg-white rounded-xl shadow-sm border border-stone-200 hover:shadow-lg hover:border-stone-300 transition-all cursor-pointer group"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-stone-800 mb-1 group-hover:text-stone-700 transition-colors line-clamp-2">
            {thesis.title}
          </h3>
          {thesis.description && (
            <p className="text-stone-500 text-sm mb-3 line-clamp-2">
              {thesis.description}
            </p>
          )}

          {/* Stats Row */}
          <div className="flex items-center gap-3 text-sm mb-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg font-medium">
              {paperCount} papers
            </span>
            {pendingCount > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg font-medium">
                {pendingCount} pending
              </span>
            )}
          </div>

          {/* Reading Progress Bar */}
          {paperCount > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                <span>Reading progress</span>
                <span>{Math.round(readingProgress)}%</span>
              </div>
              <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-stone-600 rounded-full transition-all duration-300"
                  style={{ width: `${readingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Last Updated */}
          <span className="text-xs text-stone-400">
            {daysAgo === 0
              ? 'Updated today'
              : daysAgo === 1
              ? 'Updated yesterday'
              : `Updated ${daysAgo} days ago`}
          </span>
        </div>

        {/* Menu Button */}
        <div className="relative ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <MoreVertical size={18} />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-stone-200 py-1.5 z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-stone-50 text-stone-700 transition-colors"
                >
                  <Archive size={15} />
                  Archive
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this thesis and all its papers?')) {
                      onDelete();
                    }
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-red-50 text-red-600 transition-colors"
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
