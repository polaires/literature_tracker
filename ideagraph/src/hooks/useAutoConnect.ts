// useAutoConnect Hook
// React hook for automatic connection suggestions when papers are added

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAI } from './useAI';
import { getAutoConnectService } from '../services/ai/autoConnect';
import type { ConnectionSuggestion } from '../services/ai';

interface PendingSuggestions {
  paperId: string;
  paperTitle: string;
  suggestions: ConnectionSuggestion[];
  timestamp: string;
}

interface UseAutoConnectState {
  isEnabled: boolean;
  pendingSuggestions: PendingSuggestions[];
  queueStatus: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
}

interface UseAutoConnectReturn extends UseAutoConnectState {
  // Actions
  enable: () => void;
  disable: () => void;
  dismissSuggestions: (paperId: string) => void;
  acceptConnection: (paperId: string, suggestion: ConnectionSuggestion) => void;
  dismissConnection: (paperId: string, suggestionId: string) => void;
  clearAllSuggestions: () => void;
}

/**
 * React hook for automatic connection suggestions
 */
export function useAutoConnect(): UseAutoConnectReturn {
  const { settings: aiSettings, isConfigured } = useAI();

  // Store selectors
  const activeThesisId = useAppStore(s => s.activeThesisId);
  const theses = useAppStore(s => s.theses);
  const papers = useAppStore(s => s.papers);
  const connections = useAppStore(s => s.connections);
  const createConnection = useAppStore(s => s.createConnection);

  // Local state
  const [isEnabled, setIsEnabled] = useState(true);
  const [pendingSuggestions, setPendingSuggestions] = useState<PendingSuggestions[]>([]);
  const [queueStatus, setQueueStatus] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  });

  // Track papers we've already queued
  const queuedPaperIds = useRef<Set<string>>(new Set());

  // Get current thesis
  const activeThesis = theses.find(t => t.id === activeThesisId);
  const thesisPapers = papers.filter(p => p.thesisId === activeThesisId);
  const thesisConnections = connections.filter(c => c.thesisId === activeThesisId);

  // Setup service callback
  useEffect(() => {
    if (!isConfigured || !isEnabled) return;

    const service = getAutoConnectService();

    service.onSuggestions((paperId, suggestions) => {
      const paper = papers.find(p => p.id === paperId);
      if (!paper) return;

      setPendingSuggestions(prev => {
        // Remove any existing for this paper
        const filtered = prev.filter(p => p.paperId !== paperId);
        return [
          ...filtered,
          {
            paperId,
            paperTitle: paper.title,
            suggestions,
            timestamp: new Date().toISOString(),
          },
        ];
      });
    });

    // Update queue status periodically
    const interval = setInterval(() => {
      setQueueStatus(service.getQueueStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, [isConfigured, isEnabled, papers]);

  // Watch for new papers and queue them
  useEffect(() => {
    if (!isEnabled || !isConfigured || !activeThesis) return;

    const service = getAutoConnectService();

    // Find papers not yet queued
    for (const paper of thesisPapers) {
      if (!queuedPaperIds.current.has(paper.id)) {
        // Check if paper was added recently (within last 30 seconds)
        const addedAt = new Date(paper.addedAt).getTime();
        const now = Date.now();
        const isRecent = now - addedAt < 30000;

        if (isRecent) {
          service.queuePaper({
            paper,
            thesis: activeThesis,
            allPapers: thesisPapers,
            connections: thesisConnections,
            aiSettings,
          });
        }

        // Mark as queued regardless (to avoid re-queuing old papers)
        queuedPaperIds.current.add(paper.id);
      }
    }
  }, [thesisPapers, activeThesis, isEnabled, isConfigured, aiSettings, thesisConnections]);

  // Enable auto-connect
  const enable = useCallback(() => {
    setIsEnabled(true);
    const service = getAutoConnectService();
    service.configure({ enabled: true });
  }, []);

  // Disable auto-connect
  const disable = useCallback(() => {
    setIsEnabled(false);
    const service = getAutoConnectService();
    service.configure({ enabled: false });
  }, []);

  // Dismiss all suggestions for a paper
  const dismissSuggestions = useCallback((paperId: string) => {
    setPendingSuggestions(prev => prev.filter(p => p.paperId !== paperId));
  }, []);

  // Accept a connection suggestion
  const acceptConnection = useCallback(
    (paperId: string, suggestion: ConnectionSuggestion) => {
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

      // Remove this suggestion from pending
      setPendingSuggestions(prev =>
        prev.map(p => {
          if (p.paperId !== paperId) return p;
          return {
            ...p,
            suggestions: p.suggestions.filter(s => s.id !== suggestion.id),
          };
        }).filter(p => p.suggestions.length > 0)
      );
    },
    [activeThesisId, createConnection]
  );

  // Dismiss a single connection suggestion
  const dismissConnection = useCallback(
    (paperId: string, suggestionId: string) => {
      setPendingSuggestions(prev =>
        prev.map(p => {
          if (p.paperId !== paperId) return p;
          return {
            ...p,
            suggestions: p.suggestions.filter(s => s.id !== suggestionId),
          };
        }).filter(p => p.suggestions.length > 0)
      );
    },
    []
  );

  // Clear all pending suggestions
  const clearAllSuggestions = useCallback(() => {
    setPendingSuggestions([]);
    getAutoConnectService().clearQueue();
  }, []);

  return {
    isEnabled,
    pendingSuggestions,
    queueStatus,
    enable,
    disable,
    dismissSuggestions,
    acceptConnection,
    dismissConnection,
    clearAllSuggestions,
  };
}

export type { PendingSuggestions };
