import { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  Grid3X3,
  Tag,
  FileText,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import type { SynthesisTheme } from '../../types';

interface SynthesisMatrixProps {
  thesisId: string;
  onClose: () => void;
}

const THEME_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#78716c', // stone
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
];

export function SynthesisMatrix({ thesisId, onClose }: SynthesisMatrixProps) {
  const {
    getThemesForThesis,
    getPapersForThesis,
    createTheme,
    updateTheme,
    deleteTheme,
    assignPaperToTheme,
    removePaperFromTheme,
  } = useAppStore();

  // UI State
  const [showAddTheme, setShowAddTheme] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeDescription, setNewThemeDescription] = useState('');
  const [editingTheme, setEditingTheme] = useState<SynthesisTheme | null>(null);
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set());

  // Get data
  const themes = getThemesForThesis(thesisId);
  const allPapers = getPapersForThesis(thesisId);
  const includedPapers = allPapers.filter((p) => p.screeningDecision === 'include');
  // matrixData is available for future grid view: getSynthesisMatrix(thesisId)

  // Calculate coverage stats
  const coverageStats = useMemo(() => {
    const papersWithThemes = new Set<string>();
    themes.forEach((theme) => {
      theme.paperIds.forEach((id) => papersWithThemes.add(id));
    });

    return {
      papersWithThemes: papersWithThemes.size,
      totalPapers: includedPapers.length,
      uncoveredPapers: includedPapers.filter((p) => !papersWithThemes.has(p.id)),
    };
  }, [themes, includedPapers]);

  const handleAddTheme = () => {
    if (!newThemeName.trim()) return;

    createTheme({
      thesisId,
      name: newThemeName.trim(),
      description: newThemeDescription.trim() || null,
      color: THEME_COLORS[themes.length % THEME_COLORS.length],
      paperIds: [],
      relatedArgumentIds: [],
    });

    setNewThemeName('');
    setNewThemeDescription('');
    setShowAddTheme(false);
  };

  const handleUpdateTheme = () => {
    if (!editingTheme || !editingTheme.name.trim()) return;

    updateTheme(editingTheme.id, {
      name: editingTheme.name,
      description: editingTheme.description,
      color: editingTheme.color,
    });

    setEditingTheme(null);
  };

  const handleTogglePaperTheme = (paperId: string, themeId: string, isAssigned: boolean) => {
    if (isAssigned) {
      removePaperFromTheme(paperId, themeId);
    } else {
      assignPaperToTheme(paperId, themeId);
    }
  };

  const toggleThemeExpand = (themeId: string) => {
    const newExpanded = new Set(expandedThemes);
    if (newExpanded.has(themeId)) {
      newExpanded.delete(themeId);
    } else {
      newExpanded.add(themeId);
    }
    setExpandedThemes(newExpanded);
  };

  return (
    <Modal onClose={onClose} className="max-w-6xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Grid3X3 className="w-5 h-5 text-stone-700 dark:text-stone-400" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Synthesis Matrix
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Organize papers by themes for structured synthesis
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-stone-600" />
            <span className="text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-white">{themes.length}</strong> themes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-green-500" />
            <span className="text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-white">
                {coverageStats.papersWithThemes}
              </strong>
              /{coverageStats.totalPapers} papers assigned
            </span>
          </div>
          {coverageStats.uncoveredPapers.length > 0 && (
            <div className="text-amber-600 dark:text-amber-400">
              {coverageStats.uncoveredPapers.length} papers need theme assignment
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {themes.length === 0 ? (
          <div className="text-center py-12">
            <Tag size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No themes yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
              Create themes to organize your papers by topic, argument type, or any other
              classification that helps structure your review.
            </p>
            <Button onClick={() => setShowAddTheme(true)} icon={<Plus size={18} />}>
              Create First Theme
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Theme List with Papers */}
            {themes.map((theme) => {
              const themePapers = includedPapers.filter((p) => theme.paperIds.includes(p.id));
              const isExpanded = expandedThemes.has(theme.id);

              return (
                <div
                  key={theme.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  {/* Theme Header */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 cursor-pointer"
                    onClick={() => toggleThemeExpand(theme.id)}
                  >
                    <button className="p-1">
                      {isExpanded ? (
                        <ChevronDown size={18} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={18} className="text-gray-400" />
                      )}
                    </button>

                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: theme.color }}
                    />

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {theme.name}
                      </h3>
                      {theme.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {theme.description}
                        </p>
                      )}
                    </div>

                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {themePapers.length} paper{themePapers.length !== 1 ? 's' : ''}
                    </span>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setEditingTheme(theme)}
                        className="p-1.5 text-gray-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800/20 rounded"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this theme?')) {
                            deleteTheme(theme.id);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content - Paper Assignment */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                        {includedPapers.map((paper) => {
                          const isAssigned = theme.paperIds.includes(paper.id);

                          return (
                            <div
                              key={paper.id}
                              className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                isAssigned
                                  ? 'bg-stone-100 dark:bg-stone-800/20'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                              }`}
                              onClick={() => handleTogglePaperTheme(paper.id, theme.id, isAssigned)}
                            >
                              <div
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                  isAssigned
                                    ? 'bg-stone-800 border-stone-800'
                                    : 'border-gray-300 dark:border-gray-600'
                                }`}
                              >
                                {isAssigned && <Check size={12} className="text-white" />}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                                  {paper.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                  {paper.takeaway}
                                </p>
                              </div>

                              <span className="text-xs text-gray-400">
                                {paper.year}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Theme Button */}
            <button
              onClick={() => setShowAddTheme(true)}
              className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-stone-400 hover:text-stone-700 dark:hover:text-stone-400 transition-colors"
            >
              <Plus size={20} />
              Add Theme
            </button>

            {/* Uncovered Papers Section */}
            {coverageStats.uncoveredPapers.length > 0 && (
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                  Papers Without Themes ({coverageStats.uncoveredPapers.length})
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {coverageStats.uncoveredPapers.map((paper) => (
                    <div
                      key={paper.id}
                      className="text-sm text-amber-700 dark:text-amber-300"
                    >
                      • {paper.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Theme Modal */}
      {showAddTheme && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddTheme(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create Theme
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Theme Name *
                </label>
                <input
                  type="text"
                  value={newThemeName}
                  onChange={(e) => setNewThemeName(e.target.value)}
                  placeholder="e.g., Kinetic limitations, Experimental methods"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-stone-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newThemeDescription}
                  onChange={(e) => setNewThemeDescription(e.target.value)}
                  placeholder="Brief description of what this theme covers..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-stone-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setShowAddTheme(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTheme} disabled={!newThemeName.trim()}>
                Create Theme
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Theme Modal */}
      {editingTheme && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditingTheme(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Edit Theme
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Theme Name
                </label>
                <input
                  type="text"
                  value={editingTheme.name}
                  onChange={(e) =>
                    setEditingTheme({ ...editingTheme, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-stone-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={editingTheme.description || ''}
                  onChange={(e) =>
                    setEditingTheme({ ...editingTheme, description: e.target.value || null })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-stone-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {THEME_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setEditingTheme({ ...editingTheme, color })}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        editingTheme.color === color ? 'ring-2 ring-offset-2 ring-stone-500 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setEditingTheme(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTheme}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
