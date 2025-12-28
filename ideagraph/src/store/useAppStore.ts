import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import type {
  Thesis,
  Paper,
  Connection,
  UserSettings,
  PDFAnnotation,
  ScreeningDecision,
  ExclusionReason,
  ReviewSection,
  SynthesisTheme,
  ResearchGap,
  EvidenceSynthesis,
  PaperCluster,
  GraphCustomization,
  PaperIdeaGraph,
  ExtractedFinding,
  ExtractionStatus,
  ReviewStatus,
  AIChatResult,
  AIChatAction,
} from '../types';
import { createEmptyChatHistory } from '../types/paperGraph';
import { CLUSTER_COLORS, DEFAULT_GRAPH_CUSTOMIZATION } from '../types';
import type { AISettings, AITaskModelAssignment, ClaudeModelId } from '../services/ai/types';
import { isUsingDefaultAPI } from '../services/ai/config';

interface AppStore {
  // Data
  theses: Thesis[];
  papers: Paper[];
  connections: Connection[];
  annotations: PDFAnnotation[];

  // Synthesis data (Phase 2.6)
  reviewSections: ReviewSection[];
  synthesisThemes: SynthesisTheme[];
  researchGaps: ResearchGap[];
  evidenceSyntheses: EvidenceSynthesis[];

  // Clustering data (Phase 4)
  clusters: PaperCluster[];

  // Paper IdeaGraph extraction data
  paperGraphs: PaperIdeaGraph[];

  // Active state
  activeThesisId: string | null;
  selectedPaperId: string | null;

  // Settings
  settings: UserSettings;

  // AI Settings (consolidated from useAI hook)
  aiSettings: AISettings;

  // Thesis actions
  createThesis: (thesis: Omit<Thesis, 'id' | 'createdAt' | 'updatedAt' | 'paperIds' | 'connectionIds'>) => Thesis;
  updateThesis: (id: string, updates: Partial<Thesis>) => void;
  deleteThesis: (id: string) => void;
  setActiveThesis: (id: string | null) => void;

  // Paper actions
  addPaper: (paper: Omit<Paper, 'id' | 'addedAt' | 'lastAccessedAt'>) => Paper;
  addPapersBatch: (papers: Omit<Paper, 'id' | 'addedAt' | 'lastAccessedAt'>[]) => Paper[];
  updatePaper: (id: string, updates: Partial<Paper>) => void;
  deletePaper: (id: string) => void;
  deletePapersBatch: (ids: string[]) => void;
  setSelectedPaper: (id: string | null) => void;

  // Screening actions (Phase 2.5)
  setScreeningDecision: (paperId: string, decision: ScreeningDecision, reason?: ExclusionReason, note?: string) => void;
  setScreeningDecisionBatch: (paperIds: string[], decision: ScreeningDecision, reason?: ExclusionReason) => void;
  getScreeningStats: (thesisId: string) => { pending: number; include: number; exclude: number; maybe: number };
  getPapersForScreening: (thesisId: string) => Paper[];

  // Connection actions
  createConnection: (connection: Omit<Connection, 'id' | 'createdAt'>) => Connection;
  deleteConnection: (id: string) => void;

  // Annotation actions
  addAnnotation: (annotation: Omit<PDFAnnotation, 'id' | 'createdAt' | 'updatedAt'>) => PDFAnnotation;
  updateAnnotation: (id: string, updates: Partial<PDFAnnotation>) => void;
  deleteAnnotation: (id: string) => void;
  getAnnotationsForPaper: (paperId: string) => PDFAnnotation[];
  linkAnnotationToArgument: (annotationId: string, argumentId: string | null) => void;
  linkAnnotationToEvidence: (annotationId: string, evidenceId: string | null) => void;

  // Utilities
  getPapersForThesis: (thesisId: string) => Paper[];
  getConnectionsForThesis: (thesisId: string) => Connection[];
  getConnectionsForPaper: (paperId: string) => Connection[];
  getPaperBySemanticScholarId: (semanticScholarId: string) => Paper | undefined;
  hasPaperWithDOI: (thesisId: string, doi: string) => boolean;

  // Settings
  updateSettings: (updates: Partial<UserSettings>) => void;
  updateGraphCustomization: (updates: Partial<GraphCustomization>) => void;

  // AI Settings actions
  updateAISettings: (updates: Partial<AISettings>) => void;
  isAIConfigured: () => boolean;

  // Import/Export
  exportData: () => string;
  importData: (json: string) => void;
  clearAllData: () => void;

  // Review Section actions (Phase 2.6)
  createSection: (section: Omit<ReviewSection, 'id' | 'createdAt'>) => ReviewSection;
  updateSection: (id: string, updates: Partial<ReviewSection>) => void;
  deleteSection: (id: string) => void;
  assignPaperToSection: (paperId: string, sectionId: string) => void;
  removePaperFromSection: (paperId: string, sectionId: string) => void;
  getSectionsForThesis: (thesisId: string) => ReviewSection[];

  // Synthesis Theme actions
  createTheme: (theme: Omit<SynthesisTheme, 'id' | 'createdAt'>) => SynthesisTheme;
  updateTheme: (id: string, updates: Partial<SynthesisTheme>) => void;
  deleteTheme: (id: string) => void;
  assignPaperToTheme: (paperId: string, themeId: string) => void;
  removePaperFromTheme: (paperId: string, themeId: string) => void;
  getThemesForThesis: (thesisId: string) => SynthesisTheme[];

  // Research Gap actions
  createGap: (gap: Omit<ResearchGap, 'id' | 'createdAt'>) => ResearchGap;
  updateGap: (id: string, updates: Partial<ResearchGap>) => void;
  deleteGap: (id: string) => void;
  getGapsForThesis: (thesisId: string) => ResearchGap[];
  detectGaps: (thesisId: string) => ResearchGap[];  // Auto-detect potential gaps

