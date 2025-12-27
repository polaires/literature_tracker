// Help Content Area Component
import {
  Rocket,
  FilePlus,
  Network,
  ClipboardCheck,
  Sparkles,
  BookOpen,
  Download,
} from 'lucide-react';
import type { HelpSection, HelpStep } from './helpData';
import { TutorialStep } from './TutorialStep';

// Icon mapping
const SECTION_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Rocket,
  FilePlus,
  Network,
  ClipboardCheck,
  Sparkles,
  BookOpen,
  Download,
};

interface HelpContentProps {
  section: HelpSection;
  activeStep: string | null;
  onStepChange: (stepId: string) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  hasPrev: boolean;
  hasNext: boolean;
  totalStepsGlobal: number;
  currentStepGlobal: number;
}

export function HelpContent({
  section,
  activeStep,
  onStepChange,
  onNavigate,
  hasPrev,
  hasNext,
  totalStepsGlobal,
  currentStepGlobal,
}: HelpContentProps) {
  const Icon = SECTION_ICONS[section.icon] || Rocket;

  // If no step is active, show section overview
  if (!activeStep) {
    return (
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-stone-100 dark:bg-gray-700 rounded-xl">
            <Icon size={28} className="text-stone-600 dark:text-gray-300" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-stone-800 dark:text-white">
              {section.title}
            </h2>
            <p className="text-stone-500 dark:text-gray-400">{section.description}</p>
          </div>
        </div>

        {/* Steps Overview */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-stone-500 dark:text-gray-400 uppercase tracking-wider">
            In this section
          </h3>
          <div className="grid gap-3">
            {section.steps.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => onStepChange(step.id)}
                className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 rounded-xl hover:border-stone-300 dark:hover:border-gray-600 transition-colors text-left group"
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-stone-100 dark:bg-gray-700 text-sm font-semibold text-stone-500 dark:text-gray-400 group-hover:bg-stone-200 dark:group-hover:bg-gray-600 transition-colors">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="font-medium text-stone-800 dark:text-white group-hover:text-stone-900 dark:group-hover:text-white">
                    {step.title}
                  </h4>
                  <p className="text-sm text-stone-500 dark:text-gray-400 line-clamp-2 mt-1">
                    {step.content.split('\n')[0].substring(0, 100)}...
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Find the active step
  const stepIndex = section.steps.findIndex((s) => s.id === activeStep);
  const step = section.steps[stepIndex];

  if (!step) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-500 dark:text-gray-400">Step not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-gray-400 mb-6">
        <button
          onClick={() => onStepChange('')}
          className="hover:text-stone-700 dark:hover:text-gray-200 transition-colors"
        >
          {section.title}
        </button>
        <span>/</span>
        <span className="text-stone-700 dark:text-gray-300">{step.title}</span>
      </div>

      {/* Step Content */}
      <TutorialStep
        step={step}
        stepNumber={currentStepGlobal}
        totalSteps={totalStepsGlobal}
        onNavigate={onNavigate}
        hasPrev={hasPrev}
        hasNext={hasNext}
      />
    </div>
  );
}
