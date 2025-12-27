import { useState, useMemo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Link2,
  Search,
  ArrowRight,
  Sparkles,
  Check,
  XCircle,
  ArrowRightCircle,
  AlertTriangle,
  Settings,
  BookOpen,
  RotateCcw,
  CircleDot,
  Loader2,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAI } from '../../hooks/useAI';
import { useAuth } from '../../contexts/AuthContext';
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
  iconColor: string;
  selectedBg: string;
  selectedBorder: string;
  selectedText: string;
  icon: ReactNode;
}[] = [
  {
    value: 'supports',
    label: 'Supports',
    description: 'This paper provides evidence for the other',
    iconColor: 'text-emerald-500',
    selectedBg: 'bg-emerald-50 dark:bg-emerald-900/30',
    selectedBorder: 'border-emerald-300 dark:border-emerald-700',
    selectedText: 'text-emerald-700 dark:text-emerald-300',
    icon: <Check size={16} />,
  },
  {
    value: 'contradicts',
    label: 'Contradicts',
    description: 'Papers disagree on a key point',
    iconColor: 'text-rose-500',
    selectedBg: 'bg-rose-50 dark:bg-rose-900/30',
    selectedBorder: 'border-rose-300 dark:border-rose-700',
    selectedText: 'text-rose-700 dark:text-rose-300',
    icon: <XCircle size={16} />,
  },
  {
    value: 'extends',
    label: 'Extends',
    description: 'This paper builds upon the other',
    iconColor: 'text-amber-500',
    selectedBg: 'bg-amber-50 dark:bg-amber-900/30',
    selectedBorder: 'border-amber-300 dark:border-amber-700',
    selectedText: 'text-amber-700 dark:text-amber-300',
    icon: <ArrowRightCircle size={16} />,
  },
  {
    value: 'critiques',
    label: 'Critiques',
    description: 'Critical commentary or concerns',
    iconColor: 'text-orange-500',
    selectedBg: 'bg-orange-50 dark:bg-orange-900/30',
    selectedBorder: 'border-orange-300 dark:border-orange-700',
    selectedText: 'text-orange-700 dark:text-orange-300',
    icon: <AlertTriangle size={16} />,
  },
  {
    value: 'uses-method',
    label: 'Uses Method',
    description: 'Methodological dependency',
    iconColor: 'text-cyan-500',
    selectedBg: 'bg-cyan-50 dark:bg-cyan-900/30',
    selectedBorder: 'border-cyan-300 dark:border-cyan-700',
    selectedText: 'text-cyan-700 dark:text-cyan-300',
    icon: <Settings size={16} />,
  },
  {
    value: 'reviews',
    label: 'Reviews',
    description: 'One paper reviews the other',
    iconColor: 'text-stone-500',
    selectedBg: 'bg-stone-50 dark:bg-stone-900/30',
    selectedBorder: 'border-stone-300 dark:border-stone-700',
    selectedText: 'text-stone-700 dark:text-stone-300',
    icon: <BookOpen size={16} />,
  },
  {
    value: 'replicates',
    label: 'Replicates',
    description: 'Replication or validation study',
    iconColor: 'text-teal-500',
    selectedBg: 'bg-teal-50 dark:bg-teal-900/30',
    selectedBorder: 'border-teal-300 dark:border-teal-700',
    selectedText: 'text-teal-700 dark:text-teal-300',
    icon: <RotateCcw size={16} />,
  },
  {
    value: 'same-topic',
    label: 'Same Topic',
    description: 'Topically related, no direct link',
    iconColor: 'text-slate-500',
    selectedBg: 'bg-slate-100 dark:bg-slate-700',
    selectedBorder: 'border-slate-300 dark:border-slate-600',
    selectedText: 'text-slate-700 dark:text-slate-300',
    icon: <CircleDot size={16} />,
  },
];

