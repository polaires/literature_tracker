// useDiscovery Hook
// React hook for AI-powered thesis-aware paper discovery

import { useState, useCallback, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAI } from './useAI';
import {
  getDiscoveryService,
  type DiscoveryResult,
  type SearchStrategy,
} from '../services/discovery';

interface UseDiscoveryState {
  // Loading states
  isDiscovering: boolean;
  progress: number;
  progressMessage: string;

  // Results
  strategies: SearchStrategy[];
  results: DiscoveryResult[];

  // Error
  error: Error | null;
}

interface UseDiscoveryReturn extends UseDiscoveryState {
  // Actions
  discoverPapers: (seedPaperId?: string) => Promise<DiscoveryResult[]>;
  discoverFromPaper: (paperId: string) => Promise<DiscoveryResult[]>;
  generateStrategies: () => Promise<SearchStrategy[]>;

  // State management
  clearResults: () => void;

  // Helpers
  isAvailable: boolean;
}

/**
 * React hook for thesis-aware paper discovery
 */
export function useDiscovery(): UseDiscoveryReturn {
  const { settings } = useAI();

  // Get store data
  const activeThesisId = useAppStore(s => s.activeThesisId);
  const theses = useAppStore(s => s.theses);
  const papers = useAppStore(s => s.papers);

  // Local state
  const [state, setState] = useState<UseDiscoveryState>({
    isDiscovering: false,
    progress: 0,
    progressMessage: '',
    strategies: [],
    results: [],
    error: null,
  });

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

  // Get discovery service
  const service = useMemo(
    () => getDiscoveryService(settings),
    [settings]
  );

  // Check if discovery is available
  const isAvailable = useMemo(() => {
    return !!activeThesis && settings.provider !== 'mock';
  }, [activeThesis, settings.provider]);

  // Progress handler
  const handleProgress = useCallback((message: string, progress: number) => {
    setState(prev => ({
      ...prev,
      progress,
      progressMessage: message,
    }));
  }, []);

  // Generate search strategies
  const generateStrategies = useCallback(async () => {
    if (!activeThesis) {
      throw new Error('No active thesis');
    }

    setState(prev => ({
      ...prev,
      isDiscovering: true,
      progress: 0,
      progressMessage: 'Generating search strategies...',
      error: null,
    }));

    try {
      const strategies = await service.generateSearchStrategies({
        thesis: activeThesis,
        papers: thesisPapers,
      });

      setState(prev => ({
        ...prev,
        isDiscovering: false,
        progress: 1,
        progressMessage: 'Complete',
        strategies,
      }));

      return strategies;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isDiscovering: false,
        error: error as Error,
      }));
      throw error;
    }
  }, [activeThesis, thesisPapers, service]);

  // Full discovery pipeline
  const discoverPapers = useCallback(async (seedPaperId?: string) => {
    if (!activeThesis) {
      throw new Error('No active thesis');
    }

    setState(prev => ({
      ...prev,
      isDiscovering: true,
      progress: 0,
      progressMessage: 'Starting discovery...',
      error: null,
      results: [],
    }));

    try {
      const results = await service.discoverPapers({
        thesis: activeThesis,
        papers: thesisPapers,
        seedPaperId,
        maxResults: 30,
        onProgress: handleProgress,
      });

      setState(prev => ({
        ...prev,
        isDiscovering: false,
        progress: 1,
        progressMessage: 'Complete',
        results,
      }));

      return results;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isDiscovering: false,
        error: error as Error,
      }));
      throw error;
    }
  }, [activeThesis, thesisPapers, service, handleProgress]);

  // Quick discovery from a specific paper
  const discoverFromPaper = useCallback(async (paperId: string) => {
    if (!activeThesis) {
      throw new Error('No active thesis');
    }

    setState(prev => ({
      ...prev,
      isDiscovering: true,
      progress: 0,
      progressMessage: 'Finding similar papers...',
      error: null,
    }));

    try {
      const results = await service.discoverFromPaper({
        thesis: activeThesis,
        existingPapers: thesisPapers,
        seedPaperId: paperId,
        maxResults: 15,
      });

      setState(prev => ({
        ...prev,
        isDiscovering: false,
        progress: 1,
        progressMessage: 'Complete',
        results,
      }));

      return results;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isDiscovering: false,
        error: error as Error,
      }));
      throw error;
    }
  }, [activeThesis, thesisPapers, service]);

  // Clear results
  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      results: [],
      strategies: [],
      error: null,
    }));
  }, []);

  return {
    ...state,
    discoverPapers,
    discoverFromPaper,
    generateStrategies,
    clearResults,
    isAvailable,
  };
}

export type { DiscoveryResult, SearchStrategy };
