import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Lightbulb,
  FlaskConical,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  ExternalLink,
  CircleDot,
  Circle,
  CircleDashed,
  MessageSquareQuote,
  Beaker,
  BookOpen,
  ShieldCheck,
  ShieldX,
  MoreHorizontal,
} from 'lucide-react';
import type { Paper, Thesis, Argument, Evidence } from '../../types';
import { ARGUMENT_STRENGTH_COLORS, ARGUMENT_ASSESSMENT_COLORS } from '../../constants/colors';

interface ArgumentMapViewProps {
  thesis: Thesis;
  papers: Paper[];
  onPaperSelect: (paperId: string) => void;
}

interface ArgumentNode {
  argument: Argument;
  paper: Paper;
  linkedEvidence: Evidence[];
}

interface ThesisRoleGroup {
  role: string;
  label: string;
  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  accentColor: string;
  icon: typeof ShieldCheck;
  papers: Paper[];
  arguments: ArgumentNode[];
}

const ROLE_CONFIG: Record<string, { label: string; color: string; textColor: string; bgColor: string; borderColor: string; accentColor: string; icon: typeof ShieldCheck }> = {
  supports: {
    label: 'Supporting Evidence',
    color: 'text-emerald-600 dark:text-emerald-400',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-white dark:bg-slate-900',
    borderColor: 'border-slate-200 dark:border-slate-800',
    accentColor: 'bg-emerald-500',
    icon: ShieldCheck,
  },
  contradicts: {
    label: 'Contradicting Evidence',
    color: 'text-rose-600 dark:text-rose-400',
    textColor: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-white dark:bg-slate-900',
    borderColor: 'border-slate-200 dark:border-slate-800',
    accentColor: 'bg-rose-500',
    icon: ShieldX,
  },
  method: {
    label: 'Methodology',
    color: 'text-blue-600 dark:text-blue-400',
    textColor: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-white dark:bg-slate-900',
    borderColor: 'border-slate-200 dark:border-slate-800',
    accentColor: 'bg-blue-500',
    icon: Beaker,
  },
  background: {
    label: 'Background',
    color: 'text-slate-600 dark:text-slate-400',
    textColor: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-white dark:bg-slate-900',
    borderColor: 'border-slate-200 dark:border-slate-800',
    accentColor: 'bg-slate-500',
    icon: BookOpen,
  },
  other: {
    label: 'Other',
    color: 'text-stone-600 dark:text-stone-400',
    textColor: 'text-stone-600 dark:text-stone-400',
    bgColor: 'bg-white dark:bg-slate-900',
    borderColor: 'border-slate-200 dark:border-slate-800',
    accentColor: 'bg-stone-500',
    icon: MoreHorizontal,
  },
};

// Icon mapping for argument strength (consistent with other components)
const STRENGTH_ICONS = {
  strong: CircleDot,
  moderate: Circle,
  weak: CircleDashed,
} as const;

// Icon mapping for argument assessment
const ASSESSMENT_ICONS = {
  agree: ThumbsUp,
  disagree: ThumbsDown,
  uncertain: HelpCircle,
} as const;