  // Evidence Synthesis actions
  createEvidenceSynthesis: (synthesis: Omit<EvidenceSynthesis, 'id' | 'createdAt'>) => EvidenceSynthesis;
  updateEvidenceSynthesis: (id: string, updates: Partial<EvidenceSynthesis>) => void;
  deleteEvidenceSynthesis: (id: string) => void;
  getEvidenceSynthesesForThesis: (thesisId: string) => EvidenceSynthesis[];

  // Synthesis Utilities
  getSynthesisMatrix: (thesisId: string) => {
    themes: SynthesisTheme[];
    papers: Paper[];
    matrix: Record<string, Record<string, boolean>>;  // themeId -> paperId -> hasContent
  };
  getArgumentClusters: (thesisId: string) => {
    claim: string;
    papers: Paper[];
    agreement: 'consensus' | 'partial' | 'conflicting';
  }[];

  // Cluster actions (Phase 4)
  createCluster: (name: string, thesisId: string, paperIds: string[]) => PaperCluster;
  updateCluster: (id: string, updates: Partial<PaperCluster>) => void;
  deleteCluster: (id: string) => void;
  toggleClusterCollapse: (id: string) => void;
  addPaperToCluster: (paperId: string, clusterId: string) => void;
  removePaperFromCluster: (paperId: string, clusterId: string) => void;
  getClustersForThesis: (thesisId: string) => PaperCluster[];
  getClusterForPaper: (paperId: string) => PaperCluster | undefined;

  // Paper IdeaGraph actions
  createPaperGraph: (paperId: string) => PaperIdeaGraph;
  updatePaperGraph: (id: string, updates: Partial<PaperIdeaGraph>) => void;
  deletePaperGraph: (id: string) => void;
  getPaperGraphForPaper: (paperId: string) => PaperIdeaGraph | undefined;
  updateExtractionStatus: (id: string, status: ExtractionStatus, error?: string) => void;
  updateReviewStatus: (id: string, status: ReviewStatus) => void;
  addFinding: (graphId: string, finding: ExtractedFinding) => void;
  updateFinding: (graphId: string, findingId: string, updates: Partial<ExtractedFinding>) => void;
  deleteFinding: (graphId: string, findingId: string) => void;
  verifyFinding: (graphId: string, findingId: string, verified: boolean) => void;

  // AI Chat History actions
  saveChatResult: (paperId: string, action: AIChatAction, result: AIChatResult) => void;
  getChatResult: (paperId: string, action: AIChatAction) => AIChatResult | null;
  clearChatHistory: (paperId: string) => void;
}

const generateId = () => crypto.randomUUID();

const defaultSettings: UserSettings = {
  defaultView: 'list',
  graphLayout: 'force',
  theme: 'system',
  autoSave: true,
  showAiSuggestions: true,
  graphCustomization: DEFAULT_GRAPH_CUSTOMIZATION,
};

// Default AI settings (moved from useAI hook for centralization)
const DEFAULT_TASK_MODELS: AITaskModelAssignment = {
  connectionSuggestions: 'claude-3-5-sonnet-20241022' as ClaudeModelId,
  takeawaySuggestions: 'claude-3-haiku-20240307' as ClaudeModelId,
  argumentExtraction: 'claude-3-haiku-20240307' as ClaudeModelId,
  gapAnalysis: 'claude-3-5-sonnet-20241022' as ClaudeModelId,
  reviewGeneration: 'claude-3-5-sonnet-20241022' as ClaudeModelId,
};

const defaultAISettings: AISettings = {
  provider: 'claude',
  apiKey: null,
  apiBaseUrl: null,
  customModelName: null,
  ollamaEndpoint: null,

  enableConnectionSuggestions: true,
  enableTakeawaySuggestions: true,
  enableArgumentExtraction: true,
  enableGapAnalysis: true,
  enableReviewGeneration: true,

  enableRetractionChecking: true,
  enableSemanticSearch: false,
  enableFeedbackLearning: true,
  enablePlanBasedGaps: false,

  autoSuggestOnPaperAdd: false,
  suggestionConfidenceThreshold: 0.6,
  maxSuggestionsPerRequest: 5,

  sendAbstractsToAI: true,
  sendHighlightsToAI: true,

  preferFastModel: false,
  defaultModel: 'claude-3-5-sonnet-20241022' as ClaudeModelId,
  taskModels: { ...DEFAULT_TASK_MODELS },
};

