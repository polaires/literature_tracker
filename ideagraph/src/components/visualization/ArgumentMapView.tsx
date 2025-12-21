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
} from 'lucide-react';
import type { Paper, Thesis, Argument, Evidence } from '../../types';

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
  bgColor: string;
  papers: Paper[];
  arguments: ArgumentNode[];
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  supports: { label: 'Supporting Evidence', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  contradicts: { label: 'Contradicting Evidence', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20' },
  method: { label: 'Methodology', color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  background: { label: 'Background', color: 'text-gray-700 dark:text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-800/50' },
  other: { label: 'Other', color: 'text-purple-700 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
};

const STRENGTH_ICONS: Record<string, { icon: typeof ThumbsUp; color: string }> = {
  strong: { icon: ThumbsUp, color: 'text-green-600' },
  moderate: { icon: HelpCircle, color: 'text-yellow-600' },
  weak: { icon: ThumbsDown, color: 'text-red-600' },
};

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
        bgColor: config.bgColor,
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
          <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">
            Add papers with arguments to see the argument map
          </p>
        </div>
      </div>
    );
  }

  const totalArguments = papers.reduce((sum, p) => sum + p.arguments.length, 0);
  const totalEvidence = papers.reduce((sum, p) => sum + p.evidence.length, 0);

  return (
    <div className="h-full overflow-auto p-6">
      {/* Thesis Header */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 mb-8 text-white shadow-lg">
          <h2 className="text-xl font-bold mb-2">{thesis.title}</h2>
          {thesis.description && (
            <p className="text-indigo-100 text-sm">{thesis.description}</p>
          )}
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <FileText size={16} />
              <span>{papers.length} papers</span>
            </div>
            <div className="flex items-center gap-2">
              <Lightbulb size={16} />
              <span>{totalArguments} arguments</span>
            </div>
            <div className="flex items-center gap-2">
              <FlaskConical size={16} />
              <span>{totalEvidence} evidence</span>
            </div>
          </div>
        </div>

        {/* Role Groups */}
        <div className="space-y-4">
          {roleGroups.map((group) => {
            const isExpanded = expandedRoles.has(group.role);
            const argumentCount = group.arguments.length;

            return (
              <div
                key={group.role}
                className={`rounded-xl border ${group.bgColor} border-gray-200 dark:border-gray-700 overflow-hidden`}
              >
                {/* Role Header */}
                <button
                  onClick={() => toggleRole(group.role)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className={`w-5 h-5 ${group.color}`} />
                    ) : (
                      <ChevronRight className={`w-5 h-5 ${group.color}`} />
                    )}
                    <h3 className={`font-semibold ${group.color}`}>{group.label}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{group.papers.length} papers</span>
                    <span>{argumentCount} arguments</span>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4">
                    {/* Papers with Arguments */}
                    <div className="space-y-3">
                      {group.papers.map((paper) => {
                        const isPaperExpanded = expandedPapers.has(paper.id);
                        const paperArguments = paper.arguments;

                        return (
                          <div
                            key={paper.id}
                            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                          >
                            {/* Paper Header */}
                            <div className="flex items-start gap-3 p-3">
                              <button
                                onClick={() => togglePaper(paper.id)}
                                className="mt-1 p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                              >
                                {isPaperExpanded ? (
                                  <ChevronDown size={16} className="text-gray-400" />
                                ) : (
                                  <ChevronRight size={16} className="text-gray-400" />
                                )}
                              </button>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <button
                                    onClick={() => onPaperSelect(paper.id)}
                                    className="text-left hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                  >
                                    <h4 className="font-medium text-gray-900 dark:text-white text-sm leading-tight">
                                      {paper.title}
                                    </h4>
                                  </button>
                                  <button
                                    onClick={() => onPaperSelect(paper.id)}
                                    className="flex-shrink-0 p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                    title="View paper details"
                                  >
                                    <ExternalLink size={14} />
                                  </button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {paper.authors.map((a) => a.name).join(', ')}
                                  {paper.year && ` (${paper.year})`}
                                </p>

                                {/* Takeaway */}
                                <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-2 italic">
                                  "{paper.takeaway}"
                                </p>

                                {/* Quick Stats */}
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <Lightbulb size={12} />
                                    {paperArguments.length} arguments
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <FlaskConical size={12} />
                                    {paper.evidence.length} evidence
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Paper Content - Arguments */}
                            {isPaperExpanded && paperArguments.length > 0 && (
                              <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
                                <div className="space-y-2">
                                  {paperArguments.map((arg) => {
                                    const isArgExpanded = expandedArguments.has(arg.id);
                                    const linkedEvidence = paper.evidence.filter(
                                      (ev) => ev.linkedArgumentId === arg.id
                                    );
                                    const StrengthIcon = arg.strength
                                      ? STRENGTH_ICONS[arg.strength]?.icon
                                      : null;
                                    const strengthColor = arg.strength
                                      ? STRENGTH_ICONS[arg.strength]?.color
                                      : '';

                                    return (
                                      <div
                                        key={arg.id}
                                        className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                                      >
                                        <div className="flex items-start gap-2">
                                          {linkedEvidence.length > 0 && (
                                            <button
                                              onClick={() => toggleArgument(arg.id)}
                                              className="mt-0.5 p-0.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                                            >
                                              {isArgExpanded ? (
                                                <ChevronDown size={14} className="text-gray-400" />
                                              ) : (
                                                <ChevronRight size={14} className="text-gray-400" />
                                              )}
                                            </button>
                                          )}

                                          <Lightbulb
                                            size={16}
                                            className="text-amber-500 mt-0.5 flex-shrink-0"
                                          />

                                          <div className="flex-1">
                                            <p className="text-sm text-gray-800 dark:text-gray-200">
                                              {arg.claim}
                                            </p>

                                            <div className="flex items-center gap-3 mt-1.5">
                                              {arg.strength && StrengthIcon && (
                                                <span
                                                  className={`flex items-center gap-1 text-xs ${strengthColor}`}
                                                >
                                                  <StrengthIcon size={12} />
                                                  {arg.strength}
                                                </span>
                                              )}
                                              {arg.yourAssessment && (
                                                <span
                                                  className={`text-xs px-1.5 py-0.5 rounded ${
                                                    arg.yourAssessment === 'agree'
                                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                      : arg.yourAssessment === 'disagree'
                                                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                      : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                                                  }`}
                                                >
                                                  {arg.yourAssessment}
                                                </span>
                                              )}
                                              {linkedEvidence.length > 0 && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                  {linkedEvidence.length} evidence linked
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Linked Evidence */}
                                        {isArgExpanded && linkedEvidence.length > 0 && (
                                          <div className="mt-3 ml-6 space-y-2">
                                            {linkedEvidence.map((ev) => (
                                              <div
                                                key={ev.id}
                                                className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                                              >
                                                <FlaskConical
                                                  size={14}
                                                  className="text-blue-500 mt-0.5 flex-shrink-0"
                                                />
                                                <div>
                                                  <p className="text-xs text-gray-700 dark:text-gray-300">
                                                    {ev.description}
                                                  </p>
                                                  <span className="text-[10px] text-blue-600 dark:text-blue-400">
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
                                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                    <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                      Other Evidence
                                    </h5>
                                    <div className="space-y-1.5">
                                      {paper.evidence
                                        .filter((ev) => !ev.linkedArgumentId)
                                        .map((ev) => (
                                          <div
                                            key={ev.id}
                                            className="flex items-start gap-2 p-2 bg-gray-100 dark:bg-gray-600 rounded"
                                          >
                                            <FlaskConical
                                              size={12}
                                              className="text-gray-400 mt-0.5 flex-shrink-0"
                                            />
                                            <div>
                                              <p className="text-xs text-gray-600 dark:text-gray-300">
                                                {ev.description}
                                              </p>
                                              <span className="text-[10px] text-gray-500 dark:text-gray-400">
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
                              <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                  No arguments recorded for this paper yet.
                                </p>
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
        <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Argument Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {roleGroups.map((group) => (
              <div
                key={group.role}
                className={`p-4 rounded-lg ${group.bgColor}`}
              >
                <p className={`text-2xl font-bold ${group.color}`}>
                  {group.arguments.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {group.label.toLowerCase()}
                </p>
              </div>
            ))}
          </div>

          {/* Strength Distribution */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Argument Strength Distribution
            </h4>
            <div className="flex items-center gap-6">
              {(['strong', 'moderate', 'weak'] as const).map((strength) => {
                const count = papers.reduce(
                  (sum, p) =>
                    sum + p.arguments.filter((a) => a.strength === strength).length,
                  0
                );
                const config = STRENGTH_ICONS[strength];
                const Icon = config.icon;

                return (
                  <div key={strength} className="flex items-center gap-2">
                    <Icon size={16} className={config.color} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {count} {strength}
                    </span>
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
