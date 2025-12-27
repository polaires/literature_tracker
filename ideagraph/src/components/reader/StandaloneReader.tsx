// Standalone Reader Component
// PDF viewer with AI assistant for exploring papers before adding to thesis

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  PdfLoader,
  PdfHighlighter,
  Highlight,
  AreaHighlight,
  Popup,
} from 'react-pdf-highlighter';
import type { IHighlight } from 'react-pdf-highlighter';

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
  Highlighter,
  Square,
  MessageSquare,
  ChevronLeft,
  Keyboard,
  Edit3,
} from 'lucide-react';
import type { AnnotationColor } from '../../types';
import { AIAssistantPanel } from '../pdf/AIAssistantPanel';
import { UsageMeter } from '../pdf/UsageMeter';
import { useUsage, calculateUsageDisplay } from '../../services/usage';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '../../contexts/AuthContext';
import { pdfStorage } from '../../services/pdfStorage';
import type { Thesis, Paper, ThesisRole } from '../../types';

// Highlight color map
const COLOR_MAP: Record<AnnotationColor, string> = {
  yellow: '#FFEB3B',
  red: '#EF5350',
  green: '#66BB6A',
  blue: '#42A5F5',
  purple: '#AB47BC',
  orange: '#FFA726',
};

// Temporary annotation for reader session (not persisted)
interface TempAnnotation {
  id: string;
  color: AnnotationColor;
  position: IHighlight['position'];
  content: IHighlight['content'];
  comment?: string;
}

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
  const addAnnotation = useAppStore((state) => state.addAnnotation);
  const { isAuthenticated } = useAuth();

  // Use the proper React hook for usage tracking
  const usage = useUsage();

  // State
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [showThesisDropdown, setShowThesisDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  // PDF tools state
  const [activeColor, setActiveColor] = useState<AnnotationColor>('yellow');
  const [highlightMode, setHighlightMode] = useState<'highlight' | 'area' | 'none'>('none');
  const [annotations, setAnnotations] = useState<TempAnnotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [showAnnotationSidebar, setShowAnnotationSidebar] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; highlightId: string } | null>(null);

  // Form state for adding paper
  const [paperTitle, setPaperTitle] = useState(pdf.filename.replace('.pdf', ''));
  const [paperTakeaway, setPaperTakeaway] = useState('');
  const [paperRole, setPaperRole] = useState<ThesisRole>('background');

  // Scroll to highlight ref
  const scrollViewerTo = useRef<(highlight: IHighlight) => void>(() => {});

  // Refs to track current values (avoids stale closure in react-pdf-highlighter callbacks)
  const activeColorRef = useRef<AnnotationColor>(activeColor);
  activeColorRef.current = activeColor;
  const highlightModeRef = useRef<'highlight' | 'area' | 'none'>(highlightMode);
  highlightModeRef.current = highlightMode;

  // Track previous annotation count to detect new annotations
  const prevAnnotationsLengthRef = useRef(annotations.length);

  // Fix color for newly created annotations (react-pdf-highlighter caches callbacks)
  useEffect(() => {
    if (annotations.length > prevAnnotationsLengthRef.current) {
      // A new annotation was added - update its color to current activeColor
      const lastAnnotation = annotations[annotations.length - 1];
      if (lastAnnotation && lastAnnotation.color !== activeColor) {
        setAnnotations(prev => prev.map((a, i) =>
          i === prev.length - 1 ? { ...a, color: activeColor } : a
        ));
      }
    }
    prevAnnotationsLengthRef.current = annotations.length;
  }, [annotations.length, activeColor]);

  // Track previous blob URL to revoke when creating a new one
  const previousBlobUrlRef = useRef<string | null>(null);

  // Create blob URL for PDF
  // Use pdf.id as dependency instead of pdf.pdfData to avoid issues with ArrayBuffer reference changes
  useEffect(() => {
    if (!pdf.pdfData || pdf.pdfData.byteLength === 0) {
      return;
    }

    // Revoke previous URL if it exists
    if (previousBlobUrlRef.current) {
      URL.revokeObjectURL(previousBlobUrlRef.current);
    }

    const blob = new Blob([pdf.pdfData], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    previousBlobUrlRef.current = url;
    setPdfUrl(url);

    // Only revoke on unmount, not on effect re-run
    return () => {
      // Don't revoke here - let the next effect run handle it
      // This prevents StrictMode double-render from breaking the URL
    };
  }, [pdf.id, pdf.pdfData]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (previousBlobUrlRef.current) {
        URL.revokeObjectURL(previousBlobUrlRef.current);
      }
    };
  }, []);

  // Convert annotations to highlight format for react-pdf-highlighter
  const highlights = useMemo((): IHighlight[] =>
    annotations.map(a => ({
      id: a.id,
      position: a.position,
      content: a.content,
      comment: { text: a.comment || '', emoji: '' },
    })),
    [annotations]
  );

  // Handle deleting a highlight
  const handleDeleteHighlight = useCallback((highlightId: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== highlightId));
    if (selectedAnnotationId === highlightId) {
      setSelectedAnnotationId(null);
    }
  }, [selectedAnnotationId]);

  // Handle updating annotation comment
  const handleUpdateComment = useCallback((annotationId: string, comment: string) => {
    setAnnotations(prev => prev.map(a =>
      a.id === annotationId ? { ...a, comment } : a
    ));
    setEditingAnnotationId(null);
    setEditingComment('');
  }, []);

  // Scroll to annotation
  const scrollToAnnotation = useCallback((annotation: TempAnnotation) => {
    setSelectedAnnotationId(annotation.id);
    const highlight: IHighlight = {
      id: annotation.id,
      position: annotation.position,
      content: annotation.content,
      comment: { text: annotation.comment || '', emoji: '' },
    };
    scrollViewerTo.current(highlight);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Color shortcuts (1-6)
      const colors: AnnotationColor[] = ['yellow', 'red', 'green', 'blue', 'purple', 'orange'];
      if (e.key >= '1' && e.key <= '6') {
        e.preventDefault();
        setActiveColor(colors[parseInt(e.key) - 1]);
      }

      // Tool shortcuts (toggle on/off)
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setHighlightMode(prev => prev === 'highlight' ? 'none' : 'highlight');
      }
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setHighlightMode(prev => prev === 'area' ? 'none' : 'area');
      }

      // Toggle panels
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setShowAnnotationSidebar(prev => !prev);
      }
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        setShowAIPanel(prev => !prev);
      }

      // Show keyboard shortcuts
      if (e.key === '?') {
        e.preventDefault();
        setShowKeyboardShortcuts(prev => !prev);
      }

      // Escape to close modals
      if (e.key === 'Escape') {
        setShowKeyboardShortcuts(false);
        setEditingAnnotationId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Memoized callbacks for PdfHighlighter
  const enableAreaSelection = useCallback(() => highlightMode === 'area', [highlightMode]);
  const onScrollChange = useCallback(() => {}, []);
  const scrollRef = useCallback((scrollTo: (highlight: IHighlight) => void) => {
    scrollViewerTo.current = scrollTo;
  }, []);

  // onSelectionFinished - NOT memoized to ensure it always captures current state
  // react-pdf-highlighter caches callbacks, so we need to use refs for current values
  const onSelectionFinished = (
    position: IHighlight['position'],
    content: IHighlight['content'],
    hideTipAndSelection: () => void
  ) => {
    // Use ref to get current highlight mode
    if (highlightModeRef.current === 'none') {
      hideTipAndSelection();
      return null;
    }
    const newAnnotation: TempAnnotation = {
      id: `highlight-${Date.now()}`,
      color: activeColorRef.current,
      position,
      content,
      comment: undefined,
    };
    setAnnotations(prev => [...prev, newAnnotation]);
    hideTipAndSelection();
    return null;
  };

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

      // Export annotations to the new paper
      for (const annotation of annotations) {
        addAnnotation({
          paperId: newPaper.id,
          type: annotation.content?.image ? 'area' : 'highlight',
          color: annotation.color,
          position: annotation.position as import('../../types').PDFAnnotation['position'],
          selectedText: annotation.content?.text,
          comment: annotation.comment,
          imageDataUrl: annotation.content?.image,
          tags: [],
        });
      }

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
  }, [selectedThesis, paperTitle, paperTakeaway, paperRole, pdf, addPaper, addAnnotation, annotations, onBack]);

  const usageDisplay = calculateUsageDisplay(usage);

  if (!pdfUrl) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-stone-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#FDFBF7] flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="bg-[#FDFBF7] border-b border-stone-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-stone-500" />
            <div>
              <h1 className="text-stone-800 font-medium truncate max-w-[200px]">
                {pdf.filename}
              </h1>
              {pdf.readingTime && (
                <div className="flex items-center gap-1 text-xs text-stone-500">
                  <Clock className="w-3 h-3" />
                  <span>{pdf.readingTime} min read</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PDF Tools */}
        <div className="flex items-center gap-2">
          {/* Color picker - only show when highlighting is enabled */}
          {highlightMode !== 'none' && (
            <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1">
              {(Object.keys(COLOR_MAP) as AnnotationColor[]).map((color) => (
                <button
                  key={color}
                  onClick={() => setActiveColor(color)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    activeColor === color
                      ? 'border-stone-800 scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: COLOR_MAP[color] }}
                  title={`${color} highlight`}
                />
              ))}
            </div>
          )}

          {/* Mode buttons */}
          <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1">
            <button
              onClick={() => setHighlightMode(highlightMode === 'highlight' ? 'none' : 'highlight')}
              className={`p-2 rounded ${
                highlightMode === 'highlight'
                  ? 'bg-stone-800 text-white'
                  : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200'
              }`}
              title={highlightMode === 'highlight' ? 'Disable highlighting' : 'Enable text highlighting'}
            >
              <Highlighter size={18} />
            </button>
            <button
              onClick={() => setHighlightMode(highlightMode === 'area' ? 'none' : 'area')}
              className={`p-2 rounded ${
                highlightMode === 'area'
                  ? 'bg-stone-800 text-white'
                  : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200'
              }`}
              title={highlightMode === 'area' ? 'Disable area selection' : 'Enable area selection'}
            >
              <Square size={18} />
            </button>
          </div>

          {/* Annotation sidebar toggle */}
          <button
            onClick={() => setShowAnnotationSidebar(!showAnnotationSidebar)}
            className={`p-2 rounded-lg flex items-center gap-1.5 ${
              showAnnotationSidebar
                ? 'bg-stone-800 text-white'
                : 'bg-stone-100 text-stone-500 hover:text-stone-700 hover:bg-stone-200'
            }`}
            title="Toggle annotations sidebar (N)"
          >
            <MessageSquare size={18} />
            {annotations.length > 0 && (
              <span className="text-xs font-medium">{annotations.length}</span>
            )}
          </button>

          {/* Keyboard shortcuts button */}
          <button
            onClick={() => setShowKeyboardShortcuts(true)}
            className="p-2 rounded-lg bg-stone-100 text-stone-500 hover:text-stone-700 hover:bg-stone-200"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Thesis selector */}
          <div className="relative">
            <button
              onClick={() => setShowThesisDropdown(!showThesisDropdown)}
              className="flex items-center gap-2 px-3 py-2 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg text-sm text-stone-700"
            >
              <span className="truncate max-w-[200px]">
                {selectedThesis ? selectedThesis.title : 'Select Thesis'}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showThesisDropdown && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-lg shadow-xl border border-stone-200 z-50 overflow-hidden">
                <div className="p-2 border-b border-stone-100">
                  <p className="text-xs text-stone-500">
                    Select a thesis to enable relevance analysis
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {theses.length === 0 ? (
                    <p className="p-3 text-sm text-stone-500 text-center">
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
                        className={`w-full p-3 text-left hover:bg-stone-50 ${
                          selectedThesis?.id === thesis.id ? 'bg-stone-100' : ''
                        }`}
                      >
                        <p className="text-sm text-stone-800 truncate">{thesis.title}</p>
                        <p className="text-xs text-stone-500">
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
          {isAuthenticated ? (
            <button
              onClick={() => setShowAIPanel(!showAIPanel)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                showAIPanel
                  ? 'bg-stone-800 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span className="text-sm">AI</span>
            </button>
          ) : (
            <button
              disabled
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed"
              title="Sign in to use AI features"
            >
              <Brain className="w-4 h-4" />
              <span className="text-sm">AI</span>
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Annotation Sidebar */}
        {showAnnotationSidebar && (
          <div className="w-72 flex-shrink-0 bg-[#FDFBF7] border-r border-stone-200 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-semibold text-stone-800 text-sm">
                Annotations ({annotations.length})
              </h3>
              <button
                onClick={() => setShowAnnotationSidebar(false)}
                className="p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {annotations.length === 0 ? (
                <div className="p-4 text-center text-stone-400 text-sm">
                  <Highlighter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No annotations yet</p>
                  <p className="text-xs mt-1">Select text to highlight</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {annotations.map((annotation) => (
                    <div
                      key={annotation.id}
                      className={`p-3 cursor-pointer hover:bg-stone-50 transition-colors ${
                        selectedAnnotationId === annotation.id ? 'bg-stone-100' : ''
                      }`}
                      onClick={() => scrollToAnnotation(annotation)}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                          style={{ backgroundColor: COLOR_MAP[annotation.color] }}
                        />
                        <div className="flex-1 min-w-0">
                          {annotation.content?.text && (
                            <p className="text-xs text-stone-600 line-clamp-2 mb-1">
                              "{annotation.content.text}"
                            </p>
                          )}
                          {annotation.content?.image && (
                            <div className="mb-1">
                              <img
                                src={annotation.content.image}
                                alt="Area highlight"
                                className="max-w-full h-auto rounded border border-stone-200"
                              />
                            </div>
                          )}
                          {editingAnnotationId === annotation.id ? (
                            <div className="mt-2">
                              <textarea
                                value={editingComment}
                                onChange={(e) => setEditingComment(e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-stone-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-stone-400"
                                rows={2}
                                placeholder="Add a note..."
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex items-center gap-1 mt-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateComment(annotation.id, editingComment);
                                  }}
                                  className="px-2 py-0.5 text-xs bg-stone-800 text-white rounded hover:bg-stone-900"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingAnnotationId(null);
                                    setEditingComment('');
                                  }}
                                  className="px-2 py-0.5 text-xs text-stone-500 hover:text-stone-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : annotation.comment ? (
                            <p className="text-xs text-stone-500 italic mt-1">
                              Note: {annotation.comment}
                            </p>
                          ) : null}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingAnnotationId(annotation.id);
                                setEditingComment(annotation.comment || '');
                              }}
                              className="text-xs text-stone-400 hover:text-stone-600 flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              {annotation.comment ? 'Edit' : 'Add note'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteHighlight(annotation.id);
                              }}
                              className="text-xs text-red-400 hover:text-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PDF Viewer - Container must be relative for absolute positioned PdfHighlighter */}
        <div
          className="flex-1 min-h-0 overflow-auto"
          style={{ position: 'relative', width: '100%', height: '100%' }}
        >
          <PdfLoader
            key={pdfUrl}
            url={pdfUrl}
            beforeLoad={<div className="text-stone-600 p-4">Loading PDF...</div>}
          >
            {(pdfDocument) => (
              <PdfHighlighter
                pdfDocument={pdfDocument}
                enableAreaSelection={enableAreaSelection}
                onScrollChange={onScrollChange}
                scrollRef={scrollRef}
                onSelectionFinished={onSelectionFinished}
                highlightTransform={(
                  highlight,
                  index,
                  setTip,
                  hideTip,
                  _viewportToScaled,
                  _screenshot,
                  isScrolledTo
                ) => {
                  const annotation = annotations.find(a => a.id === highlight.id);
                  const isAreaHighlight = highlight.content?.image;
                  const color = annotation?.color || 'yellow';

                  // Apply color directly via CSS
                  const highlightColor = COLOR_MAP[color];

                  const component = isAreaHighlight ? (
                    <AreaHighlight
                      isScrolledTo={isScrolledTo}
                      highlight={highlight}
                      onChange={() => {}}
                    />
                  ) : (
                    <Highlight
                      isScrolledTo={isScrolledTo}
                      position={highlight.position}
                      comment={highlight.comment}
                    />
                  );

                  return (
                    <Popup
                      popupContent={
                        <div className="bg-white shadow-lg rounded-lg p-3 max-w-xs border border-stone-200">
                          {annotation?.content?.text && (
                            <p className="text-xs text-stone-500 mb-2 italic line-clamp-3">
                              "{annotation.content.text}"
                            </p>
                          )}
                          {annotation?.comment && (
                            <p className="text-xs text-stone-700 mb-2 bg-stone-50 p-2 rounded">
                              {annotation.comment}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingAnnotationId(highlight.id);
                                setEditingComment(annotation?.comment || '');
                                setShowAnnotationSidebar(true);
                              }}
                              className="text-xs text-stone-600 hover:text-stone-800 flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              {annotation?.comment ? 'Edit note' : 'Add note'}
                            </button>
                            <button
                              onClick={() => handleDeleteHighlight(highlight.id)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      }
                      onMouseOver={() => setTip(highlight, () => {})}
                      onMouseOut={hideTip}
                      key={index}
                    >
                      <div
                        data-highlight-id={highlight.id}
                        style={{
                          opacity: selectedAnnotationId === highlight.id ? 0.8 : 0.4,
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            highlightId: highlight.id,
                          });
                        }}
                        title="Right-click for options"
                      >
                        <style>{`
                          [data-highlight-id="${highlight.id}"] .Highlight__part {
                            background-color: ${highlightColor} !important;
                          }
                        `}</style>
                        {component}
                      </div>
                    </Popup>
                  );
                }}
                highlights={highlights}
              />
            )}
          </PdfLoader>
        </div>

        {/* AI Assistant Panel */}
        {showAIPanel && isAuthenticated && (
          <div className="w-80 flex-shrink-0 bg-[#FDFBF7] dark:bg-slate-800 border-l border-stone-200 dark:border-slate-700 flex flex-col overflow-hidden">
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
      <div className="bg-[#FDFBF7] border-t border-stone-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UsageMeter usage={usageDisplay} variant="compact" className="w-32" />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onDiscard}
            className="flex items-center gap-2 px-4 py-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
            <span>Discard</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            disabled={!selectedThesis}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
              selectedThesis
                ? 'bg-stone-800 hover:bg-stone-900 text-white'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
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
          <div className="bg-[#FDFBF7] dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg mx-4">
            {addSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-stone-800 dark:text-white mb-2">
                  Paper Added
                </h3>
                <p className="text-stone-500 dark:text-slate-400">
                  Redirecting to thesis...
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-stone-800 dark:text-white">
                    Add to: {selectedThesis.title}
                  </h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-slate-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-slate-300 mb-1">
                      Paper Title
                    </label>
                    <input
                      type="text"
                      value={paperTitle}
                      onChange={(e) => setPaperTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-stone-800 dark:text-white"
                      placeholder="Enter paper title"
                    />
                  </div>

                  {/* Takeaway */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-slate-300 mb-1">
                      Your Takeaway <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={paperTakeaway}
                      onChange={(e) => setPaperTakeaway(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-stone-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-stone-800 dark:text-white resize-none"
                      placeholder="What's the key insight from this paper?"
                    />
                    <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">
                      10-500 characters. Use AI to help generate a takeaway.
                    </p>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-slate-300 mb-1">
                      Role in Thesis
                    </label>
                    <select
                      value={paperRole}
                      onChange={(e) => setPaperRole(e.target.value as ThesisRole)}
                      className="w-full px-3 py-2 border border-stone-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-stone-800 dark:text-white"
                    >
                      <option value="supports">Supports thesis</option>
                      <option value="contradicts">Contradicts thesis</option>
                      <option value="method">Provides methodology</option>
                      <option value="background">Background/context</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-4 border-t border-stone-200 dark:border-slate-700">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-stone-600 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddToThesis}
                    disabled={!paperTitle || !paperTakeaway || paperTakeaway.length < 10 || isAdding}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                      !paperTitle || !paperTakeaway || paperTakeaway.length < 10 || isAdding
                        ? 'bg-stone-300 dark:bg-slate-600 text-stone-500 dark:text-slate-400 cursor-not-allowed'
                        : 'bg-stone-800 hover:bg-stone-900 text-white'
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

      {/* Right-click context menu for annotations */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-50"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-stone-200 py-1 min-w-[120px]"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            <button
              onClick={() => {
                handleDeleteHighlight(contextMenu.highlightId);
                setContextMenu(null);
              }}
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete highlight
            </button>
            <button
              onClick={() => {
                setEditingAnnotationId(contextMenu.highlightId);
                const annotation = annotations.find(a => a.id === contextMenu.highlightId);
                setEditingComment(annotation?.comment || '');
                setShowAnnotationSidebar(true);
                setContextMenu(null);
              }}
              className="w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50 flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Edit note
            </button>
          </div>
        </>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#FDFBF7] rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-stone-600" />
                <h3 className="text-lg font-semibold text-stone-800">
                  Keyboard Shortcuts
                </h3>
              </div>
              <button
                onClick={() => setShowKeyboardShortcuts(false)}
                className="p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Colors */}
              <div>
                <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                  Highlight Colors
                </h4>
                <div className="space-y-1">
                  {(['yellow', 'red', 'green', 'blue', 'purple', 'orange'] as AnnotationColor[]).map((color, i) => (
                    <div key={color} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLOR_MAP[color] }}
                        />
                        <span className="text-sm text-stone-700 capitalize">{color}</span>
                      </div>
                      <kbd className="px-2 py-0.5 text-xs font-mono bg-stone-100 border border-stone-200 rounded text-stone-600">
                        {i + 1}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tools */}
              <div>
                <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                  Tools (Toggle On/Off)
                </h4>
                <div className="space-y-1">
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <Highlighter className="w-4 h-4 text-stone-500" />
                      <span className="text-sm text-stone-700">Text Highlight</span>
                    </div>
                    <kbd className="px-2 py-0.5 text-xs font-mono bg-stone-100 border border-stone-200 rounded text-stone-600">
                      H
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <Square className="w-4 h-4 text-stone-500" />
                      <span className="text-sm text-stone-700">Area Selection</span>
                    </div>
                    <kbd className="px-2 py-0.5 text-xs font-mono bg-stone-100 border border-stone-200 rounded text-stone-600">
                      A
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Panels */}
              <div>
                <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                  Panels
                </h4>
                <div className="space-y-1">
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-stone-500" />
                      <span className="text-sm text-stone-700">Annotations Sidebar</span>
                    </div>
                    <kbd className="px-2 py-0.5 text-xs font-mono bg-stone-100 border border-stone-200 rounded text-stone-600">
                      N
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-stone-500" />
                      <span className="text-sm text-stone-700">AI Assistant</span>
                    </div>
                    <kbd className="px-2 py-0.5 text-xs font-mono bg-stone-100 border border-stone-200 rounded text-stone-600">
                      I
                    </kbd>
                  </div>
                </div>
              </div>

              {/* General */}
              <div>
                <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                  General
                </h4>
                <div className="space-y-1">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-stone-700">Show Shortcuts</span>
                    <kbd className="px-2 py-0.5 text-xs font-mono bg-stone-100 border border-stone-200 rounded text-stone-600">
                      ?
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-stone-700">Close Modal</span>
                    <kbd className="px-2 py-0.5 text-xs font-mono bg-stone-100 border border-stone-200 rounded text-stone-600">
                      Esc
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Mouse Actions */}
              <div>
                <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                  Mouse Actions
                </h4>
                <div className="space-y-1">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-stone-700">Delete Annotation</span>
                    <span className="text-xs text-stone-500">Right-click on highlight</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-stone-700">Edit/View Options</span>
                    <span className="text-xs text-stone-500">Hover on highlight</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-3 border-t border-stone-200 bg-stone-50">
              <p className="text-xs text-stone-500 text-center">
                Press <kbd className="px-1 py-0.5 text-xs font-mono bg-stone-100 border border-stone-200 rounded">?</kbd> anytime to show this help
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
