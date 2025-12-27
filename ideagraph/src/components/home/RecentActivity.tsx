import { useMemo } from 'react';
import { Clock, FileText } from 'lucide-react';
import type { Paper, Thesis, ThesisRole } from '../../types';
import { THESIS_ROLE_COLORS } from '../../constants/colors';

interface RecentActivityProps {
  papers: Paper[];
  theses: Thesis[];
  onPaperClick: (paperId: string, thesisId: string) => void;
}

export function RecentActivity({ papers, theses, onPaperClick }: RecentActivityProps) {
  // Create thesis lookup map
  const thesisMap = useMemo(() => {
    const map = new Map<string, Thesis>();
    theses.forEach((t) => map.set(t.id, t));
    return map;
  }, [theses]);

  // Get recent papers sorted by lastAccessedAt or addedAt
  const recentPapers = useMemo(() => {
    return [...papers]
      .sort((a, b) => {
        const dateA = new Date(a.lastAccessedAt || a.addedAt).getTime();
        const dateB = new Date(b.lastAccessedAt || b.addedAt).getTime();
        return dateB - dateA;
      })
      .slice(0, 8);
  }, [papers]);

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString();
  };

  if (recentPapers.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
        <Clock size={16} className="text-stone-500" />
        <h3 className="text-sm font-semibold text-stone-700">Recent Activity</h3>
      </div>

      <div className="divide-y divide-stone-100">
        {recentPapers.map((paper) => {
          const thesis = thesisMap.get(paper.thesisId);
          const roleColors = THESIS_ROLE_COLORS[paper.thesisRole as ThesisRole];

          return (
            <div
              key={paper.id}
              className="px-4 py-3 hover:bg-stone-50 cursor-pointer transition-colors"
              onClick={() => onPaperClick(paper.id, paper.thesisId)}
            >
              <div className="flex items-start gap-3">
                {/* Role color indicator */}
                <div
                  className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                  style={{ backgroundColor: roleColors?.hex || '#a8a29e' }}
                />

                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <p className="text-sm font-medium text-stone-800 line-clamp-1">
                    {paper.title}
                  </p>

                  {/* Thesis name and timestamp */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-stone-500 truncate max-w-[150px]">
                      {thesis?.title || 'Unknown thesis'}
                    </span>
                    <span className="text-xs text-stone-400">•</span>
                    <span className="text-xs text-stone-400 flex-shrink-0">
                      {formatRelativeTime(paper.lastAccessedAt || paper.addedAt)}
                    </span>
                  </div>
                </div>

                <FileText size={14} className="text-stone-300 flex-shrink-0 mt-1" />
              </div>
            </div>
          );
        })}
      </div>

      {papers.length > 8 && (
        <div className="px-4 py-2 bg-stone-50 border-t border-stone-100">
          <p className="text-xs text-stone-400 text-center">
            Showing 8 of {papers.length} papers
          </p>
        </div>
      )}
    </div>
  );
}
