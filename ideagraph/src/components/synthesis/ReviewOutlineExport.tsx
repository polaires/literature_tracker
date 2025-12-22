import { useState, useMemo } from 'react';
import {
  X,
  Download,
  FileText,
  Copy,
  Check,
  BookOpen,
  ListTree,
  Table2,
  AlertTriangle,
  Settings,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import type { ExportOptions, Paper } from '../../types';

interface ReviewOutlineExportProps {
  thesisId: string;
  onClose: () => void;
}

export function ReviewOutlineExport({ thesisId, onClose }: ReviewOutlineExportProps) {
  const {
    theses,
    getPapersForThesis,
    getConnectionsForThesis,
    getSectionsForThesis,
    getThemesForThesis,
    getGapsForThesis,
    getArgumentClusters,
  } = useAppStore();

  // Export options
  const [options, setOptions] = useState<ExportOptions>({
    format: 'markdown',
    includeSections: true,
    includeThemes: true,
    includeGaps: true,
    includeEvidenceTable: true,
    includeCitations: true,
    citationStyle: 'apa',
  });

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'settings'>('preview');

  // Get data
  const thesis = theses.find((t) => t.id === thesisId);
  const papers = getPapersForThesis(thesisId).filter((p) => p.screeningDecision === 'include');
  const connections = getConnectionsForThesis(thesisId);
  const sections = getSectionsForThesis(thesisId);
  const themes = getThemesForThesis(thesisId);
  const gaps = getGapsForThesis(thesisId);
  const argumentClusters = getArgumentClusters(thesisId);

  // Generate citation
  const formatCitation = (paper: Paper): string => {
    const authors = paper.authors.length > 0
      ? paper.authors.length > 2
        ? `${paper.authors[0].name} et al.`
        : paper.authors.map((a) => a.name).join(' & ')
      : 'Unknown';

    switch (options.citationStyle) {
      case 'apa':
        return `${authors} (${paper.year || 'n.d.'})`;
      case 'mla':
        return `(${authors.split(' ')[0]} ${paper.year || 'n.d.'})`;
      case 'chicago':
        return `(${authors}, ${paper.year || 'n.d.'})`;
      case 'ieee':
        return `[${papers.indexOf(paper) + 1}]`;
      default:
        return `${authors} (${paper.year || 'n.d.'})`;
    }
  };

  // Generate the markdown content
  const generateMarkdown = useMemo(() => {
    if (!thesis) return '';

    let md = '';

    // Title
    md += `# ${thesis.title}\n\n`;
    md += `> ${thesis.description}\n\n`;
    md += `**Generated:** ${new Date().toLocaleDateString()}\n\n`;
    md += `---\n\n`;

    // Summary stats
    md += `## Overview\n\n`;
    md += `- **Papers Included:** ${papers.length}\n`;
    md += `- **Themes Identified:** ${themes.length}\n`;
    md += `- **Research Gaps:** ${gaps.length}\n`;
    md += `- **Paper Connections:** ${connections.length}\n\n`;

    // Sections (if user has created them)
    if (options.includeSections && sections.length > 0) {
      md += `## Review Structure\n\n`;
      sections.forEach((section, idx) => {
        const sectionPapers = papers.filter((p) => section.paperIds.includes(p.id));
        md += `### ${idx + 1}. ${section.title}\n\n`;
        if (section.description) {
          md += `${section.description}\n\n`;
        }
        if (sectionPapers.length > 0) {
          md += `**Key Papers:**\n`;
          sectionPapers.forEach((paper) => {
            md += `- ${paper.title} ${formatCitation(paper)}\n`;
            md += `  - *Takeaway:* ${paper.takeaway}\n`;
          });
          md += '\n';
        }
      });
    }

    // Themes
    if (options.includeThemes && themes.length > 0) {
      md += `## Thematic Analysis\n\n`;
      themes.forEach((theme) => {
        const themePapers = papers.filter((p) => theme.paperIds.includes(p.id));
        md += `### ${theme.name}\n\n`;
        if (theme.description) {
          md += `${theme.description}\n\n`;
        }
        if (themePapers.length > 0) {
          md += `**Papers (${themePapers.length}):**\n`;
          themePapers.forEach((paper) => {
            md += `- ${paper.title} ${formatCitation(paper)}\n`;
          });
          md += '\n';
        }
      });
    }

    // Argument Clusters (consensus analysis)
    if (argumentClusters.length > 0) {
      md += `## Key Arguments & Consensus\n\n`;
      argumentClusters.slice(0, 10).forEach((cluster) => {
        const agreementLabel = cluster.agreement === 'consensus'
          ? '✓ Consensus'
          : cluster.agreement === 'partial'
            ? '◐ Partial Agreement'
            : '✗ Conflicting';
        md += `### ${cluster.claim}\n\n`;
        md += `**Status:** ${agreementLabel}\n\n`;
        md += `**Papers discussing this:**\n`;
        cluster.papers.forEach((paper) => {
          md += `- ${paper.title} ${formatCitation(paper)}\n`;
        });
        md += '\n';
      });
    }

    // Evidence Table
    if (options.includeEvidenceTable && papers.length > 0) {
      md += `## Evidence Summary Table\n\n`;
      md += `| Paper | Year | Key Finding | Evidence Type | Role |\n`;
      md += `|-------|------|-------------|---------------|------|\n`;
      papers.forEach((paper) => {
        const evidenceTypes = paper.evidence.map((e) => e.type).join(', ') || 'Not specified';
        const roleLabel = {
          supports: 'Supports',
          contradicts: 'Contradicts',
          method: 'Method',
          background: 'Background',
          other: 'Other',
        }[paper.thesisRole];
        md += `| ${paper.authors[0]?.name || 'Unknown'} et al. | ${paper.year || 'n.d.'} | ${paper.takeaway.substring(0, 60)}${paper.takeaway.length > 60 ? '...' : ''} | ${evidenceTypes} | ${roleLabel} |\n`;
      });
      md += '\n';
    }

    // Research Gaps
    if (options.includeGaps && gaps.length > 0) {
      md += `## Research Gaps & Future Directions\n\n`;

      const highPriority = gaps.filter((g) => g.priority === 'high');
      const mediumPriority = gaps.filter((g) => g.priority === 'medium');
      const lowPriority = gaps.filter((g) => g.priority === 'low');

      if (highPriority.length > 0) {
        md += `### High Priority Gaps\n\n`;
        highPriority.forEach((gap) => {
          md += `**${gap.title}**\n\n`;
          md += `${gap.description}\n\n`;
          if (gap.futureResearchNote) {
            md += `*Potential approach:* ${gap.futureResearchNote}\n\n`;
          }
        });
      }

      if (mediumPriority.length > 0) {
        md += `### Medium Priority Gaps\n\n`;
        mediumPriority.forEach((gap) => {
          md += `- **${gap.title}:** ${gap.description}\n`;
        });
        md += '\n';
      }

      if (lowPriority.length > 0) {
        md += `### Lower Priority Gaps\n\n`;
        lowPriority.forEach((gap) => {
          md += `- ${gap.title}\n`;
        });
        md += '\n';
      }
    }

    // Paper connections / relationships
    if (connections.length > 0) {
      md += `## Paper Relationships\n\n`;

      const supportConnections = connections.filter((c) => c.type === 'supports');
      const contradictConnections = connections.filter((c) => c.type === 'contradicts');
      const methodConnections = connections.filter((c) => c.type === 'uses-method');
      const extendConnections = connections.filter((c) => c.type === 'extends');

      if (supportConnections.length > 0) {
        md += `### Supporting Relationships\n\n`;
        supportConnections.forEach((conn) => {
          const fromPaper = papers.find((p) => p.id === conn.fromPaperId);
          const toPaper = papers.find((p) => p.id === conn.toPaperId);
          if (fromPaper && toPaper) {
            md += `- ${fromPaper.authors[0]?.name || 'Unknown'} → supports → ${toPaper.authors[0]?.name || 'Unknown'}`;
            if (conn.note) md += `: ${conn.note}`;
            md += '\n';
          }
        });
        md += '\n';
      }

      if (contradictConnections.length > 0) {
        md += `### Contradicting Relationships\n\n`;
        contradictConnections.forEach((conn) => {
          const fromPaper = papers.find((p) => p.id === conn.fromPaperId);
          const toPaper = papers.find((p) => p.id === conn.toPaperId);
          if (fromPaper && toPaper) {
            md += `- ${fromPaper.authors[0]?.name || 'Unknown'} ↔ contradicts ↔ ${toPaper.authors[0]?.name || 'Unknown'}`;
            if (conn.note) md += `: ${conn.note}`;
            md += '\n';
          }
        });
        md += '\n';
      }

      if (extendConnections.length > 0 || methodConnections.length > 0) {
        md += `### Building & Method Relationships\n\n`;
        [...extendConnections, ...methodConnections].forEach((conn) => {
          const fromPaper = papers.find((p) => p.id === conn.fromPaperId);
          const toPaper = papers.find((p) => p.id === conn.toPaperId);
          if (fromPaper && toPaper) {
            md += `- ${fromPaper.authors[0]?.name || 'Unknown'} → ${conn.type} → ${toPaper.authors[0]?.name || 'Unknown'}\n`;
          }
        });
        md += '\n';
      }
    }

    // References (if enabled)
    if (options.includeCitations) {
      md += `## References\n\n`;
      papers.forEach((paper, idx) => {
        const authors = paper.authors.map((a) => a.name).join(', ') || 'Unknown';
        switch (options.citationStyle) {
          case 'apa':
            md += `${authors} (${paper.year || 'n.d.'}). ${paper.title}. *${paper.journal || 'Unknown Journal'}*${paper.volume ? `, ${paper.volume}` : ''}${paper.issue ? `(${paper.issue})` : ''}${paper.pages ? `, ${paper.pages}` : ''}.${paper.doi ? ` https://doi.org/${paper.doi}` : ''}\n\n`;
            break;
          case 'ieee':
            md += `[${idx + 1}] ${authors}, "${paper.title}," *${paper.journal || 'Unknown'}*, ${paper.year || 'n.d.'}${paper.doi ? `, doi: ${paper.doi}` : ''}.\n\n`;
            break;
          default:
            md += `${authors}. (${paper.year || 'n.d.'}). ${paper.title}. ${paper.journal || ''}.\n\n`;
        }
      });
    }

    md += `---\n\n`;
    md += `*Generated by IdeaGraph Literature Tracker*\n`;

    return md;
  }, [thesis, papers, connections, sections, themes, gaps, argumentClusters, options]);

  // Copy to clipboard
  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download as file
  const handleDownload = () => {
    const blob = new Blob([generateMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${thesis?.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'review'}_outline.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!thesis) return null;

  return (
    <Modal onClose={onClose} className="max-w-5xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Export Review Outline
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Generate a structured outline for your literature review
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

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'preview'
              ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600'
              : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700'
          }`}
        >
          <BookOpen size={16} className="inline mr-2" />
          Preview
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'settings'
              ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600'
              : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700'
          }`}
        >
          <Settings size={16} className="inline mr-2" />
          Settings
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'preview' ? (
          <div className="p-6">
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-[50vh]">
              {generateMarkdown}
            </pre>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Include Options */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Include in Export
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeSections}
                    onChange={(e) =>
                      setOptions({ ...options, includeSections: e.target.checked })
                    }
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <ListTree size={18} className="text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Review Sections ({sections.length})
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeThemes}
                    onChange={(e) =>
                      setOptions({ ...options, includeThemes: e.target.checked })
                    }
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Synthesis Themes ({themes.length})
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeGaps}
                    onChange={(e) =>
                      setOptions({ ...options, includeGaps: e.target.checked })
                    }
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Research Gaps ({gaps.length})
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeEvidenceTable}
                    onChange={(e) =>
                      setOptions({ ...options, includeEvidenceTable: e.target.checked })
                    }
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <Table2 size={18} className="text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Evidence Summary Table
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeCitations}
                    onChange={(e) =>
                      setOptions({ ...options, includeCitations: e.target.checked })
                    }
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      References List
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Citation Style */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Citation Style
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(['apa', 'mla', 'chicago', 'ieee'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setOptions({ ...options, citationStyle: style })}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      options.citationStyle === style
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {style.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Export Summary
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {papers.length}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">Papers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {themes.length}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">Themes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {gaps.length}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">Gaps</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {argumentClusters.length}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">Arguments</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="secondary"
          onClick={handleCopy}
          icon={copied ? <Check size={18} /> : <Copy size={18} />}
        >
          {copied ? 'Copied!' : 'Copy'}
        </Button>
        <Button onClick={handleDownload} icon={<Download size={18} />}>
          Download .md
        </Button>
      </div>
    </Modal>
  );
}
