// usePaperExtraction Hook
// React hook for extracting knowledge graphs from papers

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../contexts/AuthContext';
import {
  createPaperGraphExtractor,
  type PaperInput,
  type ThesisInput,
  type ExistingPaperInput,
  type ExtractionResult,
  type ExtractionOptions,
} from '../services/ai/paperGraphExtractor';
import type {
  PaperIdeaGraph,
  ExtractionProgress,
  ExtractedFinding,
  PaperClassification,
} from '../types/paperGraph';

// =============================================================================
// Types
// =============================================================================

interface UsePaperExtractionState {
  // Status
  isExtracting: boolean;
  currentPaperId: string | null;
  progress: ExtractionProgress | null;

  // Results
  lastResult: ExtractionResult | null;
  error: string | null;

  // Classification (available after Stage 1)
  classification: PaperClassification | null;
}

interface UsePaperExtractionReturn extends UsePaperExtractionState {
  // Core actions
  extractPaper: (
    paper: PaperInput,
    options?: Partial<ExtractionOptions>
  ) => Promise<PaperIdeaGraph | null>;
  cancelExtraction: () => void;

  // Store integration
  getGraphForPaper: (paperId: string) => PaperIdeaGraph | undefined;
  deleteGraph: (graphId: string) => void;

  // Finding management
  verifyFinding: (graphId: string, findingId: string, verified: boolean) => void;
  updateFinding: (graphId: string, findingId: string, updates: Partial<ExtractedFinding>) => void;
  deleteFinding: (graphId: string, findingId: string) => void;

