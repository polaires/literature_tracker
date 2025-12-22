import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import type { Core, ElementDefinition } from 'cytoscape';
import type { Paper, Connection, ThesisRole, PaperCluster } from '../../types';
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
} from 'lucide-react';

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
  onViewPdf?: (url: string) => void;
  onCreateCluster: (name: string, paperIds: string[]) => void;
  onToggleClusterCollapse: (clusterId: string) => void;
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

type LayoutType = 'fcose' | 'role-clustered' | 'temporal' | 'scatter' | 'concentric' | 'circle' | 'grid';

type ScatterAxisType = 'year' | 'citations' | 'connections' | 'added';

interface DiscoveryState {
  sourcePaperId: string | null;
  papers: SemanticScholarPaper[];
  loading: boolean;
  error: string | null;
}

export function GraphView({
  thesis: _thesis,
  papers,
  connections,
  clusters,
  onPaperSelect,
  onAddPaper,
  onOpenSearch,
  onViewPdf,
  onCreateCluster,
  onToggleClusterCollapse,
}: GraphViewProps) {
  void _thesis; // Available for future use (e.g., thesis-centered layout)
  const cyRef = useRef<Core | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<ReturnType<Core['layout']> | null>(null);
  const isFirstRender = useRef(true);

  // Refs to track current state for event handlers (avoid stale closures)
  const discoveryModeRef = useRef(false);
  const selectModeRef = useRef(false);
  const papersRef = useRef<Paper[]>([]);
  const fetchSimilarPapersRef = useRef<(paper: { id?: string; semanticScholarId?: string | null; doi?: string | null; title: string }) => void>(() => {});

  // UI state
  const [activeRoles, setActiveRoles] = useState<Set<ThesisRole>>(
    new Set(['supports', 'contradicts', 'method', 'background', 'other'])
  );
  const [showEdges, setShowEdges] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [layoutType, setLayoutType] = useState<LayoutType>('fcose');
  const [hoveredPaper, setHoveredPaper] = useState<Paper | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isLayoutRunning, setIsLayoutRunning] = useState(false);

  // Phase 4: Discovery Mode state
  const [discoveryMode, setDiscoveryMode] = useState(false);
  const [discoveryState, setDiscoveryState] = useState<DiscoveryState>({
    sourcePaperId: null,
    papers: [],
    loading: false,
    error: null,
  });
  const [selectedDiscoveryPaper, setSelectedDiscoveryPaper] = useState<SemanticScholarPaper | null>(null);

  // Phase 4: Multi-select for clustering
  const [selectMode, setSelectMode] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [showClusterModal, setShowClusterModal] = useState(false);
  const [newClusterName, setNewClusterName] = useState('');

  // Phase 4: Filter - hide screening papers
  const [hideScreening, setHideScreening] = useState(false);

  // Scatter plot axis configuration
  const [scatterXAxis, setScatterXAxis] = useState<ScatterAxisType>('year');
  const [scatterYAxis, setScatterYAxis] = useState<ScatterAxisType>('citations');

  // Keep refs in sync with state (for event handlers to avoid stale closures)
  useEffect(() => {
    discoveryModeRef.current = discoveryMode;
  }, [discoveryMode]);

  useEffect(() => {
    selectModeRef.current = selectMode;
  }, [selectMode]);

  useEffect(() => {
    papersRef.current = papers;
  }, [papers]);

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

  // Get papers that are in collapsed clusters
  const collapsedClusterPaperIds = useMemo(() => {
    const ids = new Set<string>();
    clusters.filter((c) => c.isCollapsed).forEach((c) => {
      c.paperIds.forEach((id) => ids.add(id));
    });
    return ids;
  }, [clusters]);

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
    // Filter out papers that are in collapsed clusters
    const visiblePapers = filteredPapers.filter((p) => !collapsedClusterPaperIds.has(p.id));

    const nodes: ElementDefinition[] = visiblePapers.map((paper) => ({
      data: {
        id: paper.id,
        label: getShortLabel(paper),
        role: paper.thesisRole,
        year: paper.year,
        citationCount: paper.citationCount || 0,
        isSelected: selectedNodes.has(paper.id),
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

    return [...nodes, ...clusterNodes, ...edges];
  }, [filteredPapers, filteredConnections, showEdges, selectedNodes, clusters, collapsedClusterPaperIds, filteredPaperIds, getShortLabel]);

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
    []
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

      const nodeCount = filteredPapers.length;

      switch (type) {
        case 'fcose': {
          // Cognitively-optimized force-directed layout
          // Design principles:
          // 1. Semantic grouping: Papers with same role cluster together
          // 2. Debate visualization: Supports on left, Contradicts on right
          // 3. Prominence: High-citation papers get more space
          // 4. Connection clarity: Connected papers stay close

          // Group papers by role for relative placement
          const supportsIds = filteredPapers.filter(p => p.thesisRole === 'supports').map(p => p.id);
          const contradictsIds = filteredPapers.filter(p => p.thesisRole === 'contradicts').map(p => p.id);
          const methodIds = filteredPapers.filter(p => p.thesisRole === 'method').map(p => p.id);
          const backgroundIds = filteredPapers.filter(p => p.thesisRole === 'background').map(p => p.id);

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

          const supportsIds = filteredPapers.filter(p => p.thesisRole === 'supports').map(p => p.id);
          const contradictsIds = filteredPapers.filter(p => p.thesisRole === 'contradicts').map(p => p.id);
          const methodIds = filteredPapers.filter(p => p.thesisRole === 'method').map(p => p.id);
          const backgroundIds = filteredPapers.filter(p => p.thesisRole === 'background').map(p => p.id);
          const otherIds = filteredPapers.filter(p => p.thesisRole === 'other').map(p => p.id);

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
          const papersWithYear = filteredPapers.filter((p) => p.year);
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
          const xNormalized = normalizeAxisValues(filteredPapers, scatterXAxis);
          // eslint-disable-next-line no-case-declarations
          const yNormalized = normalizeAxisValues(filteredPapers, scatterYAxis);

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

        default:
          return { name: 'fcose', ...baseConfig };
      }
    },
    [filteredPapers, normalizeAxisValues, scatterXAxis, scatterYAxis, ROLE_ORDER]
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
      setSelectMode(false);
    }
  }, [selectedNodes, newClusterName, onCreateCluster]);

  // Initialize cytoscape
  const handleCy = useCallback(
    (cy: Core) => {
      cyRef.current = cy;

      // Smooth zooming
      cy.on('zoom', () => {
        cy.style().update();
      });

      // Click handler - uses refs to avoid stale closures
      cy.on('tap', 'node', (event) => {
        const nodeId = event.target.id();
        const nodeData = event.target.data();

        console.log('[GraphView] Node clicked:', nodeId, 'discoveryMode:', discoveryModeRef.current);

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

        // Discovery mode: fetch similar papers (use refs to get current values)
        if (discoveryModeRef.current) {
          const paper = papersRef.current.find((p) => p.id === nodeId);
          console.log('[GraphView] Discovery mode active, paper:', paper?.title, 'semanticScholarId:', paper?.semanticScholarId, 'doi:', paper?.doi);
          if (paper) {
            // Pass the full paper info including id for caching
            fetchSimilarPapersRef.current({
              id: paper.id,
              semanticScholarId: paper.semanticScholarId,
              doi: paper.doi,
              title: paper.title,
            });
          } else {
            console.warn('Paper not found for node:', nodeId);
          }
          return;
        }

        // Select mode: toggle selection (use ref to get current value)
        if (selectModeRef.current || event.originalEvent.shiftKey) {
          toggleNodeSelection(nodeId);
          return;
        }

        // Normal mode: select paper
        onPaperSelect(nodeId);
      });

      // Hover effects with smooth transitions
      cy.on('mouseover', 'node', (event) => {
        const node = event.target;
        const nodeId = node.id();

        // Skip hover effects for discovery/cluster nodes
        if (nodeId.startsWith('discovery_') || nodeId.startsWith('cluster_')) {
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
    ]
  );

  // Re-run layout when filter, layout type, or scatter axes change
  useEffect(() => {
    if (cyRef.current && !isFirstRender.current) {
      runLayout(true);
    }
  }, [filteredPapers.length, showEdges, layoutType, discoveryElements.length, scatterXAxis, scatterYAxis]);

  // Clear discovery when exiting discovery mode
  useEffect(() => {
    if (!discoveryMode) {
      clearDiscovery();
    }
  }, [discoveryMode, clearDiscovery]);

  // Clear selection when exiting select mode
  useEffect(() => {
    if (!selectMode) {
      setSelectedNodes(new Set());
    }
  }, [selectMode]);

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

      {/* Control Panel - Top Left */}
      <div className="absolute top-4 left-4 flex items-start gap-2">
        {/* Zoom Controls */}
        <div className="flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => handleZoom(1.3)}
            className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={18} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div className="h-px bg-slate-200 dark:bg-slate-700" />
          <button
            onClick={() => handleZoom(0.7)}
            className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={18} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div className="h-px bg-slate-200 dark:bg-slate-700" />
          <button
            onClick={handleFit}
            className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title="Fit to View"
          >
            <Maximize2 size={18} className="text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 rounded-xl shadow-lg border transition-all duration-200 ${
            showFilters
              ? 'bg-indigo-500 border-indigo-500 text-white'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
          title="Filters"
        >
          <Filter size={18} />
        </button>

        {/* Discovery Mode Toggle */}
        <button
          onClick={() => setDiscoveryMode(!discoveryMode)}
          className={`p-2.5 rounded-xl shadow-lg border transition-all duration-200 ${
            discoveryMode
              ? 'bg-purple-500 border-purple-500 text-white'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
          title="Discovery Mode - Click papers to find similar"
        >
          <Compass size={18} />
        </button>

        {/* Select Mode Toggle (for clustering) */}
        <button
          onClick={() => setSelectMode(!selectMode)}
          className={`p-2.5 rounded-xl shadow-lg border transition-all duration-200 ${
            selectMode
              ? 'bg-cyan-500 border-cyan-500 text-white'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
          title="Select Mode - Click papers to create clusters"
        >
          <Layers size={18} />
        </button>

        {/* Filter Panel */}
        {showFilters && (
          <div className="absolute top-0 left-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 min-w-[220px] animate-in fade-in slide-in-from-left-2 duration-200">
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

            {/* Layout Selector */}
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 px-1">
                Layout
              </label>
              <div className="grid grid-cols-2 gap-1">
                {[
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
                    onClick={() => setLayoutType(value as LayoutType)}
                    title={desc}
                    className={`px-2.5 py-1.5 text-xs rounded-lg transition-all duration-150 ${
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
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                      X-Axis
                    </label>
                    <div className="flex gap-1">
                      {[
                        { value: 'year', label: 'Year' },
                        { value: 'citations', label: 'Cites' },
                        { value: 'connections', label: 'Links' },
                        { value: 'added', label: 'Added' },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => setScatterXAxis(value as ScatterAxisType)}
                          className={`flex-1 px-1.5 py-1 text-[10px] rounded transition-all ${
                            scatterXAxis === value
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                      Y-Axis
                    </label>
                    <div className="flex gap-1">
                      {[
                        { value: 'year', label: 'Year' },
                        { value: 'citations', label: 'Cites' },
                        { value: 'connections', label: 'Links' },
                        { value: 'added', label: 'Added' },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => setScatterYAxis(value as ScatterAxisType)}
                          className={`flex-1 px-1.5 py-1 text-[10px] rounded transition-all ${
                            scatterYAxis === value
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 pt-1">
                    High-impact recent → top-right
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Discovery Mode Banner */}
      {discoveryMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium flex items-center gap-2">
          <Compass size={16} />
          Discovery Mode: Click a paper to find similar
        </div>
      )}

      {/* Select Mode Banner */}
      {selectMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium flex items-center gap-2">
          <Layers size={16} />
          Select Mode: Click papers to group (Shift+Click)
        </div>
      )}

      {/* Multi-select Action Bar */}
      {selectedNodes.size >= 2 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {selectedNodes.size} papers selected
          </span>
          <button
            onClick={() => setShowClusterModal(true)}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Create Cluster
          </button>
          <button
            onClick={() => setSelectedNodes(new Set())}
            className="px-3 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm transition-colors"
          >
            Clear
          </button>
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
      {discoveryMode && (discoveryState.loading || discoveryState.papers.length > 0 || discoveryState.error) && (
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

      {/* Stats Badge - Top Right */}
      <div className="absolute top-4 right-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {filteredPapers.length}
            </span>
            <span className="text-slate-400">papers</span>
          </div>
          {showEdges && filteredConnections.length > 0 && (
            <>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {filteredConnections.length}
                </span>
                <span className="text-slate-400">links</span>
              </div>
            </>
          )}
          {clusters.length > 0 && (
            <>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {clusters.length}
                </span>
                <span className="text-slate-400">clusters</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Compact Legend - Bottom Left */}
      <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5">
        <div className="flex items-center gap-3">
          {(Object.entries(ROLE_COLORS) as [ThesisRole, (typeof ROLE_COLORS)[ThesisRole]][])
            .filter(([role]) => activeRoles.has(role))
            .map(([role, colors]) => (
              <div key={role} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: colors.bg }}
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">{colors.label}</span>
              </div>
            ))}
          {discoveryMode && (
            <>
              <div className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500/50 border border-purple-500 border-dashed" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Discovered</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Instructions - Bottom Right */}
      <div className="absolute bottom-4 right-4 text-[11px] text-slate-400 dark:text-slate-500">
        {discoveryMode
          ? 'Click paper to discover similar'
          : selectMode
          ? 'Click to select • Shift+Click for multiple'
          : 'Click to select • Hover to explore • Scroll to zoom'}
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
