// Standalone Reader Component
// PDF viewer with AI assistant for exploring papers before adding to thesis

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PdfLoader,
  PdfHighlighter,
} from 'react-pdf-highlighter';

import '../../lib/pdfWorker';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  Clock,
  FileText,
  Brain,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { AIAssistantPanel } from '../pdf/AIAssistantPanel';
import { UsageMeter } from '../pdf/UsageMeter';
import { useUsage, calculateUsageDisplay } from '../../services/usage';
import { useAppStore } from '../../store/useAppStore';
import { pdfStorage } from '../../services/pdfStorage';
import type { Thesis, Paper, ThesisRole } from '../../types';

// Stable no-op callbacks to prevent PdfHighlighter re-renders
const NOOP = () => {};
const NOOP_FALSE = () => false;
const NOOP_NULL = () => null;
const EMPTY_HIGHLIGHTS: never[] = [];

interface UploadedPDF {
  id: string;
  filename: string;
  fileSize: number;
  pdfData: ArrayBuffer;
  extractedText?: string;
  readingTime?: number;
}

interface StandaloneReaderProps {
  pdf: UploadedPDF;
  selectedThesis: Thesis | null;
  theses: Thesis[];
  onSelectThesis: (thesis: Thesis | null) => void;
  onDiscard: () => void;
  onBack: () => void;
}