export function ArgumentMapView({ thesis, papers, onPaperSelect }: ArgumentMapViewProps) {
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set(['supports', 'contradicts']));
  const [expandedPapers, setExpandedPapers] = useState<Set<string>>(new Set());
  const [expandedArguments, setExpandedArguments] = useState<Set<string>>(new Set());

  // Organize papers by thesis role with their arguments
  const roleGroups = useMemo<ThesisRoleGroup[]>(() => {
    const groups: Record<string, ThesisRoleGroup> = {};

    // Initialize groups
    Object.entries(ROLE_CONFIG).forEach(([role, config]) => {
      groups[role] = {
        role,
        label: config.label,
        color: config.color,
        textColor: config.textColor,
        bgColor: config.bgColor,
        borderColor: config.borderColor,
        accentColor: config.accentColor,
        icon: config.icon,
        papers: [],
        arguments: [],
      };
    });

    // Populate groups
    papers.forEach((paper) => {
      const role = paper.thesisRole;
      if (groups[role]) {
        groups[role].papers.push(paper);

        // Add arguments from this paper
        paper.arguments.forEach((arg) => {
          const linkedEvidence = paper.evidence.filter(
            (ev) => ev.linkedArgumentId === arg.id
          );
          groups[role].arguments.push({
            argument: arg,
            paper,
            linkedEvidence,
          });
        });
      }
    });

    // Filter out empty groups and sort by importance
    const order = ['supports', 'contradicts', 'method', 'background', 'other'];
    return order
      .map((role) => groups[role])
      .filter((group) => group.papers.length > 0);
  }, [papers]);

  const toggleRole = (role: string) => {
    setExpandedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) {
        next.delete(role);
      } else {
        next.add(role);
      }
      return next;
    });
  };

  const togglePaper = (paperId: string) => {
    setExpandedPapers((prev) => {
      const next = new Set(prev);
      if (next.has(paperId)) {
        next.delete(paperId);
      } else {
        next.add(paperId);
      }
      return next;
    });
  };

  const toggleArgument = (argId: string) => {
    setExpandedArguments((prev) => {
      const next = new Set(prev);
      if (next.has(argId)) {
        next.delete(argId);
      } else {
        next.add(argId);
      }
      return next;
    });
  };

  if (papers.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <MessageSquareQuote className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
            No arguments to display
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Add papers with arguments to see the argument map
          </p>
        </div>
      </div>
    );
  }

  const totalArguments = papers.reduce((sum, p) => sum + p.arguments.length, 0);
  const totalEvidence = papers.reduce((sum, p) => sum + p.evidence.length, 0);

  return (
    <div className="h-full overflow-auto p-6 bg-slate-50 dark:bg-slate-950">
      {/* Thesis Header */}
      <div className="max-w-4xl mx-auto">
        <div className="relative bg-gradient-to-br from-stone-700 via-stone-800 to-stone-900 rounded-2xl p-6 mb-8 text-white shadow-2xl overflow-hidden border border-stone-600/50">
          {/* Subtle accent glows */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-stone-400/10 rounded-full blur-3xl" />
          </div>

          <div className="relative">
            <h2 className="text-2xl font-bold mb-3 leading-tight text-white">{thesis.title}</h2>
            {thesis.description && (
              <p className="text-stone-300 text-sm leading-relaxed line-clamp-3 mb-4">
                {thesis.description}
              </p>
            )}

            {/* Stats badges */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg text-sm border border-white/10">
                <FileText size={14} className="text-stone-300" />
                <span className="font-medium text-stone-200">{papers.length} papers</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg text-sm border border-white/10">
                <MessageSquareQuote size={14} className="text-stone-300" />
                <span className="font-medium text-stone-200">{totalArguments} arguments</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg text-sm border border-white/10">
                <FlaskConical size={14} className="text-stone-300" />
                <span className="font-medium text-stone-200">{totalEvidence} evidence</span>
              </div>
            </div>
          </div>
        </div>

        {/* Role Groups */}
        <div className="space-y-4">
          {roleGroups.map((group) => {
            const isExpanded = expandedRoles.has(group.role);
            const argumentCount = group.arguments.length;
            const GroupIcon = group.icon;

            return (
              <div
                key={group.role}
                className="relative rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Left accent border */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${group.accentColor}`} />

                {/* Role Header */}
                <button
                  onClick={() => toggleRole(group.role)}
                  className="w-full flex items-center justify-between p-4 pl-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <GroupIcon className={`w-5 h-5 ${group.color}`} />
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{group.label}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-medium text-slate-600 dark:text-slate-400">
                      {group.papers.length} papers
                    </span>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${group.textColor} bg-slate-100 dark:bg-slate-800`}>
                      {argumentCount} arguments
                    </span>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 pl-5">
                    {/* Papers with Arguments */}
                    <div className="space-y-3">
                      {group.papers.map((paper) => {
                        const isPaperExpanded = expandedPapers.has(paper.id);
                        const paperArguments = paper.arguments;

                        return (
                          <div
                            key={paper.id}
                            className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50 overflow-hidden hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                          >
                            {/* Paper Header */}
                            <div className="flex items-start gap-3 p-4">
                              <button
                                onClick={() => togglePaper(paper.id)}
                                className="mt-0.5 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                              >
                                {isPaperExpanded ? (
                                  <ChevronDown size={16} className="text-slate-400" />
                                ) : (
                                  <ChevronRight size={16} className="text-slate-400" />
                                )}
                              </button>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <button
                                    onClick={() => onPaperSelect(paper.id)}
                                    className="text-left hover:text-slate-600 dark:hover:text-slate-200 transition-colors group"
                                  >
                                    <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm leading-tight group-hover:underline underline-offset-2">
                                      {paper.title}
                                    </h4>
                                  </button>
                                  <button
                                    onClick={() => onPaperSelect(paper.id)}
                                    className="flex-shrink-0 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-all"
                                    title="View paper details"
                                  >
                                    <ExternalLink size={14} />
                                  </button>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  {paper.authors.map((a) => a.name).join(', ')}
                                  {paper.year && ` (${paper.year})`}
                                </p>

                                {/* Takeaway */}
                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 italic leading-relaxed pl-3 border-l-2 border-slate-300 dark:border-slate-600">
                                  "{paper.takeaway}"
                                </p>

                                {/* Quick Stats */}
                                <div className="flex items-center gap-2 mt-3">
                                  <span className="flex items-center gap-1.5 text-xs px-2 py-1 bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-400 rounded">
                                    <MessageSquareQuote size={12} />
                                    {paperArguments.length} arguments
                                  </span>
                                  <span className="flex items-center gap-1.5 text-xs px-2 py-1 bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-400 rounded">
                                    <FlaskConical size={12} />
                                    {paper.evidence.length} evidence
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Paper Content - Arguments */}
                            {isPaperExpanded && paperArguments.length > 0 && (
                              <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                                <div className="space-y-3">
                                  {paperArguments.map((arg) => {
                                    const isArgExpanded = expandedArguments.has(arg.id);
                                    const linkedEvidence = paper.evidence.filter(
                                      (ev) => ev.linkedArgumentId === arg.id
                                    );
                                    const strengthColors = arg.strength ? ARGUMENT_STRENGTH_COLORS[arg.strength] : null;
                                    const assessmentColors = arg.yourAssessment ? ARGUMENT_ASSESSMENT_COLORS[arg.yourAssessment] : null;
                                    const StrengthIcon = arg.strength ? STRENGTH_ICONS[arg.strength] : null;
                                    const AssessmentIcon = arg.yourAssessment ? ASSESSMENT_ICONS[arg.yourAssessment] : null;

                                    return (
                                      <div
                                        key={arg.id}
                                        className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
                                      >
                                        <div className="flex items-start gap-3">
                                          {linkedEvidence.length > 0 && (
                                            <button
                                              onClick={() => toggleArgument(arg.id)}
                                              className="mt-0.5 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                                            >
                                              {isArgExpanded ? (
                                                <ChevronDown size={14} className="text-slate-400" />
                                              ) : (
                                                <ChevronRight size={14} className="text-slate-400" />
                                              )}
                                            </button>
                                          )}

                                          <div className="p-1.5 bg-slate-200 dark:bg-slate-700 rounded">
                                            <MessageSquareQuote
                                              size={14}
                                              className="text-slate-500 dark:text-slate-400"
                                            />
                                          </div>

                                          <div className="flex-1">
                                            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                                              {arg.claim}
                                            </p>

                                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                                              {strengthColors && StrengthIcon && (
                                                <span
                                                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${strengthColors.bg} ${strengthColors.text}`}
                                                >
                                                  <StrengthIcon size={12} />
                                                  {strengthColors.label}
                                                </span>
                                              )}
                                              {assessmentColors && AssessmentIcon && (
                                                <span
                                                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${assessmentColors.bg} ${assessmentColors.text}`}
                                                >
                                                  <AssessmentIcon size={12} />
                                                  {assessmentColors.label}
                                                </span>
                                              )}
                                              {linkedEvidence.length > 0 && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                                                  <FlaskConical size={12} />
                                                  {linkedEvidence.length} evidence
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Linked Evidence */}
                                        {isArgExpanded && linkedEvidence.length > 0 && (
                                          <div className="mt-4 ml-8 space-y-2">
                                            {linkedEvidence.map((ev) => (
                                              <div
                                                key={ev.id}
                                                className="flex items-start gap-2.5 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600"
                                              >
                                                <FlaskConical
                                                  size={14}
                                                  className="text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0"
                                                />
                                                <div>
                                                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                                    {ev.description}
                                                  </p>
                                                  <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded font-medium uppercase tracking-wide">
                                                    {ev.type}
                                                  </span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Unlinked Evidence */}
                                {paper.evidence.filter((ev) => !ev.linkedArgumentId).length > 0 && (
                                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <h5 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                                      <FlaskConical size={12} />
                                      Other Evidence
                                    </h5>
                                    <div className="space-y-2">
                                      {paper.evidence
                                        .filter((ev) => !ev.linkedArgumentId)
                                        .map((ev) => (
                                          <div
                                            key={ev.id}
                                            className="flex items-start gap-2.5 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600"
                                          >
                                            <FlaskConical
                                              size={14}
                                              className="text-slate-400 mt-0.5 flex-shrink-0"
                                            />
                                            <div>
                                              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                                {ev.description}
                                              </p>
                                              <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400 rounded font-medium uppercase tracking-wide">
                                                {ev.type}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Expanded but no arguments */}
                            {isPaperExpanded && paperArguments.length === 0 && (
                              <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
                                <div className="text-center">
                                  <MessageSquareQuote className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                                  <p className="text-sm text-slate-500 dark:text-slate-400">
                                    No arguments recorded for this paper yet.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Section */}
        <div className="mt-8 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <Lightbulb className="text-slate-400" size={20} />
            Argument Summary
          </h3>

          {/* Role Distribution */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {roleGroups.map((group) => {
              const GroupIcon = group.icon;
              return (
                <div
                  key={group.role}
                  className="relative p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all hover:border-slate-300 dark:hover:border-slate-600"
                >
                  {/* Left accent */}
                  <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${group.accentColor}`} />
                  <div className="pl-2">
                    <div className="flex items-center gap-2 mb-2">
                      <GroupIcon size={14} className={group.color} />
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {group.role}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {group.arguments.length}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      arguments
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Strength Distribution */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
              Argument Strength Distribution
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {(['strong', 'moderate', 'weak'] as const).map((strength) => {
                const count = papers.reduce(
                  (sum, p) =>
                    sum + p.arguments.filter((a) => a.strength === strength).length,
                  0
                );
                const colors = ARGUMENT_STRENGTH_COLORS[strength];
                const Icon = STRENGTH_ICONS[strength];
                const total = totalArguments || 1;
                const percentage = Math.round((count / total) * 100);

                return (
                  <div key={strength} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className={colors.text} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {colors.label}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {count}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          strength === 'strong' ? 'bg-emerald-500' :
                          strength === 'moderate' ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                      {percentage}% of total
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assessment Distribution */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
              Your Assessment Distribution
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {(['agree', 'disagree', 'uncertain'] as const).map((assessment) => {
                const count = papers.reduce(
                  (sum, p) =>
                    sum + p.arguments.filter((a) => a.yourAssessment === assessment).length,
                  0
                );
                const colors = ARGUMENT_ASSESSMENT_COLORS[assessment];
                const Icon = ASSESSMENT_ICONS[assessment];
                const total = totalArguments || 1;
                const percentage = Math.round((count / total) * 100);

                return (
                  <div key={assessment} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className={colors.text} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {colors.label}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {count}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          assessment === 'agree' ? 'bg-emerald-500' :
                          assessment === 'disagree' ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                      {percentage}% of total
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
