import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import type { Core, ElementDefinition } from 'cytoscape';
import type { Paper, Connection, ThesisRole, PaperCluster, ConnectionType, ReadingStatus, HybridLayoutConfig } from '../../types';
import { DEFAULT_HYBRID_CONFIG } from '../../types';
import { generatePhantomEdges, type PhantomEdge } from '../../utils/similarityEngine';
import type { SemanticScholarPaper } from '../../services/api/semanticScholar';
import { getSimilarPapers, fetchPaperByDOI } from '../../services/api/semanticScholar';
import { QuickAddModal } from './QuickAddModal';
import { DiscoveryPanel } from './DiscoveryPanel';
import { useAppStore } from '../../store/useAppStore';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Eye,
  EyeOff,
  LayoutGrid,
  X,
  Compass,
  Layers,
  ChevronDown,
  ChevronRight,
  Link2,
  MousePointer2,
  Pin,
  Focus,
  Plus,
  Trash2,
  MoreHorizontal,
  Square,
  ArrowRight,
  Check,
  XCircle,
  ArrowRightCircle,
  AlertCircle,
  Settings2,
  BookOpen,
  RotateCcw,
  Circle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Register fcose layout once
if (!cytoscape.prototype.hasInitializedFcose) {
  cytoscape.use(fcose);
  cytoscape.prototype.hasInitializedFcose = true;
}

interface GraphViewProps {
  thesis: { id: string; title: string };
  papers: Paper[];
  connections: Connection[];
  clusters: PaperCluster[];
  onPaperSelect: (paperId: string) => void;
  onAddPaper: (data: {
    paper: SemanticScholarPaper;
    role: ThesisRole;
    takeaway: string;
    addAsScreening: boolean;
  }) => void;
  onOpenSearch: () => void;
  onOpenAddPaper?: () => void;
  onViewPdf?: (url: string) => void;
  onCreateCluster: (name: string, paperIds: string[]) => void;
  onToggleClusterCollapse: (clusterId: string) => void;
}

// Connection type options for inline picker with Lucide icons
const CONNECTION_TYPE_OPTIONS: { value: ConnectionType; label: string; color: string; Icon: LucideIcon }[] = [
  { value: 'supports', label: 'Supports', color: '#10b981', Icon: Check },
  { value: 'contradicts', label: 'Contradicts', color: '#f43f5e', Icon: XCircle },
  { value: 'extends', label: 'Extends', color: '#f59e0b', Icon: ArrowRightCircle },
  { value: 'critiques', label: 'Critiques', color: '#f97316', Icon: AlertCircle },
  { value: 'uses-method', label: 'Uses Method', color: '#06b6d4', Icon: Settings2 },
  { value: 'reviews', label: 'Reviews', color: '#8b5cf6', Icon: BookOpen },
  { value: 'replicates', label: 'Replicates', color: '#22c55e', Icon: RotateCcw },
  { value: 'same-topic', label: 'Same Topic', color: '#94a3b8', Icon: Circle },
];

// Tool modes for the graph
type ToolMode = 'pointer' | 'connect' | 'select' | 'discovery' | 'focus';

// Context menu state
interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  type: 'node' | 'edge' | 'canvas';
  targetId: string | null;
  targetData?: Record<string, unknown>;
}