  // Extraction state
  isConfigured: boolean;
  clearError: () => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function usePaperExtraction(): UsePaperExtractionReturn {
  // Auth check
  const { isAuthenticated } = useAuth();

  // Store access
  const aiSettings = useAppStore(s => s.aiSettings);
  const isAIConfigured = useAppStore(s => s.isAIConfigured);
  const activeThesisId = useAppStore(s => s.activeThesisId);
  const theses = useAppStore(s => s.theses);
  const papers = useAppStore(s => s.papers);

  // Store actions
  const createPaperGraph = useAppStore(s => s.createPaperGraph);
  const updatePaperGraph = useAppStore(s => s.updatePaperGraph);
  const deletePaperGraph = useAppStore(s => s.deletePaperGraph);
  const getPaperGraphForPaper = useAppStore(s => s.getPaperGraphForPaper);
  const verifyFindingAction = useAppStore(s => s.verifyFinding);
  const updateFindingAction = useAppStore(s => s.updateFinding);
  const deleteFindingAction = useAppStore(s => s.deleteFinding);

  // Local state
  const [state, setState] = useState<UsePaperExtractionState>({
    isExtracting: false,
    currentPaperId: null,
    progress: null,
    lastResult: null,
    error: null,
    classification: null,
  });

  // Extractor instance ref (to support cancellation)
  const extractorRef = useRef<ReturnType<typeof createPaperGraphExtractor> | null>(null);

  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Cleanup on unmount - cancel any in-flight extraction
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      // Cancel any ongoing extraction when component unmounts
      if (extractorRef.current) {
        extractorRef.current.cancel();
        extractorRef.current = null;
      }
    };
  }, []);

  // Check configuration
  const isConfigured = useMemo(() => {
    return isAuthenticated && isAIConfigured();
  }, [isAuthenticated, isAIConfigured]);

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

  // =============================================================================
  // Core Actions
  // =============================================================================

  /**
   * Extract knowledge graph from a paper
   */
  const extractPaper = useCallback(async (
    paper: PaperInput,
    options: Partial<ExtractionOptions> = {}
  ): Promise<PaperIdeaGraph | null> => {
    if (!isConfigured) {
      setState(prev => ({
        ...prev,
        error: 'AI is not configured. Please check your settings or sign in.',
      }));
      return null;
    }

    // Create extractor
    const extractor = createPaperGraphExtractor(
      aiSettings.apiKey ?? undefined,
      aiSettings.apiBaseUrl ?? undefined,
      aiSettings.customModelName ?? undefined
    );
    extractorRef.current = extractor;

    // Reset state
    setState({
      isExtracting: true,
      currentPaperId: paper.id,
      progress: null,
      lastResult: null,
      error: null,
      classification: null,
    });

    // Prepare thesis input
    const thesisInput: ThesisInput | null = activeThesis
      ? {
          id: activeThesis.id,
          title: activeThesis.title,
          description: activeThesis.description,
        }
      : null;

    // Prepare existing papers
    const existingPapers: ExistingPaperInput[] = thesisPapers
      .filter(p => p.id !== paper.id) // Exclude current paper
      .map(p => ({
        id: p.id,
        title: p.title,
        takeaway: p.takeaway || '',
        thesisRole: p.thesisRole,
        year: p.year,
      }));

    try {
      const result = await extractor.extract(
        paper,
        thesisInput,
        existingPapers,
        {
          ...options,
          onProgress: (progress) => {
            // Guard against state updates after unmount
            if (!isMountedRef.current) return;
            setState(prev => ({ ...prev, progress }));
            options.onProgress?.(progress);
          },
          onStageComplete: (stage, data) => {
            // Guard against state updates after unmount
            if (!isMountedRef.current) return;
            if (stage === 1) {
              setState(prev => ({
                ...prev,
                classification: data as PaperClassification,
              }));
            }
            options.onStageComplete?.(stage, data);
          },
        }
      );

      // Guard against state updates after unmount
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          isExtracting: false,
          lastResult: result,
          error: result.success ? null : result.error || 'Unknown error',
        }));
      }

      if (result.success && result.graph) {
        // Check if graph already exists for this paper
        const existingGraph = getPaperGraphForPaper(paper.id);

        if (existingGraph) {
          // Update existing graph
          updatePaperGraph(existingGraph.id, result.graph);
        } else {
          // Create new graph in store (we need to save the whole graph, not just create empty)
          const newGraph = createPaperGraph(paper.id);
          updatePaperGraph(newGraph.id, result.graph);
        }

        return result.graph;
      }

      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Guard against state updates after unmount
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          isExtracting: false,
          error: errorMessage,
        }));
      }
      return null;
    } finally {
      extractorRef.current = null;
    }
  }, [
    isConfigured,
    aiSettings,
    activeThesis,
    thesisPapers,
    getPaperGraphForPaper,
    createPaperGraph,
    updatePaperGraph,
  ]);

  /**
   * Cancel ongoing extraction
   */
  const cancelExtraction = useCallback(() => {
    if (extractorRef.current) {
      extractorRef.current.cancel();
      setState(prev => ({
        ...prev,
        isExtracting: false,
        error: 'Extraction cancelled',
      }));
    }
  }, []);

  // =============================================================================
  // Store Integration
  // =============================================================================

  /**
   * Get graph for a paper
   */
  const getGraphForPaper = useCallback((paperId: string) => {
    return getPaperGraphForPaper(paperId);
  }, [getPaperGraphForPaper]);

  /**
   * Delete a graph
   */
  const deleteGraph = useCallback((graphId: string) => {
    deletePaperGraph(graphId);
  }, [deletePaperGraph]);

  // =============================================================================
  // Finding Management
  // =============================================================================

  /**
   * Verify a finding
   */
  const verifyFinding = useCallback((
    graphId: string,
    findingId: string,
    verified: boolean
  ) => {
    verifyFindingAction(graphId, findingId, verified);
  }, [verifyFindingAction]);

  /**
   * Update a finding
   */
  const updateFinding = useCallback((
    graphId: string,
    findingId: string,
    updates: Partial<ExtractedFinding>
  ) => {
    updateFindingAction(graphId, findingId, updates);
  }, [updateFindingAction]);

  /**
   * Delete a finding
   */
  const deleteFinding = useCallback((
    graphId: string,
    findingId: string
  ) => {
    deleteFindingAction(graphId, findingId);
  }, [deleteFindingAction]);

  // =============================================================================
  // Utility
  // =============================================================================

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // =============================================================================
  // Return
  // =============================================================================

  return {
    // State
    ...state,

    // Core actions
    extractPaper,
    cancelExtraction,

    // Store integration
    getGraphForPaper,
    deleteGraph,

    // Finding management
    verifyFinding,
    updateFinding,
    deleteFinding,

    // Utilities
    isConfigured,
    clearError,
  };
}

export type { UsePaperExtractionReturn, PaperInput };
