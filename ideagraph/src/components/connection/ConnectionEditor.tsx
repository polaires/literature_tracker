import { useState, useMemo } from 'react';
import { X, Link2, Search, ArrowRight, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { Paper, ConnectionType } from '../../types';

interface ConnectionEditorProps {
  thesisId: string;
  sourcePaper: Paper;
  onClose: () => void;
  onSuccess?: () => void;
}

const CONNECTION_TYPES: {
  value: ConnectionType;
  label: string;
  description: string;
  color: string;
  icon: string;
}[] = [
  {
    value: 'supports',
    label: 'Supports',
    description: 'This paper provides evidence for the other',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    icon: '✓',
  },
  {
    value: 'contradicts',
    label: 'Contradicts',
    description: 'Papers disagree on a key point',
    color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
    icon: '✗',
  },
  {
    value: 'extends',
    label: 'Extends',
    description: 'This paper builds upon the other',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    icon: '→',
  },
  {
    value: 'critiques',
    label: 'Critiques',
    description: 'Critical commentary or methodological concerns',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    icon: '!',
  },
  {
    value: 'uses-method',
    label: 'Uses Method',
    description: 'Methodological dependency',
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    icon: '⚙',
  },
  {
    value: 'reviews',
    label: 'Reviews',
    description: 'One paper reviews or cites the other',
    color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
    icon: '📖',
  },
  {
    value: 'replicates',
    label: 'Replicates',
    description: 'Replication or validation study',
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    icon: '↺',
  },
  {
    value: 'same-topic',
    label: 'Same Topic',
    description: 'Topically related, no direct link',
    color: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
    icon: '≈',
  },
];

export function ConnectionEditor({
  thesisId,
  sourcePaper,
  onClose,
  onSuccess,
}: ConnectionEditorProps) {
  const { papers, connections, createConnection } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [connectionType, setConnectionType] = useState<ConnectionType>('supports');
  const [note, setNote] = useState('');
  const [isReversed, setIsReversed] = useState(false);

  // Get available papers (exclude source paper and already connected papers)
  const existingConnectionIds = useMemo(() => {
    return new Set(
      connections
        .filter((c) => c.fromPaperId === sourcePaper.id || c.toPaperId === sourcePaper.id)
        .flatMap((c) => [c.fromPaperId, c.toPaperId])
    );
  }, [connections, sourcePaper.id]);

  const availablePapers = useMemo(() => {
    return papers.filter(
      (p) => p.thesisId === thesisId && p.id !== sourcePaper.id && !existingConnectionIds.has(p.id)
    );
  }, [papers, thesisId, sourcePaper.id, existingConnectionIds]);

  const filteredPapers = useMemo(() => {
    if (!searchQuery.trim()) return availablePapers;
    const query = searchQuery.toLowerCase();
    return availablePapers.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.takeaway.toLowerCase().includes(query) ||
        p.authors.some((a) => a.name.toLowerCase().includes(query))
    );
  }, [availablePapers, searchQuery]);

  const handleCreate = () => {
    if (!selectedPaper) return;

    const fromPaper = isReversed ? selectedPaper : sourcePaper;
    const toPaper = isReversed ? sourcePaper : selectedPaper;

    createConnection({
      thesisId,
      fromPaperId: fromPaper.id,
      toPaperId: toPaper.id,
      type: connectionType,
      note: note.trim() || null,
      aiSuggested: false,
      aiConfidence: null,
      userApproved: true,
    });

    onSuccess?.();
    onClose();
  };

  const selectedType = CONNECTION_TYPES.find((t) => t.value === connectionType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Create Connection
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Link papers with meaningful relationships
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Source Paper */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              From Paper
            </label>
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
              <h3 className="font-medium text-slate-900 dark:text-white line-clamp-2">
                {sourcePaper.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {sourcePaper.authors.slice(0, 3).map((a) => a.name).join(', ')}
                {sourcePaper.authors.length > 3 && ' et al.'}
                {sourcePaper.year && ` (${sourcePaper.year})`}
              </p>
            </div>
          </div>

          {/* Connection Type */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Connection Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CONNECTION_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setConnectionType(type.value)}
                  className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                    connectionType === type.value
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{type.icon}</span>
                    <span
                      className={`text-sm font-medium ${
                        connectionType === type.value
                          ? 'text-indigo-700 dark:text-indigo-300'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {type.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {type.description}
                  </p>
                  {connectionType === type.value && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Direction Indicator */}
          {selectedPaper && (
            <div className="flex items-center justify-center gap-3 py-4">
              <div className="flex-1 text-right">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-1">
                  {isReversed ? selectedPaper.title : sourcePaper.title}
                </p>
              </div>
              <button
                onClick={() => setIsReversed(!isReversed)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                title="Swap direction"
              >
                <span className={`text-xs font-medium ${selectedType?.color}`}>
                  {connectionType.replace('-', ' ')}
                </span>
                <ArrowRight size={16} className="text-slate-500" />
              </button>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-1">
                  {isReversed ? sourcePaper.title : selectedPaper.title}
                </p>
              </div>
            </div>
          )}

          {/* Target Paper Search */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Connect To
            </label>
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search papers by title, author, or takeaway..."
                className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              />
            </div>

            {/* Paper List */}
            <div className="mt-3 max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-600 divide-y divide-slate-100 dark:divide-slate-700">
              {filteredPapers.length === 0 ? (
                <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                  {availablePapers.length === 0
                    ? 'No other papers available to connect'
                    : 'No papers match your search'}
                </div>
              ) : (
                filteredPapers.map((paper) => (
                  <button
                    key={paper.id}
                    onClick={() => setSelectedPaper(paper)}
                    className={`w-full p-4 text-left transition-colors ${
                      selectedPaper?.id === paper.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h4
                          className={`font-medium line-clamp-1 ${
                            selectedPaper?.id === paper.id
                              ? 'text-indigo-700 dark:text-indigo-300'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {paper.title}
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                          {paper.authors.slice(0, 2).map((a) => a.name).join(', ')}
                          {paper.year && ` (${paper.year})`}
                        </p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 line-clamp-1">
                          {paper.takeaway}
                        </p>
                      </div>
                      {selectedPaper?.id === paper.id && (
                        <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Note <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why are these papers connected? What's the key relationship?"
              rows={2}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-shadow"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Sparkles size={16} />
            <span>AI suggestions coming soon</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!selectedPaper}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Create Connection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
