// useAI Hook
// React hook for AI-powered suggestions in IdeaGraph
// AI settings are now managed in the Zustand store for centralization and persistence

import { useState, useCallback, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  getSuggestionManager,
  type AISettings,
  type ConnectionSuggestion,
  type TakeawaySuggestion,
  type ArgumentSuggestion,
  type GapSuggestion,
  type AIError,
  type PaperIntakeAnalysis,
  getRelevanceLabel,
} from '../services/ai';

interface UseAIState {
  // Loading states
  isLoading: boolean;
  loadingType: 'connection' | 'takeaway' | 'argument' | 'gap' | 'intake' | null;

  // Error state
  error: AIError | Error | null;

  // Pending suggestions
  connectionSuggestions: ConnectionSuggestion[];
  takeawaySuggestion: TakeawaySuggestion | null;
  argumentSuggestions: ArgumentSuggestion[];
  gapSuggestions: GapSuggestion[];
  intakeAnalysis: PaperIntakeAnalysis | null;
}

interface UseAIReturn extends UseAIState {
  // Settings
  settings: AISettings;
  updateSettings: (updates: Partial<AISettings>) => void;
  isConfigured: boolean;

  // Actions
  suggestConnections: (targetPaperId: string) => Promise<ConnectionSuggestion[]>;
  suggestTakeaway: (paperData: {
    title: string;
    abstract?: string | null;
    authors?: { name: string }[];
    year?: number | null;
  }) => Promise<TakeawaySuggestion>;
  extractArguments: (paperId: string) => Promise<ArgumentSuggestion[]>;
  analyzeGaps: () => Promise<GapSuggestion[]>;
  testConnection: () => Promise<boolean>;

  // Unified paper intake (role + takeaway + arguments + relevance)
  analyzePaperForIntake: (paperData: {
    id?: string;
    title: string;
    abstract: string | null;
    authors?: { name: string }[];
    year?: number | null;
    journal?: string | null;
    tldr?: string | null;
  }) => Promise<PaperIntakeAnalysis>;

  // Helper for relevance score display
  getRelevanceLabel: typeof getRelevanceLabel;

  // Suggestion management
  clearSuggestions: () => void;
  clearIntakeAnalysis: () => void;
  dismissConnectionSuggestion: (suggestionId: string) => void;
  acceptConnectionSuggestion: (suggestion: ConnectionSuggestion) => void;
}

/**
 * React hook for AI-powered features
 * AI settings are now stored in Zustand for centralization and automatic persistence
 */
