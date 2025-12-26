import { useState } from 'react';
import { X, FileText, ExternalLink } from 'lucide-react';
import type { SemanticScholarPaper } from '../../services/api/semanticScholar';
import type { ThesisRole } from '../../types';
import { cleanAbstract } from '../../utils/textCleaner';

interface QuickAddModalProps {
  paper: SemanticScholarPaper;
  onAdd: (data: {
    paper: SemanticScholarPaper;
    role: ThesisRole;
    takeaway: string;
    addAsScreening: boolean;
  }) => void;
  onCancel: () => void;
  onViewPdf?: (url: string) => void;
}

const ROLE_OPTIONS: { value: ThesisRole; label: string; color: string }[] = [
  { value: 'supports', label: 'Supports', color: 'bg-emerald-500' },
  { value: 'contradicts', label: 'Contradicts', color: 'bg-rose-500' },
  { value: 'method', label: 'Method', color: 'bg-blue-500' },
  { value: 'background', label: 'Background', color: 'bg-slate-500' },
  { value: 'other', label: 'Other', color: 'bg-stone-500' },
];

export function QuickAddModal({ paper, onAdd, onCancel, onViewPdf }: QuickAddModalProps) {
  const [role, setRole] = useState<ThesisRole>('background');
  const [takeaway, setTakeaway] = useState('');
  const [addAsScreening, setAddAsScreening] = useState(true);

  const handleAdd = () => {
    onAdd({
      paper,
      role,
      takeaway: addAsScreening ? '' : takeaway,
      addAsScreening,
    });
  };

  const canSubmit = addAsScreening || takeaway.length >= 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-white text-base leading-snug line-clamp-2">
                {paper.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                {paper.authors?.slice(0, 3).map((a) => a.name).join(', ')}
                {paper.authors && paper.authors.length > 3 && ' et al.'}
                {paper.year && ` (${paper.year})`}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                {paper.citationCount !== null && paper.citationCount > 0 && (
                  <span>{paper.citationCount.toLocaleString()} citations</span>
                )}
                {paper.venue && (
                  <span className="truncate max-w-[150px]">{paper.venue}</span>
                )}
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X size={18} className="text-slate-400" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-3">
            {paper.openAccessPdf?.url && onViewPdf && (
              <button
                onClick={() => onViewPdf(paper.openAccessPdf!.url)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-700 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/30 rounded-lg transition-colors"
              >
                <FileText size={14} />
                View PDF
              </button>
            )}
            {paper.externalIds?.DOI && (
              <a
                href={`https://doi.org/${paper.externalIds.DOI}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ExternalLink size={14} />
                DOI
              </a>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Abstract preview */}
          {paper.abstract && (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                {cleanAbstract(paper.abstract)}
              </p>
            </div>
          )}

          {/* Role selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Role in Thesis
            </label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => setRole(value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    role === value
                      ? `${color} text-white shadow-sm`
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Screening toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={addAsScreening}
              onChange={(e) => setAddAsScreening(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-stone-600 focus:ring-stone-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Add for screening (takeaway not required yet)
            </span>
          </label>

          {/* Takeaway input (if not screening) */}
          {!addAsScreening && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Takeaway <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={takeaway}
                onChange={(e) => setTakeaway(e.target.value)}
                placeholder="What's the key insight from this paper? (10-500 characters)"
                className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-stone-500 focus:border-transparent resize-none"
                rows={3}
              />
              <p className="text-xs text-slate-400 mt-1">
                {takeaway.length}/500 characters (min 10)
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!canSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-stone-700 hover:bg-stone-800 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
            >
              Add to Thesis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
