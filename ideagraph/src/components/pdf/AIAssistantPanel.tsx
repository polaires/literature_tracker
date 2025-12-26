// AI Assistant Panel Component
// Floating panel for AI-assisted PDF reading

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  Brain,
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
} from 'lucide-react';
import { UsageMeter } from './UsageMeter';
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

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<PDFAIAction | null>(null);
  const [currentResult, setCurrentResult] = useState<AIResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pdfText, setPdfText] = useState<string | null>(null);
  const [pdfSections, setPdfSections] = useState<ReturnType<typeof detectSections> | null>(null);

  // Track whether auto-summarize has been triggered to prevent loops
  const hasAutoSummarizedRef = useRef(false);

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
        <Brain className="w-5 h-5" />
        <ChevronLeft className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className={`fixed right-0 top-0 h-full w-80 bg-[#FDFBF7]/95 dark:bg-slate-900/95 backdrop-blur-sm border-l border-stone-200 dark:border-slate-700 shadow-xl z-40 flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-stone-700 dark:text-stone-400" />
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

      {/* Action buttons */}
      <div className="p-3 space-y-1.5 border-b border-stone-100 dark:border-slate-800">
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

      {/* Result area */}
      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

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

        {!isLoading && !currentResult && !error && (
          <div className="flex flex-col items-center justify-center py-8 text-stone-400 dark:text-slate-500">
            <Brain className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm text-center">
              Select an action above to get AI-powered insights about this paper
            </p>
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