export function ConnectionEditor({
  thesisId,
  sourcePaper,
  onClose,
  onSuccess,
}: ConnectionEditorProps) {
  const { papers, connections, createConnection } = useAppStore();
  const { isAuthenticated } = useAuth();

  const {
    isConfigured: isAIConfigured,
    settings: aiSettings,
    suggestConnections,
    connectionSuggestions,
    acceptConnectionSuggestion,
    dismissConnectionSuggestion,
    isLoading: isAILoading,
    loadingType: aiLoadingType,
  } = useAI();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [connectionType, setConnectionType] = useState<ConnectionType>('supports');
  const [note, setNote] = useState('');
  const [isReversed, setIsReversed] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [hoveredPaperId, setHoveredPaperId] = useState<string | null>(null);

  const thesisPapers = useMemo(
    () => papers.filter((p) => p.thesisId === thesisId),
    [papers, thesisId]
  );
  // AI suggestions require authentication
  const canSuggestConnections =
    isAuthenticated && isAIConfigured && aiSettings.enableConnectionSuggestions && thesisPapers.length > 1;
  const isSuggestingConnections = isAILoading && aiLoadingType === 'connection';

  const paperSuggestions = connectionSuggestions.filter(
    (s) => s.targetPaperId === sourcePaper.id
  );

  const handleSuggestConnections = async () => {
    if (!canSuggestConnections || isSuggestingConnections) return;
    setShowAISuggestions(true);
    try {
      await suggestConnections(sourcePaper.id);
    } catch (err) {
      console.error('Failed to suggest connections:', err);
    }
  };

  const handleAcceptSuggestion = (suggestion: typeof connectionSuggestions[0]) => {
    acceptConnectionSuggestion(suggestion);
    const suggestedPaper = papers.find((p) => p.id === suggestion.suggestedPaperId);
    if (suggestedPaper) {
      setSelectedPaper(suggestedPaper);
      setConnectionType(suggestion.connectionType);
      setNote(suggestion.reasoning || '');
    }
  };

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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-stone-800/30 flex items-center justify-center">
              <Link2 className="w-4 h-4 text-stone-700 dark:text-stone-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Create Connection
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Link papers with meaningful relationships
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Source Paper */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
              From Paper
            </label>
            <div className="text-sm text-slate-900 dark:text-white">
              <span className="font-medium">{sourcePaper.title}</span>
              <span className="text-slate-500 dark:text-slate-400 ml-1">
                ({sourcePaper.authors.slice(0, 2).map((a) => a.name).join(', ')}
                {sourcePaper.authors.length > 2 && ' et al.'}
                {sourcePaper.year && `, ${sourcePaper.year}`})
              </span>
            </div>
          </div>

          {/* AI Suggestions */}
          {showAISuggestions && paperSuggestions.length > 0 && (
            <div className="p-3 bg-stone-50 dark:bg-stone-900/20 rounded-lg border border-stone-200 dark:border-stone-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  AI Suggestions
                </span>
                <button
                  onClick={() => setShowAISuggestions(false)}
                  className="text-[10px] text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                >
                  Hide
                </button>
              </div>
              <div className="space-y-1.5">
                {paperSuggestions.map((suggestion) => {
                  const suggestedPaper = papers.find((p) => p.id === suggestion.suggestedPaperId);
                  const suggestionType = CONNECTION_TYPES.find((t) => t.value === suggestion.connectionType);
                  return (
                    <div
                      key={suggestion.id}
                      className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-slate-800 rounded border border-stone-100 dark:border-stone-900"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {suggestionType && (
                            <span className={suggestionType.iconColor}>{suggestionType.icon}</span>
                          )}
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                            {suggestedPaper?.title || suggestion.suggestedPaperTitle}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => handleAcceptSuggestion(suggestion)}
                          className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => dismissConnectionSuggestion(suggestion.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Connection Type - Fixed 4-column grid */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
              Connection Type
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {CONNECTION_TYPES.map((type) => {
                const isSelected = connectionType === type.value;
                return (
                  <button
                    key={type.value}
                    onClick={() => setConnectionType(type.value)}
                    title={type.description}
                    className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg border transition-all ${
                      isSelected
                        ? `${type.selectedBg} ${type.selectedBorder} ${type.selectedText}`
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className={isSelected ? type.selectedText : type.iconColor}>
                      {type.icon}
                    </span>
                    <span className="text-[10px] font-medium leading-tight text-center">
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direction Indicator */}
          {selectedPaper && (
            <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {isReversed ? selectedPaper.title : sourcePaper.title}
                </p>
              </div>
              <button
                onClick={() => setIsReversed(!isReversed)}
                title="Swap direction"
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${selectedType?.selectedBg} ${selectedType?.selectedText} ${selectedType?.selectedBorder} border`}
              >
                <span className={selectedType?.selectedText}>{selectedType?.icon}</span>
                <ArrowRight size={12} />
              </button>
              <div className="flex-1 min-w-0 text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {isReversed ? sourcePaper.title : selectedPaper.title}
                </p>
              </div>
            </div>
          )}

          {/* Target Paper Search */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
              Connect To
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search papers..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-stone-500 focus:border-transparent"
              />
            </div>

            {/* Paper List */}
            <div className="mt-1.5 max-h-44 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-600 divide-y divide-slate-100 dark:divide-slate-700">
              {filteredPapers.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                  {availablePapers.length === 0
                    ? 'No other papers available'
                    : 'No papers match your search'}
                </div>
              ) : (
                filteredPapers.map((paper) => {
                  const isSelected = selectedPaper?.id === paper.id;
                  const isHovered = hoveredPaperId === paper.id;
                  const showExpanded = isSelected || isHovered;

                  return (
                    <button
                      key={paper.id}
                      onClick={() => setSelectedPaper(paper)}
                      onMouseEnter={() => setHoveredPaperId(paper.id)}
                      onMouseLeave={() => setHoveredPaperId(null)}
                      className={`w-full px-3 py-2.5 text-left transition-colors ${
                        isSelected
                          ? 'bg-stone-100 dark:bg-stone-800/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4
                            className={`text-sm font-medium leading-snug ${
                              showExpanded ? '' : 'truncate'
                            } ${
                              isSelected
                                ? 'text-stone-800 dark:text-stone-300'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {paper.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {paper.authors.slice(0, 2).map((a) => a.name).join(', ')}
                            {paper.authors.length > 2 && ' et al.'}
                            {paper.year && ` (${paper.year})`}
                          </p>
                          {showExpanded && paper.takeaway && (
                            <p className="text-xs text-stone-700 dark:text-stone-400 mt-1">
                              {paper.takeaway}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-stone-700 flex items-center justify-center flex-shrink-0">
                            <Check size={10} className="text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
              Note <span className="font-normal">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why are these papers connected?"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-stone-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-700">
          {/* AI Suggest button - grayed out when not authenticated */}
          {!isAuthenticated ? (
            <button
              disabled
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-400 dark:text-slate-600 cursor-not-allowed"
              title="Sign in to use AI features"
            >
              <Sparkles size={14} />
              AI Suggest
            </button>
          ) : canSuggestConnections ? (
            <button
              onClick={handleSuggestConnections}
              disabled={isSuggestingConnections}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                isSuggestingConnections
                  ? 'bg-stone-100 dark:bg-stone-900/30 text-stone-600 dark:text-stone-400'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900/20'
              }`}
            >
              {isSuggestingConnections ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {isSuggestingConnections ? 'Finding...' : 'AI Suggest'}
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <Sparkles size={14} />
              <span>{!isAIConfigured ? 'Configure AI' : 'Need 2+ papers'}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!selectedPaper}
              className="px-4 py-1.5 text-xs font-medium bg-stone-800 text-white rounded-lg hover:bg-stone-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create Connection
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
