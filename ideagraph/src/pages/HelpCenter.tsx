// Help Center Page
import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Menu, X } from 'lucide-react';
import {
  HelpSidebar,
  HelpContent,
  HELP_SECTIONS,
  getAllSteps,
  findSection,
  getAdjacentStep,
  searchContent,
} from '../components/help';

export function HelpCenter() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get active section/step from URL
  const activeSection = searchParams.get('section') || HELP_SECTIONS[0].id;
  const activeStep = searchParams.get('step') || null;

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter sections based on search
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return HELP_SECTIONS;

    const results = searchContent(searchQuery);
    const sectionIds = new Set(results.map((r) => r.section.id));

    return HELP_SECTIONS.filter((s) => sectionIds.has(s.id)).map((section) => ({
      ...section,
      steps: section.steps.filter((step) =>
        results.some((r) => r.section.id === section.id && r.step.id === step.id)
      ),
    }));
  }, [searchQuery]);

  // Get current section
  const currentSection = findSection(activeSection) || HELP_SECTIONS[0];

  // Calculate global step position
  const allSteps = getAllSteps();
  const currentStepIndex = activeStep
    ? allSteps.findIndex(
        (s) => s.section.id === activeSection && s.step.id === activeStep
      )
    : -1;

  // Navigation
  const handleSectionClick = (sectionId: string) => {
    setSearchParams({ section: sectionId });
    setIsMobileMenuOpen(false);
  };

  const handleStepClick = (sectionId: string, stepId: string) => {
    if (stepId) {
      setSearchParams({ section: sectionId, step: stepId });
    } else {
      setSearchParams({ section: sectionId });
    }
    setIsMobileMenuOpen(false);
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!activeStep) {
      // If on section overview, go to first step
      if (direction === 'next' && currentSection.steps.length > 0) {
        handleStepClick(activeSection, currentSection.steps[0].id);
      }
      return;
    }

    const adjacent = getAdjacentStep(activeSection, activeStep, direction);
    if (adjacent) {
      handleStepClick(adjacent.section.id, adjacent.step.id);
    }
  };

  // Check if prev/next available
  const hasPrev = currentStepIndex > 0;
  const hasNext = currentStepIndex < allSteps.length - 1;

  // Close mobile menu on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-stone-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center px-4 gap-4 flex-shrink-0">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-stone-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Go back"
        >
          <ArrowLeft size={20} className="text-stone-600 dark:text-gray-300" />
        </button>

        {/* Logo & Title */}
        <div className="flex items-center gap-2">
          <HelpCircle size={24} className="text-stone-600 dark:text-gray-300" />
          <h1 className="text-lg font-semibold text-stone-800 dark:text-white">
            Help Center
          </h1>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 hover:bg-stone-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? (
            <X size={20} className="text-stone-600 dark:text-gray-300" />
          ) : (
            <Menu size={20} className="text-stone-600 dark:text-gray-300" />
          )}
        </button>

        {/* Home Link */}
        <button
          onClick={() => navigate('/')}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-stone-600 dark:text-gray-300 hover:text-stone-800 dark:hover:text-white transition-colors"
        >
          Back to IdeaGraph
        </button>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <HelpSidebar
            sections={filteredSections}
            activeSection={activeSection}
            activeStep={activeStep}
            onSectionClick={handleSectionClick}
            onStepClick={handleStepClick}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-72 z-50 md:hidden">
              <HelpSidebar
                sections={filteredSections}
                activeSection={activeSection}
                activeStep={activeStep}
                onSectionClick={handleSectionClick}
                onStepClick={handleStepClick}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
          </>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <HelpContent
            section={currentSection}
            activeStep={activeStep}
            onStepChange={(stepId) => handleStepClick(activeSection, stepId)}
            onNavigate={handleNavigate}
            hasPrev={hasPrev}
            hasNext={hasNext}
            totalStepsGlobal={allSteps.length}
            currentStepGlobal={currentStepIndex + 1}
          />
        </main>
      </div>
    </div>
  );
}
