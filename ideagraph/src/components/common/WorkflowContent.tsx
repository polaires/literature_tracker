// WorkflowContent - Workflow guidance for the right panel

import { useMemo } from 'react';
import {
  Search,
  ClipboardCheck,
  BookOpen,
  Network,
  Lightbulb,
  FileText,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { usePanelContext } from '../../contexts/PanelContext';

interface WorkflowContentProps {
  thesisId: string;
}

type WorkflowPhase = 'collect' | 'screen' | 'read' | 'organize' | 'gaps' | 'export';

interface PhaseInfo {
  phase: WorkflowPhase;
  label: string;
  description: string;
  icon: typeof Search;
  action: () => void;
  count?: number;
  isComplete: boolean;
  isActive: boolean;
}

export function WorkflowContent({ thesisId }: WorkflowContentProps) {
  const { openModal, openRightPanel } = usePanelContext();
  const {
    getPapersForThesis,
    getScreeningStats,
    getConnectionsForThesis,
    setSelectedPaper,
  } = useAppStore();

  const papers = getPapersForThesis(thesisId);
  const connections = getConnectionsForThesis(thesisId);
  const screeningStats = getScreeningStats(thesisId);

  const includedPapers = papers.filter(p => p.screeningDecision === 'include');
  const readPapers = includedPapers.filter(p => p.readingStatus === 'read');
  const papersNeedingScreening = screeningStats.pending + screeningStats.maybe;
  const unreadPapers = includedPapers.filter(p => p.readingStatus !== 'read');

  const phases = useMemo<PhaseInfo[]>(() => [
    {
      phase: 'collect',
      label: 'Collect Papers',
      description: 'Add papers to your thesis',
      icon: Search,
      action: () => openModal('addPaper'),
      count: papers.length,
      isComplete: papers.length >= 5,
      isActive: papers.length < 5,
    },
    {
      phase: 'screen',
      label: 'Screen Papers',
      description: 'Decide which papers to include',
      icon: ClipboardCheck,
      action: () => openRightPanel('screening'),
      count: papersNeedingScreening,
      isComplete: papersNeedingScreening === 0 && papers.length > 0,
      isActive: papersNeedingScreening > 0,
    },
    {
      phase: 'read',
      label: 'Read & Annotate',
      description: 'Read papers and add takeaways',
      icon: BookOpen,
      action: () => {
        const firstUnread = unreadPapers[0];
        if (firstUnread) {
          setSelectedPaper(firstUnread.id);
          openRightPanel('detail');
        }
      },
      count: unreadPapers.length,
      isComplete: readPapers.length > 0 && unreadPapers.length === 0,
      isActive: unreadPapers.length > 0,
    },
    {
      phase: 'organize',
      label: 'Build Connections',
      description: 'Link related papers together',
      icon: Network,
      action: () => openModal('synthesisMatrix'),
      count: connections.length,
      isComplete: connections.length >= 3,
      isActive: readPapers.length >= 2 && connections.length < 3,
    },
    {
      phase: 'gaps',
      label: 'Find Gaps',
      description: 'Identify research opportunities',
      icon: Lightbulb,
      action: () => openModal('gapAnalysis'),
      isComplete: false,
      isActive: readPapers.length >= 3,
    },
    {
      phase: 'export',
      label: 'Export Review',
      description: 'Generate your literature review',
      icon: FileText,
      action: () => openModal('exportOutline'),
      isComplete: false,
      isActive: readPapers.length >= 3 && connections.length >= 2,
    },
  ], [papers, connections, papersNeedingScreening, readPapers, unreadPapers, openModal, openRightPanel, setSelectedPaper]);

  // Find current phase
  const currentPhase = phases.find(p => p.isActive) || phases[phases.length - 1];

  return (
    <div className="flex flex-col h-full">
      {/* Current focus */}
      <div className="p-4 bg-stone-100 dark:bg-stone-800/20 border-b border-stone-100 dark:border-stone-700">
        <p className="text-xs font-medium text-stone-700 dark:text-stone-400 uppercase tracking-wider mb-1">
          Current Focus
        </p>
        <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
          {currentPhase.label}
        </h3>
        <p className="text-sm text-stone-800 dark:text-stone-300 mt-1">
          {currentPhase.description}
        </p>
        <button
          onClick={currentPhase.action}
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-900 transition-colors text-sm font-medium"
        >
          {currentPhase.label}
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Phase list */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {phases.map((phase, index) => {
            const Icon = phase.icon;
            const isCurrentOrFuture = index >= phases.findIndex(p => p === currentPhase);

            return (
              <button
                key={phase.phase}
                onClick={phase.action}
                disabled={!isCurrentOrFuture && !phase.isComplete}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  phase === currentPhase
                    ? 'bg-stone-100 dark:bg-stone-800/30 text-stone-900 dark:text-stone-100'
                    : phase.isComplete
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900/30'
                    : isCurrentOrFuture
                    ? 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                    : 'opacity-50 text-gray-500 cursor-not-allowed'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  phase.isComplete
                    ? 'bg-green-500 text-white'
                    : phase === currentPhase
                    ? 'bg-stone-700 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {phase.isComplete ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{phase.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {phase.description}
                  </p>
                </div>
                {phase.count !== undefined && phase.count > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    phase === currentPhase
                      ? 'bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {phase.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats summary */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {papers.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Papers</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {readPapers.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Read</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {connections.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Links</p>
          </div>
        </div>
      </div>
    </div>
  );
}