export function useAI(): UseAIReturn {
  // AI settings from Zustand store (centralized)
  const settings = useAppStore(s => s.aiSettings);
  const updateAISettings = useAppStore(s => s.updateAISettings);
  const isAIConfigured = useAppStore(s => s.isAIConfigured);

  // Loading and error states
  const [state, setState] = useState<UseAIState>({
    isLoading: false,
    loadingType: null,
    error: null,
    connectionSuggestions: [],
    takeawaySuggestion: null,
    argumentSuggestions: [],
    gapSuggestions: [],
    intakeAnalysis: null,
  });

  // Get store data
  const activeThesisId = useAppStore(s => s.activeThesisId);
  const theses = useAppStore(s => s.theses);
  const papers = useAppStore(s => s.papers);
  const connections = useAppStore(s => s.connections);
  const annotations = useAppStore(s => s.annotations);
  const createConnection = useAppStore(s => s.createConnection);

  // Get active thesis
  const activeThesis = useMemo(
    () => theses.find(t => t.id === activeThesisId),
    [theses, activeThesisId]
  );

  // Get papers for active thesis
  const thesisPapers = useMemo(
    () => papers.filter(p => p.thesisId === activeThesisId),
    [papers, activeThesisId]
  );

  // Get connections for active thesis
  const thesisConnections = useMemo(
    () => connections.filter(c => c.thesisId === activeThesisId),
    [connections, activeThesisId]
  );

  // Check if AI is configured (use store method)
  const isConfigured = isAIConfigured();

  // Get suggestion manager
  const manager = useMemo(
    () => getSuggestionManager(settings),
    [settings]
  );

  // Update settings (delegates to store)
  const updateSettings = useCallback((updates: Partial<AISettings>) => {
    updateAISettings(updates);
  }, [updateAISettings]);

  // Suggest connections for a paper
  const suggestConnections = useCallback(async (targetPaperId: string) => {
    if (!activeThesis) {
      throw new Error('No active thesis. Please ensure the thesis is selected.');
    }

    // Check that the target paper exists in thesis papers
    const targetPaper = thesisPapers.find(p => p.id === targetPaperId);
    if (!targetPaper) {
      // Try to find in all papers and use that thesis
      const paperInAllPapers = papers.find(p => p.id === targetPaperId);
      if (paperInAllPapers) {
        throw new Error(`Paper found but not in active thesis. Active thesis ID: ${activeThesisId}, Paper thesis ID: ${paperInAllPapers.thesisId}`);
      }
      throw new Error(`Target paper not found: ${targetPaperId}`);
    }

    if (thesisPapers.length < 2) {
      throw new Error('Need at least 2 papers in the thesis to suggest connections');
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      loadingType: 'connection',
      error: null,
    }));

    try {
      const paperAnnotations = annotations.filter(a => a.paperId === targetPaperId);

      const suggestions = await manager.suggestConnectionsForPaper({
        thesis: activeThesis,
        papers: thesisPapers,
        connections: thesisConnections,
        targetPaperId,
        annotations: paperAnnotations,
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        loadingType: null,
        connectionSuggestions: suggestions,
      }));

      return suggestions;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        loadingType: null,
        error: error as Error,
      }));
      throw error;
    }
  }, [activeThesis, activeThesisId, papers, thesisPapers, thesisConnections, annotations, manager]);

  // Suggest takeaway for a paper
  const suggestTakeaway = useCallback(async (paperData: {
    title: string;
    abstract?: string | null;
    authors?: { name: string }[];
    year?: number | null;
  }) => {
    if (!activeThesis) {
      throw new Error('No active thesis');
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      loadingType: 'takeaway',
      error: null,
    }));

    try {
      const suggestion = await manager.suggestTakeaway({
        thesis: activeThesis,
        papers: thesisPapers,
        targetPaper: paperData,
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        loadingType: null,
        takeawaySuggestion: suggestion,
      }));

      return suggestion;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        loadingType: null,
        error: error as Error,
      }));
      throw error;
    }
  }, [activeThesis, thesisPapers, manager]);

  // Extract arguments from a paper
  const extractArguments = useCallback(async (paperId: string) => {
    if (!activeThesis) {
      throw new Error('No active thesis');
    }

    const paper = thesisPapers.find(p => p.id === paperId);
    if (!paper) {
      throw new Error('Paper not found');
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      loadingType: 'argument',
      error: null,
    }));

    try {
      const paperAnnotations = annotations.filter(a => a.paperId === paperId);

      const suggestions = await manager.extractArguments({
        thesis: activeThesis,
        paper,
        annotations: paperAnnotations,
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        loadingType: null,
        argumentSuggestions: suggestions,
      }));

      return suggestions;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        loadingType: null,
        error: error as Error,
      }));
      throw error;
    }
  }, [activeThesis, thesisPapers, annotations, manager]);

  // Analyze gaps in the literature
  const analyzeGaps = useCallback(async () => {
    if (!activeThesis) {
      throw new Error('No active thesis');
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      loadingType: 'gap',
      error: null,
    }));

    try {
      const suggestions = await manager.analyzeGaps({
        thesis: activeThesis,
        papers: thesisPapers,
        connections: thesisConnections,
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        loadingType: null,
        gapSuggestions: suggestions,
      }));

      return suggestions;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        loadingType: null,
        error: error as Error,
      }));
      throw error;
    }
  }, [activeThesis, thesisPapers, thesisConnections, manager]);

  // Test AI connection
  const testConnection = useCallback(async () => {
    return manager.testConnection();
  }, [manager]);

  // Unified paper intake analysis
  const analyzePaperForIntake = useCallback(async (paperData: {
    id?: string;
    title: string;
    abstract: string | null;
    authors?: { name: string }[];
    year?: number | null;
    journal?: string | null;
    tldr?: string | null;
  }) => {
    if (!activeThesis) {
      throw new Error('No active thesis');
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      loadingType: 'intake',
      error: null,
      intakeAnalysis: null,
    }));

    try {
      const analysis = await manager.analyzePaperForIntake({
        thesis: activeThesis,
        existingPapers: thesisPapers,
        newPaper: paperData,
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        loadingType: null,
        intakeAnalysis: analysis,
      }));

      return analysis;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        loadingType: null,
        error: error as Error,
      }));
      throw error;
    }
  }, [activeThesis, thesisPapers, manager]);

  // Clear all suggestions
  const clearSuggestions = useCallback(() => {
    setState(prev => ({
      ...prev,
      connectionSuggestions: [],
      takeawaySuggestion: null,
      argumentSuggestions: [],
      gapSuggestions: [],
      intakeAnalysis: null,
      error: null,
    }));
  }, []);

  // Clear intake analysis specifically
  const clearIntakeAnalysis = useCallback(() => {
    setState(prev => ({
      ...prev,
      intakeAnalysis: null,
    }));
  }, []);

  // Dismiss a connection suggestion
  const dismissConnectionSuggestion = useCallback((suggestionId: string) => {
    setState(prev => ({
      ...prev,
      connectionSuggestions: prev.connectionSuggestions.filter(s => s.id !== suggestionId),
    }));

    // Record feedback
    const suggestion = state.connectionSuggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      manager.recordFeedback(suggestionId, 'connection', 'dismissed', suggestion);
    }
  }, [state.connectionSuggestions, manager]);

  // Accept a connection suggestion
  const acceptConnectionSuggestion = useCallback((suggestion: ConnectionSuggestion) => {
    if (!activeThesisId) return;

    // Create the connection
    createConnection({
      thesisId: activeThesisId,
      fromPaperId: suggestion.targetPaperId,
      toPaperId: suggestion.suggestedPaperId,
      type: suggestion.connectionType,
      note: suggestion.reasoning,
      aiSuggested: true,
      aiConfidence: suggestion.confidence,
      userApproved: true,
    });

    // Remove from suggestions
    setState(prev => ({
      ...prev,
      connectionSuggestions: prev.connectionSuggestions.filter(s => s.id !== suggestion.id),
    }));

    // Record feedback
    manager.recordFeedback(suggestion.id, 'connection', 'accepted', suggestion);
  }, [activeThesisId, createConnection, manager]);

  return {
    // State
    ...state,

    // Settings
    settings,
    updateSettings,
    isConfigured,

    // Actions
    suggestConnections,
    suggestTakeaway,
    extractArguments,
    analyzeGaps,
    testConnection,

    // Unified paper intake
    analyzePaperForIntake,
    getRelevanceLabel,

    // Suggestion management
    clearSuggestions,
    clearIntakeAnalysis,
    dismissConnectionSuggestion,
    acceptConnectionSuggestion,
  };
}

export type { UseAIReturn, PaperIntakeAnalysis };
