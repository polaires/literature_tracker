// Help Center Sidebar Navigation
import { useState } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Rocket,
  FilePlus,
  Network,
  ClipboardCheck,
  Sparkles,
  BookOpen,
  Download,
} from 'lucide-react';
import type { HelpSection } from './helpData';

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

interface HelpSidebarProps {
  sections: HelpSection[];
  activeSection: string;
  activeStep: string | null;
  onSectionClick: (sectionId: string) => void;
  onStepClick: (sectionId: string, stepId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function HelpSidebar({
  sections,
  activeSection,
  activeStep,
  onSectionClick,
  onStepClick,
  searchQuery,
  onSearchChange,
}: HelpSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set([activeSection])
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleSectionClick = (sectionId: string) => {
    // Expand if not expanded
    if (!expandedSections.has(sectionId)) {
      setExpandedSections((prev) => new Set([...prev, sectionId]));
    }
    onSectionClick(sectionId);
  };

  return (
    <aside className="w-72 flex-shrink-0 border-r border-stone-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-stone-200 dark:border-gray-700">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search help..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 dark:bg-gray-700 border border-stone-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 dark:focus:ring-stone-400"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {sections.map((section) => {
          const Icon = SECTION_ICONS[section.icon] || Rocket;
          const isExpanded = expandedSections.has(section.id);
          const isActive = activeSection === section.id;

          return (
            <div key={section.id} className="mb-1">
              {/* Section Header */}
              <button
                onClick={() => {
                  toggleSection(section.id);
                  handleSectionClick(section.id);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-stone-100 dark:bg-gray-700 text-stone-900 dark:text-white'
                    : 'text-stone-600 dark:text-gray-300 hover:bg-stone-50 dark:hover:bg-gray-700/50'
                }`}
              >
                {isExpanded ? (
                  <ChevronDown size={16} className="flex-shrink-0 text-stone-400" />
                ) : (
                  <ChevronRight size={16} className="flex-shrink-0 text-stone-400" />
                )}
                <Icon size={16} className="flex-shrink-0" />
                <span className="text-sm font-medium truncate">{section.title}</span>
              </button>

              {/* Steps */}
              {isExpanded && (
                <div className="ml-7 mt-1 space-y-0.5">
                  {section.steps.map((step) => {
                    const isStepActive =
                      activeSection === section.id && activeStep === step.id;

                    return (
                      <button
                        key={step.id}
                        onClick={() => onStepClick(section.id, step.id)}
                        className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                          isStepActive
                            ? 'bg-stone-200 dark:bg-gray-600 text-stone-900 dark:text-white font-medium'
                            : 'text-stone-500 dark:text-gray-400 hover:text-stone-700 dark:hover:text-gray-200 hover:bg-stone-50 dark:hover:bg-gray-700/30'
                        }`}
                      >
                        {step.title}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-stone-200 dark:border-gray-700">
        <p className="text-xs text-stone-400 dark:text-gray-500">
          Need more help?{' '}
          <a
            href="https://github.com/yourusername/ideagraph/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-stone-600 dark:text-gray-400 hover:underline"
          >
            Report an issue
          </a>
        </p>
      </div>
    </aside>
  );
}