export function StandaloneReader({
  pdf,
  selectedThesis,
  theses,
  onSelectThesis,
  onDiscard,
  onBack,
}: StandaloneReaderProps) {
  const addPaper = useAppStore((state) => state.addPaper);

  // Use the proper React hook for usage tracking
  const usage = useUsage();

  // State
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [showThesisDropdown, setShowThesisDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  // Form state for adding paper
  const [paperTitle, setPaperTitle] = useState(pdf.filename.replace('.pdf', ''));
  const [paperTakeaway, setPaperTakeaway] = useState('');
  const [paperRole, setPaperRole] = useState<ThesisRole>('background');

  // Create blob URL for PDF
  useEffect(() => {
    const blob = new Blob([pdf.pdfData], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [pdf.pdfData]);

  // Create a temporary paper object for AI assistant
  const tempPaper = useMemo((): Paper => ({
    id: pdf.id,
    thesisId: selectedThesis?.id || '',
    doi: null,
    title: paperTitle,
    authors: [],
    year: null,
    journal: null,
    volume: null,
    issue: null,
    pages: null,
    abstract: pdf.extractedText?.slice(0, 2000) || null,
    url: null,
    pdfUrl: null,
    citationCount: null,
    takeaway: paperTakeaway || 'Pending analysis',
    arguments: [],
    evidence: [],
    assessment: null,
    thesisRole: paperRole,
    readingStatus: 'reading',
    tags: [],
    addedAt: new Date().toISOString(),
    readAt: null,
    lastAccessedAt: new Date().toISOString(),
    source: 'manual',
    rawBibtex: null,
    screeningDecision: 'pending',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: null,
    semanticScholarId: null,
  }), [pdf.id, pdf.extractedText, paperTitle, paperTakeaway, paperRole, selectedThesis?.id]);

  // Handle adding paper to thesis
  const handleAddToThesis = useCallback(async () => {
    if (!selectedThesis || !paperTitle || !paperTakeaway) {
      return;
    }

    setIsAdding(true);

    try {
      // First store the PDF
      const pdfBlob = new Blob([pdf.pdfData], { type: 'application/pdf' });
      const pdfFile = new File([pdfBlob], pdf.filename, { type: 'application/pdf' });

      // Create temporary ID for PDF storage
      const tempPaperId = `temp-${Date.now()}`;
      await pdfStorage.storePDF(tempPaperId, pdfFile);

      // Add paper to store
      const newPaper = addPaper({
        thesisId: selectedThesis.id,
        doi: null,
        title: paperTitle,
        authors: [],
        year: null,
        journal: null,
        volume: null,
        issue: null,
        pages: null,
        abstract: pdf.extractedText?.slice(0, 2000) || null,
        url: null,
        pdfUrl: null,
        citationCount: null,
        takeaway: paperTakeaway,
        arguments: [],
        evidence: [],
        assessment: null,
        thesisRole: paperRole,
        readingStatus: 'reading',
        tags: [],
        readAt: null,
        source: 'manual',
        rawBibtex: null,
        screeningDecision: 'include',
        exclusionReason: null,
        exclusionNote: null,
        screenedAt: null,
        semanticScholarId: null,
      });

      // Reassign PDF to actual paper ID
      await pdfStorage.reassignPDF(tempPaperId, newPaper.id);

      setAddSuccess(true);

      // Navigate back after short delay
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (err) {
      console.error('Failed to add paper:', err);
    } finally {
      setIsAdding(false);
    }
  }, [selectedThesis, paperTitle, paperTakeaway, paperRole, pdf, addPaper, onBack]);

  const usageDisplay = calculateUsageDisplay(usage);

  if (!pdfUrl) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-slate-400" />
            <div>
              <h1 className="text-white font-medium truncate max-w-md">
                {pdf.filename}
              </h1>
              {pdf.readingTime && (
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>{pdf.readingTime} min read</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Thesis selector */}
          <div className="relative">
            <button
              onClick={() => setShowThesisDropdown(!showThesisDropdown)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white"
            >
              <span className="truncate max-w-[200px]">
                {selectedThesis ? selectedThesis.title : 'Select Thesis'}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showThesisDropdown && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-slate-700 rounded-lg shadow-xl border border-slate-600 z-50 overflow-hidden">
                <div className="p-2 border-b border-slate-600">
                  <p className="text-xs text-slate-400">
                    Select a thesis to enable relevance analysis
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {theses.length === 0 ? (
                    <p className="p-3 text-sm text-slate-400 text-center">
                      No theses yet
                    </p>
                  ) : (
                    theses.map((thesis) => (
                      <button
                        key={thesis.id}
                        onClick={() => {
                          onSelectThesis(thesis);
                          setShowThesisDropdown(false);
                        }}
                        className={`w-full p-3 text-left hover:bg-slate-600 ${
                          selectedThesis?.id === thesis.id ? 'bg-slate-600' : ''
                        }`}
                      >
                        <p className="text-sm text-white truncate">{thesis.title}</p>
                        <p className="text-xs text-slate-400">
                          {thesis.paperIds.length} papers
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* AI toggle */}
          <button
            onClick={() => setShowAIPanel(!showAIPanel)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              showAIPanel
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span className="text-sm">AI</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* PDF Viewer - Container must be relative for absolute positioned PdfHighlighter */}
        <div
          className="flex-1 min-h-0 overflow-auto"
          style={{ position: 'relative', width: '100%', height: '100%' }}
        >
          <PdfLoader
            url={pdfUrl}
            beforeLoad={<div className="text-white p-4">Loading PDF...</div>}
          >
            {(pdfDocument) => (
              <PdfHighlighter
                pdfDocument={pdfDocument}
                enableAreaSelection={NOOP_FALSE}
                onScrollChange={NOOP}
                scrollRef={NOOP}
                onSelectionFinished={NOOP_NULL}
                highlightTransform={NOOP_NULL}
                highlights={EMPTY_HIGHLIGHTS}
              />
            )}
          </PdfLoader>
        </div>

        {/* AI Assistant Panel */}
        {showAIPanel && (
          <div className="w-80 flex-shrink-0 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
            <AIAssistantPanel
              paper={tempPaper}
              thesis={selectedThesis || undefined}
              isOpen={true}
              onToggle={() => setShowAIPanel(false)}
              className="relative w-full h-full"
            />
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="bg-slate-800 border-t border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UsageMeter usage={usageDisplay} variant="compact" className="w-32" />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onDiscard}
            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
            <span>Discard</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            disabled={!selectedThesis}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
              selectedThesis
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-slate-600 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add to Thesis</span>
          </button>
        </div>
      </div>

      {/* Add to Thesis Modal */}
      {showAddModal && selectedThesis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg mx-4">
            {addSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  Paper Added
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Redirecting to thesis...
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Add to: {selectedThesis.title}
                  </h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Paper Title
                    </label>
                    <input
                      type="text"
                      value={paperTitle}
                      onChange={(e) => setPaperTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="Enter paper title"
                    />
                  </div>

                  {/* Takeaway */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Your Takeaway <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={paperTakeaway}
                      onChange={(e) => setPaperTakeaway(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
                      placeholder="What's the key insight from this paper?"
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      10-500 characters. Use AI to help generate a takeaway.
                    </p>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Role in Thesis
                    </label>
                    <select
                      value={paperRole}
                      onChange={(e) => setPaperRole(e.target.value as ThesisRole)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="supports">Supports thesis</option>
                      <option value="contradicts">Contradicts thesis</option>
                      <option value="method">Provides methodology</option>
                      <option value="background">Background/context</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddToThesis}
                    disabled={!paperTitle || !paperTakeaway || paperTakeaway.length < 10 || isAdding}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                      !paperTitle || !paperTakeaway || paperTakeaway.length < 10 || isAdding
                        ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {isAdding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>{isAdding ? 'Adding...' : 'Add Paper'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close thesis dropdown */}
      {showThesisDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowThesisDropdown(false)}
        />
      )}
    </div>
  );
}
