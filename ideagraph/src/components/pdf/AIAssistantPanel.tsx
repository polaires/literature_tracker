// AI Assistant Panel Component
// Floating panel for AI-assisted PDF reading with tabbed interface

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  Bot,
  FileText,
  Search,
  GitCompare,
  FlaskConical,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  X,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  List,
  Network,
  GripVertical,
} from 'lucide-react';
import { UsageMeter } from './UsageMeter';
import { FindingsGraphView } from './FindingsGraphView';
import { usageTracker, useUsage, calculateUsageDisplay } from '../../services/usage';
import type { PDFAIAction } from '../../services/ai/prompts/pdfSummary';
import type { Thesis, Paper } from '../../types';
import { extractPDFText, detectSections } from '../../services/pdf';
import { pdfStorage } from '../../services/pdfStorage';
import {
  PDF_ASSISTANT_SYSTEM_PROMPT,
  getPromptBuilder,
  getRecommendedModel,
} from '../../services/ai/prompts/pdfSummary';
import { getAIProvider } from '../../services/ai/providers';
import { useAppStore } from '../../store/useAppStore';
import { usePaperExtraction } from '../../hooks/usePaperExtraction';

interface AIAssistantPanelProps {
  paper: Paper;
  thesis?: Thesis;
  isOpen: boolean;
  onToggle: () => void;
  onClose?: () => void;
  className?: string;
}

interface ActionButton {
  action: PDFAIAction;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const ACTION_BUTTONS: ActionButton[] = [
  {
    action: 'summarize',
    label: 'Summarize this paper',
    icon: <FileText className="w-4 h-4" />,
    description: 'Get a quick overview of the paper',
  },
  {
    action: 'key-findings',
    label: 'What are the key findings?',
    icon: <Search className="w-4 h-4" />,
    description: 'Extract main results and conclusions',
  },
  {
    action: 'thesis-relevance',
    label: 'How does this relate to my thesis?',
    icon: <GitCompare className="w-4 h-4" />,
    description: 'Analyze relevance to your research',
  },
  {
    action: 'methodology',
    label: 'Extract methodology',
    icon: <FlaskConical className="w-4 h-4" />,
    description: 'Identify methods and techniques used',
  },
  {
    action: 'takeaway',
    label: 'Generate takeaway',
    icon: <Lightbulb className="w-4 h-4" />,
    description: 'Create a thesis-relevant insight',
  },
];

interface AIResult {
  id: string;
  action: PDFAIAction;
  content: string;
  timestamp: string;
}

// Tab types for the panel
type PanelTab = 'extraction' | 'chat' | 'findings';
type FindingsViewMode = 'list' | 'graph';

export const AIAssistantPanel = memo(function AIAssistantPanel({
  paper,
  thesis,
  isOpen,
  onToggle,
  onClose,
  className = '',
}: AIAssistantPanelProps) {
  const aiSettings = useAppStore((state) => state.aiSettings);

  // Use the proper React hook for usage tracking
  const usage = useUsage();

  // Extraction hook
  const {
    isExtracting,
    progress: extractionProgress,
    error: extractionError,
    extractPaper,
    cancelExtraction,
    getGraphForPaper,
    verifyFinding,
    clearError: clearExtractionError,
  } = usePaperExtraction();

  // Tab state
  const [activeTab, setActiveTab] = useState<PanelTab>('extraction');
  const [findingsViewMode, setFindingsViewMode] = useState<FindingsViewMode>('list');

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<PDFAIAction | null>(null);
  const [currentResult, setCurrentResult] = useState<AIResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pdfText, setPdfText] = useState<string | null>(null);
  const [pdfSections, setPdfSections] = useState<ReturnType<typeof detectSections> | null>(null);
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set());

