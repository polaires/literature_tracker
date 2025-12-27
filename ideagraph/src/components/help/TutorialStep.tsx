// Tutorial Step Component
import { Lightbulb, Keyboard, ChevronLeft, ChevronRight } from 'lucide-react';
import type { HelpStep } from './helpData';

interface TutorialStepProps {
  step: HelpStep;
  stepNumber: number;
  totalSteps: number;
  onNavigate: (direction: 'prev' | 'next') => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export function TutorialStep({
  step,
  stepNumber,
  totalSteps,
  onNavigate,
  hasPrev,
  hasNext,
}: TutorialStepProps) {
  // Convert markdown-like content to rendered HTML
  const renderContent = (content: string) => {
    // Split by double newlines for paragraphs
    const paragraphs = content.split('\n\n');

    return paragraphs.map((paragraph, idx) => {
      // Handle headers
      if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
        const text = paragraph.slice(2, -2);
        return (
          <h4
            key={idx}
            className="font-semibold text-stone-800 dark:text-white mt-4 mb-2"
          >
            {text}
          </h4>
        );
      }

      // Handle lists
      if (paragraph.includes('\n-') || paragraph.startsWith('-')) {
        const lines = paragraph.split('\n');
        const listItems = lines.filter((line) => line.trim().startsWith('-'));
        const header = lines.find((line) => !line.trim().startsWith('-'));

        return (
          <div key={idx} className="mb-3">
            {header && (
              <p
                className="text-stone-700 dark:text-gray-300 mb-2"
                dangerouslySetInnerHTML={{ __html: formatInlineStyles(header) }}
              />
            )}
            <ul className="list-disc list-inside space-y-1 text-stone-600 dark:text-gray-400">
              {listItems.map((item, i) => (
                <li
                  key={i}
                  dangerouslySetInnerHTML={{
                    __html: formatInlineStyles(item.replace(/^-\s*/, '')),
                  }}
                />
              ))}
            </ul>
          </div>
        );
      }

      // Handle numbered lists
      if (/^\d+\./.test(paragraph.trim())) {
        const lines = paragraph.split('\n').filter((l) => l.trim());
        return (
          <ol
            key={idx}
            className="list-decimal list-inside space-y-1 text-stone-600 dark:text-gray-400 mb-3"
          >
            {lines.map((item, i) => (
              <li
                key={i}
                dangerouslySetInnerHTML={{
                  __html: formatInlineStyles(item.replace(/^\d+\.\s*/, '')),
                }}
              />
            ))}
          </ol>
        );
      }

      // Regular paragraph
      return (
        <p
          key={idx}
          className="text-stone-600 dark:text-gray-400 mb-3 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatInlineStyles(paragraph) }}
        />
      );
    });
  };

  // Format inline styles like **bold** and *italic*
  const formatInlineStyles = (text: string): string => {
    return text
      .replace(
        /\*\*([^*]+)\*\*/g,
        '<strong class="font-semibold text-stone-800 dark:text-white">$1</strong>'
      )
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(
        /`([^`]+)`/g,
        '<code class="px-1.5 py-0.5 bg-stone-100 dark:bg-gray-700 rounded text-sm font-mono">$1</code>'
      );
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-stone-100 dark:bg-gray-700 text-sm font-semibold text-stone-600 dark:text-gray-300">
            {stepNumber}
          </span>
          <h3 className="text-xl font-semibold text-stone-800 dark:text-white">
            {step.title}
          </h3>
        </div>
        <span className="text-sm text-stone-400 dark:text-gray-500">
          Step {stepNumber} of {totalSteps}
        </span>
      </div>

      {/* Content */}
      <div className="prose prose-stone dark:prose-invert max-w-none">
        {renderContent(step.content)}
      </div>

      {/* Tips */}
      {step.tips && step.tips.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={16} className="text-amber-600 dark:text-amber-400" />
            <span className="font-medium text-amber-800 dark:text-amber-300 text-sm">
              Pro Tips
            </span>
          </div>
          <ul className="space-y-1.5">
            {step.tips.map((tip, idx) => (
              <li
                key={idx}
                className="text-sm text-amber-700 dark:text-amber-300/80 flex items-start gap-2"
              >
                <span className="text-amber-400 mt-1">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Keyboard Shortcuts */}
      {step.shortcuts && step.shortcuts.length > 0 && (
        <div className="bg-stone-50 dark:bg-gray-700/50 border border-stone-200 dark:border-gray-600 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Keyboard size={16} className="text-stone-500 dark:text-gray-400" />
            <span className="font-medium text-stone-700 dark:text-gray-300 text-sm">
              Keyboard Shortcuts
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {step.shortcuts.map((shortcut, idx) => (
              <kbd
                key={idx}
                className="px-2 py-1 bg-white dark:bg-gray-800 border border-stone-300 dark:border-gray-600 rounded text-sm font-mono text-stone-600 dark:text-gray-300 shadow-sm"
              >
                {shortcut}
              </kbd>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-gray-700">
        <button
          onClick={() => onNavigate('prev')}
          disabled={!hasPrev}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            hasPrev
              ? 'text-stone-600 dark:text-gray-300 hover:bg-stone-100 dark:hover:bg-gray-700'
              : 'text-stone-300 dark:text-gray-600 cursor-not-allowed'
          }`}
        >
          <ChevronLeft size={18} />
          <span>Previous</span>
        </button>

        <button
          onClick={() => onNavigate('next')}
          disabled={!hasNext}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            hasNext
              ? 'bg-stone-800 dark:bg-stone-600 text-white hover:bg-stone-700 dark:hover:bg-stone-500'
              : 'bg-stone-200 dark:bg-gray-700 text-stone-400 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>Next Step</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
