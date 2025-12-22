// useAI Hook
// React hook for AI-powered suggestions in IdeaGraph

import { useState, useCallback, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  getSuggestionManager,
  DEFAULT_AI_SETTINGS,
  DEFAULT_TASK_MODELS,
  type AISettings,
  type ConnectionSuggestion,
  type TakeawaySuggestion,
  type ArgumentSuggestion,
  type GapSuggestion,
  type AIError,
} from '../services/ai';

// Local storage key for AI settings
const AI_SETTINGS_KEY = 'ideagraph_ai_settings';

/**
 * Load AI settings from localStorage
 */
function loadAISettings(): AISettings {
  try {
    const stored = localStorage.getItem(AI_SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle new fields
      return {
        ...DEFAULT_AI_SETTINGS,
        ...parsed,
        // Ensure taskModels is properly merged
        taskModels: {
          ...DEFAULT_TASK_MODELS,
          ...(parsed.taskModels || {}),
        },
      };
    }
  } catch (e) {
    console.warn('[useAI] Failed to load AI settings:', e);
  }
  return { ...DEFAULT_AI_SETTINGS };
}

/**
 * Save AI settings to localStorage
 */
function saveAISettings(settings: AISettings): void {
  try {
    localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('[useAI] Failed to save AI settings:', e);
  }
}

interface UseAIState {
  // Loading states
  isLoading: boolean;
  loadingType: 'connection' | 'takeaway' | 'argument' | 'gap' | null;

  // Error state
  error: AIError | Error | null;

  // Pending suggestions
  connectionSuggestions: ConnectionSuggestion[];
  takeawaySuggestion: TakeawaySuggestion | null;
  argumentSuggestions: ArgumentSuggestion[];
  gapSuggestions: GapSuggestion[];
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

  // Suggestion management
  clearSuggestions: () => void;
  dismissConnectionSuggestion: (suggestionId: string) => void;
  acceptConnectionSuggestion: (suggestion: ConnectionSuggestion) => void;
}

/**
 * React hook for AI-powered features
 */
export function useAI(): UseAIReturn {
  // AI settings state
  const [settings, setSettings] = useState<AISettings>(loadAISettings);

  // Loading and error states
  const [state, setState] = useState<UseAIState>({
    isLoading: false,
    loadingType: null,
    error: null,
    connectionSuggestions: [],
    takeawaySuggestion: null,
    argumentSuggestions: [],
    gapSuggestions: [],
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

  // Check if AI is configured
  const isConfigured = useMemo(() => {
    if (settings.provider === 'mock') return true;
    // Accept any sk- key for Claude (official sk-ant- or third-party sk-)
    if (settings.provider === 'claude' && settings.apiKey?.startsWith('sk-')) return true;
    if (settings.provider === 'openai' && settings.apiKey?.startsWith('sk-')) return true;
    if (settings.provider === 'ollama' && settings.ollamaEndpoint) return true;
    return false;
  }, [settings]);

  // Get suggestion manager
  const manager = useMemo(
    () => getSuggestionManager(settings),
    [settings]
  );

  // Update settings
  const updateSettings = useCallback((updates: Partial<AISettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      saveAISettings(newSettings);
      return newSettings;
    });
  }, []);

  // Suggest connections for a paper
  const suggestConnections = useCallback(async (targetPaperId: string) => {
    if (!activeThesis) {
      throw new Error('No active thesis');
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
  }, [activeThesis, thesisPapers, thesisConnections, annotations, manager]);

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

  // Clear all suggestions
  const clearSuggestions = useCallback(() => {
    setState(prev => ({
      ...prev,
      connectionSuggestions: [],
      takeawaySuggestion: null,
      argumentSuggestions: [],
      gapSuggestions: [],
      error: null,
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

    // Suggestion management
    clearSuggestions,
    dismissConnectionSuggestion,
    acceptConnectionSuggestion,
  };
}

export type { UseAIReturn };