export const useAppStore = create<AppStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
      // Initial state
      theses: [],
      papers: [],
      connections: [],
      annotations: [],
      reviewSections: [],
      synthesisThemes: [],
      researchGaps: [],
      evidenceSyntheses: [],
      clusters: [],
      paperGraphs: [],
      activeThesisId: null,
      selectedPaperId: null,
      settings: defaultSettings,
      aiSettings: defaultAISettings,

      // Thesis actions
      createThesis: (thesisData) => {
        const now = new Date().toISOString();
        const thesis: Thesis = {
          ...thesisData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
          paperIds: [],
          connectionIds: [],
        };
        set((state) => ({ theses: [...state.theses, thesis] }));
        return thesis;
      },

      updateThesis: (id, updates) => {
        set((state) => ({
          theses: state.theses.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        }));
      },

      deleteThesis: (id) => {
        // Collect paper IDs to delete for cascade cleanup
        const paperIdsToDelete = new Set(
          get().papers.filter((p) => p.thesisId === id).map((p) => p.id)
        );

        set((state) => ({
          theses: state.theses.filter((t) => t.id !== id),
          papers: state.papers.filter((p) => p.thesisId !== id),
          connections: state.connections.filter((c) => c.thesisId !== id),
          annotations: state.annotations.filter((a) => !paperIdsToDelete.has(a.paperId)),
          paperGraphs: state.paperGraphs.filter((g) => !paperIdsToDelete.has(g.paperId)),
          clusters: state.clusters.filter((c) => c.thesisId !== id),
          reviewSections: state.reviewSections.filter((s) => s.thesisId !== id),
          synthesisThemes: state.synthesisThemes.filter((t) => t.thesisId !== id),
          researchGaps: state.researchGaps.filter((g) => g.thesisId !== id),
          evidenceSyntheses: state.evidenceSyntheses.filter((e) => e.thesisId !== id),
          activeThesisId: state.activeThesisId === id ? null : state.activeThesisId,
        }));
      },

      setActiveThesis: (id) => {
        set({ activeThesisId: id, selectedPaperId: null });
      },

      // Paper actions
      addPaper: (paperData) => {
        const now = new Date().toISOString();
        const paper: Paper = {
          ...paperData,
          id: generateId(),
          addedAt: now,
          lastAccessedAt: now,
        };
        set((state) => ({
          papers: [...state.papers, paper],
          theses: state.theses.map((t) =>
            t.id === paper.thesisId
              ? { ...t, paperIds: [...t.paperIds, paper.id], updatedAt: now }
              : t
          ),
        }));
        return paper;
      },

      addPapersBatch: (papersData) => {
        const now = new Date().toISOString();
        const newPapers: Paper[] = papersData.map((paperData) => ({
          ...paperData,
          id: generateId(),
          addedAt: now,
          lastAccessedAt: now,
        }));

        set((state) => {
          // Group papers by thesis
          const papersByThesis = new Map<string, string[]>();
          for (const paper of newPapers) {
            const existing = papersByThesis.get(paper.thesisId) || [];
            existing.push(paper.id);
            papersByThesis.set(paper.thesisId, existing);
          }

          return {
            papers: [...state.papers, ...newPapers],
            theses: state.theses.map((t) => {
              const newPaperIds = papersByThesis.get(t.id);
              if (newPaperIds) {
                return { ...t, paperIds: [...t.paperIds, ...newPaperIds], updatedAt: now };
              }
              return t;
            }),
          };
        });

        return newPapers;
      },

      updatePaper: (id, updates) => {
        set((state) => ({
          papers: state.papers.map((p) =>
            p.id === id ? { ...p, ...updates, lastAccessedAt: new Date().toISOString() } : p
          ),
        }));
      },

      deletePaper: (id) => {
        const paper = get().papers.find((p) => p.id === id);
        if (!paper) return;

        set((state) => ({
          papers: state.papers.filter((p) => p.id !== id),
          connections: state.connections.filter(
            (c) => c.fromPaperId !== id && c.toPaperId !== id
          ),
          annotations: state.annotations.filter((a) => a.paperId !== id),
          paperGraphs: state.paperGraphs.filter((g) => g.paperId !== id),
          theses: state.theses.map((t) =>
            t.id === paper.thesisId
              ? { ...t, paperIds: t.paperIds.filter((pid) => pid !== id) }
              : t
          ),
          // Also remove from clusters
          clusters: state.clusters.map((c) =>
            c.paperIds.includes(id)
              ? { ...c, paperIds: c.paperIds.filter((pid) => pid !== id) }
              : c
          ),
          selectedPaperId: state.selectedPaperId === id ? null : state.selectedPaperId,
        }));
      },

      deletePapersBatch: (ids) => {
        const idsSet = new Set(ids);
        const papersToDelete = get().papers.filter((p) => idsSet.has(p.id));
        const thesisIds = new Set(papersToDelete.map((p) => p.thesisId));

        set((state) => ({
          papers: state.papers.filter((p) => !idsSet.has(p.id)),
          connections: state.connections.filter(
            (c) => !idsSet.has(c.fromPaperId) && !idsSet.has(c.toPaperId)
          ),
          annotations: state.annotations.filter((a) => !idsSet.has(a.paperId)),
          paperGraphs: state.paperGraphs.filter((g) => !idsSet.has(g.paperId)),
          theses: state.theses.map((t) =>
            thesisIds.has(t.id)
              ? { ...t, paperIds: t.paperIds.filter((pid) => !idsSet.has(pid)) }
              : t
          ),
          // Also remove from clusters
          clusters: state.clusters.map((c) => ({
            ...c,
            paperIds: c.paperIds.filter((pid) => !idsSet.has(pid)),
          })),
          selectedPaperId: idsSet.has(state.selectedPaperId || '') ? null : state.selectedPaperId,
        }));
      },

      setSelectedPaper: (id) => {
        if (id) {
          // Update lastAccessedAt when selecting a paper
          set((state) => ({
            selectedPaperId: id,
            papers: state.papers.map((p) =>
              p.id === id ? { ...p, lastAccessedAt: new Date().toISOString() } : p
            ),
          }));
        } else {
          set({ selectedPaperId: null });
        }
      },

      // Connection actions
      createConnection: (connectionData) => {
        const connection: Connection = {
          ...connectionData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          connections: [...state.connections, connection],
          theses: state.theses.map((t) =>
            t.id === connection.thesisId
              ? { ...t, connectionIds: [...t.connectionIds, connection.id] }
              : t
          ),
        }));
        return connection;
      },

      deleteConnection: (id) => {
        const connection = get().connections.find((c) => c.id === id);
        if (!connection) return;

        set((state) => ({
          connections: state.connections.filter((c) => c.id !== id),
          theses: state.theses.map((t) =>
            t.id === connection.thesisId
              ? { ...t, connectionIds: t.connectionIds.filter((cid) => cid !== id) }
              : t
          ),
        }));
      },

      // Annotation actions
      addAnnotation: (annotationData) => {
        const now = new Date().toISOString();
        const annotation: PDFAnnotation = {
          ...annotationData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          annotations: [...state.annotations, annotation],
        }));
        return annotation;
      },

      updateAnnotation: (id, updates) => {
        set((state) => ({
          annotations: state.annotations.map((a) =>
            a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
          ),
        }));
      },

      deleteAnnotation: (id) => {
        set((state) => ({
          annotations: state.annotations.filter((a) => a.id !== id),
        }));
      },

      getAnnotationsForPaper: (paperId) => {
        return get().annotations.filter((a) => a.paperId === paperId);
      },

      linkAnnotationToArgument: (annotationId, argumentId) => {
        set((state) => ({
          annotations: state.annotations.map((a) =>
            a.id === annotationId
              ? { ...a, linkedArgumentId: argumentId || undefined, updatedAt: new Date().toISOString() }
              : a
          ),
        }));
      },

      linkAnnotationToEvidence: (annotationId, evidenceId) => {
        set((state) => ({
          annotations: state.annotations.map((a) =>
            a.id === annotationId
              ? { ...a, linkedEvidenceId: evidenceId || undefined, updatedAt: new Date().toISOString() }
              : a
          ),
        }));
      },

      // Screening actions (Phase 2.5)
      setScreeningDecision: (paperId, decision, reason, note) => {
        const now = new Date().toISOString();
        set((state) => ({
          papers: state.papers.map((p) =>
            p.id === paperId
              ? {
                  ...p,
                  screeningDecision: decision,
                  exclusionReason: decision === 'exclude' ? (reason || null) : null,
                  exclusionNote: decision === 'exclude' && reason === 'other' ? (note || null) : null,
                  screenedAt: now,
                  // Auto-update reading status based on decision
                  readingStatus: decision === 'include' ? 'to-read' : decision === 'exclude' ? 'screening' : p.readingStatus,
                  lastAccessedAt: now,
                }
              : p
          ),
        }));
      },

      setScreeningDecisionBatch: (paperIds, decision, reason) => {
        const now = new Date().toISOString();
        const idsSet = new Set(paperIds);
        set((state) => ({
          papers: state.papers.map((p) =>
            idsSet.has(p.id)
              ? {
                  ...p,
                  screeningDecision: decision,
                  exclusionReason: decision === 'exclude' ? (reason || null) : null,
                  exclusionNote: null,
                  screenedAt: now,
                  readingStatus: decision === 'include' ? 'to-read' : decision === 'exclude' ? 'screening' : p.readingStatus,
                  lastAccessedAt: now,
                }
              : p
          ),
        }));
      },

      getScreeningStats: (thesisId) => {
        const papers = get().papers.filter((p) => p.thesisId === thesisId);
        return {
          pending: papers.filter((p) => p.screeningDecision === 'pending').length,
          include: papers.filter((p) => p.screeningDecision === 'include').length,
          exclude: papers.filter((p) => p.screeningDecision === 'exclude').length,
          maybe: papers.filter((p) => p.screeningDecision === 'maybe').length,
        };
      },

      getPapersForScreening: (thesisId) => {
        return get().papers.filter(
          (p) => p.thesisId === thesisId && (p.screeningDecision === 'pending' || p.screeningDecision === 'maybe')
        );
      },

      // Utilities
      getPapersForThesis: (thesisId) => {
        return get().papers.filter((p) => p.thesisId === thesisId);
      },

      getConnectionsForThesis: (thesisId) => {
        return get().connections.filter((c) => c.thesisId === thesisId);
      },

      getConnectionsForPaper: (paperId) => {
        return get().connections.filter(
          (c) => c.fromPaperId === paperId || c.toPaperId === paperId
        );
      },

      getPaperBySemanticScholarId: (semanticScholarId) => {
        return get().papers.find((p) => p.semanticScholarId === semanticScholarId);
      },

      hasPaperWithDOI: (thesisId, doi) => {
        return get().papers.some((p) => p.thesisId === thesisId && p.doi === doi);
      },

      // Settings
      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      updateGraphCustomization: (updates) => {
        set((state) => ({
          settings: {
            ...state.settings,
            graphCustomization: {
              ...state.settings.graphCustomization,
              ...updates,
            },
          },
        }));
      },

      // AI Settings actions
      updateAISettings: (updates) => {
        set((state) => ({
          aiSettings: {
            ...state.aiSettings,
            ...updates,
            // Ensure taskModels is properly merged if provided
            taskModels: updates.taskModels
              ? { ...state.aiSettings.taskModels, ...updates.taskModels }
              : state.aiSettings.taskModels,
          },
        }));
      },

      isAIConfigured: () => {
        const { aiSettings } = get();
        if (aiSettings.provider === 'mock') return true;
        // If using default API (no user config), AI is configured
        if (isUsingDefaultAPI(aiSettings.apiKey, aiSettings.apiBaseUrl)) return true;
        if (aiSettings.provider === 'claude' && aiSettings.apiKey?.startsWith('sk-')) return true;
        if (aiSettings.provider === 'openai' && aiSettings.apiKey?.startsWith('sk-')) return true;
        if (aiSettings.provider === 'ollama' && aiSettings.ollamaEndpoint) return true;
        return false;
      },

      // Import/Export
      exportData: () => {
        const { theses, papers, connections, settings } = get();
        return JSON.stringify({ theses, papers, connections, settings }, null, 2);
      },

      importData: (json) => {
        try {
          const data = JSON.parse(json);
          set({
            theses: data.theses || [],
            papers: data.papers || [],
            connections: data.connections || [],
            settings: { ...defaultSettings, ...data.settings },
          });
        } catch (e) {
          console.error('Failed to import data:', e);
          throw new Error('Invalid JSON data');
        }
      },

      clearAllData: () => {
        set({
          theses: [],
          papers: [],
          connections: [],
          annotations: [],
          reviewSections: [],
          synthesisThemes: [],
          researchGaps: [],
          evidenceSyntheses: [],
          clusters: [],
          paperGraphs: [],
          activeThesisId: null,
          selectedPaperId: null,
          settings: defaultSettings,
          aiSettings: defaultAISettings,
        });
      },

      // Review Section actions (Phase 2.6)
      createSection: (sectionData) => {
        const section: ReviewSection = {
          ...sectionData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          reviewSections: [...state.reviewSections, section],
        }));
        return section;
      },

      updateSection: (id, updates) => {
        set((state) => ({
          reviewSections: state.reviewSections.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },

      deleteSection: (id) => {
        set((state) => ({
          reviewSections: state.reviewSections.filter((s) => s.id !== id),
        }));
      },

      assignPaperToSection: (paperId, sectionId) => {
        set((state) => ({
          reviewSections: state.reviewSections.map((s) =>
            s.id === sectionId && !s.paperIds.includes(paperId)
              ? { ...s, paperIds: [...s.paperIds, paperId] }
              : s
          ),
        }));
      },

      removePaperFromSection: (paperId, sectionId) => {
        set((state) => ({
          reviewSections: state.reviewSections.map((s) =>
            s.id === sectionId
              ? { ...s, paperIds: s.paperIds.filter((id) => id !== paperId) }
              : s
          ),
        }));
      },

      getSectionsForThesis: (thesisId) => {
        return get().reviewSections
          .filter((s) => s.thesisId === thesisId)
          .sort((a, b) => a.order - b.order);
      },

      // Synthesis Theme actions
      createTheme: (themeData) => {
        const theme: SynthesisTheme = {
          ...themeData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          synthesisThemes: [...state.synthesisThemes, theme],
        }));
        return theme;
      },

      updateTheme: (id, updates) => {
        set((state) => ({
          synthesisThemes: state.synthesisThemes.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      deleteTheme: (id) => {
        set((state) => ({
          synthesisThemes: state.synthesisThemes.filter((t) => t.id !== id),
        }));
      },

      assignPaperToTheme: (paperId, themeId) => {
        set((state) => ({
          synthesisThemes: state.synthesisThemes.map((t) =>
            t.id === themeId && !t.paperIds.includes(paperId)
              ? { ...t, paperIds: [...t.paperIds, paperId] }
              : t
          ),
        }));
      },

      removePaperFromTheme: (paperId, themeId) => {
        set((state) => ({
          synthesisThemes: state.synthesisThemes.map((t) =>
            t.id === themeId
              ? { ...t, paperIds: t.paperIds.filter((id) => id !== paperId) }
              : t
          ),
        }));
      },

      getThemesForThesis: (thesisId) => {
        return get().synthesisThemes.filter((t) => t.thesisId === thesisId);
      },

      // Research Gap actions
      createGap: (gapData) => {
        const gap: ResearchGap = {
          ...gapData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          researchGaps: [...state.researchGaps, gap],
        }));
        return gap;
      },

      updateGap: (id, updates) => {
        set((state) => ({
          researchGaps: state.researchGaps.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        }));
      },

      deleteGap: (id) => {
        set((state) => ({
          researchGaps: state.researchGaps.filter((g) => g.id !== id),
        }));
      },

      getGapsForThesis: (thesisId) => {
        return get().researchGaps.filter((g) => g.thesisId === thesisId);
      },

      detectGaps: (thesisId) => {
        const papers = get().papers.filter((p) => p.thesisId === thesisId && p.screeningDecision === 'include');
        const connections = get().connections.filter((c) => c.thesisId === thesisId);
        const existingGaps = get().researchGaps.filter((g) => g.thesisId === thesisId);
        const detectedGaps: ResearchGap[] = [];

        // Detect contradictory findings
        const contradictions = connections.filter((c) => c.type === 'contradicts');
        if (contradictions.length > 0) {
          const contradictingPaperIds = new Set<string>();
          contradictions.forEach((c) => {
            contradictingPaperIds.add(c.fromPaperId);
            contradictingPaperIds.add(c.toPaperId);
          });

          const existingContradictoryGap = existingGaps.find((g) => g.type === 'contradictory');
          if (!existingContradictoryGap) {
            detectedGaps.push({
              id: generateId(),
              thesisId,
              title: 'Conflicting findings need resolution',
              description: `${contradictions.length} contradictory relationships identified between papers. These conflicting findings suggest an opportunity for resolution through meta-analysis or new research.`,
              type: 'contradictory',
              priority: 'high',
              evidenceSource: 'inferred',
              relatedPaperIds: Array.from(contradictingPaperIds),
              futureResearchNote: null,
              createdAt: new Date().toISOString(),
            });
          }
        }

        // Detect temporal gaps (papers older than 5 years with no recent updates)
        const currentYear = new Date().getFullYear();
        const oldPapers = papers.filter((p) => p.year && p.year < currentYear - 5);
        const recentPapers = papers.filter((p) => p.year && p.year >= currentYear - 3);
        if (oldPapers.length > papers.length * 0.5 && recentPapers.length < 3) {
          const existingTemporalGap = existingGaps.find((g) => g.type === 'temporal');
          if (!existingTemporalGap) {
            detectedGaps.push({
              id: generateId(),
              thesisId,
              title: 'Limited recent research',
              description: `More than half of the papers are over 5 years old, with few recent publications. Consider searching for more current literature or note this as a gap.`,
              type: 'temporal',
              priority: 'medium',
              evidenceSource: 'inferred',
              relatedPaperIds: oldPapers.map((p) => p.id),
              futureResearchNote: null,
              createdAt: new Date().toISOString(),
            });
          }
        }

        // Detect methodological gaps
        const evidenceTypes = new Set<string>();
        papers.forEach((p) => {
          p.evidence.forEach((e) => evidenceTypes.add(e.type));
        });
        const missingTypes = ['experimental', 'computational', 'theoretical', 'meta-analysis'].filter(
          (t) => !evidenceTypes.has(t)
        );
        if (missingTypes.length >= 2 && papers.length >= 5) {
          const existingMethodGap = existingGaps.find((g) => g.type === 'methodological');
          if (!existingMethodGap) {
            detectedGaps.push({
              id: generateId(),
              thesisId,
              title: `Missing ${missingTypes.join(' and ')} evidence`,
              description: `The literature lacks ${missingTypes.join(' and ')} studies. This methodological gap could be addressed with future research.`,
              type: 'methodological',
              priority: 'medium',
              evidenceSource: 'inferred',
              relatedPaperIds: [],
              futureResearchNote: null,
              createdAt: new Date().toISOString(),
            });
          }
        }

        // Detect knowledge gaps from weak arguments
        const weakArguments = papers.flatMap((p) =>
          p.arguments.filter((a) => a.strength === 'weak').map((a) => ({ paper: p, argument: a }))
        );
        if (weakArguments.length >= 3) {
          const existingKnowledgeGap = existingGaps.find((g) => g.type === 'knowledge');
          if (!existingKnowledgeGap) {
            detectedGaps.push({
              id: generateId(),
              thesisId,
              title: 'Weak evidence for key claims',
              description: `${weakArguments.length} arguments across papers have been marked as weakly supported. These represent potential knowledge gaps requiring stronger empirical evidence.`,
              type: 'knowledge',
              priority: 'high',
              evidenceSource: 'inferred',
              relatedPaperIds: [...new Set(weakArguments.map((wa) => wa.paper.id))],
              futureResearchNote: null,
              createdAt: new Date().toISOString(),
            });
          }
        }

        return detectedGaps;
      },

      // Evidence Synthesis actions
      createEvidenceSynthesis: (synthesisData) => {
        const synthesis: EvidenceSynthesis = {
          ...synthesisData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          evidenceSyntheses: [...state.evidenceSyntheses, synthesis],
        }));
        return synthesis;
      },

      updateEvidenceSynthesis: (id, updates) => {
        set((state) => ({
          evidenceSyntheses: state.evidenceSyntheses.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },

      deleteEvidenceSynthesis: (id) => {
        set((state) => ({
          evidenceSyntheses: state.evidenceSyntheses.filter((s) => s.id !== id),
        }));
      },

      getEvidenceSynthesesForThesis: (thesisId) => {
        return get().evidenceSyntheses.filter((s) => s.thesisId === thesisId);
      },

      // Synthesis Utilities
      getSynthesisMatrix: (thesisId) => {
        const themes = get().synthesisThemes.filter((t) => t.thesisId === thesisId);
        const papers = get().papers.filter((p) => p.thesisId === thesisId && p.screeningDecision === 'include');

        const matrix: Record<string, Record<string, boolean>> = {};
        themes.forEach((theme) => {
          matrix[theme.id] = {};
          papers.forEach((paper) => {
            matrix[theme.id][paper.id] = theme.paperIds.includes(paper.id);
          });
        });

        return { themes, papers, matrix };
      },

      getArgumentClusters: (thesisId) => {
        const papers = get().papers.filter((p) => p.thesisId === thesisId && p.screeningDecision === 'include');
        // Note: connections can be used in future to enhance clustering based on paper relationships

        // Group papers by similar arguments (simplified clustering)
        const clusters: { claim: string; papers: Paper[]; agreement: 'consensus' | 'partial' | 'conflicting' }[] = [];

        // Extract all claims
        const claimsToPapers = new Map<string, { supporting: Paper[]; contradicting: Paper[] }>();

        papers.forEach((paper) => {
          paper.arguments.forEach((arg) => {
            const normalizedClaim = arg.claim.toLowerCase().trim();
            if (!claimsToPapers.has(normalizedClaim)) {
              claimsToPapers.set(normalizedClaim, { supporting: [], contradicting: [] });
            }
            if (arg.yourAssessment === 'agree' || arg.yourAssessment === null) {
              claimsToPapers.get(normalizedClaim)!.supporting.push(paper);
            } else if (arg.yourAssessment === 'disagree') {
              claimsToPapers.get(normalizedClaim)!.contradicting.push(paper);
            }
          });
        });

        // Create clusters from claims with multiple papers
        claimsToPapers.forEach((data, claim) => {
          const allPapers = [...data.supporting, ...data.contradicting];
          if (allPapers.length >= 2) {
            let agreement: 'consensus' | 'partial' | 'conflicting' = 'consensus';
            if (data.contradicting.length > 0 && data.supporting.length > 0) {
              agreement = data.contradicting.length >= data.supporting.length ? 'conflicting' : 'partial';
            } else if (data.contradicting.length > 0) {
              agreement = 'conflicting';
            }

            clusters.push({
              claim,
              papers: [...new Set(allPapers)],
              agreement,
            });
          }
        });

        // Sort by number of papers (most discussed first)
        return clusters.sort((a, b) => b.papers.length - a.papers.length);
      },

      // Cluster actions (Phase 4)
      createCluster: (name, thesisId, paperIds) => {
        const existingClusters = get().clusters.filter((c) => c.thesisId === thesisId);
        const colorIndex = existingClusters.length % CLUSTER_COLORS.length;

        const cluster: PaperCluster = {
          id: generateId(),
          thesisId,
          name,
          paperIds,
          color: CLUSTER_COLORS[colorIndex],
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          clusters: [...state.clusters, cluster],
        }));

        return cluster;
      },

      updateCluster: (id, updates) => {
        set((state) => ({
          clusters: state.clusters.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      deleteCluster: (id) => {
        set((state) => ({
          clusters: state.clusters.filter((c) => c.id !== id),
        }));
      },

      toggleClusterCollapse: (id) => {
        set((state) => ({
          clusters: state.clusters.map((c) =>
            c.id === id ? { ...c, isCollapsed: !c.isCollapsed } : c
          ),
        }));
      },

      addPaperToCluster: (paperId, clusterId) => {
        set((state) => ({
          clusters: state.clusters.map((c) =>
            c.id === clusterId && !c.paperIds.includes(paperId)
              ? { ...c, paperIds: [...c.paperIds, paperId] }
              : c
          ),
        }));
      },

      removePaperFromCluster: (paperId, clusterId) => {
        set((state) => ({
          clusters: state.clusters.map((c) =>
            c.id === clusterId
              ? { ...c, paperIds: c.paperIds.filter((id) => id !== paperId) }
              : c
          ),
        }));
      },

      getClustersForThesis: (thesisId) => {
        return get().clusters.filter((c) => c.thesisId === thesisId);
      },

      getClusterForPaper: (paperId) => {
        return get().clusters.find((c) => c.paperIds.includes(paperId));
      },

      // Paper IdeaGraph actions
      createPaperGraph: (paperId) => {
        const now = new Date().toISOString();
        const graph: PaperIdeaGraph = {
          id: generateId(),
          paperId,
          extractedAt: now,
          extractionDepth: 'standard',
          extractionStatus: 'pending',
          findings: [],
          intraPaperConnections: [],
          dataTables: [],
          paperType: 'research-article',
          keyContributions: [],
          limitations: [],
          openQuestions: [],
          potentialConnections: [],
          reviewStatus: 'unreviewed',
          tokensUsed: {
            stage1: { input: 0, output: 0 },
            stage2: { input: 0, output: 0 },
            stage3: { input: 0, output: 0 },
          },
        };
        set((state) => ({
          paperGraphs: [...state.paperGraphs, graph],
        }));
        return graph;
      },

      updatePaperGraph: (id, updates) => {
        set((state) => ({
          paperGraphs: state.paperGraphs.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        }));
      },

      deletePaperGraph: (id) => {
        set((state) => ({
          paperGraphs: state.paperGraphs.filter((g) => g.id !== id),
        }));
      },

      getPaperGraphForPaper: (paperId) => {
        return get().paperGraphs.find((g) => g.paperId === paperId);
      },

      updateExtractionStatus: (id, status, error) => {
        set((state) => ({
          paperGraphs: state.paperGraphs.map((g) =>
            g.id === id
              ? { ...g, extractionStatus: status, extractionError: error }
              : g
          ),
        }));
      },

      updateReviewStatus: (id, status) => {
        const now = new Date().toISOString();
        set((state) => ({
          paperGraphs: state.paperGraphs.map((g) =>
            g.id === id
              ? { ...g, reviewStatus: status, reviewedAt: status === 'reviewed' ? now : g.reviewedAt }
              : g
          ),
        }));
      },

      addFinding: (graphId, finding) => {
        set((state) => ({
          paperGraphs: state.paperGraphs.map((g) =>
            g.id === graphId
              ? { ...g, findings: [...g.findings, finding] }
              : g
          ),
        }));
      },

      updateFinding: (graphId, findingId, updates) => {
        set((state) => ({
          paperGraphs: state.paperGraphs.map((g) =>
            g.id === graphId
              ? {
                  ...g,
                  findings: g.findings.map((f) =>
                    f.id === findingId ? { ...f, ...updates } : f
                  ),
                }
              : g
          ),
        }));
      },

      deleteFinding: (graphId, findingId) => {
        set((state) => ({
          paperGraphs: state.paperGraphs.map((g) =>
            g.id === graphId
              ? { ...g, findings: g.findings.filter((f) => f.id !== findingId) }
              : g
          ),
        }));
      },

      verifyFinding: (graphId, findingId, verified) => {
        set((state) => ({
          paperGraphs: state.paperGraphs.map((g) => {
            if (g.id !== graphId) return g;

            const updatedFindings = g.findings.map((f) =>
              f.id === findingId ? { ...f, userVerified: verified } : f
            );

            // Auto-update review status based on verification state
            const verifiedCount = updatedFindings.filter((f) => f.userVerified).length;
            let reviewStatus: ReviewStatus = g.reviewStatus;
            if (verifiedCount === 0) {
              reviewStatus = 'unreviewed';
            } else if (verifiedCount === updatedFindings.length) {
              reviewStatus = 'reviewed';
            } else {
              reviewStatus = 'partial';
            }

            return { ...g, findings: updatedFindings, reviewStatus };
          }),
        }));
      },

      // AI Chat History actions
      saveChatResult: (paperId, action, result) => {
        set((state) => {
          // Find the graph for this paper
          const graphIndex = state.paperGraphs.findIndex((g) => g.paperId === paperId);

          if (graphIndex === -1) {
            // No graph exists yet - create one with just chat history
            const newGraph: PaperIdeaGraph = {
              id: `graph-${paperId}-${Date.now()}`,
              paperId,
              extractedAt: new Date().toISOString(),
              extractionDepth: 'standard',
              extractionStatus: 'pending',
              findings: [],
              intraPaperConnections: [],
              dataTables: [],
              paperType: 'research-article',
              keyContributions: [],
              limitations: [],
              openQuestions: [],
              potentialConnections: [],
              reviewStatus: 'unreviewed',
              tokensUsed: {
                stage1: { input: 0, output: 0 },
                stage2: { input: 0, output: 0 },
                stage3: { input: 0, output: 0 },
              },
              chatHistory: {
                ...createEmptyChatHistory(),
                [action === 'key-findings' ? 'keyFindings' : action === 'thesis-relevance' ? 'thesisRelevance' : action]: result,
                lastUpdated: new Date().toISOString(),
              },
            };
            return { paperGraphs: [...state.paperGraphs, newGraph] };
          }

          // Update existing graph's chat history
          const actionKey = action === 'key-findings' ? 'keyFindings' : action === 'thesis-relevance' ? 'thesisRelevance' : action;
          return {
            paperGraphs: state.paperGraphs.map((g, i) => {
              if (i !== graphIndex) return g;
              return {
                ...g,
                chatHistory: {
                  ...(g.chatHistory || createEmptyChatHistory()),
                  [actionKey]: result,
                  lastUpdated: new Date().toISOString(),
                },
              };
            }),
          };
        });
      },

      getChatResult: (paperId, action) => {
        const graph = get().paperGraphs.find((g) => g.paperId === paperId);
        if (!graph?.chatHistory) return null;

        const actionKey = action === 'key-findings' ? 'keyFindings' : action === 'thesis-relevance' ? 'thesisRelevance' : action;
        return graph.chatHistory[actionKey as keyof typeof graph.chatHistory] as AIChatResult | null;
      },

      clearChatHistory: (paperId) => {
        set((state) => ({
          paperGraphs: state.paperGraphs.map((g) => {
            if (g.paperId !== paperId) return g;
            return {
              ...g,
              chatHistory: createEmptyChatHistory(),
            };
          }),
        }));
      },
    }),
    {
      name: 'ideagraph-storage',
      // Merge function for handling state updates (used by multi-tab sync)
      merge: (persistedState, currentState) => {
        const persisted = persistedState as typeof currentState;
        // Deep merge persisted state with current state, ensuring defaults are preserved
        return {
          ...currentState,
          ...persisted,
          // Ensure settings are deep-merged with defaults
          settings: {
            ...currentState.settings,
            ...(persisted?.settings || {}),
            // Deep merge graphCustomization to pick up new options
            graphCustomization: {
              ...currentState.settings.graphCustomization,
              ...(persisted?.settings?.graphCustomization || {}),
            },
          },
          // Ensure AI settings are deep-merged with defaults to pick up new feature flags
          aiSettings: {
            ...currentState.aiSettings,
            ...(persisted?.aiSettings || {}),
            // Deep merge taskModels
            taskModels: {
              ...currentState.aiSettings.taskModels,
              ...(persisted?.aiSettings?.taskModels || {}),
            },
          },
        };
      },
    }
    )
  )
);

// =============================================================================
// Multi-Tab Synchronization
// =============================================================================

// Flag to prevent re-broadcasting state updates received from other tabs
let isApplyingExternalUpdate = false;

// Initialize multi-tab sync if in browser environment
if (typeof window !== 'undefined') {
  import('../services/storage/multiTabSync').then(({ multiTabSync }) => {
    multiTabSync.init();

    // Listen for state updates from other tabs
    multiTabSync.on('state-update', (message) => {
      if (message.payload) {
        try {
          const externalState = typeof message.payload === 'string'
            ? JSON.parse(message.payload)
            : message.payload;

          // Extract state from Zustand persist format
          const actualState = externalState.state || externalState;

          // Set flag to prevent re-broadcasting this update
          isApplyingExternalUpdate = true;

          // Merge external state into current state
          useAppStore.setState((current) => ({
            ...current,
            // Only merge data fields, not actions
            theses: actualState.theses ?? current.theses,
            papers: actualState.papers ?? current.papers,
            connections: actualState.connections ?? current.connections,
            annotations: actualState.annotations ?? current.annotations,
            reviewSections: actualState.reviewSections ?? current.reviewSections,
            synthesisThemes: actualState.synthesisThemes ?? current.synthesisThemes,
            researchGaps: actualState.researchGaps ?? current.researchGaps,
            evidenceSyntheses: actualState.evidenceSyntheses ?? current.evidenceSyntheses,
            clusters: actualState.clusters ?? current.clusters,
            paperGraphs: actualState.paperGraphs ?? current.paperGraphs,
            settings: actualState.settings ?? current.settings,
            aiSettings: actualState.aiSettings ?? current.aiSettings,
          }));

          // Reset flag after state update is complete
          isApplyingExternalUpdate = false;

          console.log('[MultiTabSync] Applied state update from another tab');
        } catch (e) {
          isApplyingExternalUpdate = false;
          console.error('[MultiTabSync] Failed to apply state update:', e);
        }
      }
    });

    // Subscribe to store changes and broadcast to other tabs
    useAppStore.subscribe(
      (state) => ({
        theses: state.theses,
        papers: state.papers,
        connections: state.connections,
        annotations: state.annotations,
        paperGraphs: state.paperGraphs,
        settings: state.settings,
        aiSettings: state.aiSettings,
      }),
      () => {
        // Don't re-broadcast if this update came from another tab
        if (isApplyingExternalUpdate) {
          return;
        }
        // State changed, notify other tabs
        // The actual state is read from localStorage by other tabs
        multiTabSync.broadcastStateUpdate(['theses', 'papers', 'connections', 'annotations', 'paperGraphs', 'settings', 'aiSettings']);
      },
      { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) }
    );

    // Discover other tabs
    multiTabSync.discoverTabs().then((tabs) => {
      if (tabs.length > 0) {
        console.log(`[MultiTabSync] Found ${tabs.length} other tab(s)`);
      }
    });
  }).catch((e) => {
    console.warn('[MultiTabSync] Failed to initialize:', e);
  });
}
