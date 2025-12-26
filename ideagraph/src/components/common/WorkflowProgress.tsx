import { useMemo } from 'react';
import {
  ClipboardCheck,
  BookOpen,
  Grid3X3,
  AlertTriangle,
  FileText,
  Plus,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface WorkflowProgressProps {
  thesisId: string;
  onActivityClick?: (activity: ActivityType) => void;
  // Alias for backward compatibility
  onPhaseClick?: (phase: ActivityType) => void;
}

interface ActivityStats {
  count: number;
  label: string;
  hasAction: boolean;
  badge?: number;
}

export type ActivityType =
  | 'collect'
  | 'screen'
  | 'read'
  | 'organize'
  | 'gaps'
  | 'export';

// Keep the old type name for backward compatibility
export type WorkflowPhase = ActivityType;

interface ActivityConfig {
  id: ActivityType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const ACTIVITIES: ActivityConfig[] = [
  {
    id: 'collect',
    label: 'Add Papers',
    icon: <Plus size={16} />,
    description: 'Import papers by DOI, search, or file',
  },
  {
    id: 'screen',
    label: 'Screen',
    icon: <ClipboardCheck size={16} />,
    description: 'Include or exclude papers',
  },
  {
    id: 'read',
    label: 'Read & Annotate',
    icon: <BookOpen size={16} />,
    description: 'Add takeaways and arguments',
  },
  {
    id: 'organize',
    label: 'Themes',
    icon: <Grid3X3 size={16} />,
    description: 'Group papers by topic',
  },
  {
    id: 'gaps',
    label: 'Gaps',
    icon: <AlertTriangle size={16} />,
    description: 'Identify research gaps',
  },
  {
    id: 'export',
    label: 'Export',
    icon: <FileText size={16} />,
    description: 'Generate review outline',
  },
];

export function WorkflowProgress({
  thesisId,
  onActivityClick,
  onPhaseClick,
}: WorkflowProgressProps) {
  // Use either callback (onPhaseClick is for backward compat)
  const handleClick = onActivityClick || onPhaseClick;
  const {
    getPapersForThesis,
    getScreeningStats,
    getThemesForThesis,
    getGapsForThesis,
  } = useAppStore();

  // Calculate stats for each activity
  const activityStats = useMemo((): Record<ActivityType, ActivityStats> => {
    const papers = getPapersForThesis(thesisId);
    const screeningStats = getScreeningStats(thesisId);
    const themes = getThemesForThesis(thesisId);
    const gaps = getGapsForThesis(thesisId);

    const includedPapers = papers.filter((p) => p.screeningDecision === 'include');
    const readPapers = includedPapers.filter((p) => p.readingStatus === 'read');
    const papersWithTakeaways = includedPapers.filter((p) => p.takeaway.length > 20);
    const pendingScreening = screeningStats.pending + screeningStats.maybe;

    return {
      collect: {
        count: papers.length,
        label: papers.length === 1 ? '1 paper' : `${papers.length} papers`,
        hasAction: true, // Always can add more
      },
      screen: {
        count: pendingScreening,
        label: pendingScreening > 0 ? `${pendingScreening} pending` : 'All screened',
        hasAction: pendingScreening > 0,
        badge: pendingScreening > 0 ? pendingScreening : undefined,
      },
      read: {
        count: papersWithTakeaways.length,
        label: includedPapers.length > 0
          ? `${papersWithTakeaways.length}/${includedPapers.length} synthesized`
          : 'No papers yet',
        hasAction: includedPapers.length > readPapers.length,
      },
      organize: {
        count: themes.length,
        label: themes.length === 0 ? 'No themes' : `${themes.length} themes`,
        hasAction: includedPapers.length > 0,
      },
      gaps: {
        count: gaps.length,
        label: gaps.length === 0 ? 'No gaps' : `${gaps.length} gaps`,
        hasAction: includedPapers.length >= 3,
      },
      export: {
        count: 0,
        label: 'Generate outline',
        hasAction: includedPapers.length > 0,
      },
    };
  }, [thesisId, getPapersForThesis, getScreeningStats, getThemesForThesis, getGapsForThesis]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
        Quick Actions
      </h3>

      {/* Activity Grid */}
      <div className="grid grid-cols-2 gap-2">
        {ACTIVITIES.map((activity) => {
          const stats = activityStats[activity.id];

          return (
            <button
              key={activity.id}
              onClick={() => handleClick?.(activity.id)}
              className={`relative flex items-start gap-2 p-2.5 rounded-lg text-left transition-all ${
                stats.hasAction
                  ? 'bg-gray-50 dark:bg-gray-700/50 hover:bg-stone-100 dark:hover:bg-stone-800/20 hover:border-stone-200 dark:hover:border-stone-700'
                  : 'bg-gray-50 dark:bg-gray-700/50 opacity-60'
              } border border-transparent`}
            >
              {/* Icon */}
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                  stats.hasAction
                    ? 'bg-stone-100 dark:bg-stone-800/50 text-stone-700 dark:text-stone-400'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                }`}
              >
                {activity.icon}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-gray-900 dark:text-white">
                  {activity.label}
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                  {stats.label}
                </div>
              </div>

              {/* Badge for pending items */}
              {stats.badge && (
                <span className="absolute top-1 right-1 w-4 h-4 text-[10px] bg-amber-500 text-white rounded-full flex items-center justify-center font-medium">
                  {stats.badge > 9 ? '9+' : stats.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