// Refined color palette with gradients
const ROLE_COLORS: Record<ThesisRole, { bg: string; glow: string; label: string }> = {
  supports: { bg: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', label: 'Supports' },
  contradicts: { bg: '#f43f5e', glow: 'rgba(244, 63, 94, 0.4)', label: 'Contradicts' },
  method: { bg: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)', label: 'Method' },
  background: { bg: '#64748b', glow: 'rgba(100, 116, 139, 0.4)', label: 'Background' },
  other: { bg: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)', label: 'Other' },
};

const CONNECTION_STYLES: Record<string, { color: string; style: string; label: string }> = {
  supports: { color: '#10b981', style: 'solid', label: 'Supports' },
  contradicts: { color: '#f43f5e', style: 'dashed', label: 'Contradicts' },
  extends: { color: '#f59e0b', style: 'solid', label: 'Extends' },
  critiques: { color: '#f97316', style: 'dashed', label: 'Critiques' },
  reviews: { color: '#8b5cf6', style: 'solid', label: 'Reviews' },
  'uses-method': { color: '#06b6d4', style: 'dotted', label: 'Uses Method' },
  'same-topic': { color: '#94a3b8', style: 'dotted', label: 'Same Topic' },
  replicates: { color: '#22c55e', style: 'solid', label: 'Replicates' },
};

type LayoutType = 'fcose' | 'role-clustered' | 'temporal' | 'scatter' | 'concentric' | 'circle' | 'grid' | 'hybrid';

type ScatterAxisType = 'year' | 'citations' | 'connections' | 'added';

interface DiscoveryState {
  sourcePaperId: string | null;
  papers: SemanticScholarPaper[];
  loading: boolean;
  error: string | null;
}

export function GraphView({
  thesis,
  papers,
  connections,
  clusters,
  onPaperSelect,
  onAddPaper,
  onOpenSearch,
  onOpenAddPaper,
  onViewPdf,
  onCreateCluster,
  onToggleClusterCollapse,
}: GraphViewProps) {
  const cyRef = useRef<Core | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<ReturnType<Core['layout']> | null>(null);
  const isFirstRender = useRef(true);

  // Refs to track current state for event handlers (avoid stale closures)
  const toolModeRef = useRef<ToolMode>('pointer');
  const papersRef = useRef<Paper[]>([]);
  const fetchSimilarPapersRef = useRef<(paper: { id?: string; semanticScholarId?: string | null; doi?: string | null; title: string }) => void>(() => {});

  // Store actions
  const { createConnection, deleteConnection, updatePaper: storeUpdatePaper, deletePaper } = useAppStore();

  // UI state
  const [activeRoles, setActiveRoles] = useState<Set<ThesisRole>>(
    new Set(['supports', 'contradicts', 'method', 'background', 'other'])
  );
  const [showEdges, setShowEdges] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const [layoutType, setLayoutType] = useState<LayoutType>('fcose');
  const [hoveredPaper, setHoveredPaper] = useState<Paper | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isLayoutRunning, setIsLayoutRunning] = useState(false);

  // Tool mode (unified mode selector)
  const [toolMode, setToolMode] = useState<ToolMode>('pointer');

  // Connect mode state
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [showConnectionTypePicker, setShowConnectionTypePicker] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<{ from: string; to: string } | null>(null);
  const [connectionPickerPos, setConnectionPickerPos] = useState({ x: 0, y: 0 });

  // Discovery Mode state
  const [discoveryState, setDiscoveryState] = useState<DiscoveryState>({
    sourcePaperId: null,
    papers: [],
    loading: false,
    error: null,
  });
  const [selectedDiscoveryPaper, setSelectedDiscoveryPaper] = useState<SemanticScholarPaper | null>(null);

  // Multi-select state
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [showClusterModal, setShowClusterModal] = useState(false);
  const [newClusterName, setNewClusterName] = useState('');
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);
  const [boxSelectStart, setBoxSelectStart] = useState<{ x: number; y: number } | null>(null);
  const [boxSelectEnd, setBoxSelectEnd] = useState<{ x: number; y: number } | null>(null);

  // Bulk actions panel
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Focus mode state
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  // Pinned nodes
  const [pinnedNodes, setPinnedNodes] = useState<Set<string>>(new Set());

  // Context menu
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    type: 'canvas',
    targetId: null,
  });

  // Filter - hide screening papers
  const [hideScreening, setHideScreening] = useState(false);

  // Scatter plot axis configuration
  const [scatterXAxis, setScatterXAxis] = useState<ScatterAxisType>('year');
  const [scatterYAxis, setScatterYAxis] = useState<ScatterAxisType>('citations');

  // Hybrid layout configuration
  const [hybridConfig, setHybridConfig] = useState<HybridLayoutConfig>(DEFAULT_HYBRID_CONFIG);
  const [showPhantomEdges, setShowPhantomEdges] = useState(true);

  // Keep refs in sync with state (for event handlers to avoid stale closures)
  useEffect(() => {
    toolModeRef.current = toolMode;
  }, [toolMode]);

  useEffect(() => {
    papersRef.current = papers;
  }, [papers]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(prev => ({ ...prev, visible: false }));
    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.visible]);

  // Handle escape key to exit modes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (toolMode !== 'pointer') {
          setToolMode('pointer');
          setConnectSourceId(null);
          setShowConnectionTypePicker(false);
          setFocusedNodeId(null);
        }
        setContextMenu(prev => ({ ...prev, visible: false }));
        setSelectedNodes(new Set());
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toolMode]);

  // Existing paper IDs for filtering out duplicates
  const existingSemanticScholarIds = useMemo(
    () => new Set(papers.filter((p) => p.semanticScholarId).map((p) => p.semanticScholarId!)),
    [papers]
  );

  // Memoized filtered data
  const filteredPapers = useMemo(() => {
    return papers.filter((p) => {
      if (!activeRoles.has(p.thesisRole)) return false;
      if (hideScreening && p.readingStatus === 'screening') return false;
      return true;
    });
  }, [papers, activeRoles, hideScreening]);

  const filteredPaperIds = useMemo(
    () => new Set(filteredPapers.map((p) => p.id)),
    [filteredPapers]
  );

  const filteredConnections = useMemo(
    () =>
      connections.filter(
        (c) => filteredPaperIds.has(c.fromPaperId) && filteredPaperIds.has(c.toPaperId)
      ),
    [connections, filteredPaperIds]
  );

  // Compute phantom edges for hybrid layout (similarity-based edges for clustering)
  const phantomEdges = useMemo<PhantomEdge[]>(() => {
    if (layoutType !== 'hybrid' || !hybridConfig.useSimilarityEdges) {
      return [];
    }
    return generatePhantomEdges(
      filteredPapers,
      filteredConnections,
      hybridConfig.similarityThreshold,
      3 // max phantom edges per paper
    );
  }, [filteredPapers, filteredConnections, layoutType, hybridConfig.useSimilarityEdges, hybridConfig.similarityThreshold]);

  // Get papers that are in collapsed clusters
  const collapsedClusterPaperIds = useMemo(() => {
    const ids = new Set<string>();
    clusters.filter((c) => c.isCollapsed).forEach((c) => {
      c.paperIds.forEach((id) => ids.add(id));
    });
    return ids;
  }, [clusters]);

  // Papers actually visible in the graph (excludes collapsed cluster papers)
  // Used for both element generation AND layout constraints to avoid referencing non-existent nodes
  const visiblePapers = useMemo(
    () => filteredPapers.filter((p) => !collapsedClusterPaperIds.has(p.id)),
    [filteredPapers, collapsedClusterPaperIds]
  );

  // Helper: Generate Connected Papers-style label (FirstAuthor Year)
  // e.g., "Smith 2023" or "Smith et al. 2023"
  const getShortLabel = useCallback((paper: { authors: { name: string }[]; year?: number | null; title: string }) => {
    if (paper.authors.length > 0 && paper.year) {
      const firstAuthor = paper.authors[0].name.split(' ').pop() || paper.authors[0].name; // Get last name
      const suffix = paper.authors.length > 1 ? ' et al.' : '';
      return `${firstAuthor}${suffix} ${paper.year}`;
    }
    // Fallback: short title
    return paper.title.length > 15 ? paper.title.slice(0, 15) + '...' : paper.title;
  }, []);

  // Build graph elements
  const elements = useMemo<ElementDefinition[]>(() => {
    const nodes: ElementDefinition[] = visiblePapers.map((paper) => ({
      data: {
        id: paper.id,
        label: getShortLabel(paper),
        role: paper.thesisRole,
        year: paper.year,
        citationCount: paper.citationCount || 0,
        isSelected: selectedNodes.has(paper.id),
        isPinned: pinnedNodes.has(paper.id),
        isConnectSource: connectSourceId === paper.id,
        isFocused: focusedNodeId === paper.id,
      },
    }));

    // Add cluster nodes for collapsed clusters
    const clusterNodes: ElementDefinition[] = clusters
      .filter((c) => c.isCollapsed && c.paperIds.some((id) => filteredPaperIds.has(id)))
      .map((cluster) => ({
        data: {
          id: `cluster_${cluster.id}`,
          label: `${cluster.name} (${cluster.paperIds.length})`,
          isCluster: true,
          color: cluster.color,
          clusterId: cluster.id,
        },
      }));

    const edges: ElementDefinition[] = showEdges
      ? filteredConnections
          .filter(
            (conn) =>
              !collapsedClusterPaperIds.has(conn.fromPaperId) &&
              !collapsedClusterPaperIds.has(conn.toPaperId)
          )
          .map((conn) => ({
            data: {
              id: conn.id,
              source: conn.fromPaperId,
              target: conn.toPaperId,
              type: conn.type,
            },
          }))
      : [];

    // Add phantom edges for hybrid layout (similarity-based clustering)
    const phantomEdgeElements: ElementDefinition[] =
      layoutType === 'hybrid' && showPhantomEdges && phantomEdges.length > 0
        ? phantomEdges
            .filter(
              (edge) =>
                !collapsedClusterPaperIds.has(edge.source) &&
                !collapsedClusterPaperIds.has(edge.target)
            )
            .map((edge) => ({
              data: {
                id: edge.id,
                source: edge.source,
                target: edge.target,
                type: 'phantom',
                similarity: edge.similarity,
                isPhantom: true,
              },
            }))
        : [];

    return [...nodes, ...clusterNodes, ...edges, ...phantomEdgeElements];
  }, [visiblePapers, filteredConnections, showEdges, selectedNodes, pinnedNodes, connectSourceId, focusedNodeId, clusters, filteredPaperIds, getShortLabel, collapsedClusterPaperIds, layoutType, showPhantomEdges, phantomEdges]);

  // Helper: Generate short label for Semantic Scholar papers
  const getSSPaperLabel = useCallback((paper: { authors: { name: string }[]; year: number | null; title: string }) => {
    if (paper.authors.length > 0 && paper.year) {
      const firstAuthor = paper.authors[0].name.split(' ').pop() || paper.authors[0].name;
      const suffix = paper.authors.length > 1 ? ' et al.' : '';
      return `${firstAuthor}${suffix} ${paper.year}`;
    }
    return paper.title.length > 15 ? paper.title.slice(0, 15) + '...' : paper.title;
  }, []);

  // Discovery ghost nodes
  const discoveryElements = useMemo<ElementDefinition[]>(() => {
    if (!discoveryState.sourcePaperId || discoveryState.papers.length === 0) {
      return [];
    }

    // Filter out papers already in thesis
    const newPapers = discoveryState.papers.filter(
      (p) => !existingSemanticScholarIds.has(p.paperId)
    );

    const nodes: ElementDefinition[] = newPapers.slice(0, 8).map((paper) => ({
      data: {
        id: `discovery_${paper.paperId}`,
        label: getSSPaperLabel(paper),
        isDiscovery: true,
        year: paper.year,
        citationCount: paper.citationCount || 0,
        paperId: paper.paperId,
      },
    }));

    // Find the source paper node to connect to
    const sourceNodeId = papers.find((p) => p.semanticScholarId === discoveryState.sourcePaperId)?.id;

    const edges: ElementDefinition[] = sourceNodeId
      ? newPapers.slice(0, 8).map((paper) => ({
          data: {
            id: `discovery_edge_${paper.paperId}`,
            source: sourceNodeId,
            target: `discovery_${paper.paperId}`,
            type: 'discovery',
          },
        }))
      : [];

    return [...nodes, ...edges];
  }, [discoveryState, existingSemanticScholarIds, papers, getSSPaperLabel]);

  // Merge main elements with discovery elements
  const allElements = useMemo(
    () => [...elements, ...discoveryElements],
    [elements, discoveryElements]
  );

  // Professional stylesheet with smooth styling
  const stylesheet = useMemo(
    () => [
      {
        selector: 'node',
        style: {
          'background-color': '#64748b',
          'background-opacity': 0.95,
          label: 'data(label)',
          width: 48,
          height: 48,
          'font-size': 11,
          'font-weight': 500,
          'font-family': 'Inter, system-ui, -apple-system, sans-serif',
          'text-wrap': 'wrap',
          'text-max-width': 100,
          'text-valign': 'bottom',
          'text-margin-y': 6,
          color: '#334155',
          'text-outline-color': '#ffffff',
          'text-outline-width': 2.5,
          'text-outline-opacity': 0.9,
          'border-width': 2.5,
          'border-color': '#ffffff',
          'border-opacity': 0.9,
          'overlay-opacity': 0,
          'transition-property': 'background-color, border-color, width, height, opacity',
          'transition-duration': '0.2s',
          'transition-timing-function': 'ease-out',
        },
      },
      // Role colors
      ...Object.entries(ROLE_COLORS).map(([role, colors]) => ({
        selector: `node[role="${role}"]`,
        style: {
          'background-color': colors.bg,
        },
      })),
      // Discovery (ghost) nodes
      {
        selector: 'node[?isDiscovery]',
        style: {
          'background-color': '#8b5cf6',
          'background-opacity': 0.5,
          'border-style': 'dashed',
          'border-width': 2,
          'border-color': '#8b5cf6',
          'font-size': 10,
          color: '#6b7280',
          width: 40,
          height: 40,
        },
      },
      // Cluster nodes
      {
        selector: 'node[?isCluster]',
        style: {
          'background-color': 'data(color)',
          'background-opacity': 0.85,
          width: 56,
          height: 56,
          'border-width': 3,
          'border-style': 'double',
          'font-weight': 600,
        },
      },
      // Selected nodes (for clustering)
      {
        selector: 'node[?isSelected]',
        style: {
          'border-width': 4,
          'border-color': '#6366f1',
          'border-opacity': 1,
        },
      },
      // Pinned nodes
      {
        selector: 'node[?isPinned]',
        style: {
          'border-style': 'double',
          'border-width': 3,
        },
      },
      // Connect source node (first node in connect mode)
      {
        selector: 'node[?isConnectSource]',
        style: {
          'border-width': 4,
          'border-color': '#f59e0b',
          'border-opacity': 1,
          width: 54,
          height: 54,
        },
      },
      // Focused node
      {
        selector: 'node[?isFocused]',
        style: {
          'border-width': 4,
          'border-color': '#8b5cf6',
          'border-opacity': 1,
          width: 56,
          height: 56,
        },
      },
      // Edge styling
      {
        selector: 'edge',
        style: {
          width: 1.5,
          'line-color': '#cbd5e1',
          'target-arrow-color': '#cbd5e1',
          'target-arrow-shape': 'triangle',
          'arrow-scale': 0.7,
          'curve-style': 'bezier',
          opacity: 0.6,
          'transition-property': 'opacity, line-color, width',
          'transition-duration': '0.15s',
        },
      },
      ...Object.entries(CONNECTION_STYLES).map(([type, style]) => ({
        selector: `edge[type="${type}"]`,
        style: {
          'line-color': style.color,
          'target-arrow-color': style.color,
          'line-style': style.style as 'solid' | 'dashed' | 'dotted',
        },
      })),
      // Discovery edges
      {
        selector: 'edge[type="discovery"]',
        style: {
          'line-style': 'dotted',
          'line-color': '#8b5cf6',
          opacity: 0.3,
          width: 1,
          'target-arrow-shape': 'none',
        },
      },
      // Phantom edges (similarity-based for hybrid layout)
      {
        selector: 'edge[?isPhantom]',
        style: {
          'line-style': 'dotted',
          'line-color': '#94a3b8',
          opacity: hybridConfig.similarityEdgeOpacity,
          width: 1,
          'target-arrow-shape': 'none',
          'curve-style': 'bezier',
        },
      },
      // Hover/selected states
      {
        selector: 'node:active',
        style: {
          'overlay-opacity': 0.1,
        },
      },
      {
        selector: 'node:selected',
        style: {
          'border-width': 3,
          'border-color': '#6366f1',
          'border-opacity': 1,
        },
      },
      {
        selector: '.highlighted',
        style: {
          opacity: 1,
          'z-index': 999,
        },
      },
      {
        selector: 'node.highlighted',
        style: {
          width: 52,
          height: 52,
          'border-width': 3,
        },
      },
      {
        selector: 'edge.highlighted',
        style: {
          width: 2.5,
          opacity: 0.9,
        },
      },
      {
        selector: '.dimmed',
        style: {
          opacity: 0.12,
        },
      },
    ],
    [hybridConfig.similarityEdgeOpacity]
  );

  // Role order for clustering layout (center to edge)
  const ROLE_ORDER: Record<ThesisRole, number> = {
    supports: 1,
    contradicts: 2,
    method: 3,
    background: 4,
    other: 5,
  };

  // Get axis value for scatter plot
  const getAxisValue = useCallback(
    (paper: Paper, axis: ScatterAxisType): number => {
      switch (axis) {
        case 'year':
          return paper.year || new Date().getFullYear();
        case 'citations':
          return paper.citationCount || 0;
        case 'connections':
          return connections.filter(
            (c) => c.fromPaperId === paper.id || c.toPaperId === paper.id
          ).length;
        case 'added':
          return new Date(paper.addedAt).getTime();
        default:
          return 0;
      }
    },
    [connections]
  );

  // Normalize values to 0-1 range for scatter plot
  const normalizeAxisValues = useCallback(
    (papersToNormalize: Paper[], axis: ScatterAxisType): Map<string, number> => {
      const values = papersToNormalize.map((p) => getAxisValue(p, axis));
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min || 1;

      const normalized = new Map<string, number>();
      papersToNormalize.forEach((p) => {
        const value = getAxisValue(p, axis);
        // Use log scale for citations
        if (axis === 'citations') {
          const logValue = Math.log10(value + 1);
          const logMax = Math.log10(max + 1);
          normalized.set(p.id, logMax > 0 ? logValue / logMax : 0);
        } else {
          normalized.set(p.id, (value - min) / range);
        }
      });
      return normalized;
    },
    [getAxisValue]
  );

  // Layout configurations optimized for academic paper visualization
  const getLayoutConfig = useCallback(
    (type: LayoutType, animate = true) => {
      const baseConfig = {
        animate,
        animationDuration: animate ? 600 : 0,
        animationEasing: 'ease-out-cubic' as const,
        fit: true,
        padding: 50,
      };

      const nodeCount = visiblePapers.length;

      switch (type) {
        case 'fcose': {
          // Cognitively-optimized force-directed layout
          // Design principles:
          // 1. Semantic grouping: Papers with same role cluster together
          // 2. Debate visualization: Supports on left, Contradicts on right
          // 3. Prominence: High-citation papers get more space
          // 4. Connection clarity: Connected papers stay close

          // Group papers by role for relative placement
          // IMPORTANT: Use visiblePapers (not filteredPapers) to match actual graph nodes
          const supportsIds = visiblePapers.filter(p => p.thesisRole === 'supports').map(p => p.id);
          const contradictsIds = visiblePapers.filter(p => p.thesisRole === 'contradicts').map(p => p.id);
          const methodIds = visiblePapers.filter(p => p.thesisRole === 'method').map(p => p.id);
          const backgroundIds = visiblePapers.filter(p => p.thesisRole === 'background').map(p => p.id);

          // Build relative placement constraints for semantic grouping
          const relativePlacement: Array<{ left?: string; right?: string; top?: string; bottom?: string; gap?: number }> = [];

          // Supports papers should be LEFT of Contradicts papers (debate layout)
          if (supportsIds.length > 0 && contradictsIds.length > 0) {
            // Pick a representative from each group
            relativePlacement.push({
              left: supportsIds[0],
              right: contradictsIds[0],
              gap: 150,
            });
          }

          // Methods should be ABOVE the main debate (foundational)
          if (methodIds.length > 0 && (supportsIds.length > 0 || contradictsIds.length > 0)) {
            const mainPaperId = supportsIds[0] || contradictsIds[0];
            relativePlacement.push({
              top: methodIds[0],
              bottom: mainPaperId,
              gap: 100,
            });
          }

          // Background should be at the BOTTOM (contextual)
          if (backgroundIds.length > 0 && (supportsIds.length > 0 || contradictsIds.length > 0)) {
            const mainPaperId = supportsIds[0] || contradictsIds[0];
            relativePlacement.push({
              top: mainPaperId,
              bottom: backgroundIds[0],
              gap: 100,
            });
          }

          // Calculate ideal edge length based on graph density
          // Sparser graphs = longer edges for clarity
          const density = filteredConnections.length / Math.max(nodeCount * (nodeCount - 1) / 2, 1);
          const basEdgeLength = density < 0.1 ? 140 : density < 0.3 ? 110 : 85;

          return {
            name: 'fcose',
            ...baseConfig,
            quality: 'proof',
            randomize: false,

            // Semantic grouping via alignment
            alignmentConstraint: {
              // Papers of same role align vertically (form columns)
              vertical: supportsIds.length > 1 ? [supportsIds] : undefined,
            },

            // Relative placement for debate layout
            relativePlacementConstraint: relativePlacement.length > 0 ? relativePlacement : undefined,

            // Node repulsion scales with citation count (prominent papers get more space)
            nodeRepulsion: (node: { data: (key: string) => number }): number => {
              const citations = node.data('citationCount') || 0;
              const citationBonus = Math.min(citations / 100, 3); // Max 3x boost
              const baseRepulsion = Math.max(4500, 7500 - nodeCount * 80);
              return baseRepulsion * (1 + citationBonus * 0.3);
            },

            // Edge length adapts to graph density
            idealEdgeLength: (): number => Math.max(75, basEdgeLength - nodeCount * 1.5),
            edgeElasticity: (): number => 0.4,

            // Moderate gravity to keep groups together
            nestingFactor: 0.15,
            gravity: 0.3,
            gravityRange: 4.0,
            gravityCompound: 1.2,
            gravityRangeCompound: 2.0,

            // More iterations for better convergence
            numIter: 3000,

            // Tile disconnected components with good spacing
            tile: true,
            tilingPaddingVertical: 50,
            tilingPaddingHorizontal: 50,

            // Include labels in spacing calculations
            nodeDimensionsIncludeLabels: true,
            nodeOverlap: 25,

            // Smoother incremental updates
            initialEnergyOnIncremental: 0.2,
          };
        }

        case 'role-clustered': {
          // Explicit role-based clustering with clear visual separation
          // Layout: Methods (top) -> Supports (left) | Contradicts (right) -> Background (bottom)

          const supportsIds = visiblePapers.filter(p => p.thesisRole === 'supports').map(p => p.id);
          const contradictsIds = visiblePapers.filter(p => p.thesisRole === 'contradicts').map(p => p.id);
          const methodIds = visiblePapers.filter(p => p.thesisRole === 'method').map(p => p.id);
          const backgroundIds = visiblePapers.filter(p => p.thesisRole === 'background').map(p => p.id);
          const otherIds = visiblePapers.filter(p => p.thesisRole === 'other').map(p => p.id);

          // Build comprehensive alignment constraints
          const alignmentConstraint: { vertical?: string[][]; horizontal?: string[][] } = {};

          // Vertical alignment: each role forms a column
          const verticalGroups: string[][] = [];
          if (supportsIds.length > 1) verticalGroups.push(supportsIds);
          if (contradictsIds.length > 1) verticalGroups.push(contradictsIds);
          if (methodIds.length > 1) verticalGroups.push(methodIds);
          if (backgroundIds.length > 1) verticalGroups.push(backgroundIds);
          if (verticalGroups.length > 0) {
            alignmentConstraint.vertical = verticalGroups;
          }

          // Horizontal alignment: methods in one row, background in another
          const horizontalGroups: string[][] = [];
          if (methodIds.length > 1) horizontalGroups.push(methodIds);
          if (backgroundIds.length > 1) horizontalGroups.push(backgroundIds);
          if (horizontalGroups.length > 0) {
            alignmentConstraint.horizontal = horizontalGroups;
          }

          // Build relative placement for debate-style layout
          const relativePlacement: Array<{ left?: string; right?: string; top?: string; bottom?: string; gap?: number }> = [];

          // Supports LEFT of Contradicts (the main debate axis)
          if (supportsIds.length > 0 && contradictsIds.length > 0) {
            relativePlacement.push({ left: supportsIds[0], right: contradictsIds[0], gap: 200 });
          }

          // Methods ABOVE main content (foundational knowledge)
          if (methodIds.length > 0) {
            const centerPaper = supportsIds[0] || contradictsIds[0] || otherIds[0];
            if (centerPaper) {
              relativePlacement.push({ top: methodIds[0], bottom: centerPaper, gap: 120 });
            }
          }

          // Background BELOW main content (contextual)
          if (backgroundIds.length > 0) {
            const centerPaper = supportsIds[0] || contradictsIds[0] || otherIds[0];
            if (centerPaper) {
              relativePlacement.push({ top: centerPaper, bottom: backgroundIds[0], gap: 120 });
            }
          }

          return {
            name: 'fcose',
            ...baseConfig,
            quality: 'proof',
            randomize: false,
            alignmentConstraint: Object.keys(alignmentConstraint).length > 0 ? alignmentConstraint : undefined,
            relativePlacementConstraint: relativePlacement.length > 0 ? relativePlacement : undefined,
            nodeRepulsion: (): number => 6000,
            idealEdgeLength: (): number => 120,
            edgeElasticity: (): number => 0.45,
            gravity: 0.35,
            gravityRange: 3.0,
            numIter: 3500,
            tile: true,
            tilingPaddingVertical: 60,
            tilingPaddingHorizontal: 60,
            nodeDimensionsIncludeLabels: true,
            nodeOverlap: 30,
          };
        }

        case 'temporal':
          // Arrange papers by publication year (left=older, right=newer)
          // eslint-disable-next-line no-case-declarations
          const papersWithYear = visiblePapers.filter((p) => p.year);
          // eslint-disable-next-line no-case-declarations
          const years = papersWithYear.map((p) => p.year!);
          // eslint-disable-next-line no-case-declarations
          const minYear = Math.min(...years, new Date().getFullYear() - 10);
          // eslint-disable-next-line no-case-declarations
          const maxYear = Math.max(...years, new Date().getFullYear());
          // eslint-disable-next-line no-case-declarations
          const yearRange = maxYear - minYear || 1;

          return {
            name: 'fcose',
            ...baseConfig,
            quality: 'proof',
            randomize: false,
            // Fix X positions based on year, let Y be free
            fixedNodeConstraint: papersWithYear.map((p) => ({
              nodeId: p.id,
              position: {
                x: 100 + ((p.year! - minYear) / yearRange) * 600,
                y: undefined, // Let fcose decide Y position
              },
            })),
            nodeRepulsion: (): number => 4000,
            idealEdgeLength: (): number => 80,
            edgeElasticity: (): number => 0.4,
            gravity: 0.2,
            gravityRange: 2,
            numIter: 2000,
            tile: false,
            nodeDimensionsIncludeLabels: true,
          };

        case 'scatter': {
          // Configurable scatter plot: X and Y axes based on user selection
          // eslint-disable-next-line no-case-declarations
          const xNormalized = normalizeAxisValues(visiblePapers, scatterXAxis);
          // eslint-disable-next-line no-case-declarations
          const yNormalized = normalizeAxisValues(visiblePapers, scatterYAxis);

          // Graph dimensions
          const graphWidth = 700;
          const graphHeight = 500;
          const marginX = 80;
          const marginY = 60;

          return {
            name: 'preset',
            ...baseConfig,
            positions: (node: { id: () => string }) => {
              const id = node.id();
              const xVal = xNormalized.get(id) ?? 0.5;
              const yVal = yNormalized.get(id) ?? 0.5;
              return {
                x: marginX + xVal * graphWidth,
                // Y is inverted (higher values at top)
                y: marginY + (1 - yVal) * graphHeight,
              };
            },
          };
        }

        case 'concentric':
          // High-citation papers in center, low-citation on edges
          return {
            name: 'concentric',
            ...baseConfig,
            minNodeSpacing: 60,
            concentric: (node: { data: (key: string) => number }) => {
              // Higher citation count = closer to center
              return Math.log10((node.data('citationCount') || 1) + 1) * 10;
            },
            levelWidth: () => 2,
            spacingFactor: 1.2,
            startAngle: (3 * Math.PI) / 2, // Start from top
            sweep: 2 * Math.PI, // Full circle
            clockwise: true,
            equidistant: false,
          };

        case 'circle':
          return {
            name: 'circle',
            ...baseConfig,
            spacingFactor: 1.8,
            avoidOverlap: true,
            startAngle: (3 * Math.PI) / 2,
            sweep: 2 * Math.PI,
            // Sort by role for visual grouping
            sort: (a: { data: (key: string) => ThesisRole }, b: { data: (key: string) => ThesisRole }) => {
              return (ROLE_ORDER[a.data('role')] || 5) - (ROLE_ORDER[b.data('role')] || 5);
            },
          };

        case 'grid':
          return {
            name: 'grid',
            ...baseConfig,
            rows: Math.ceil(Math.sqrt(nodeCount)),
            cols: Math.ceil(nodeCount / Math.ceil(Math.sqrt(nodeCount))),
            avoidOverlap: true,
            avoidOverlapPadding: 25,
            condense: true,
            // Sort by year for grid layout
            sort: (a: { data: (key: string) => number | null }, b: { data: (key: string) => number | null }) => {
              const yearA = a.data('year') || 0;
              const yearB = b.data('year') || 0;
              return yearA - yearB;
            },
          };

        case 'hybrid': {
          // Connected Papers-inspired hybrid layout:
          // Key insight: NO alignment constraints - let force-directed naturally cluster
          // Phantom edges provide gentle attraction between similar papers
          // Strong repulsion prevents overlap, gravity keeps it centered

          // Scale spacing based on paper count - more papers need more space
          const spacingScale = Math.max(1, Math.sqrt(nodeCount / 20));

          // Base ideal edge length - larger for bigger graphs
          const baseEdgeLength = Math.max(100, 80 + nodeCount * 1.5) * spacingScale;

          return {
            name: 'fcose',
            ...baseConfig,
            quality: 'proof',

            // CRITICAL: Start with random positions to avoid local minima
            randomize: true,

            // NO alignment constraints - these cause vertical stacking!
            // Let the force simulation naturally find clusters

            // STRONG node repulsion to prevent overlap
            // This is the key to avoiding the "hairball"
            nodeRepulsion: (node: { data: (key: string) => number | string | null }): number => {
              const citations = (node.data('citationCount') as number) || 0;
              // Log scale for citations to prevent outliers from dominating
              const citationBonus = Math.log10(citations + 10) / 2;

              // Much higher base repulsion - scale with node count
              const baseRepulsion = Math.max(8000, 4000 + nodeCount * 200);

              return baseRepulsion * (1 + citationBonus * 0.5);
            },

            // Ideal edge length varies by edge type
            idealEdgeLength: (edge: { data: (key: string) => boolean | number }): number => {
              const isPhantom = edge.data('isPhantom') as boolean;
              const similarity = (edge.data('similarity') as number) || 0.5;

              if (isPhantom) {
                // Phantom edges: LONGER base length, similarity brings them closer
                // High similarity (0.8) = 70% of phantom length
                // Low similarity (0.3) = 100% of phantom length
                const phantomBase = baseEdgeLength * 1.8;
                return phantomBase * (1.2 - similarity * 0.6);
              }
              // Explicit connections: shorter, bring connected papers together
              return baseEdgeLength * 0.7;
            },

            // Edge elasticity: phantom edges are MUCH weaker
            // They suggest clustering but don't force it
            edgeElasticity: (edge: { data: (key: string) => boolean }): number => {
              const isPhantom = edge.data('isPhantom');
              return isPhantom ? 0.1 : 0.45;  // Phantom edges 4.5x weaker
            },

            // Moderate gravity - keeps graph centered without crushing it
            gravity: 0.25 * hybridConfig.thesisGravityStrength,
            gravityRange: 3.8,
            gravityCompound: 1.0,
            gravityRangeCompound: 1.5,

            // No nesting factor - we're not using compound nodes
            nestingFactor: 0.1,

            // More iterations for complex graphs
            numIter: Math.min(5000, 2500 + nodeCount * 50),

            // Tiling for disconnected components - spread them out
            tile: true,
            tilingPaddingVertical: 80,
            tilingPaddingHorizontal: 80,

            // CRITICAL: Include labels in dimension calculations
            nodeDimensionsIncludeLabels: true,

            // Strong overlap prevention
            nodeOverlap: 50,

            // Smoother animation
            initialEnergyOnIncremental: 0.3,

            // Pack components closer after layout
            packComponents: true,

            // Step size for simulation
            step: 'all',
          };
        }

        default:
          return { name: 'fcose', ...baseConfig };
      }
    },
    [visiblePapers, filteredConnections, normalizeAxisValues, scatterXAxis, scatterYAxis, ROLE_ORDER, hybridConfig.thesisGravityStrength]
  );

  // Run layout with proper cleanup
  const runLayout = useCallback(
    (animate = true) => {
      if (!cyRef.current || allElements.length === 0) return;

      // Stop any running layout
      if (layoutRef.current) {
        layoutRef.current.stop();
      }

      setIsLayoutRunning(true);

      const layout = cyRef.current.layout(getLayoutConfig(layoutType, animate));
      layoutRef.current = layout;

      layout.on('layoutstop', () => {
        setIsLayoutRunning(false);
        layoutRef.current = null;
      });

      layout.run();
    },
    [allElements.length, layoutType, getLayoutConfig]
  );

  // Store access for caching Semantic Scholar IDs
  const updatePaper = useAppStore((state) => state.updatePaper);

  // Debounce ref to prevent rapid clicks
  const lastFetchTimeRef = useRef(0);
  const pendingFetchRef = useRef<string | null>(null);

  // Fetch similar papers for discovery mode
  // Accepts either a semanticScholarId or a DOI (will lookup semanticScholarId from DOI)
  const fetchSimilarPapers = useCallback(async (paper: { id?: string; semanticScholarId?: string | null; doi?: string | null; title: string }) => {
    // Debounce: ignore rapid clicks (within 1 second)
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 1000) {
      console.log('[fetchSimilarPapers] Debounced - too soon after last request');
      return;
    }

    // Prevent duplicate concurrent fetches for same paper
    const fetchKey = paper.semanticScholarId || paper.doi || paper.title;
    if (pendingFetchRef.current === fetchKey) {
      console.log('[fetchSimilarPapers] Already fetching for this paper');
      return;
    }

    lastFetchTimeRef.current = now;
    pendingFetchRef.current = fetchKey;

    console.log('[fetchSimilarPapers] Starting fetch for paper:', paper.title);
    setDiscoveryState((prev) => ({
      ...prev,
      sourcePaperId: fetchKey,
      loading: true,
      error: null,
    }));

    try {
      let paperId = paper.semanticScholarId;

      // If no semanticScholarId but have DOI, look it up
      if (!paperId && paper.doi) {
        console.log('[fetchSimilarPapers] No semanticScholarId, looking up by DOI:', paper.doi);
        try {
          const ssData = await fetchPaperByDOI(paper.doi);
          paperId = ssData.paperId;
          console.log('[fetchSimilarPapers] Got semanticScholarId from DOI:', paperId);

          // Cache the Semantic Scholar ID back to the paper store
          if (paper.id && paperId) {
            console.log('[fetchSimilarPapers] Caching semanticScholarId to paper store');
            updatePaper(paper.id, { semanticScholarId: paperId });
          }
        } catch (doiError) {
          console.warn('[fetchSimilarPapers] Could not find paper by DOI:', paper.doi, doiError);
          setDiscoveryState((prev) => ({
            ...prev,
            loading: false,
            error: `Paper not indexed by Semantic Scholar (DOI: ${paper.doi}). This paper may be too new or from a source not covered by Semantic Scholar.`,
          }));
          pendingFetchRef.current = null;
          return;
        }
      }

      if (!paperId) {
        setDiscoveryState((prev) => ({
          ...prev,
          loading: false,
          error: 'No Semantic Scholar ID or DOI available for this paper.',
        }));
        pendingFetchRef.current = null;
        return;
      }

      console.log('[fetchSimilarPapers] Calling getSimilarPapers for:', paperId);
      const similarPapers = await getSimilarPapers(paperId, { limit: 12 });
      console.log('[fetchSimilarPapers] Got similar papers:', similarPapers.length);

      // Filter out papers already in thesis
      const newPapers = similarPapers.filter(
        (p) => !existingSemanticScholarIds.has(p.paperId)
      );

      setDiscoveryState((prev) => ({
        ...prev,
        papers: newPapers.slice(0, 8),
        loading: false,
      }));
    } catch (error) {
      console.error('[fetchSimilarPapers] Error:', error);
      setDiscoveryState((prev) => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch similar papers',
      }));
    } finally {
      pendingFetchRef.current = null;
    }
  }, [existingSemanticScholarIds, updatePaper]);

  // Keep fetchSimilarPapers ref in sync
  useEffect(() => {
    fetchSimilarPapersRef.current = fetchSimilarPapers;
  }, [fetchSimilarPapers]);

  // Clear discovery state
  const clearDiscovery = useCallback(() => {
    setDiscoveryState({
      sourcePaperId: null,
      papers: [],
      loading: false,
      error: null,
    });
  }, []);

  // Handle discovery node click
  const handleDiscoveryNodeClick = useCallback(
    (paperId: string) => {
      const paper = discoveryState.papers.find((p) => p.paperId === paperId);
      if (paper) {
        setSelectedDiscoveryPaper(paper);
      }
    },
    [discoveryState.papers]
  );

  // Handle cluster node click
  const handleClusterNodeClick = useCallback(
    (clusterId: string) => {
      onToggleClusterCollapse(clusterId);
    },
    [onToggleClusterCollapse]
  );

  // Toggle node selection for clustering
  const toggleNodeSelection = useCallback((nodeId: string) => {
    setSelectedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Create cluster from selected nodes
  const handleCreateCluster = useCallback(() => {
    if (selectedNodes.size >= 2 && newClusterName.trim()) {
      onCreateCluster(newClusterName.trim(), Array.from(selectedNodes));
      setSelectedNodes(new Set());
      setNewClusterName('');
      setShowClusterModal(false);
      setToolMode('pointer');
    }
  }, [selectedNodes, newClusterName, onCreateCluster]);

  // Toggle pin for a node
  const togglePinNode = useCallback((nodeId: string) => {
    setPinnedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Handle connection creation
  const handleCreateConnection = useCallback((type: ConnectionType) => {
    if (pendingConnection) {
      createConnection({
        thesisId: thesis.id,
        fromPaperId: pendingConnection.from,
        toPaperId: pendingConnection.to,
        type,
        note: null,
        aiSuggested: false,
        aiConfidence: null,
        userApproved: true,
      });
      setPendingConnection(null);
      setShowConnectionTypePicker(false);
      setConnectSourceId(null);
    }
  }, [pendingConnection, thesis.id, createConnection]);

  // Handle bulk role change
  const handleBulkRoleChange = useCallback((role: ThesisRole) => {
    selectedNodes.forEach(nodeId => {
      storeUpdatePaper(nodeId, { thesisRole: role });
    });
    setSelectedNodes(new Set());
    setShowBulkActions(false);
  }, [selectedNodes, storeUpdatePaper]);

  // Handle bulk status change
  const handleBulkStatusChange = useCallback((status: ReadingStatus) => {
    selectedNodes.forEach(nodeId => {
      storeUpdatePaper(nodeId, {
        readingStatus: status,
        readAt: status === 'read' ? new Date().toISOString() : undefined,
      });
    });
    setSelectedNodes(new Set());
    setShowBulkActions(false);
  }, [selectedNodes, storeUpdatePaper]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(() => {
    if (confirm(`Delete ${selectedNodes.size} papers?`)) {
      selectedNodes.forEach(nodeId => {
        deletePaper(nodeId);
      });
      setSelectedNodes(new Set());
      setShowBulkActions(false);
    }
  }, [selectedNodes, deletePaper]);

  // Invert selection
  const invertSelection = useCallback(() => {
    const allIds = new Set(filteredPapers.map(p => p.id));
    const inverted = new Set<string>();
    allIds.forEach(id => {
      if (!selectedNodes.has(id)) {
        inverted.add(id);
      }
    });
    setSelectedNodes(inverted);
  }, [filteredPapers, selectedNodes]);

  // Select all visible papers
  const selectAll = useCallback(() => {
    setSelectedNodes(new Set(filteredPapers.map(p => p.id)));
  }, [filteredPapers]);

  // Connect all selected papers with same-topic connection
  const handleBulkConnect = useCallback((connectionType: ConnectionType) => {
    const selectedArray = Array.from(selectedNodes);
    if (selectedArray.length < 2) return;

    // Create connections between consecutive pairs to avoid n^2 connections
    for (let i = 0; i < selectedArray.length - 1; i++) {
      const fromId = selectedArray[i];
      const toId = selectedArray[i + 1];
      // Check if connection already exists
      const exists = connections.some(
        c => (c.fromPaperId === fromId && c.toPaperId === toId) ||
             (c.fromPaperId === toId && c.toPaperId === fromId)
      );
      if (!exists) {
        createConnection({
          thesisId: thesis.id,
          fromPaperId: fromId,
          toPaperId: toId,
          type: connectionType,
          note: null,
          aiSuggested: false,
          aiConfidence: null,
          userApproved: true,
        });
      }
    }
    setSelectedNodes(new Set());
    setShowBulkActions(false);
  }, [selectedNodes, connections, createConnection, thesis.id]);

  // Initialize cytoscape
  const handleCy = useCallback(
    (cy: Core) => {
      cyRef.current = cy;

      // Smooth zooming
      cy.on('zoom', () => {
        cy.style().update();
      });

      // Right-click context menu
      cy.on('cxttap', 'node', (event) => {
        event.originalEvent.preventDefault();
        const nodeId = event.target.id();
        const nodeData = event.target.data();

        // Skip for special nodes
        if (nodeId.startsWith('discovery_') || nodeId.startsWith('cluster_')) return;

        const renderedPos = event.target.renderedPosition();
        setContextMenu({
          visible: true,
          x: renderedPos.x,
          y: renderedPos.y,
          type: 'node',
          targetId: nodeId,
          targetData: nodeData,
        });
      });

      cy.on('cxttap', 'edge', (event) => {
        event.originalEvent.preventDefault();
        const edgeId = event.target.id();
        const edgeData = event.target.data();

        // Skip discovery edges
        if (edgeId.startsWith('discovery_')) return;

        const midpoint = event.target.midpoint();
        const pan = cy.pan();
        const zoom = cy.zoom();
        setContextMenu({
          visible: true,
          x: midpoint.x * zoom + pan.x,
          y: midpoint.y * zoom + pan.y,
          type: 'edge',
          targetId: edgeId,
          targetData: edgeData,
        });
      });

      // Click handler - uses refs to avoid stale closures
      cy.on('tap', 'node', (event) => {
        const nodeId = event.target.id();
        const nodeData = event.target.data();
        const currentMode = toolModeRef.current;

        // Check if it's a discovery node
        if (nodeId.startsWith('discovery_')) {
          const paperId = nodeData.paperId;
          handleDiscoveryNodeClick(paperId);
          return;
        }

        // Check if it's a cluster node
        if (nodeId.startsWith('cluster_')) {
          handleClusterNodeClick(nodeData.clusterId);
          return;
        }

        // Handle based on current tool mode
        switch (currentMode) {
          case 'connect': {
            // Connect mode: first click sets source, second click creates connection
            setConnectSourceId(prev => {
              if (prev === null) {
                // First click - set source
                return nodeId;
              } else if (prev !== nodeId) {
                // Second click - show connection type picker
                const targetNode = cy.getElementById(nodeId);
                const sourceNode = cy.getElementById(prev);
                if (targetNode && sourceNode) {
                  const midX = (sourceNode.renderedPosition().x + targetNode.renderedPosition().x) / 2;
                  const midY = (sourceNode.renderedPosition().y + targetNode.renderedPosition().y) / 2;
                  setConnectionPickerPos({ x: midX, y: midY });
                }
                setPendingConnection({ from: prev, to: nodeId });
                setShowConnectionTypePicker(true);
                return prev; // Keep source until connection is created
              }
              return prev;
            });
            break;
          }

          case 'discovery': {
            const paper = papersRef.current.find((p) => p.id === nodeId);
            if (paper) {
              fetchSimilarPapersRef.current({
                id: paper.id,
                semanticScholarId: paper.semanticScholarId,
                doi: paper.doi,
                title: paper.title,
              });
            }
            break;
          }

          case 'select': {
            toggleNodeSelection(nodeId);
            break;
          }

          case 'focus': {
            setFocusedNodeId(prev => prev === nodeId ? null : nodeId);
            // Apply focus effect
            if (focusedNodeId !== nodeId) {
              const node = cy.getElementById(nodeId);
              const neighborhood = node.neighborhood().add(node);
              cy.elements().addClass('dimmed');
              neighborhood.removeClass('dimmed').addClass('highlighted');
            } else {
              cy.elements().removeClass('dimmed highlighted');
            }
            break;
          }

          case 'pointer':
          default: {
            // Shift+click for multi-select even in pointer mode
            if (event.originalEvent.shiftKey) {
              toggleNodeSelection(nodeId);
            } else {
              onPaperSelect(nodeId);
            }
            break;
          }
        }
      });

      // Hover effects with smooth transitions (only in pointer mode)
      cy.on('mouseover', 'node', (event) => {
        const node = event.target;
        const nodeId = node.id();
        const currentMode = toolModeRef.current;

        // Skip hover effects for discovery/cluster nodes or when in focus mode with a focused node
        if (nodeId.startsWith('discovery_') || nodeId.startsWith('cluster_')) {
          return;
        }

        // Don't apply hover effects if in focus mode with a focused node
        if (currentMode === 'focus' && focusedNodeId) {
          return;
        }

        const neighborhood = node.neighborhood().add(node);

        cy.elements().addClass('dimmed');
        neighborhood.removeClass('dimmed').addClass('highlighted');

        // Use ref to get current papers (avoid stale closure)
        const paper = papersRef.current.find((p) => p.id === nodeId);
        if (paper && containerRef.current) {
          const renderedPos = node.renderedPosition();
          const containerRect = containerRef.current.getBoundingClientRect();
          setHoveredPaper(paper);
          setTooltipPos({
            x: Math.min(renderedPos.x, containerRect.width - 280),
            y: renderedPos.y,
          });
        }
      });

      cy.on('mouseout', 'node', () => {
        const currentMode = toolModeRef.current;
        // Don't clear if in focus mode with a focused node
        if (currentMode === 'focus' && focusedNodeId) {
          return;
        }
        cy.elements().removeClass('dimmed highlighted');
        setHoveredPaper(null);
      });

      cy.on('dbltap', () => {
        cy.animate({
          fit: { eles: cy.elements(), padding: 50 },
          duration: 300,
          easing: 'ease-out-cubic',
        });
      });

      // Box selection support - works in select mode OR pointer mode with Shift key
      // Use local variable to track within the callback scope
      let boxStartPos: { x: number; y: number } | null = null;
      let isCurrentlyBoxSelecting = false;

      cy.on('mousedown', (event) => {
        const currentMode = toolModeRef.current;
        const isOnCanvas = !event.target.isNode?.() && !event.target.isEdge?.();
        const shiftHeld = event.originalEvent?.shiftKey;

        // In pointer mode: only box select with Shift held
        // In select mode: always allow box select on canvas
        const shouldBoxSelect = isOnCanvas && (currentMode === 'select' || (currentMode === 'pointer' && shiftHeld));

        if (shouldBoxSelect) {
          boxStartPos = { x: event.renderedPosition.x, y: event.renderedPosition.y };
          isCurrentlyBoxSelecting = true;
          setBoxSelectStart(boxStartPos);
          setIsBoxSelecting(true);
          // Prevent panning when starting box select
          event.originalEvent?.preventDefault();
        }
      });

      cy.on('mousemove', (event) => {
        if (isCurrentlyBoxSelecting && boxStartPos) {
          setBoxSelectEnd({ x: event.renderedPosition.x, y: event.renderedPosition.y });
        }
      });

      cy.on('mouseup', (event) => {
        if (isCurrentlyBoxSelecting && boxStartPos) {
          const endPos = { x: event.renderedPosition.x, y: event.renderedPosition.y };

          // Only select if box is bigger than a small threshold (to distinguish from clicks)
          const boxWidth = Math.abs(endPos.x - boxStartPos.x);
          const boxHeight = Math.abs(endPos.y - boxStartPos.y);

          if (boxWidth > 10 || boxHeight > 10) {
            // Calculate box bounds
            const minX = Math.min(boxStartPos.x, endPos.x);
            const maxX = Math.max(boxStartPos.x, endPos.x);
            const minY = Math.min(boxStartPos.y, endPos.y);
            const maxY = Math.max(boxStartPos.y, endPos.y);

            // Select nodes within box
            const newSelection = new Set<string>();
            cy.nodes().forEach((node) => {
              const pos = node.renderedPosition();
              if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY) {
                const nodeId = node.id();
                if (!nodeId.startsWith('discovery_') && !nodeId.startsWith('cluster_')) {
                  newSelection.add(nodeId);
                }
              }
            });

            if (newSelection.size > 0) {
              setSelectedNodes(prev => {
                const combined = new Set(prev);
                newSelection.forEach(id => combined.add(id));
                return combined;
              });
            }
          }

          boxStartPos = null;
          isCurrentlyBoxSelecting = false;
          setIsBoxSelecting(false);
          setBoxSelectStart(null);
          setBoxSelectEnd(null);
        }
      });

      // Run initial layout after a brief delay
      if (isFirstRender.current) {
        isFirstRender.current = false;
        setTimeout(() => runLayout(true), 100);
      }
    },
    [
      onPaperSelect,
      runLayout,
      handleDiscoveryNodeClick,
      handleClusterNodeClick,
      toggleNodeSelection,
      focusedNodeId,
    ]
  );

  // Re-run layout when filter, layout type, or scatter axes change
  useEffect(() => {
    if (cyRef.current && !isFirstRender.current) {
      runLayout(true);
    }
  }, [filteredPapers.length, showEdges, layoutType, discoveryElements.length, scatterXAxis, scatterYAxis]);

  // Handle tool mode changes
  useEffect(() => {
    // Clear discovery when not in discovery mode
    if (toolMode !== 'discovery') {
      clearDiscovery();
    }
    // Note: Don't clear selection when changing modes - keep it so user can switch back
    // Selection is only cleared explicitly via X button or Escape key
    // Clear connect state when not in connect mode
    if (toolMode !== 'connect') {
      setConnectSourceId(null);
      setShowConnectionTypePicker(false);
      setPendingConnection(null);
    }
    // Clear focus when not in focus mode
    if (toolMode !== 'focus') {
      setFocusedNodeId(null);
      if (cyRef.current) {
        cyRef.current.elements().removeClass('dimmed highlighted');
      }
    }
    // Disable panning in select mode to prevent drag conflicts with box selection
    if (cyRef.current) {
      cyRef.current.userPanningEnabled(toolMode !== 'select');
    }
  }, [toolMode, clearDiscovery]);

  // Zoom handlers
  const handleZoom = (factor: number) => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    cy.animate({
      zoom: cy.zoom() * factor,
      center: { eles: cy.elements() },
      duration: 200,
      easing: 'ease-out',
    });
  };

  const handleFit = () => {
    if (!cyRef.current) return;
    cyRef.current.animate({
      fit: { eles: cyRef.current.elements(), padding: 50 },
      duration: 300,
      easing: 'ease-out-cubic',
    });
  };

  const toggleRole = (role: ThesisRole) => {
    setActiveRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) {
        if (next.size > 1) next.delete(role);
      } else {
        next.add(role);
      }
      return next;
    });
  };

  // Count screening papers
  const screeningCount = useMemo(
    () => papers.filter((p) => p.readingStatus === 'screening').length,
    [papers]
  );

  if (papers.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <LayoutGrid className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">Add papers to visualize connections</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative" ref={containerRef}>
      {/* Graph Canvas */}
      <CytoscapeComponent
        elements={allElements}
        stylesheet={stylesheet as never}
        layout={{ name: 'preset' }}
        cy={handleCy}
        style={{ width: '100%', height: '100%' }}
        className="bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
        wheelSensitivity={0.3}
        minZoom={0.3}
        maxZoom={3}
      />

      {/* Loading indicator */}
      {isLayoutRunning && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              Arranging...
            </div>
          </div>
        </div>
      )}

      {/* Control Panel - Top Horizontal Toolbar */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none">
        {/* Left Toolbar Group */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Quick Add Button */}
          {onOpenAddPaper && (
            <button
              onClick={onOpenAddPaper}
              className="p-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-lg transition-colors"
              title="Add Paper"
            >
              <Plus size={18} />
            </button>
          )}

          {/* Navigation Tools */}
          <div className="flex bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button
              onClick={() => handleZoom(1.3)}
              className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-r border-slate-200 dark:border-slate-700"
              title="Zoom In"
            >
              <ZoomIn size={18} className="text-slate-600 dark:text-slate-300" />
            </button>
            <button
              onClick={() => handleZoom(0.7)}
              className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-r border-slate-200 dark:border-slate-700"
              title="Zoom Out"
            >
              <ZoomOut size={18} className="text-slate-600 dark:text-slate-300" />
            </button>
            <button
              onClick={handleFit}
              className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title="Fit to View"
            >
              <Maximize2 size={18} className="text-slate-600 dark:text-slate-300" />
            </button>
          </div>

          {/* Tool Mode Group */}
          <div className="flex bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button
              onClick={() => setToolMode('pointer')}
              className={`p-2.5 transition-all duration-200 border-r border-slate-200 dark:border-slate-700 ${
                toolMode === 'pointer'
                  ? 'bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
              title="Pointer Mode - Click to select, Shift+drag to box select"
            >
              <MousePointer2 size={18} />
            </button>
            <button
              onClick={() => setToolMode(toolMode === 'connect' ? 'pointer' : 'connect')}
              className={`p-2.5 transition-all duration-200 border-r border-slate-200 dark:border-slate-700 ${
                toolMode === 'connect'
                  ? 'bg-amber-500 text-white'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
              title="Connect Mode - Click source → Click target"
            >
              <Link2 size={18} />
            </button>
            <button
              onClick={() => setToolMode(toolMode === 'select' ? 'pointer' : 'select')}
              className={`p-2.5 transition-all duration-200 border-r border-slate-200 dark:border-slate-700 ${
                toolMode === 'select'
                  ? 'bg-cyan-500 text-white'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
              title="Select Mode - Click or drag to select multiple"
            >
              <Square size={18} />
            </button>
            <button
              onClick={() => setToolMode(toolMode === 'discovery' ? 'pointer' : 'discovery')}
              className={`p-2.5 transition-all duration-200 border-r border-slate-200 dark:border-slate-700 ${
                toolMode === 'discovery'
                  ? 'bg-purple-500 text-white'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
              title="Discovery Mode - Find similar papers"
            >
              <Compass size={18} />
            </button>
            <button
              onClick={() => setToolMode(toolMode === 'focus' ? 'pointer' : 'focus')}
              className={`p-2.5 transition-all duration-200 ${
                toolMode === 'focus'
                  ? 'bg-violet-500 text-white'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
              title="Focus Mode - Spotlight paper connections"
            >
              <Focus size={18} />
            </button>
          </div>

          {/* Options Group */}
          <div className="flex bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="relative">
              <button
                onClick={() => { setShowFilters(!showFilters); setShowLayoutPicker(false); }}
                className={`p-2.5 transition-all duration-200 border-r border-slate-200 dark:border-slate-700 ${
                  showFilters
                    ? 'bg-indigo-500 text-white'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
                title="Filters"
              >
                <Filter size={18} />
              </button>
            </div>
            <div className="relative">
              <button
                onClick={() => { setShowLayoutPicker(!showLayoutPicker); setShowFilters(false); }}
                className={`p-2.5 transition-all duration-200 ${
                  showLayoutPicker
                    ? 'bg-indigo-500 text-white'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
                title="Layout Options"
              >
                <LayoutGrid size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Right side - empty for balance, stats moved to bottom left */}
        <div />
      </div>

      {/* Filter Panel - Positioned below toolbar, fixed position */}
      {showFilters && (
        <div className="absolute top-16 left-4 z-30 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 w-[240px] max-h-[calc(100%-120px)] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Filters
              </h4>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={14} className="text-slate-400" />
              </button>
            </div>

            {/* Role Filters */}
            <div className="space-y-1.5">
              {(Object.entries(ROLE_COLORS) as [ThesisRole, (typeof ROLE_COLORS)[ThesisRole]][]).map(
                ([role, colors]) => {
                  const count = papers.filter((p) => p.thesisRole === role).length;
                  const isActive = activeRoles.has(role);
                  return (
                    <button
                      key={role}
                      onClick={() => toggleRole(role)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all duration-150 ${
                        isActive
                          ? 'bg-slate-100 dark:bg-slate-700'
                          : 'opacity-50 hover:opacity-75'
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0 transition-transform duration-150"
                        style={{
                          backgroundColor: colors.bg,
                          transform: isActive ? 'scale(1)' : 'scale(0.8)',
                        }}
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-300 flex-1 text-left">
                        {colors.label}
                      </span>
                      <span className="text-xs text-slate-400 tabular-nums">{count}</span>
                    </button>
                  );
                }
              )}
            </div>

            {/* Screening Filter */}
            {screeningCount > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setHideScreening(!hideScreening)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {hideScreening ? (
                    <EyeOff size={16} className="text-slate-400" />
                  ) : (
                    <Eye size={16} className="text-slate-500" />
                  )}
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    Screening papers
                  </span>
                  <span className="text-xs text-slate-400 ml-auto">
                    {hideScreening ? 'Hidden' : screeningCount}
                  </span>
                </button>
              </div>
            )}

            {/* Connections Toggle */}
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowEdges(!showEdges)}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {showEdges ? (
                  <Eye size={16} className="text-slate-500" />
                ) : (
                  <EyeOff size={16} className="text-slate-400" />
                )}
                <span className="text-sm text-slate-600 dark:text-slate-300">Connections</span>
                <span className="text-xs text-slate-400 ml-auto">
                  {showEdges ? 'On' : 'Off'}
                </span>
              </button>
            </div>

            {/* Clusters Section */}
            {clusters.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 px-1">
                  Clusters
                </label>
                <div className="space-y-1">
                  {clusters.map((cluster) => (
                    <button
                      key={cluster.id}
                      onClick={() => onToggleClusterCollapse(cluster.id)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cluster.color }}
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-300 flex-1 text-left truncate">
                        {cluster.name}
                      </span>
                      {cluster.isCollapsed ? (
                        <ChevronRight size={14} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={14} className="text-slate-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      {/* Layout Picker Panel - Positioned below toolbar */}
      {showLayoutPicker && (
        <div className="absolute top-16 left-4 z-30 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 w-[220px] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Layout</h4>
            <button
              onClick={() => setShowLayoutPicker(false)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X size={14} className="text-slate-400" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { value: 'hybrid', label: 'Hybrid', desc: 'Connected Papers-style similarity clustering' },
              { value: 'fcose', label: 'Auto', desc: 'Force-directed' },
              { value: 'role-clustered', label: 'By Role', desc: 'Group by thesis role' },
              { value: 'temporal', label: 'Timeline', desc: 'Left=old, Right=new' },
              { value: 'scatter', label: 'Scatter', desc: 'Custom X/Y axes' },
              { value: 'concentric', label: 'Citations', desc: 'High cites = center' },
              { value: 'circle', label: 'Circle', desc: 'Grouped by role' },
              { value: 'grid', label: 'Grid', desc: 'Sorted by year' },
            ].map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => {
                  setLayoutType(value as LayoutType);
                  if (value !== 'scatter' && value !== 'hybrid') setShowLayoutPicker(false);
                }}
                title={desc}
                className={`px-3 py-2 text-xs rounded-lg transition-all duration-150 ${
                  layoutType === value
                    ? 'bg-indigo-500 text-white font-medium'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Scatter Plot Axis Configuration */}
          {layoutType === 'scatter' && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-600 space-y-2">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">X-Axis</label>
                <div className="flex gap-1">
                  {(['year', 'citations', 'connections', 'added'] as const).map((value) => (
                    <button
                      key={value}
                      onClick={() => setScatterXAxis(value)}
                      className={`flex-1 px-1.5 py-1 text-[10px] rounded transition-all ${
                        scatterXAxis === value
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-50 dark:bg-slate-700 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {value === 'citations' ? 'Cites' : value === 'connections' ? 'Links' : value.charAt(0).toUpperCase() + value.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Y-Axis</label>
                <div className="flex gap-1">
                  {(['year', 'citations', 'connections', 'added'] as const).map((value) => (
                    <button
                      key={value}
                      onClick={() => setScatterYAxis(value)}
                      className={`flex-1 px-1.5 py-1 text-[10px] rounded transition-all ${
                        scatterYAxis === value
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-50 dark:bg-slate-700 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {value === 'citations' ? 'Cites' : value === 'connections' ? 'Links' : value.charAt(0).toUpperCase() + value.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Hybrid Layout Configuration */}
          {layoutType === 'hybrid' && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-600 space-y-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">Hybrid Settings</div>

              {/* Similarity Edges Toggle */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs text-slate-600 dark:text-slate-300">Show similarity edges</span>
                <button
                  onClick={() => setShowPhantomEdges(!showPhantomEdges)}
                  className={`w-9 h-5 rounded-full transition-colors ${
                    showPhantomEdges ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    showPhantomEdges ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
              </label>

              {/* Similarity Threshold */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                  Similarity threshold: {(hybridConfig.similarityThreshold * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={hybridConfig.similarityThreshold * 100}
                  onChange={(e) => setHybridConfig(prev => ({
                    ...prev,
                    similarityThreshold: parseInt(e.target.value) / 100
                  }))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Edge Opacity */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                  Edge opacity: {(hybridConfig.similarityEdgeOpacity * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={hybridConfig.similarityEdgeOpacity * 100}
                  onChange={(e) => setHybridConfig(prev => ({
                    ...prev,
                    similarityEdgeOpacity: parseInt(e.target.value) / 100
                  }))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Gravity Strength */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                  Center gravity: {(hybridConfig.thesisGravityStrength * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={hybridConfig.thesisGravityStrength * 100}
                  onChange={(e) => setHybridConfig(prev => ({
                    ...prev,
                    thesisGravityStrength: parseInt(e.target.value) / 100
                  }))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Stats */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-600">
                <div className="text-[10px] text-slate-400">
                  {phantomEdges.length} similarity edges • {filteredPapers.length} papers
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tool Mode Banners - positioned below toolbar */}
      {toolMode !== 'pointer' && (
        <div className={`absolute top-16 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full shadow-lg text-sm font-medium flex items-center gap-2 ${
          toolMode === 'connect' ? 'bg-amber-500 text-white' :
          toolMode === 'select' ? 'bg-cyan-500 text-white' :
          toolMode === 'discovery' ? 'bg-purple-500 text-white' :
          toolMode === 'focus' ? 'bg-violet-500 text-white' : 'bg-slate-500 text-white'
        }`}>
          {toolMode === 'connect' && (
            <>
              <Link2 size={16} />
              {connectSourceId ? (
                <span className="flex items-center gap-1">
                  <span className="opacity-60">Step 2:</span> Click target paper
                  <ArrowRight size={14} />
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span className="opacity-60">Step 1:</span> Click source paper
                </span>
              )}
            </>
          )}
          {toolMode === 'select' && (
            <>
              <Square size={16} />
              Click papers or drag to box select
            </>
          )}
          {toolMode === 'discovery' && (
            <>
              <Compass size={16} />
              Click a paper to find similar
            </>
          )}
          {toolMode === 'focus' && (
            <>
              <Focus size={16} />
              Click a paper to spotlight its connections
            </>
          )}
          <button
            onClick={() => setToolMode('pointer')}
            className="ml-2 p-1 hover:bg-white/20 rounded transition-colors"
            title="Exit mode (Esc)"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Connection Type Picker */}
      {showConnectionTypePicker && pendingConnection && (
        <div
          className="absolute z-50 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-3 animate-in fade-in zoom-in-95 duration-150"
          style={{ left: connectionPickerPos.x, top: connectionPickerPos.y, transform: 'translate(-50%, -50%)' }}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 text-center">Connection Type</div>
          <div className="grid grid-cols-2 gap-1.5">
            {CONNECTION_TYPE_OPTIONS.map(({ value, label, color, Icon }) => (
              <button
                key={value}
                onClick={() => handleCreateConnection(value)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
              >
                <Icon size={14} style={{ color }} />
                <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setShowConnectionTypePicker(false);
              setPendingConnection(null);
              setConnectSourceId(null);
            }}
            className="mt-2 w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Box Selection Rectangle */}
      {isBoxSelecting && boxSelectStart && boxSelectEnd && (
        <div
          className="absolute border-2 border-cyan-500 bg-cyan-500/10 pointer-events-none"
          style={{
            left: Math.min(boxSelectStart.x, boxSelectEnd.x),
            top: Math.min(boxSelectStart.y, boxSelectEnd.y),
            width: Math.abs(boxSelectEnd.x - boxSelectStart.x),
            height: Math.abs(boxSelectEnd.y - boxSelectStart.y),
          }}
        />
      )}

      {/* Enhanced Multi-select Action Bar */}
      {selectedNodes.size >= 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-3 animate-in fade-in slide-in-from-bottom-2 max-w-lg">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
              {selectedNodes.size} selected
            </span>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

            {selectedNodes.size >= 2 && (
              <>
                <button
                  onClick={() => setShowClusterModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
                  title="Group into cluster"
                >
                  <Layers size={14} />
                  Cluster
                </button>
                <button
                  onClick={() => handleBulkConnect('same-topic')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                  title="Connect selected papers in sequence"
                >
                  <Link2 size={14} />
                  Link
                </button>
              </>
            )}

            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className={`p-1.5 rounded-lg transition-colors ${
                showBulkActions ? 'bg-slate-200 dark:bg-slate-600' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="More actions"
            >
              <MoreHorizontal size={18} className="text-slate-500 dark:text-slate-400" />
            </button>

            <button
              onClick={selectAll}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Select all"
            >
              <Square size={18} className="text-slate-500 dark:text-slate-400" />
            </button>

            <button
              onClick={invertSelection}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Invert selection"
            >
              <ArrowRight size={18} className="text-slate-500 dark:text-slate-400 rotate-180" />
            </button>

            <button
              onClick={() => setSelectedNodes(new Set())}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Clear selection"
            >
              <X size={18} className="text-slate-500 dark:text-slate-400" />
            </button>
          </div>

          {/* Bulk Actions Dropdown */}
          {showBulkActions && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
              {/* Connect with type */}
              {selectedNodes.size >= 2 && (
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">Connect As</div>
                  <div className="flex gap-1 flex-wrap">
                    {([
                      { type: 'supports' as ConnectionType, label: 'Supports', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
                      { type: 'contradicts' as ConnectionType, label: 'Contradicts', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
                      { type: 'extends' as ConnectionType, label: 'Extends', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
                      { type: 'same-topic' as ConnectionType, label: 'Same Topic', color: 'bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-300' },
                    ]).map(({ type, label, color }) => (
                      <button
                        key={type}
                        onClick={() => handleBulkConnect(type)}
                        className={`px-2 py-1 rounded text-xs font-medium ${color} hover:opacity-80 transition-opacity`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">Set Role</div>
                <div className="flex gap-1 flex-wrap">
                  {(Object.entries(ROLE_COLORS) as [ThesisRole, typeof ROLE_COLORS[ThesisRole]][]).map(([role, colors]) => (
                    <button
                      key={role}
                      onClick={() => handleBulkRoleChange(role)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.bg }} />
                      {colors.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">Set Status</div>
                <div className="flex gap-1 flex-wrap">
                  {(['to-read', 'reading', 'read'] as ReadingStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleBulkStatusChange(status)}
                      className="px-2 py-1 rounded text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      {status.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-600">
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                >
                  <Trash2 size={12} />
                  Delete selected
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="absolute z-50 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
          style={{ left: contextMenu.x, top: contextMenu.y, transform: 'translate(-50%, 10px)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'node' && (
            <>
              <button
                onClick={() => {
                  if (contextMenu.targetId) onPaperSelect(contextMenu.targetId);
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Eye size={14} />
                View Details
              </button>
              <button
                onClick={() => {
                  if (contextMenu.targetId) togglePinNode(contextMenu.targetId);
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Pin size={14} />
                {contextMenu.targetId && pinnedNodes.has(contextMenu.targetId) ? 'Unpin' : 'Pin Position'}
              </button>
              <button
                onClick={() => {
                  if (contextMenu.targetId) {
                    setToolMode('connect');
                    setConnectSourceId(contextMenu.targetId);
                  }
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Link2 size={14} />
                Connect From Here
              </button>
              <button
                onClick={() => {
                  if (contextMenu.targetId) {
                    const paper = papers.find(p => p.id === contextMenu.targetId);
                    if (paper) {
                      fetchSimilarPapers({
                        id: paper.id,
                        semanticScholarId: paper.semanticScholarId,
                        doi: paper.doi,
                        title: paper.title,
                      });
                      setToolMode('discovery');
                    }
                  }
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Compass size={14} />
                Find Similar
              </button>
              <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
              <button
                onClick={() => {
                  if (contextMenu.targetId && confirm('Delete this paper?')) {
                    deletePaper(contextMenu.targetId);
                  }
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                <Trash2 size={14} />
                Delete Paper
              </button>
            </>
          )}
          {contextMenu.type === 'edge' && (
            <>
              <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                {contextMenu.targetData?.type as string || 'Connection'}
              </div>
              <button
                onClick={() => {
                  if (contextMenu.targetId && confirm('Delete this connection?')) {
                    deleteConnection(contextMenu.targetId);
                  }
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                <Trash2 size={14} />
                Delete Connection
              </button>
            </>
          )}
        </div>
      )}

      {/* Cluster Name Modal */}
      {showClusterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowClusterModal(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Create Cluster
            </h3>
            <input
              type="text"
              value={newClusterName}
              onChange={(e) => setNewClusterName(e.target.value)}
              placeholder="Cluster name..."
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowClusterModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCluster}
                disabled={!newClusterName.trim()}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discovery Panel */}
      {toolMode === 'discovery' && (discoveryState.loading || discoveryState.papers.length > 0 || discoveryState.error) && (
        <DiscoveryPanel
          papers={discoveryState.papers}
          loading={discoveryState.loading}
          error={discoveryState.error}
          existingPaperIds={existingSemanticScholarIds}
          onPaperClick={(paper) => setSelectedDiscoveryPaper(paper)}
          onSearchMore={onOpenSearch}
          onClose={clearDiscovery}
        />
      )}

      {/* Quick Add Modal */}
      {selectedDiscoveryPaper && (
        <QuickAddModal
          paper={selectedDiscoveryPaper}
          onAdd={(data) => {
            onAddPaper(data);
            setSelectedDiscoveryPaper(null);
            clearDiscovery();
          }}
          onCancel={() => setSelectedDiscoveryPaper(null)}
          onViewPdf={onViewPdf}
        />
      )}

      {/* Legend & Stats - Bottom Left */}
      <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5">
        <div className="flex flex-col gap-2">
          {/* Stats Row */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredPapers.length}</span>
              <span className="text-slate-400">papers</span>
            </div>
            {showEdges && filteredConnections.length > 0 && (
              <>
                <div className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredConnections.length}</span>
                  <span className="text-slate-400">links</span>
                </div>
              </>
            )}
            {clusters.length > 0 && (
              <>
                <div className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{clusters.length}</span>
                  <span className="text-slate-400">clusters</span>
                </div>
              </>
            )}
          </div>
          {/* Legend Row */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
            {(Object.entries(ROLE_COLORS) as [ThesisRole, (typeof ROLE_COLORS)[ThesisRole]][])
              .filter(([role]) => activeRoles.has(role))
              .map(([role, colors]) => (
                <div key={role} className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: colors.bg }}
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{colors.label}</span>
                </div>
              ))}
            {toolMode === 'discovery' && (
              <>
                <div className="w-px h-2.5 bg-slate-200 dark:bg-slate-700" />
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-purple-500/50 border border-purple-500 border-dashed" />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Discovered</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Instructions - Bottom Right */}
      <div className="absolute bottom-4 right-4 text-[11px] text-slate-400 dark:text-slate-500">
        {toolMode === 'discovery'
          ? 'Click paper to discover similar'
          : toolMode === 'select'
          ? 'Click or drag to select multiple papers'
          : toolMode === 'connect'
          ? connectSourceId
            ? '② Now click target paper to complete connection'
            : '① Click source paper first'
          : toolMode === 'focus'
          ? 'Click paper to spotlight connections'
          : 'Click to select • Shift+drag to box select • Right-click for menu'}
      </div>

      {/* Tooltip */}
      {hoveredPaper && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y - 12,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-3.5 max-w-[260px] animate-in fade-in zoom-in-95 duration-150">
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm leading-snug">
              {hoveredPaper.title}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-1">
              {hoveredPaper.authors.map((a) => a.name).join(', ')}
              {hoveredPaper.year && <span className="ml-1">({hoveredPaper.year})</span>}
            </p>
            {hoveredPaper.takeaway && (
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 leading-relaxed">
                {hoveredPaper.takeaway}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700">
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: ROLE_COLORS[hoveredPaper.thesisRole].bg }}
              >
                {ROLE_COLORS[hoveredPaper.thesisRole].label}
              </span>
              {hoveredPaper.citationCount !== null && hoveredPaper.citationCount > 0 && (
                <span className="text-[10px] text-slate-400">
                  {hoveredPaper.citationCount.toLocaleString()} citations
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
