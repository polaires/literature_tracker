import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import type { Core, ElementDefinition } from 'cytoscape';
import type { Paper, Connection, ThesisRole, PaperCluster, ConnectionType, ReadingStatus, HybridLayoutConfig } from '../../types';
import { DEFAULT_HYBRID_CONFIG } from '../../types';
import { generatePhantomEdges, generateAutoClusters, type PhantomEdge, type AutoCluster } from '../../utils/similarityEngine';
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

// ============================================================================
// GLOBAL LAYOUT CONSTANTS - Centralized parameters to prevent node overlaps
// ============================================================================
const LAYOUT_CONSTANTS = {
  // Node dimensions (must match stylesheet)
  NODE_SIZE: 48,                    // Base node diameter in pixels
  NODE_SIZE_FOCUSED: 56,            // Focused/cluster node size

  // COMPACT COLLISION DETECTION
  // Only check node circles for collision, NOT labels
  // This allows labels to overlap slightly for a more compact layout
  COLLISION_RADIUS: 26,             // Slightly larger than NODE_SIZE/2 for minimal padding
  MIN_NODE_DISTANCE: 55,            // Minimum center-to-center distance

  // Force-directed layout parameters
  MIN_NODE_OVERLAP: 55,             // Match MIN_NODE_DISTANCE
  MIN_EDGE_LENGTH: 90,              // Shorter edges for tighter layout
  MIN_NODE_SPACING: 60,             // Reduced for compactness

  // Repulsion scaling - balanced for compact but readable
  BASE_REPULSION: 5000,
  REPULSION_PER_NODE: 80,
  MAX_REPULSION: 12000,

  // Gravity to keep graph centered
  BASE_GRAVITY: 0.4,                // Higher gravity = more compact
  GRAVITY_RANGE: 2.0,

  // Iteration counts
  BASE_ITERATIONS: 2500,
  ITERATIONS_PER_NODE: 30,
  MAX_ITERATIONS: 5000,

  // Tiling for disconnected components
  TILING_PADDING: 50,

  // Post-layout overlap removal settings
  OVERLAP_REMOVAL_ITERATIONS: 20,
  // Bias toward horizontal push to balance vertical spreading from alignment constraints
  HORIZONTAL_BIAS: 1.5,             // Push 1.5x more horizontally than vertically
} as const;

// ============================================================================
// COMPACT OVERLAP REMOVAL - Circle-based collision with horizontal bias
// Prefers horizontal spreading to counter vertical alignment constraints
// ============================================================================
interface NodePosition {
  id: string;
  x: number;
  y: number;
  radius: number;
}

/**
 * Compact overlap removal - only prevents node circle overlaps
 * Uses HORIZONTAL BIAS to spread nodes more horizontally
 * This counters the vertical stacking from alignment constraints
 */