  // Resize state
  const [panelWidth, setPanelWidth] = useState(320); // default w-80 = 320px
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startWidth: panelWidth,
    };
  }, [panelWidth]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      // Calculate new width (dragging left increases width since panel is on right)
      const delta = resizeRef.current.startX - e.clientX;
      const newWidth = Math.min(Math.max(resizeRef.current.startWidth + delta, 280), 600);
      setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Track whether auto-summarize has been triggered to prevent loops
  const hasAutoSummarizedRef = useRef(false);

  // Get existing graph for this paper
  const existingGraph = getGraphForPaper(paper.id);

  // Handle AI action - defined before effects that use it
  const handleAction = useCallback(async (action: PDFAIAction) => {
    // Check if action requires thesis context
    if (action === 'thesis-relevance' && !thesis) {
      setError('This action requires a thesis context. Please add this paper to a thesis first.');
      return;
    }

    // Check usage limits
    if (!usageTracker.canPerform(action)) {
      setError('You have used all your AI credits. Please upgrade or wait for reset.');
      return;
    }

    setIsLoading(true);
    setLoadingAction(action);
    setError(null);

    try {
      // Build prompt context
      const promptContext = {
        title: paper.title,
        authors: paper.authors.map(a => a.name).join(', '),
        abstract: paper.abstract,
        fullText: pdfText || undefined,
        sections: pdfSections ? {
          abstract: pdfSections.sections.find(s => s.type === 'abstract')?.content,
          introduction: pdfSections.sections.find(s => s.type === 'introduction')?.content,
          methods: pdfSections.sections.find(s => s.type === 'methods')?.content,
          results: pdfSections.sections.find(s => s.type === 'results')?.content,
          discussion: pdfSections.sections.find(s => s.type === 'discussion')?.content,
          conclusion: pdfSections.sections.find(s => s.type === 'conclusion')?.content,
        } : undefined,
        thesis: thesis ? {
          title: thesis.title,
          description: thesis.description,
        } : undefined,
      };

      // Build prompt
      const promptBuilder = getPromptBuilder(action);
      const prompt = promptBuilder(promptContext);

      // Get AI provider
      const provider = getAIProvider(aiSettings);

      if (!provider.isConfigured()) {
        throw new Error('AI is not configured. Please set up your API key in Settings.');
      }

      // Get recommended model tier
      const modelTier = getRecommendedModel(action);

      // Make AI request
      const result = await provider.complete(prompt, {
        systemPrompt: PDF_ASSISTANT_SYSTEM_PROMPT,
        maxTokens: 1000,
        temperature: 0.3,
      });

      // Track usage
      await usageTracker.trackAction({
        action,
        tokensInput: result.tokensUsed?.input || Math.ceil(prompt.length / 4),
        tokensOutput: result.tokensUsed?.output || Math.ceil(result.text.length / 4),
        model: modelTier,
        paperId: paper.id,
        paperTitle: paper.title,
        success: true,
      });

      // Store result
      setCurrentResult({
        id: `result-${Date.now()}`,
        action,
        content: result.text,
        timestamp: new Date().toISOString(),
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI response';
      setError(errorMessage);

      // Track failed attempt
      await usageTracker.trackAction({
        action,
        tokensInput: 0,
        tokensOutput: 0,
        model: 'unknown',
        paperId: paper.id,
        success: false,
        error: errorMessage,
      });
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  }, [paper, thesis, pdfText, pdfSections, aiSettings]);

  // Extract PDF text on mount
  useEffect(() => {
    async function extractText() {
      try {
        const pdf = await pdfStorage.getPDFByPaperId(paper.id);
        if (pdf) {
          const extraction = await extractPDFText(pdf.data);
          if (extraction.success) {
            setPdfText(extraction.fullText);
            const sections = detectSections(extraction.fullText, extraction.pages);
            setPdfSections(sections);
          }
        }
      } catch (err) {
        console.error('Failed to extract PDF text:', err);
      }
    }

    if (isOpen && !pdfText) {
      extractText();
    }
  }, [isOpen, paper.id, pdfText]);

  // Auto-summarize on first open - uses ref to prevent infinite loops
  useEffect(() => {
    // Only auto-summarize once per panel open
    if (isOpen && pdfText && !currentResult && !isLoading && !hasAutoSummarizedRef.current) {
      hasAutoSummarizedRef.current = true;
      // Small delay to let the panel animate in
      const timer = setTimeout(() => {
        setActiveTab('chat');
        handleAction('summarize');
      }, 500);
      return () => clearTimeout(timer);
    }

    // Reset the ref when panel is closed
    if (!isOpen) {
      hasAutoSummarizedRef.current = false;
    }
  }, [isOpen, pdfText, currentResult, isLoading, handleAction]);

  // Copy result to clipboard
  const handleCopy = useCallback(() => {
    if (currentResult) {
      navigator.clipboard.writeText(currentResult.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [currentResult]);

  // Handle extraction
  const handleExtraction = useCallback(async () => {
    if (!pdfText) {
      setError('Please wait for PDF to load before extracting.');
      return;
    }

    clearExtractionError();

    const result = await extractPaper({
      id: paper.id,
      title: paper.title,
      abstract: paper.abstract || null,
      authors: paper.authors.map(a => a.name),
      year: paper.year,
      journal: paper.journal || null,
      pdfText: pdfText,
    });

    // Switch to findings tab after successful extraction
    if (result) {
      setActiveTab('findings');
    }
  }, [paper, pdfText, extractPaper, clearExtractionError]);

  // Toggle finding expansion
  const toggleFinding = useCallback((findingId: string) => {
    setExpandedFindings(prev => {
      const next = new Set(prev);
      if (next.has(findingId)) {
        next.delete(findingId);
      } else {
        next.add(findingId);
      }
      return next;
    });
  }, []);

  // Get action label
  const getActionLabel = (action: PDFAIAction): string => {
    return ACTION_BUTTONS.find(b => b.action === action)?.label || action;
  };

  const usageDisplay = calculateUsageDisplay(usage);

  // Collapsed state - just show toggle button
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2 px-3 py-3 bg-stone-800 hover:bg-stone-900 text-white rounded-l-lg shadow-lg transition-all ${className}`}
        title="Open AI Assistant"
      >
        <Bot className="w-5 h-5" />
        <ChevronLeft className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div
      className={`fixed right-0 top-0 h-full bg-[#FDFBF7]/95 dark:bg-slate-900/95 backdrop-blur-sm border-l border-stone-200 dark:border-slate-700 shadow-xl z-40 flex flex-col ${className}`}
      style={{ width: panelWidth }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        className={`absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-purple-500/20 transition-colors z-50 flex items-center justify-center group ${
          isResizing ? 'bg-purple-500/30' : ''
        }`}
      >
        <GripVertical className="w-3 h-3 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-stone-700 dark:text-stone-400" />
          <h3 className="font-semibold text-stone-800 dark:text-white">AI Assistant</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggle}
            className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 rounded"
            title="Collapse"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 rounded"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Usage meter */}
      <div className="px-4 py-2 border-b border-stone-100 dark:border-slate-800">
        <UsageMeter usage={usageDisplay} variant="compact" />
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-stone-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('extraction')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'extraction'
              ? 'text-purple-700 dark:text-purple-400 border-b-2 border-purple-500 bg-purple-50/50 dark:bg-purple-900/20'
              : 'text-stone-500 dark:text-slate-400 hover:text-stone-700 dark:hover:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">Extract</span>
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'chat'
              ? 'text-stone-800 dark:text-white border-b-2 border-stone-800 dark:border-white bg-stone-50/50 dark:bg-slate-800/50'
              : 'text-stone-500 dark:text-slate-400 hover:text-stone-700 dark:hover:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Chat</span>
        </button>
        <button
          onClick={() => setActiveTab('findings')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors relative ${
            activeTab === 'findings'
              ? 'text-green-700 dark:text-green-400 border-b-2 border-green-500 bg-green-50/50 dark:bg-green-900/20'
              : 'text-stone-500 dark:text-slate-400 hover:text-stone-700 dark:hover:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <List className="w-4 h-4" />
          <span className="hidden sm:inline">Findings</span>
          {existingGraph && existingGraph.findings.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-green-500 text-white rounded-full">
              {existingGraph.findings.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Global errors */}
        {(error || extractionError) && (
          <div className="m-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>{error || extractionError}</p>
          </div>
        )}

        {/* ===== EXTRACTION TAB ===== */}
        {activeTab === 'extraction' && (
          <div className="p-4 space-y-4">
            {/* Extraction status card */}
            <div className={`p-4 rounded-lg border ${
              existingGraph
                ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                : 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                {existingGraph ? (
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                ) : (
                  <Sparkles className="w-8 h-8 text-purple-500" />
                )}
                <div>
                  <h4 className={`font-semibold ${
                    existingGraph ? 'text-green-800 dark:text-green-300' : 'text-purple-800 dark:text-purple-300'
                  }`}>
                    {existingGraph ? 'Knowledge Graph Ready' : 'Extract Knowledge Graph'}
                  </h4>
                  <p className="text-sm text-stone-600 dark:text-slate-400">
                    {existingGraph
                      ? `${existingGraph.findings.length} findings extracted`
                      : 'AI will analyze this paper to extract structured findings'}
                  </p>
                </div>
              </div>

              {/* Extraction progress */}
              {isExtracting && extractionProgress && (
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-purple-700 dark:text-purple-300">
                      Stage {extractionProgress.currentStage}/3: {extractionProgress.stageDescription}
                    </span>
                    <span className="text-purple-600 dark:text-purple-400">
                      {extractionProgress.overallProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${extractionProgress.overallProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                {isExtracting ? (
                  <button
                    onClick={cancelExtraction}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30"
                  >
                    Cancel
                  </button>
                ) : existingGraph ? (
                  // Only show "View Findings" when graph already exists (no re-extract)
                  <button
                    onClick={() => setActiveTab('findings')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    View Findings
                  </button>
                ) : (
                  // Show extract button when no graph exists
                  <button
                    onClick={handleExtraction}
                    disabled={!pdfText || usageDisplay.isExhausted}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      !pdfText || usageDisplay.isExhausted
                        ? 'bg-stone-200 dark:bg-slate-700 text-stone-400 dark:text-slate-500 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    Start Extraction
                  </button>
                )}
              </div>
            </div>

            {/* Info section */}
            <div className="text-sm text-stone-500 dark:text-slate-400 space-y-2">
              <p className="font-medium text-stone-600 dark:text-slate-300">What gets extracted:</p>
              <ul className="space-y-1 text-xs list-disc pl-4">
                <li>Central findings and key results</li>
                <li>Methodology and techniques</li>
                <li>Limitations and open questions</li>
                <li>Connections between findings</li>
                {thesis && <li>Relevance to your thesis</li>}
              </ul>
            </div>
          </div>
        )}

        {/* ===== CHAT TAB ===== */}
        {activeTab === 'chat' && (
          <div className="p-4 space-y-4">
            {/* Action buttons */}
            <div className="space-y-1.5">
              {ACTION_BUTTONS.map((btn) => {
                const isDisabled = isLoading || usageDisplay.isExhausted ||
                  (btn.action === 'thesis-relevance' && !thesis);
                const isActive = loadingAction === btn.action;

                return (
                  <button
                    key={btn.action}
                    onClick={() => handleAction(btn.action)}
                    disabled={isDisabled}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-stone-100 dark:bg-stone-800/40 text-stone-800 dark:text-stone-300'
                        : isDisabled
                        ? 'bg-stone-50 dark:bg-slate-800/50 text-stone-400 dark:text-slate-500 cursor-not-allowed'
                        : 'hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-300'
                    }`}
                    title={btn.description}
                  >
                    {isActive ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      btn.icon
                    )}
                    <span className="text-sm font-medium">{btn.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-px bg-stone-200 dark:bg-slate-700" />

            {/* Results area */}
            <div>
              {isLoading && !currentResult && (
                <div className="flex flex-col items-center justify-center py-8 text-stone-500 dark:text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3" />
                  <p className="text-sm">Analyzing paper...</p>
                </div>
              )}

              {currentResult && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-stone-500 dark:text-slate-400 uppercase tracking-wide">
                      {getActionLabel(currentResult.action)}
                    </span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-stone-500 hover:text-stone-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 rounded"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="text-sm text-stone-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {currentResult.content}
                    </div>
                  </div>
                </div>
              )}

              {!isLoading && !currentResult && (
                <div className="flex flex-col items-center justify-center py-8 text-stone-400 dark:text-slate-500">
                  <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm text-center">
                    Select an action above to get AI-powered insights
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== FINDINGS TAB ===== */}
        {activeTab === 'findings' && (
          <div className="p-4">
            {/* View mode toggle */}
            {existingGraph && existingGraph.findings.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-stone-500 dark:text-slate-400 uppercase tracking-wide">
                  {existingGraph.findings.length} Findings
                </span>
                <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-slate-800 rounded-lg">
                  <button
                    onClick={() => setFindingsViewMode('list')}
                    className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${
                      findingsViewMode === 'list'
                        ? 'bg-white dark:bg-slate-700 text-stone-800 dark:text-white shadow-sm'
                        : 'text-stone-500 dark:text-slate-400 hover:text-stone-700'
                    }`}
                  >
                    <List className="w-3 h-3" />
                    List
                  </button>
                  <button
                    onClick={() => setFindingsViewMode('graph')}
                    className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${
                      findingsViewMode === 'graph'
                        ? 'bg-white dark:bg-slate-700 text-stone-800 dark:text-white shadow-sm'
                        : 'text-stone-500 dark:text-slate-400 hover:text-stone-700'
                    }`}
                  >
                    <Network className="w-3 h-3" />
                    Graph
                  </button>
                </div>
              </div>
            )}

            {/* No findings yet */}
            {!existingGraph && (
              <div className="flex flex-col items-center justify-center py-12 text-stone-400 dark:text-slate-500">
                <Sparkles className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm text-center mb-4">
                  No findings extracted yet
                </p>
                <button
                  onClick={() => setActiveTab('extraction')}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Extract Knowledge Graph
                </button>
              </div>
            )}

            {/* List view */}
            {existingGraph && findingsViewMode === 'list' && (
              <div className="space-y-2">
                {existingGraph.findings.map((finding) => {
                  // Short labels for finding types
                  const typeLabel = {
                    'central-finding': 'Central',
                    'supporting-finding': 'Support',
                    'methodological': 'Method',
                    'limitation': 'Limit',
                    'implication': 'Implic.',
                    'open-question': 'Question',
                    'background': 'Bgnd',
                  }[finding.findingType] || finding.findingType;

                  return (
                    <div
                      key={finding.id}
                      className={`border rounded-lg overflow-hidden ${
                        finding.userVerified
                          ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20'
                          : 'border-stone-200 dark:border-slate-700'
                      }`}
                    >
                      <button
                        onClick={() => toggleFinding(finding.id)}
                        className="w-full p-3 text-left hover:bg-stone-50 dark:hover:bg-slate-800/50"
                      >
                        {/* Header row: badge + icons */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${
                            finding.findingType === 'central-finding' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                            finding.findingType === 'supporting-finding' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                            finding.findingType === 'methodological' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                            finding.findingType === 'limitation' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                            finding.findingType === 'implication' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' :
                            finding.findingType === 'open-question' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' :
                            'bg-stone-100 text-stone-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {typeLabel}
                          </span>
                          <span className="flex-1" />
                          {finding.userVerified && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                          )}
                          {expandedFindings.has(finding.id) ? (
                            <ChevronUp className="w-4 h-4 text-stone-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-stone-400" />
                          )}
                        </div>
                        {/* Title */}
                        <p className="text-sm font-medium text-stone-700 dark:text-slate-300 leading-snug">
                          {finding.title}
                        </p>
                        {/* Description preview when collapsed */}
                        {!expandedFindings.has(finding.id) && (
                          <p className="text-xs text-stone-500 dark:text-slate-400 line-clamp-2 mt-1">
                            {finding.description}
                          </p>
                        )}
                      </button>
                    {expandedFindings.has(finding.id) && (
                      <div className="px-3 pb-3 space-y-3 border-t border-stone-100 dark:border-slate-700">
                        <p className="text-sm text-stone-600 dark:text-slate-300 mt-3">
                          {finding.description}
                        </p>
                        {finding.directQuotes && finding.directQuotes.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-stone-500 dark:text-slate-400">Evidence:</span>
                            <blockquote className="mt-1 pl-3 border-l-2 border-stone-300 dark:border-slate-600 text-xs italic text-stone-600 dark:text-slate-400">
                              "{finding.directQuotes[0].text}"
                            </blockquote>
                          </div>
                        )}
                        {finding.thesisRelevance?.reasoning && (
                          <div>
                            <span className="text-xs font-medium text-stone-500 dark:text-slate-400">Thesis Relevance:</span>
                            <p className="text-xs text-stone-600 dark:text-slate-400 mt-1">
                              {finding.thesisRelevance.reasoning}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              verifyFinding(existingGraph.id, finding.id, !finding.userVerified);
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                              finding.userVerified
                                ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {finding.userVerified ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Verified
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Mark Verified
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}

            {/* Graph view */}
            {existingGraph && findingsViewMode === 'graph' && (
              <FindingsGraphView
                findings={existingGraph.findings}
                connections={existingGraph.intraPaperConnections || []}
                onFindingClick={(findingId) => {
                  // Expand the finding in list view
                  setExpandedFindings(prev => {
                    const next = new Set(prev);
                    next.add(findingId);
                    return next;
                  });
                }}
                onFindingVerify={(findingId, verified) => {
                  verifyFinding(existingGraph.id, findingId, verified);
                }}
                compact={true}
                showTooltip={true}
              />
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/50">
        <p className="text-xs text-stone-500 dark:text-slate-400 text-center">
          AI responses are suggestions. Always verify important information.
        </p>
      </div>
    </div>
  );
});
