import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Thesis, Paper, Connection, UserSettings } from '../types';

interface AppStore {
  // Data
  theses: Thesis[];
  papers: Paper[];
  connections: Connection[];

  // Active state
  activeThesisId: string | null;
  selectedPaperId: string | null;

  // Settings
  settings: UserSettings;

  // Thesis actions
  createThesis: (thesis: Omit<Thesis, 'id' | 'createdAt' | 'updatedAt' | 'paperIds' | 'connectionIds'>) => Thesis;
  updateThesis: (id: string, updates: Partial<Thesis>) => void;
  deleteThesis: (id: string) => void;
  setActiveThesis: (id: string | null) => void;

  // Paper actions
  addPaper: (paper: Omit<Paper, 'id' | 'addedAt' | 'lastAccessedAt'>) => Paper;
  updatePaper: (id: string, updates: Partial<Paper>) => void;
  deletePaper: (id: string) => void;
  setSelectedPaper: (id: string | null) => void;

  // Connection actions
  createConnection: (connection: Omit<Connection, 'id' | 'createdAt'>) => Connection;
  deleteConnection: (id: string) => void;

  // Utilities
  getPapersForThesis: (thesisId: string) => Paper[];
  getConnectionsForThesis: (thesisId: string) => Connection[];
  getConnectionsForPaper: (paperId: string) => Connection[];

  // Settings
  updateSettings: (updates: Partial<UserSettings>) => void;

  // Import/Export
  exportData: () => string;
  importData: (json: string) => void;
  clearAllData: () => void;
}

const generateId = () => crypto.randomUUID();

const defaultSettings: UserSettings = {
  defaultView: 'list',
  graphLayout: 'force',
  theme: 'system',
  autoSave: true,
  showAiSuggestions: true,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      theses: [],
      papers: [],
      connections: [],
      activeThesisId: null,
      selectedPaperId: null,
      settings: defaultSettings,

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
        set((state) => ({
          theses: state.theses.filter((t) => t.id !== id),
          papers: state.papers.filter((p) => p.thesisId !== id),
          connections: state.connections.filter((c) => c.thesisId !== id),
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
          theses: state.theses.map((t) =>
            t.id === paper.thesisId
              ? { ...t, paperIds: t.paperIds.filter((pid) => pid !== id) }
              : t
          ),
          selectedPaperId: state.selectedPaperId === id ? null : state.selectedPaperId,
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

      // Settings
      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
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
          activeThesisId: null,
          selectedPaperId: null,
          settings: defaultSettings,
        });
      },
    }),
    {
      name: 'ideagraph-storage',
    }
  )
);