function removeOverlaps(cy: Core): number {
  const nodes = cy.nodes();
  if (nodes.length < 2) return 0;

  let totalMoved = 0;

  for (let iter = 0; iter < LAYOUT_CONSTANTS.OVERLAP_REMOVAL_ITERATIONS; iter++) {
    let hasOverlap = false;
    let maxOverlap = 0;

    // Build node positions with actual node sizes
    const positions: NodePosition[] = nodes.map(node => {
      // Get actual rendered width, or use default
      const width = node.renderedWidth() || node.width() || LAYOUT_CONSTANTS.NODE_SIZE;
      return {
        id: node.id(),
        x: node.position('x'),
        y: node.position('y'),
        radius: width / 2 + 5, // Half width + small padding
      };
    });

    // Check all pairs for circle overlaps
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const a = positions[i];
        const b = positions[j];

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Minimum distance is sum of radii (both nodes' collision circles)
        const minDistance = a.radius + b.radius;

        if (distance < minDistance) {
          hasOverlap = true;
          const overlap = minDistance - distance;
          maxOverlap = Math.max(maxOverlap, overlap);

          // Calculate push direction with HORIZONTAL BIAS
          // This spreads nodes more horizontally to counter vertical alignment
          const len = distance || 1;
          let nx = dx / len;
          let ny = dy / len;

          // Apply horizontal bias - amplify horizontal component
          nx *= LAYOUT_CONSTANTS.HORIZONTAL_BIAS;

          // Re-normalize after bias
          const biasedLen = Math.sqrt(nx * nx + ny * ny);
          nx /= biasedLen;
          ny /= biasedLen;

          // Push each node by half the overlap amount
          const push = overlap / 2;

          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;

          totalMoved += push * 2;
        }
      }
    }

    // Apply new positions
    positions.forEach(pos => {
      const node = cy.getElementById(pos.id);
      if (node.length > 0) {
        node.position({ x: pos.x, y: pos.y });
      }
    });

    // Early exit if overlaps are minimal
    if (!hasOverlap || maxOverlap < 1) {
      break;
    }
  }

  return totalMoved;
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

  // Auto-clustering for Similar layout
  const [enableAutoClustering, setEnableAutoClustering] = useState(false);
  const [clusterThreshold, setClusterThreshold] = useState(0.45);
  const [expandedClusterIds, setExpandedClusterIds] = useState<Set<string>>(new Set());

  // Reset expanded cluster IDs when threshold changes (cluster IDs change)
  useEffect(() => {
    setExpandedClusterIds(new Set());
  }, [clusterThreshold]);

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

  // Compute auto-clusters for Similar layout when clustering is enabled
  const autoClusters = useMemo<AutoCluster[]>(() => {
    if (layoutType !== 'hybrid' || !enableAutoClustering) {
      return [];
    }
    return generateAutoClusters(filteredPapers, filteredConnections, {
      minClusterSize: 2,
      similarityThreshold: clusterThreshold,
      maxClusters: 10,
    });
  }, [filteredPapers, filteredConnections, layoutType, enableAutoClustering, clusterThreshold]);

  // Papers that are in collapsed auto-clusters (not expanded)
  // Also build a map from paper ID to cluster ID for edge redirection
  const { autoClusteredPaperIds, paperToClusterMap } = useMemo(() => {
    if (!enableAutoClustering) {
      return { autoClusteredPaperIds: new Set<string>(), paperToClusterMap: new Map<string, string>() };
    }

    const ids = new Set<string>();
    const mapping = new Map<string, string>();
    autoClusters.forEach(cluster => {
      if (!expandedClusterIds.has(cluster.id)) {
        cluster.paperIds.forEach(id => {
          ids.add(id);
          mapping.set(id, cluster.id);
        });
      }
    });
    return { autoClusteredPaperIds: ids, paperToClusterMap: mapping };
  }, [autoClusters, enableAutoClustering, expandedClusterIds]);

  // Get papers that are in collapsed clusters
  const collapsedClusterPaperIds = useMemo(() => {
    const ids = new Set<string>();
    clusters.filter((c) => c.isCollapsed).forEach((c) => {
      c.paperIds.forEach((id) => ids.add(id));
    });
    return ids;
  }, [clusters]);

  // Papers actually visible in the graph (excludes collapsed cluster papers AND auto-clustered papers)
  // Used for both element generation AND layout constraints to avoid referencing non-existent nodes
  const visiblePapers = useMemo(
    () => filteredPapers.filter((p) =>
      !collapsedClusterPaperIds.has(p.id) && !autoClusteredPaperIds.has(p.id)
    ),
    [filteredPapers, collapsedClusterPaperIds, autoClusteredPaperIds]
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

  // Compute year range for color mapping (Connected Papers style)
  const yearRange = useMemo(() => {
    const years = visiblePapers.map(p => p.year).filter((y): y is number => y != null);
    if (years.length === 0) return { min: 2020, max: 2024 };
    return { min: Math.min(...years), max: Math.max(...years) };
  }, [visiblePapers]);

  // Compute connection count per paper
  const connectionCountByPaper = useMemo(() => {
    const counts = new Map<string, number>();
    filteredConnections.forEach(conn => {
      counts.set(conn.fromPaperId, (counts.get(conn.fromPaperId) || 0) + 1);
      counts.set(conn.toPaperId, (counts.get(conn.toPaperId) || 0) + 1);
    });
    return counts;
  }, [filteredConnections]);

  // Year to color mapping (light blue → dark blue, like Connected Papers)
  const yearToColor = useCallback((year: number | null | undefined): string => {
    if (year == null) return '#94a3b8'; // Gray for unknown years
    const { min, max } = yearRange;
    const range = max - min || 1;
    const t = (year - min) / range;
    // Interpolate from #93c5fd (light blue) to #1e40af (dark blue)
    const r = Math.round(147 + t * (30 - 147));
    const g = Math.round(197 + t * (64 - 197));
    const b = Math.round(253 + t * (175 - 253));
    return `rgb(${r}, ${g}, ${b})`;
  }, [yearRange]);

  // Build graph elements
  const elements = useMemo<ElementDefinition[]>(() => {
    const nodes: ElementDefinition[] = visiblePapers.map((paper) => ({
      data: {
        id: paper.id,
        label: getShortLabel(paper),
        role: paper.thesisRole,
        year: paper.year,
        citationCount: paper.citationCount || 0,
        connectionCount: connectionCountByPaper.get(paper.id) || 0,
        yearColor: yearToColor(paper.year),
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

    // Add auto-cluster nodes for Similar layout when clustering is enabled
    const autoClusterNodes: ElementDefinition[] = enableAutoClustering
      ? autoClusters
          .filter(cluster => !expandedClusterIds.has(cluster.id))
          .map(cluster => {
            return {
              data: {
                id: cluster.id,
                label: `${cluster.name} (${cluster.paperIds.length})`,
                isAutoCluster: true,
                role: cluster.dominantRole,
                citationCount: cluster.totalCitations,
                paperCount: cluster.paperIds.length,
                paperIds: cluster.paperIds,
                avgSimilarity: cluster.avgSimilarity,
                representativePaperId: cluster.representativePaperId,
                yearRange: cluster.yearRange,
              },
            };
          })
      : [];

    // Regular edges between non-clustered papers
    const regularEdges: ElementDefinition[] = showEdges
      ? filteredConnections
          .filter(
            (conn) =>
              !collapsedClusterPaperIds.has(conn.fromPaperId) &&
              !collapsedClusterPaperIds.has(conn.toPaperId) &&
              !autoClusteredPaperIds.has(conn.fromPaperId) &&
              !autoClusteredPaperIds.has(conn.toPaperId)
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

    // Edges connecting to/from auto-clusters (redirect paper → cluster)
    // Aggregate multiple connections into single edge with count
    const clusterEdgeMap = new Map<string, { source: string; target: string; type: string; count: number; ids: string[] }>();

    if (showEdges && enableAutoClustering && paperToClusterMap.size > 0) {
      filteredConnections.forEach((conn) => {
        // Skip if in user-created collapsed cluster
        if (collapsedClusterPaperIds.has(conn.fromPaperId) || collapsedClusterPaperIds.has(conn.toPaperId)) {
          return;
        }

        const fromCluster = paperToClusterMap.get(conn.fromPaperId);
        const toCluster = paperToClusterMap.get(conn.toPaperId);

        // Skip if both ends are in the same cluster (internal edge)
        if (fromCluster && toCluster && fromCluster === toCluster) {
          return;
        }

        // Skip if neither end is in a cluster (handled by regularEdges)
        if (!fromCluster && !toCluster) {
          return;
        }

        // Redirect to cluster node
        const source = fromCluster || conn.fromPaperId;
        const target = toCluster || conn.toPaperId;

        // Create unique key for this edge pair
        const edgeKey = source < target ? `${source}:${target}` : `${target}:${source}`;

        if (clusterEdgeMap.has(edgeKey)) {
          const existing = clusterEdgeMap.get(edgeKey)!;
          existing.count++;
          existing.ids.push(conn.id);
        } else {
          clusterEdgeMap.set(edgeKey, {
            source,
            target,
            type: conn.type,
            count: 1,
            ids: [conn.id],
          });
        }
      });
    }

    const clusterEdges: ElementDefinition[] = [...clusterEdgeMap.values()].map((edge) => ({
      data: {
        id: `cluster_edge_${edge.ids[0]}`,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        isClusterEdge: true,
        connectionCount: edge.count,
      },
    }));

    // Add phantom edges for hybrid layout (similarity-based clustering)
    // Skip edges involving auto-clustered papers (they're already visually grouped)
    const phantomEdgeElements: ElementDefinition[] =
      layoutType === 'hybrid' && showPhantomEdges && phantomEdges.length > 0
        ? phantomEdges
            .filter(
              (edge) =>
                !collapsedClusterPaperIds.has(edge.source) &&
                !collapsedClusterPaperIds.has(edge.target) &&
                !autoClusteredPaperIds.has(edge.source) &&
                !autoClusteredPaperIds.has(edge.target)
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

    return [...nodes, ...clusterNodes, ...autoClusterNodes, ...regularEdges, ...clusterEdges, ...phantomEdgeElements];
  }, [visiblePapers, filteredConnections, showEdges, selectedNodes, pinnedNodes, connectSourceId, focusedNodeId, clusters, filteredPaperIds, getShortLabel, collapsedClusterPaperIds, autoClusteredPaperIds, paperToClusterMap, layoutType, showPhantomEdges, phantomEdges, connectionCountByPaper, yearToColor, enableAutoClustering, autoClusters, expandedClusterIds, filteredPapers]);

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
          'text-halign': 'center',
          'text-margin-y': 8,
          color: '#1e293b',
          // Strong text outline for readability over other nodes (no background)
          'text-outline-color': '#ffffff',
          'text-outline-width': 3,
          'text-outline-opacity': 0.9,
          // Transparent background - rely on outline for visibility
          'text-background-opacity': 0,
          'border-width': 2.5,
          'border-color': '#ffffff',
          'border-opacity': 0.9,
          'overlay-opacity': 0,
          // Ensure labels render on top
          'z-compound-depth': 'top',
          'transition-property': 'background-color, border-color, width, height, opacity',
          'transition-duration': '0.2s',
          'transition-timing-function': 'ease-out',
        },
      },
      // Role colors (default coloring)
      ...Object.entries(ROLE_COLORS).map(([role, colors]) => ({
        selector: `node[role="${role}"]`,
        style: {
          'background-color': colors.bg,
        },
      })),
      // Year-based coloring (Connected Papers style) - applied when nodeColorMetric is 'year'
      ...(layoutType === 'hybrid' && hybridConfig.nodeColorMetric === 'year'
        ? [{
            selector: 'node[yearColor]',
            style: {
              'background-color': 'data(yearColor)',
            },
          }]
        : []),
      // Dynamic node sizing based on citations (Connected Papers style)
      ...(layoutType === 'hybrid' && hybridConfig.nodeSizeMetric === 'citations'
        ? [{
            selector: 'node[citationCount]',
            style: {
              // mapData: citationCount 0-500 → size 40-72px
              width: 'mapData(citationCount, 0, 500, 40, 72)',
              height: 'mapData(citationCount, 0, 500, 40, 72)',
            },
          }]
        : []),
      // Dynamic node sizing based on connections
      ...(layoutType === 'hybrid' && hybridConfig.nodeSizeMetric === 'connections'
        ? [{
            selector: 'node[connectionCount]',
            style: {
              // mapData: connectionCount 0-10 → size 40-72px
              width: 'mapData(connectionCount, 0, 10, 40, 72)',
              height: 'mapData(connectionCount, 0, 10, 40, 72)',
            },
          }]
        : []),
      // Auto-cluster nodes (merged similar papers)
      {
        selector: 'node[?isAutoCluster]',
        style: {
          // Larger size for clusters, scales with paper count
          width: 'mapData(paperCount, 2, 8, 56, 80)',
          height: 'mapData(paperCount, 2, 8, 56, 80)',
          // Double border to indicate it's a group
          'border-width': 4,
          'border-style': 'double',
          'border-color': '#6366f1',
          'border-opacity': 0.9,
          // Semi-transparent to hint at grouped nature
          'background-opacity': 0.85,
          // Slightly different label style
          'font-weight': 600,
          'font-size': 10,
        },
      },
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
      // Thickness and opacity vary by similarity score for visual distinction
      {
        selector: 'edge[?isPhantom]',
        style: {
          'line-style': 'dashed',
          'line-color': '#94a3b8',
          // mapData: similarity 0.25-1.0 → opacity scales with config
          opacity: `mapData(similarity, 0.25, 1.0, ${hybridConfig.similarityEdgeOpacity * 0.5}, ${hybridConfig.similarityEdgeOpacity})`,
          // mapData: similarity 0.25-1.0 → width 1-3px
          width: 'mapData(similarity, 0.25, 1.0, 1, 3)',
          'target-arrow-shape': 'none',
          'curve-style': 'bezier',
        },
      },
      // Cluster edges (aggregated connections to/from clusters)
      // Thicker based on number of connections aggregated
      {
        selector: 'edge[?isClusterEdge]',
        style: {
          // Width scales with connection count (1 connection = 2px, 5+ = 5px)
          width: 'mapData(connectionCount, 1, 5, 2, 5)',
          opacity: 0.7,
          'line-style': 'solid',
          // Use indigo to match cluster border color
          'line-color': '#818cf8',
          'target-arrow-color': '#818cf8',
          'target-arrow-shape': 'triangle',
          'arrow-scale': 0.8,
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
    [hybridConfig.similarityEdgeOpacity, hybridConfig.nodeSizeMetric, hybridConfig.nodeColorMetric, layoutType]
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
          const supportsIds = visiblePapers.filter(p => p.thesisRole === 'supports').map(p => p.id);
          const contradictsIds = visiblePapers.filter(p => p.thesisRole === 'contradicts').map(p => p.id);
          const methodIds = visiblePapers.filter(p => p.thesisRole === 'method').map(p => p.id);
          const backgroundIds = visiblePapers.filter(p => p.thesisRole === 'background').map(p => p.id);

          // Build relative placement constraints for semantic grouping
          // SCALING: Gap decreases as graph grows to prevent explosion
          const baseGap = Math.max(80, 150 - nodeCount * 3);
          const relativePlacement: Array<{ left?: string; right?: string; top?: string; bottom?: string; gap?: number }> = [];

          // Supports papers should be LEFT of Contradicts papers (debate layout)
          if (supportsIds.length > 0 && contradictsIds.length > 0) {
            relativePlacement.push({
              left: supportsIds[0],
              right: contradictsIds[0],
              gap: baseGap,
            });
          }

          // Methods should be ABOVE the main debate (foundational)
          if (methodIds.length > 0 && (supportsIds.length > 0 || contradictsIds.length > 0)) {
            const mainPaperId = supportsIds[0] || contradictsIds[0];
            relativePlacement.push({
              top: methodIds[0],
              bottom: mainPaperId,
              gap: baseGap * 0.7,
            });
          }

          // Background should be at the BOTTOM (contextual)
          if (backgroundIds.length > 0 && (supportsIds.length > 0 || contradictsIds.length > 0)) {
            const mainPaperId = supportsIds[0] || contradictsIds[0];
            relativePlacement.push({
              top: mainPaperId,
              bottom: backgroundIds[0],
              gap: baseGap * 0.7,
            });
          }

          // Calculate ideal edge length based on graph density
          const density = filteredConnections.length / Math.max(nodeCount * (nodeCount - 1) / 2, 1);
          const densityEdgeBonus = density < 0.1 ? 20 : density < 0.3 ? 10 : 0;

          // Edge length by connection type (semantic meaning)
          const EDGE_LENGTH_BY_TYPE: Record<string, number> = {
            'supports': 0.85,      // Tight coupling
            'contradicts': 0.85,   // Tight coupling (opposing)
            'extends': 0.9,        // Close relationship
            'critiques': 0.95,     // Moderate distance
            'uses-method': 1.1,    // Looser coupling
            'replicates': 0.9,     // Close relationship
            'reviews': 1.0,        // Standard
            'same-topic': 1.15,    // Loose coupling
          };

          return {
            name: 'fcose',
            ...baseConfig,
            quality: 'proof',
            randomize: false,

            // SCALING: Always apply relative placement, but with scaled gaps
            // This maintains semantic structure at any graph size
            relativePlacementConstraint: relativePlacement.length > 0
              ? relativePlacement
              : undefined,

            // Node repulsion - balanced for compact layout
            nodeRepulsion: (node: { data: (key: string) => number }): number => {
              const citations = node.data('citationCount') || 0;
              const citationBonus = Math.min(citations / 100, 1.5);
              const scaledRepulsion = Math.min(
                LAYOUT_CONSTANTS.MAX_REPULSION,
                LAYOUT_CONSTANTS.BASE_REPULSION + nodeCount * LAYOUT_CONSTANTS.REPULSION_PER_NODE
              );
              return scaledRepulsion * (1 + citationBonus * 0.2);
            },

            // Edge length varies by connection type for semantic meaning
            idealEdgeLength: (edge: { data: (key: string) => string }): number => {
              const type = edge.data('type') || 'same-topic';
              const multiplier = EDGE_LENGTH_BY_TYPE[type] || 1.0;
              return (LAYOUT_CONSTANTS.MIN_EDGE_LENGTH + densityEdgeBonus) * multiplier;
            },
            edgeElasticity: (): number => 0.4,

            // Higher gravity pulls nodes together more
            nestingFactor: 0.1,
            gravity: LAYOUT_CONSTANTS.BASE_GRAVITY,
            gravityRange: LAYOUT_CONSTANTS.GRAVITY_RANGE,
            gravityCompound: 1.5,
            gravityRangeCompound: 2.5,

            // Iterations for convergence
            numIter: Math.min(
              LAYOUT_CONSTANTS.MAX_ITERATIONS,
              LAYOUT_CONSTANTS.BASE_ITERATIONS + nodeCount * LAYOUT_CONSTANTS.ITERATIONS_PER_NODE
            ),

            // Tile disconnected components
            tile: true,
            tilingPaddingVertical: LAYOUT_CONSTANTS.TILING_PADDING,
            tilingPaddingHorizontal: LAYOUT_CONSTANTS.TILING_PADDING,

            // Don't include labels - let post-processing handle overlaps
            nodeDimensionsIncludeLabels: false,
            nodeOverlap: LAYOUT_CONSTANTS.MIN_NODE_OVERLAP,

            // Smoother incremental updates
            initialEnergyOnIncremental: 0.3,
          };
        }

        case 'role-clustered': {
          // Deterministic role-based regions layout
          // Works at ANY scale - no fcose constraints that fail for large graphs
          // Layout: Methods (top) | Supports (left) | Contradicts (right) | Background (bottom) | Other (center)

          // Define region centers (normalized 0-1 coordinates)
          const ROLE_REGIONS: Record<ThesisRole, { cx: number; cy: number; radius: number }> = {
            method:      { cx: 0.5, cy: 0.12, radius: 0.18 },  // Top center
            supports:    { cx: 0.18, cy: 0.5, radius: 0.22 },  // Left
            contradicts: { cx: 0.82, cy: 0.5, radius: 0.22 },  // Right
            background:  { cx: 0.5, cy: 0.88, radius: 0.18 },  // Bottom center
            other:       { cx: 0.5, cy: 0.5, radius: 0.15 },   // Center
          };

          // Group papers by role
          const papersByRole = new Map<ThesisRole, Paper[]>();
          visiblePapers.forEach(p => {
            const existing = papersByRole.get(p.thesisRole) || [];
            existing.push(p);
            papersByRole.set(p.thesisRole, existing);
          });

          // Sort papers within each role by year (oldest first) for consistent ordering
          papersByRole.forEach((papers, role) => {
            papers.sort((a, b) => (a.year || 2020) - (b.year || 2020));
            papersByRole.set(role, papers);
          });

          // Build position index for each paper
          const paperPositionIndex = new Map<string, { role: ThesisRole; index: number; total: number }>();
          papersByRole.forEach((papers, role) => {
            papers.forEach((p, idx) => {
              paperPositionIndex.set(p.id, { role, index: idx, total: papers.length });
            });
          });

          // Graph dimensions
          const graphWidth = 800;
          const graphHeight = 600;

          return {
            name: 'preset',
            ...baseConfig,
            positions: (node: { id: () => string }) => {
              const id = node.id();
              const posInfo = paperPositionIndex.get(id);

              if (!posInfo) {
                // Fallback for unknown nodes (clusters, etc.)
                return { x: graphWidth / 2, y: graphHeight / 2 };
              }

              const { role, index, total } = posInfo;
              const region = ROLE_REGIONS[role];

              // Calculate position within region using spiral pattern
              // This ensures papers don't overlap and fills the region nicely
              const regionRadiusPx = region.radius * Math.min(graphWidth, graphHeight);

              if (total === 1) {
                // Single paper in region: place at center
                return {
                  x: region.cx * graphWidth,
                  y: region.cy * graphHeight,
                };
              }

              // Spiral layout within region
              // Golden angle for even distribution
              const goldenAngle = Math.PI * (3 - Math.sqrt(5));
              const angle = index * goldenAngle;

              // Radius grows with sqrt for even area distribution
              const normalizedRadius = Math.sqrt((index + 0.5) / total);
              const r = normalizedRadius * regionRadiusPx * 0.85; // 85% to leave padding

              return {
                x: region.cx * graphWidth + r * Math.cos(angle),
                y: region.cy * graphHeight + r * Math.sin(angle),
              };
            },
          };
        }

        case 'temporal': {
          // Arrange papers by publication year (left=older, right=newer)
          // Use FIXED spacing between year columns with vertical spreading
          const currentYear = new Date().getFullYear();

          // Group papers by year for distribution
          const papersByYear = new Map<number, string[]>();
          visiblePapers.forEach((p) => {
            const year = p.year || currentYear;
            const existing = papersByYear.get(year) || [];
            existing.push(p.id);
            papersByYear.set(year, existing);
          });

          // Get sorted unique years
          const uniqueYears = [...papersByYear.keys()].sort((a, b) => a - b);
          const yearToColumnIndex = new Map<number, number>();
          uniqueYears.forEach((year, idx) => yearToColumnIndex.set(year, idx));

          // Find the year with most papers to determine graph height
          const maxPapersInYear = Math.max(...[...papersByYear.values()].map(ids => ids.length), 1);

          // Fixed spacing - use wider column spacing and larger vertical spacing for labels
          const columnSpacing = 140; // Wider columns to accommodate horizontal spread
          const verticalSpacing = 75; // More vertical space to prevent label overlap
          const graphHeight = Math.max(500, maxPapersInYear * verticalSpacing);
          const marginX = 100;
          const marginY = 80;

          // Track position index within each year
          const yearIndex = new Map<string, number>();
          papersByYear.forEach((ids) => {
            ids.forEach((id, idx) => yearIndex.set(id, idx));
          });

          return {
            name: 'preset',
            ...baseConfig,
            positions: (node: { id: () => string }) => {
              const id = node.id();
              const paper = visiblePapers.find((p) => p.id === id);
              const year = paper?.year || currentYear;
              const papersInYear = papersByYear.get(year) || [id];
              const indexInYear = yearIndex.get(id) || 0;
              const columnIndex = yearToColumnIndex.get(year) || 0;
              const countInYear = papersInYear.length;

              // Base X from column index
              const baseX = marginX + columnIndex * columnSpacing;

              // Use zigzag/wave pattern for X when multiple papers in same year
              // This spreads nodes horizontally within their year column
              let xOffset = 0;
              if (countInYear > 1) {
                // Alternate left/right from center, with increasing amplitude
                const wave = (indexInYear % 2 === 0) ? -1 : 1;
                const amplitude = Math.min(columnSpacing * 0.35, 40); // Max 40px from center
                xOffset = wave * amplitude * ((indexInYear % 4 < 2) ? 0.5 : 1);
              }
              const x = baseX + xOffset;

              // Y distributed evenly within year group with more spacing
              const totalHeight = (countInYear - 1) * verticalSpacing;
              const yStart = marginY + (graphHeight - totalHeight) / 2;
              const y = yStart + indexInYear * verticalSpacing;

              return { x, y };
            },
          };
        }

        case 'scatter': {
          // Configurable scatter plot: X and Y axes based on user selection
          const xNormalized = normalizeAxisValues(visiblePapers, scatterXAxis);
          const yNormalized = normalizeAxisValues(visiblePapers, scatterYAxis);

          // Graph dimensions - scale with paper count
          const nodeSpacing = 55; // Minimum distance between nodes
          const graphWidth = Math.max(700, Math.sqrt(nodeCount) * 120);
          const graphHeight = Math.max(500, Math.sqrt(nodeCount) * 100);
          const marginX = 80;
          const marginY = 60;

          // Sort papers by their raw position for consistent ordering
          const sortedPapers = [...visiblePapers].sort((a, b) => {
            const xA = xNormalized.get(a.id) ?? 0.5;
            const yA = yNormalized.get(a.id) ?? 0.5;
            const xB = xNormalized.get(b.id) ?? 0.5;
            const yB = yNormalized.get(b.id) ?? 0.5;
            // Sort by Y first, then X
            if (Math.abs(yA - yB) > 0.01) return yB - yA;
            return xA - xB;
          });

          // Calculate final positions with collision avoidance
          const finalPositions = new Map<string, { x: number; y: number }>();
          const occupiedPositions: { x: number; y: number }[] = [];

          sortedPapers.forEach((paper) => {
            const xVal = xNormalized.get(paper.id) ?? 0.5;
            const yVal = yNormalized.get(paper.id) ?? 0.5;
            let x = marginX + xVal * graphWidth;
            let y = marginY + (1 - yVal) * graphHeight;

            // Check for collisions and adjust using spiral pattern
            let attempts = 0;
            const maxAttempts = 50;
            while (attempts < maxAttempts) {
              const collision = occupiedPositions.some(pos => {
                const dx = pos.x - x;
                const dy = pos.y - y;
                return Math.sqrt(dx * dx + dy * dy) < nodeSpacing;
              });

              if (!collision) break;

              // Spiral outward to find free space
              attempts++;
              const angle = attempts * 0.5; // Golden angle approximation
              const radius = nodeSpacing * 0.5 * Math.sqrt(attempts);
              x = marginX + xVal * graphWidth + Math.cos(angle) * radius;
              y = marginY + (1 - yVal) * graphHeight + Math.sin(angle) * radius;
            }

            finalPositions.set(paper.id, { x, y });
            occupiedPositions.push({ x, y });
          });

          return {
            name: 'preset',
            ...baseConfig,
            positions: (node: { id: () => string }) => {
              const id = node.id();
              const pos = finalPositions.get(id);
              if (pos) return pos;
              // Fallback
              const xVal = xNormalized.get(id) ?? 0.5;
              const yVal = yNormalized.get(id) ?? 0.5;
              return {
                x: marginX + xVal * graphWidth,
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
            // Use global constant for consistent spacing
            minNodeSpacing: LAYOUT_CONSTANTS.MIN_NODE_SPACING,
            concentric: (node: { data: (key: string) => number }) => {
              // Higher citation count = closer to center
              return Math.log10((node.data('citationCount') || 1) + 1) * 10;
            },
            levelWidth: () => 2,
            // Increase spacing factor to prevent overlap
            spacingFactor: 1.5,
            startAngle: (3 * Math.PI) / 2, // Start from top
            sweep: 2 * Math.PI, // Full circle
            clockwise: true,
            equidistant: false,
            avoidOverlap: true,
          };

        case 'circle':
          return {
            name: 'circle',
            ...baseConfig,
            // Increase spacing factor based on node count
            spacingFactor: Math.max(2.0, 1.5 + nodeCount * 0.02),
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
            // Compact grid with minimal padding
            avoidOverlapPadding: 15,
            condense: true, // Condense for compact layout
            // Sort by year for grid layout
            sort: (a: { data: (key: string) => number | null }, b: { data: (key: string) => number | null }) => {
              const yearA = a.data('year') || 0;
              const yearB = b.data('year') || 0;
              return yearA - yearB;
            },
          };

        case 'hybrid': {
          // Connected Papers-inspired hybrid layout:
          // NO alignment constraints - natural force-directed clustering
          // Phantom edges provide gentle attraction between similar papers

          return {
            name: 'fcose',
            ...baseConfig,
            quality: 'proof',

            // Start with random positions to avoid local minima
            randomize: true,

            // NO alignment constraints - let force simulation work naturally

            // Balanced node repulsion - auto-clusters get higher repulsion
            nodeRepulsion: (node: { data: (key: string) => number | string | boolean | null }): number => {
              const isAutoCluster = node.data('isAutoCluster') as boolean;
              const paperCount = (node.data('paperCount') as number) || 1;
              const citations = (node.data('citationCount') as number) || 0;
              const citationBonus = Math.log10(citations + 10) / 3;
              const scaledRepulsion = Math.min(
                LAYOUT_CONSTANTS.MAX_REPULSION,
                LAYOUT_CONSTANTS.BASE_REPULSION + nodeCount * LAYOUT_CONSTANTS.REPULSION_PER_NODE
              );
              // Auto-clusters get higher repulsion based on how many papers they contain
              const clusterBonus = isAutoCluster ? 1 + (paperCount - 1) * 0.3 : 1;
              return scaledRepulsion * (1 + citationBonus * 0.3) * clusterBonus;
            },

            // Shorter edge lengths for compact layout
            idealEdgeLength: (edge: { data: (key: string) => boolean | number }): number => {
              const isPhantom = edge.data('isPhantom') as boolean;
              const similarity = (edge.data('similarity') as number) || 0.5;

              if (isPhantom) {
                // Phantom edges: longer but similarity brings closer
                return LAYOUT_CONSTANTS.MIN_EDGE_LENGTH * (1.4 - similarity * 0.3);
              }
              return LAYOUT_CONSTANTS.MIN_EDGE_LENGTH * 0.9;
            },

            // Phantom edges are weaker
            edgeElasticity: (edge: { data: (key: string) => boolean }): number => {
              const isPhantom = edge.data('isPhantom');
              return isPhantom ? 0.1 : 0.45;
            },

            // Higher gravity for compact layout
            gravity: LAYOUT_CONSTANTS.BASE_GRAVITY * hybridConfig.thesisGravityStrength,
            gravityRange: LAYOUT_CONSTANTS.GRAVITY_RANGE,
            gravityCompound: 1.2,
            gravityRangeCompound: 2.0,

            nestingFactor: 0.1,

            numIter: Math.min(
              LAYOUT_CONSTANTS.MAX_ITERATIONS,
              LAYOUT_CONSTANTS.BASE_ITERATIONS + nodeCount * LAYOUT_CONSTANTS.ITERATIONS_PER_NODE
            ),

            tile: true,
            tilingPaddingVertical: LAYOUT_CONSTANTS.TILING_PADDING,
            tilingPaddingHorizontal: LAYOUT_CONSTANTS.TILING_PADDING,

            // Don't include labels - post-processing handles overlaps
            nodeDimensionsIncludeLabels: false,
            nodeOverlap: LAYOUT_CONSTANTS.MIN_NODE_OVERLAP,

            initialEnergyOnIncremental: 0.3,
            packComponents: true,
            step: 'all',
          };
        }

        default:
          return { name: 'fcose', ...baseConfig };
      }
    },
    [visiblePapers, filteredConnections, normalizeAxisValues, scatterXAxis, scatterYAxis, ROLE_ORDER, hybridConfig.thesisGravityStrength]
  );

  // Run layout with proper cleanup and post-layout overlap removal
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
        // POST-LAYOUT OVERLAP REMOVAL
        // Only run for force-directed layouts where node position is fluid
        // Skip for preset layouts (temporal, scatter) where position has semantic meaning
        const skipOverlapRemoval = ['temporal', 'scatter', 'concentric', 'circle', 'grid'].includes(layoutType);

        if (!skipOverlapRemoval && cyRef.current && cyRef.current.nodes().length > 1) {
          const moved = removeOverlaps(cyRef.current);
          if (moved > 0) {
            console.log(`[GraphView] Overlap removal moved nodes by ${moved.toFixed(1)}px total`);
            // Fit the view after overlap removal
            cyRef.current.fit(undefined, 50);
          }
        }

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

  // Handle user-created cluster node click
  const handleClusterNodeClick = useCallback(
    (clusterId: string) => {
      onToggleClusterCollapse(clusterId);
    },
    [onToggleClusterCollapse]
  );

  // Handle auto-cluster node click (expand/collapse)
  const handleAutoClusterNodeClick = useCallback(
    (clusterId: string) => {
      setExpandedClusterIds(prev => {
        const next = new Set(prev);
        if (next.has(clusterId)) {
          next.delete(clusterId);
        } else {
          next.add(clusterId);
        }
        return next;
      });
    },
    []
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

        // Check if it's an auto-cluster node (from Similar layout)
        if (nodeData.isAutoCluster) {
          handleAutoClusterNodeClick(nodeId);
          return;
        }

        // Check if it's a user-created cluster node
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
        const nodeData = node.data();
        const currentMode = toolModeRef.current;

        // Skip hover effects for discovery/user-cluster nodes or when in focus mode with a focused node
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

        // Handle auto-cluster node hover - show cluster info tooltip
        if (nodeData.isAutoCluster && containerRef.current) {
          const renderedPos = node.renderedPosition();
          const containerRect = containerRef.current.getBoundingClientRect();
          // Create a pseudo-paper object for the tooltip
          const clusterPaperIds = nodeData.paperIds as string[];
          const clusterPapers = papersRef.current.filter(p => clusterPaperIds?.includes(p.id));
          if (clusterPapers.length > 0) {
            setHoveredPaper({
              ...clusterPapers[0],
              id: nodeId,
              title: nodeData.label,
              takeaway: clusterPapers.map(p => `• ${p.title}`).slice(0, 5).join('\n') +
                (clusterPapers.length > 5 ? `\n  ...and ${clusterPapers.length - 5} more` : ''),
              authors: [{ name: `Click to expand ${clusterPapers.length} papers` }],
            });
            setTooltipPos({
              x: Math.min(renderedPos.x, containerRect.width - 280),
              y: renderedPos.y,
            });
          }
          return;
        }

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
      handleAutoClusterNodeClick,
      toggleNodeSelection,
      focusedNodeId,
    ]
  );

  // Re-run layout when filter, layout type, scatter axes, or clustering changes
  useEffect(() => {
    if (cyRef.current && !isFirstRender.current) {
      runLayout(true);
    }
  }, [filteredPapers.length, showEdges, layoutType, discoveryElements.length, scatterXAxis, scatterYAxis, autoClusters.length, enableAutoClustering, expandedClusterIds.size]);

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
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 flex items-start justify-between pointer-events-none">
        {/* Left Toolbar Group */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {/* Quick Add Button */}
          {onOpenAddPaper && (
            <button
              onClick={onOpenAddPaper}
              className="p-2 sm:p-2.5 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-xl shadow-lg transition-colors touch-manipulation"
              title="Add Paper"
            >
              <Plus size={18} />
            </button>
          )}

          {/* Navigation Tools */}
          <div className="flex bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button
              onClick={() => handleZoom(1.3)}
              className="p-2 sm:p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 transition-colors border-r border-slate-200 dark:border-slate-700 touch-manipulation"
              title="Zoom In"
            >
              <ZoomIn size={18} className="text-slate-600 dark:text-slate-300" />
            </button>
            <button
              onClick={() => handleZoom(0.7)}
              className="p-2 sm:p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 transition-colors border-r border-slate-200 dark:border-slate-700 touch-manipulation"
              title="Zoom Out"
            >
              <ZoomOut size={18} className="text-slate-600 dark:text-slate-300" />
            </button>
            <button
              onClick={handleFit}
              className="p-2 sm:p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 transition-colors touch-manipulation"
              title="Fit to View"
            >
              <Maximize2 size={18} className="text-slate-600 dark:text-slate-300" />
            </button>
          </div>

          {/* Tool Mode Group - hidden on small mobile, show on sm+ */}
          <div className="hidden sm:flex bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button
              onClick={() => setToolMode('pointer')}
              className={`p-2 sm:p-2.5 transition-all duration-200 border-r border-slate-200 dark:border-slate-700 touch-manipulation ${
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
              className={`p-2 sm:p-2.5 transition-all duration-200 border-r border-slate-200 dark:border-slate-700 touch-manipulation ${
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
              className={`p-2 sm:p-2.5 transition-all duration-200 border-r border-slate-200 dark:border-slate-700 touch-manipulation ${
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
              className={`p-2 sm:p-2.5 transition-all duration-200 border-r border-slate-200 dark:border-slate-700 touch-manipulation ${
                toolMode === 'discovery'
                  ? 'bg-stone-500 text-white'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
              title="Discovery Mode - Find similar papers"
            >
              <Compass size={18} />
            </button>
            <button
              onClick={() => setToolMode(toolMode === 'focus' ? 'pointer' : 'focus')}
              className={`p-2 sm:p-2.5 transition-all duration-200 touch-manipulation ${
                toolMode === 'focus'
                  ? 'bg-amber-500 text-white'
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
        <div className="absolute top-16 left-4 z-30 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 w-[260px] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Layout</h4>
            <button
              onClick={() => setShowLayoutPicker(false)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X size={14} className="text-slate-400" />
            </button>
          </div>
          <div className="space-y-1">
            {[
              { value: 'hybrid', label: 'Similar', desc: 'Clusters by content similarity', bestFor: 'Discovering hidden relationships' },
              { value: 'fcose', label: 'Force', desc: 'Physics-based, connected papers attract', bestFor: 'Seeing connection structure' },
              { value: 'role-clustered', label: 'Regions', desc: 'Fixed zones by thesis role', bestFor: 'Comparing supports vs contradicts' },
              { value: 'temporal', label: 'Timeline', desc: 'Papers arranged by publication year', bestFor: 'Understanding research evolution' },
              { value: 'scatter', label: 'Scatter', desc: 'Custom X/Y axes for analysis', bestFor: 'Finding correlations' },
              { value: 'concentric', label: 'Impact', desc: 'High-cited papers at center', bestFor: 'Identifying key papers' },
              { value: 'circle', label: 'Circle', desc: 'Papers in a ring, grouped by role', bestFor: 'Overview presentations' },
              { value: 'grid', label: 'Grid', desc: 'Orderly grid, sorted by year', bestFor: 'Systematic review' },
            ].map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => {
                  setLayoutType(value as LayoutType);
                  if (value !== 'scatter' && value !== 'hybrid') setShowLayoutPicker(false);
                }}
                className={`w-full px-3 py-2 text-left rounded-lg transition-all duration-150 ${
                  layoutType === value
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${layoutType === value ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                    {label}
                  </span>
                  {value === 'hybrid' && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${layoutType === value ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}>
                      NEW
                    </span>
                  )}
                </div>
                <p className={`text-[10px] mt-0.5 ${layoutType === value ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  {desc}
                </p>
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

              {/* Auto-Clustering Section */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-600">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">Clustering</div>

                {/* Enable Clustering Toggle */}
                <label className="flex items-center justify-between cursor-pointer mb-2">
                  <span className="text-xs text-slate-600 dark:text-slate-300">Merge similar papers</span>
                  <button
                    onClick={() => {
                      setEnableAutoClustering(!enableAutoClustering);
                      setExpandedClusterIds(new Set()); // Reset expanded state
                    }}
                    className={`w-9 h-5 rounded-full transition-colors ${
                      enableAutoClustering ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      enableAutoClustering ? 'translate-x-4' : 'translate-x-0.5'
                    }`} />
                  </button>
                </label>

                {/* Cluster Threshold - only show when enabled */}
                {enableAutoClustering && (
                  <>
                    <div className="mb-2">
                      <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                        Similarity required: {(clusterThreshold * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="30"
                        max="70"
                        value={clusterThreshold * 100}
                        onChange={(e) => setClusterThreshold(parseInt(e.target.value) / 100)}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                        <span>Loose (more merging)</span>
                        <span>Strict (less merging)</span>
                      </div>
                    </div>

                    {/* Cluster stats */}
                    <div className="text-[10px] text-slate-400">
                      {autoClusters.length} clusters • {autoClusters.reduce((sum, c) => sum + c.paperIds.length, 0)} papers grouped
                    </div>

                    {/* Expand all / Collapse all */}
                    {autoClusters.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={() => setExpandedClusterIds(new Set(autoClusters.map(c => c.id)))}
                          className="flex-1 px-2 py-1 text-[10px] bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          Expand All
                        </button>
                        <button
                          onClick={() => setExpandedClusterIds(new Set())}
                          className="flex-1 px-2 py-1 text-[10px] bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          Collapse All
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Visual Encoding Section */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-600">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">Visual Encoding</div>

                {/* Node Color Mode */}
                <div className="mb-2">
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Color by</label>
                  <div className="flex gap-1">
                    {(['role', 'year'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setHybridConfig(prev => ({ ...prev, nodeColorMetric: mode }))}
                        className={`flex-1 px-2 py-1 text-[10px] rounded transition-all ${
                          hybridConfig.nodeColorMetric === mode
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-50 dark:bg-slate-700 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {mode === 'role' ? 'Role' : 'Year'}
                      </button>
                    ))}
                  </div>
                  {hybridConfig.nodeColorMetric === 'year' && (
                    <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400">
                      <span>{yearRange.min}</span>
                      <span className="flex-1 mx-2 h-1.5 rounded" style={{
                        background: 'linear-gradient(to right, #93c5fd, #1e40af)'
                      }} />
                      <span>{yearRange.max}</span>
                    </div>
                  )}
                </div>

                {/* Node Size Mode */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Size by</label>
                  <div className="flex gap-1">
                    {(['fixed', 'citations', 'connections'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setHybridConfig(prev => ({ ...prev, nodeSizeMetric: mode }))}
                        className={`flex-1 px-1.5 py-1 text-[10px] rounded transition-all ${
                          hybridConfig.nodeSizeMetric === mode
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-50 dark:bg-slate-700 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {mode === 'fixed' ? 'Fixed' : mode === 'citations' ? 'Cites' : 'Links'}
                      </button>
                    ))}
                  </div>
                </div>
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
          toolMode === 'discovery' ? 'bg-stone-500 text-white' :
          toolMode === 'focus' ? 'bg-amber-500 text-white' : 'bg-slate-500 text-white'
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

      {/* Legend & Stats - Bottom Left - hidden on very small screens */}
      <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 px-2 sm:px-3 py-2 sm:py-2.5 max-w-[200px] sm:max-w-none">
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
                  <div className="w-2 h-2 rounded-full bg-stone-500/50 border border-stone-500 border-dashed" />
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
