import { useState, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  FileJson,
  FileText,
  AlertTriangle,
  Check,
  Trash2,
  HardDrive,
  FileSpreadsheet,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { Paper, ThesisRole } from '../../types';

interface DataManagerProps {
  thesisId?: string;
  onClose: () => void;
}

type Tab = 'export' | 'import' | 'danger';

interface ImportResult {
  success: boolean;
  message: string;
  details?: string;
}

export function DataManager({ thesisId, onClose }: DataManagerProps) {
  const { theses, papers, connections, exportData, importData, clearAllData, addPaper } =
    useAppStore();

  // Get active thesis for context-aware imports
  const activeThesis = thesisId ? theses.find((t) => t.id === thesisId) : theses[0];

  const [activeTab, setActiveTab] = useState<Tab>('export');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bibtexInputRef = useRef<HTMLInputElement>(null);
  const risInputRef = useRef<HTMLInputElement>(null);

  // Export as JSON
  const handleExportJSON = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ideagraph-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export thesis as Markdown
  const handleExportMarkdown = (thesisId: string) => {
    const thesis = theses.find((t) => t.id === thesisId);
    if (!thesis) return;

    const thesisPapers = papers.filter((p) => p.thesisId === thesisId);
    const thesisConnections = connections.filter((c) => c.thesisId === thesisId);

    let md = `# ${thesis.title}\n\n`;
    md += `${thesis.description}\n\n`;
    md += `---\n\n`;
    md += `## Papers (${thesisPapers.length})\n\n`;

    // Group by role
    const roles: ThesisRole[] = ['supports', 'contradicts', 'method', 'background', 'other'];
    for (const role of roles) {
      const rolePapers = thesisPapers.filter((p) => p.thesisRole === role);
      if (rolePapers.length === 0) continue;

      md += `### ${role.charAt(0).toUpperCase() + role.slice(1)} (${rolePapers.length})\n\n`;

      for (const paper of rolePapers) {
        md += `#### ${paper.title}\n\n`;
        md += `- **Authors**: ${paper.authors.map((a) => a.name).join(', ')}\n`;
        if (paper.year) md += `- **Year**: ${paper.year}\n`;
        if (paper.journal) md += `- **Journal**: ${paper.journal}\n`;
        if (paper.doi) md += `- **DOI**: [${paper.doi}](https://doi.org/${paper.doi})\n`;
        md += `\n**Takeaway**: ${paper.takeaway}\n\n`;

        if (paper.arguments.length > 0) {
          md += `**Arguments**:\n`;
          for (const arg of paper.arguments) {
            md += `- ${arg.claim}`;
            if (arg.strength) md += ` _(${arg.strength})_`;
            md += `\n`;
          }
          md += `\n`;
        }

        if (paper.evidence.length > 0) {
          md += `**Evidence**:\n`;
          for (const ev of paper.evidence) {
            md += `- ${ev.description} _(${ev.type})_\n`;
          }
          md += `\n`;
        }

        if (paper.assessment) {
          md += `**Assessment**: ${paper.assessment}\n\n`;
        }

        md += `---\n\n`;
      }
    }

    // Connections
    if (thesisConnections.length > 0) {
      md += `## Connections (${thesisConnections.length})\n\n`;
      for (const conn of thesisConnections) {
        const from = papers.find((p) => p.id === conn.fromPaperId);
        const to = papers.find((p) => p.id === conn.toPaperId);
        if (from && to) {
          md += `- **${from.title}** → _${conn.type}_ → **${to.title}**`;
          if (conn.note) md += `\n  - Note: ${conn.note}`;
          md += `\n`;
        }
      }
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${thesis.title.slice(0, 50).replace(/[^a-z0-9]/gi, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export thesis as BibTeX
  const handleExportBibTeX = (thesisId: string) => {
    const thesisPapers = papers.filter((p) => p.thesisId === thesisId);

    let bibtex = '';
    for (const paper of thesisPapers) {
      const key = generateBibKey(paper);
      bibtex += `@article{${key},\n`;
      bibtex += `  title = {${escapeBibTeX(paper.title)}},\n`;
      bibtex += `  author = {${paper.authors.map((a) => escapeBibTeX(a.name)).join(' and ')}},\n`;
      if (paper.year) bibtex += `  year = {${paper.year}},\n`;
      if (paper.journal) bibtex += `  journal = {${escapeBibTeX(paper.journal)}},\n`;
      if (paper.volume) bibtex += `  volume = {${paper.volume}},\n`;
      if (paper.issue) bibtex += `  number = {${paper.issue}},\n`;
      if (paper.pages) bibtex += `  pages = {${paper.pages}},\n`;
      if (paper.doi) bibtex += `  doi = {${paper.doi}},\n`;
      if (paper.url) bibtex += `  url = {${paper.url}},\n`;
      if (paper.abstract) bibtex += `  abstract = {${escapeBibTeX(paper.abstract)}},\n`;
      bibtex += `}\n\n`;
    }

    const blob = new Blob([bibtex], { type: 'application/x-bibtex' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `references.bib`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportResult(null);

    try {
      const text = await file.text();
      importData(text);
      setImportResult({
        success: true,
        message: 'Data imported successfully!',
        details: `Imported from ${file.name}`,
      });
    } catch (error) {
      setImportResult({
        success: false,
        message: 'Failed to import data',
        details: error instanceof Error ? error.message : 'Invalid JSON format',
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Import BibTeX
  const handleImportBibTeX = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const entries = parseBibTeX(text);

      if (entries.length === 0) {
        throw new Error('No valid BibTeX entries found');
      }

      // Need a thesis to import into
      if (!activeThesis) {
        throw new Error('Create a thesis first before importing papers');
      }

      let imported = 0;

      for (const entry of entries) {
        addPaper({
          thesisId: activeThesis.id,
          doi: entry.doi || null,
          title: entry.title || 'Untitled',
          authors: entry.authors || [],
          year: entry.year || null,
          journal: entry.journal || null,
          volume: entry.volume || null,
          issue: entry.number || null,
          pages: entry.pages || null,
          abstract: entry.abstract || null,
          url: entry.url || null,
          pdfUrl: null,
          citationCount: null,
          takeaway: entry.abstract
            ? entry.abstract.slice(0, 200) + (entry.abstract.length > 200 ? '...' : '')
            : 'Imported from BibTeX - please add takeaway',
          arguments: [],
          evidence: [],
          assessment: null,
          thesisRole: 'background',
          readingStatus: 'to-read',
          tags: entry.keywords || [],
          readAt: null,
          source: 'bibtex',
          rawBibtex: text,
          screeningDecision: 'pending',
          exclusionReason: null,
          exclusionNote: null,
          screenedAt: null,
          semanticScholarId: null,
        });
        imported++;
      }

      setImportResult({
        success: true,
        message: `Imported ${imported} papers`,
        details: `Added to "${activeThesis.title}"`,
      });
    } catch (error) {
      setImportResult({
        success: false,
        message: 'Failed to import BibTeX',
        details: error instanceof Error ? error.message : 'Invalid BibTeX format',
      });
    } finally {
      setIsProcessing(false);
      if (bibtexInputRef.current) bibtexInputRef.current.value = '';
    }
  };

  // Import RIS
  const handleImportRIS = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const entries = parseRIS(text);

      if (entries.length === 0) {
        throw new Error('No valid RIS entries found');
      }

      // Need a thesis to import into
      if (!activeThesis) {
        throw new Error('Create a thesis first before importing papers');
      }

      let imported = 0;

      for (const entry of entries) {
        addPaper({
          thesisId: activeThesis.id,
          doi: entry.doi || null,
          title: entry.title || 'Untitled',
          authors: entry.authors || [],
          year: entry.year || null,
          journal: entry.journal || null,
          volume: entry.volume || null,
          issue: entry.issue || null,
          pages: entry.pages || null,
          abstract: entry.abstract || null,
          url: entry.url || null,
          pdfUrl: null,
          citationCount: null,
          takeaway: entry.abstract
            ? entry.abstract.slice(0, 200) + (entry.abstract.length > 200 ? '...' : '')
            : 'Imported from RIS - please add takeaway',
          arguments: [],
          evidence: [],
          assessment: null,
          thesisRole: 'background',
          readingStatus: 'to-read',
          tags: entry.keywords || [],
          readAt: null,
          source: 'bibtex', // Using bibtex as source type for imports
          rawBibtex: null,
          screeningDecision: 'pending',
          exclusionReason: null,
          exclusionNote: null,
          screenedAt: null,
          semanticScholarId: null,
        });
        imported++;
      }

      setImportResult({
        success: true,
        message: `Imported ${imported} papers from RIS`,
        details: `Added to "${activeThesis.title}"`,
      });
    } catch (error) {
      setImportResult({
        success: false,
        message: 'Failed to import RIS',
        details: error instanceof Error ? error.message : 'Invalid RIS format',
      });
    } finally {
      setIsProcessing(false);
      if (risInputRef.current) risInputRef.current.value = '';
    }
  };

  // Clear all data
  const handleClearData = () => {
    if (confirmClear) {
      clearAllData();
      setConfirmClear(false);
      onClose();
    } else {
      setConfirmClear(true);
    }
  };

  const stats = {
    theses: theses.length,
    papers: papers.length,
    connections: connections.length,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Data Manager
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {stats.theses} theses · {stats.papers} papers · {stats.connections} connections
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

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {[
            { id: 'export', label: 'Export', icon: Download },
            { id: 'import', label: 'Import', icon: Upload },
            { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              {/* Full Backup */}
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                    <FileJson className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Full Backup (JSON)
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Export all theses, papers, connections, and settings. Use this for backups or
                      transferring to another device.
                    </p>
                    <button
                      onClick={handleExportJSON}
                      className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Download size={16} />
                      Download Backup
                    </button>
                  </div>
                </div>
              </div>

              {/* Per-Thesis Export */}
              {theses.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Export by Thesis
                  </h3>
                  <div className="space-y-2">
                    {theses.map((thesis) => {
                      const thesisPapers = papers.filter((p) => p.thesisId === thesis.id);
                      return (
                        <div
                          key={thesis.id}
                          className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-slate-900 dark:text-white truncate">
                              {thesis.title}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {thesisPapers.length} papers
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleExportMarkdown(thesis.id)}
                              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors text-xs font-medium flex items-center gap-1.5"
                            >
                              <FileText size={14} />
                              Markdown
                            </button>
                            <button
                              onClick={() => handleExportBibTeX(thesis.id)}
                              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors text-xs font-medium flex items-center gap-1.5"
                            >
                              <FileText size={14} />
                              BibTeX
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import Tab */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              {/* Import Result */}
              {importResult && (
                <div
                  className={`p-4 rounded-xl flex items-start gap-3 ${
                    importResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {importResult.success ? (
                    <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={`font-medium ${
                        importResult.success
                          ? 'text-emerald-800 dark:text-emerald-200'
                          : 'text-rose-800 dark:text-rose-200'
                      }`}
                    >
                      {importResult.message}
                    </p>
                    {importResult.details && (
                      <p
                        className={`text-sm mt-0.5 ${
                          importResult.success
                            ? 'text-emerald-600 dark:text-emerald-300'
                            : 'text-rose-600 dark:text-rose-300'
                        }`}
                      >
                        {importResult.details}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Import JSON */}
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                    <FileJson className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Restore from Backup (JSON)
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Import a previously exported backup. This will replace all current data.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleImportJSON}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                      className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Upload size={16} />
                      {isProcessing ? 'Processing...' : 'Choose File'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Import BibTeX */}
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Import BibTeX
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Import papers from a BibTeX file (exported from Zotero, Mendeley, etc.).
                      Papers will be added to your first thesis.
                    </p>
                    <input
                      ref={bibtexInputRef}
                      type="file"
                      accept=".bib,.bibtex,text/plain"
                      onChange={handleImportBibTeX}
                      className="hidden"
                    />
                    <button
                      onClick={() => bibtexInputRef.current?.click()}
                      disabled={isProcessing || theses.length === 0}
                      className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Upload size={16} />
                      {isProcessing ? 'Processing...' : 'Choose BibTeX File'}
                    </button>
                    {theses.length === 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                        Create a thesis first before importing papers
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Import RIS */}
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Import RIS
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Import papers from a RIS file (exported from EndNote, RefWorks, etc.).
                      Papers will be added to your active thesis.
                    </p>
                    <input
                      ref={risInputRef}
                      type="file"
                      accept=".ris,text/plain"
                      onChange={handleImportRIS}
                      className="hidden"
                    />
                    <button
                      onClick={() => risInputRef.current?.click()}
                      disabled={isProcessing || theses.length === 0}
                      className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Upload size={16} />
                      {isProcessing ? 'Processing...' : 'Choose RIS File'}
                    </button>
                    {theses.length === 0 && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                        Create a thesis first before importing papers
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Danger Zone Tab */}
          {activeTab === 'danger' && (
            <div className="space-y-6">
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-rose-900 dark:text-rose-100">
                      Clear All Data
                    </h3>
                    <p className="text-sm text-rose-700 dark:text-rose-300 mt-1">
                      Permanently delete all theses, papers, connections, and settings. This action
                      cannot be undone. Consider exporting a backup first.
                    </p>
                    {confirmClear ? (
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          onClick={handleClearData}
                          className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-medium"
                        >
                          Yes, Delete Everything
                        </button>
                        <button
                          onClick={() => setConfirmClear(false)}
                          className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleClearData}
                        className="mt-3 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        Clear All Data
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions
function generateBibKey(paper: Paper): string {
  const firstAuthor = paper.authors[0]?.name.split(' ').pop() || 'unknown';
  const year = paper.year || 'xxxx';
  const titleWord = paper.title.split(' ')[0]?.toLowerCase().replace(/[^a-z]/g, '') || 'paper';
  return `${firstAuthor}${year}${titleWord}`;
}

function escapeBibTeX(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_');
}

interface BibTeXEntry {
  type: string;
  key: string;
  title?: string;
  authors?: { name: string }[];
  year?: number;
  journal?: string;
  volume?: string;
  number?: string;
  pages?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  keywords?: string[];
}

function parseBibTeX(bibtex: string): BibTeXEntry[] {
  const entries: BibTeXEntry[] = [];

  // Simple regex-based parser for common BibTeX format
  const entryRegex = /@(\w+)\s*\{\s*([^,]+)\s*,([^@]*)\}/g;
  let match;

  while ((match = entryRegex.exec(bibtex)) !== null) {
    const [, type, key, content] = match;
    const entry: BibTeXEntry = { type, key };

    // Parse fields
    const fieldRegex = /(\w+)\s*=\s*[{"']?([^"'}]+)[}"']?/g;
    let fieldMatch;

    while ((fieldMatch = fieldRegex.exec(content)) !== null) {
      const [, field, value] = fieldMatch;
      const cleanValue = value.trim().replace(/[{}]/g, '');

      switch (field.toLowerCase()) {
        case 'title':
          entry.title = cleanValue;
          break;
        case 'author':
          entry.authors = cleanValue.split(/\s+and\s+/i).map((name) => ({
            name: name.trim().replace(/,\s*/g, ' '),
          }));
          break;
        case 'year':
          entry.year = parseInt(cleanValue, 10) || undefined;
          break;
        case 'journal':
        case 'journaltitle':
          entry.journal = cleanValue;
          break;
        case 'volume':
          entry.volume = cleanValue;
          break;
        case 'number':
        case 'issue':
          entry.number = cleanValue;
          break;
        case 'pages':
          entry.pages = cleanValue;
          break;
        case 'doi':
          entry.doi = cleanValue;
          break;
        case 'url':
          entry.url = cleanValue;
          break;
        case 'abstract':
          entry.abstract = cleanValue;
          break;
        case 'keywords':
          entry.keywords = cleanValue.split(/[,;]/).map((k) => k.trim());
          break;
      }
    }

    if (entry.title) {
      entries.push(entry);
    }
  }

  return entries;
}

// RIS Parser
interface RISEntry {
  title?: string;
  authors?: { name: string }[];
  year?: number;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  keywords?: string[];
}

function parseRIS(ris: string): RISEntry[] {
  const entries: RISEntry[] = [];
  const lines = ris.split(/\r?\n/);

  let currentEntry: RISEntry | null = null;
  let currentTag = '';
  let currentValue = '';

  for (const line of lines) {
    // Check for tag line (e.g., "TY  - JOUR")
    const tagMatch = line.match(/^([A-Z][A-Z0-9])  - (.*)$/);

    if (tagMatch) {
      const [, tag, value] = tagMatch;

      // Save previous multi-line value
      if (currentEntry && currentTag && currentValue) {
        applyRISField(currentEntry, currentTag, currentValue.trim());
      }

      currentTag = tag;
      currentValue = value;

      if (tag === 'TY') {
        // Start new entry
        currentEntry = {};
      } else if (tag === 'ER') {
        // End of record - save entry
        if (currentEntry && currentEntry.title) {
          entries.push(currentEntry);
        }
        currentEntry = null;
        currentTag = '';
        currentValue = '';
      } else if (currentEntry) {
        // Apply single-line field immediately for most tags
        if (!['AB', 'N2'].includes(tag)) {
          applyRISField(currentEntry, tag, value);
          currentTag = '';
          currentValue = '';
        }
      }
    } else if (currentEntry && currentTag && line.trim()) {
      // Continuation of multi-line field
      currentValue += ' ' + line.trim();
    }
  }

  return entries;
}

function applyRISField(entry: RISEntry, tag: string, value: string) {
  switch (tag) {
    case 'TI':
    case 'T1':
      entry.title = value;
      break;
    case 'AU':
    case 'A1':
      if (!entry.authors) entry.authors = [];
      // RIS authors are typically "Last, First" format
      entry.authors.push({ name: value.replace(/,\s*/g, ' ').trim() });
      break;
    case 'PY':
    case 'Y1':
      // Year can be "YYYY" or "YYYY/MM/DD" or "YYYY///"
      const yearMatch = value.match(/^(\d{4})/);
      if (yearMatch) {
        entry.year = parseInt(yearMatch[1], 10);
      }
      break;
    case 'JO':
    case 'JF':
    case 'T2':
      entry.journal = value;
      break;
    case 'VL':
      entry.volume = value;
      break;
    case 'IS':
      entry.issue = value;
      break;
    case 'SP':
      entry.pages = value;
      break;
    case 'EP':
      if (entry.pages) {
        entry.pages += '-' + value;
      } else {
        entry.pages = value;
      }
      break;
    case 'DO':
      entry.doi = value;
      break;
    case 'UR':
    case 'L1':
    case 'L2':
      if (!entry.url) entry.url = value;
      break;
    case 'AB':
    case 'N2':
      entry.abstract = value;
      break;
    case 'KW':
      if (!entry.keywords) entry.keywords = [];
      entry.keywords.push(value);
      break;
  }
}
