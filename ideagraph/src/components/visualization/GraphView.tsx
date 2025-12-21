import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import type { Core, ElementDefinition } from 'cytoscape';
import type { Paper, Connection, Thesis, ThesisRole } from '../../types';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Eye,
  EyeOff,
  ChevronDown,
} from 'lucide-react';

// Register fcose layout
cytoscape.use(fcose);

interface GraphViewProps {
  thesis: Thesis;
  papers: Paper[];
  connections: Connection[];
  onPaperSelect: (paperId: string) => void;
}

// Color mapping for thesis roles
const ROLE_COLORS: Record<ThesisRole, { bg: string; border: string; label: string }> = {
  supports: { bg: '#22c55e', border: '#16a34a', label: 'Supports' },
  contradicts: { bg: '#ef4444', border: '#dc2626', label: 'Contradicts' },
  method: { bg: '#3b82f6', border: '#2563eb', label: 'Method' },
  background: { bg: '#9ca3af', border: '#6b7280', label: 'Background' },
  other: { bg: '#a855f7', border: '#9333ea', label: 'Other' },
};

// Connection type colors and styles
const CONNECTION_STYLES: Record<string, { color: string; style: string; label: string }> = {
  supports: { color: '#22c55e', style: 'solid', label: 'Supports' },
  contradicts: { color: '#ef4444', style: 'dashed', label: 'Contradicts' },
  extends: { color: '#f59e0b', style: 'solid', label: 'Extends' },
  critiques: { color: '#f97316', style: 'dashed', label: 'Critiques' },
  reviews: { color: '#8b5cf6', style: 'solid', label: 'Reviews' },
  'uses-method': { color: '#06b6d4', style: 'dotted', label: 'Uses Method' },
  'same-topic': { color: '#64748b', style: 'dotted', label: 'Same Topic' },
  replicates: { color: '#10b981', style: 'solid', label: 'Replicates' },
};

type LayoutType = 'fcose' | 'concentric' | 'circle' | 'grid';

export function GraphView({ papers, connections, onPaperSelect }: GraphViewProps) {
  const cyRef = useRef<Core | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [activeRoles, setActiveRoles] = useState<Set<ThesisRole>>(
    new Set(['supports', 'contradicts', 'method', 'background', 'other'])
  );
  const [showEdges, setShowEdges] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [layoutType, setLayoutType] = useState<LayoutType>('fcose');
  const [hoveredPaper, setHoveredPaper] = useState<Paper | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Filter papers by active roles
  const filteredPapers = useMemo(
    () => papers.filter((p) => activeRoles.has(p.thesisRole)),
    [papers, activeRoles]
  );

  const filteredPaperIds = useMemo(
    () => new Set(filteredPapers.map((p) => p.id)),
    [filteredPapers]
  );

  // Filter connections to only include visible papers
  const filteredConnections = useMemo(
    () =>
      connections.filter(
        (c) => filteredPaperIds.has(c.fromPaperId) && filteredPaperIds.has(c.toPaperId)
      ),
    [connections, filteredPaperIds]
  );

  // Build graph elements (papers only, no thesis node)
  const elements = useMemo<ElementDefinition[]>(() => {
    const nodes: ElementDefinition[] = filteredPapers.map((paper) => ({
      data: {
        id: paper.id,
        label: paper.title.length > 25 ? paper.title.slice(0, 25) + '...' : paper.title,
        fullTitle: paper.title,
        type: 'paper',
        role: paper.thesisRole,
        takeaway: paper.takeaway,
        year: paper.year,
        authors: paper.authors.map((a) => a.name).join(', '),
        citationCount: paper.citationCount,
      },
    }));

    const edges: ElementDefinition[] = showEdges
      ? filteredConnections.map((conn) => ({
          data: {
            id: conn.id,
            source: conn.fromPaperId,
            target: conn.toPaperId,
            type: conn.type,
            label: conn.type.replace(/-/g, ' '),
            note: conn.note,
          },
        }))
      : [];

    return [...nodes, ...edges];
  }, [filteredPapers, filteredConnections, showEdges]);

  // Cytoscape stylesheet
  const stylesheet = useMemo(
    () => [
      // Paper nodes - base style
      {
        selector: 'node',
        style: {
          'background-color': '#e5e7eb',
          label: 'data(label)',
          width: 50,
          height: 50,
          'font-size': 9,
          'text-wrap': 'wrap',
          'text-max-width': 70,
          'text-valign': 'bottom',
          'text-margin-y': 6,
          color: '#374151',
          'text-outline-color': '#ffffff',
          'text-outline-width': 1,
          'border-width': 2,
          'border-color': '#d1d5db',
        },
      },
      // Role-based coloring
      ...Object.entries(ROLE_COLORS).map(([role, colors]) => ({
        selector: `node[role="${role}"]`,
        style: {
          'background-color': colors.bg,
          'border-color': colors.border,
        },
      })),
      // Edge base style
      {
        selector: 'edge',
        style: {
          width: 2,
          'line-color': '#94a3b8',
          'target-arrow-color': '#94a3b8',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'arrow-scale': 0.8,
          opacity: 0.7,
        },
      },
      // Edge type styling
      ...Object.entries(CONNECTION_STYLES).map(([type, style]) => ({
        selector: `edge[type="${type}"]`,
        style: {
          'line-color': style.color,
          'target-arrow-color': style.color,
          'line-style': style.style as 'solid' | 'dashed' | 'dotted',
        },
      })),
      // Selected node
      {
        selector: 'node:selected',
        style: {
          'border-width': 4,
          'border-color': '#6366f1',
          'background-blacken': -0.1,
        },
      },
      // Hover highlight - node neighbors stay visible
      {
        selector: '.highlighted',
        style: {
          opacity: 1,
          'border-width': 3,
        },
      },
      // Dim non-neighbors on hover
      {
        selector: '.dimmed',
        style: {
          opacity: 0.15,
        },
      },
      // Edge on hover
      {
        selector: 'edge.highlighted',
        style: {
          width: 3,
          opacity: 1,
        },
      },
    ],
    []
  );

  // Layout configurations
  const getLayoutConfig = useCallback(
    (type: LayoutType) => {
      const baseConfig = {
        animate: true,
        animationDuration: 500,
        fit: true,
        padding: 40,
      };

      switch (type) {
        case 'fcose':
          return {
            name: 'fcose',
            ...baseConfig,
            quality: 'proof',
            randomize: true,
            nodeRepulsion: () => 8000,
            idealEdgeLength: () => 120,
            edgeElasticity: () => 0.45,
            nestingFactor: 0.1,
            gravity: 0.25,
            numIter: 2500,
            tile: true,
            nodeDimensionsIncludeLabels: true,
          };
        case 'concentric':
          return {
            name: 'concentric',
            ...baseConfig,
            minNodeSpacing: 50,
            concentric: (node: { data: (key: string) => number | null }) => {
              const citations = node.data('citationCount') || 0;
              return citations;
            },
            levelWidth: () => 2,
          };
        case 'circle':
          return {
            name: 'circle',
            ...baseConfig,
            spacingFactor: 1.5,
            startAngle: (3 / 2) * Math.PI,
            sweep: 2 * Math.PI,
          };
        case 'grid':
          return {
            name: 'grid',
            ...baseConfig,
            rows: Math.ceil(Math.sqrt(filteredPapers.length)),
            condense: true,
          };
        default:
          return { name: 'fcose', ...baseConfig };
      }
    },
    [filteredPapers.length]
  );

  // Handle Cytoscape instance
  const handleCy = useCallback(
    (cy: Core) => {
      cyRef.current = cy;

      // Click on paper node
      cy.on('tap', 'node', (event) => {
        const paperId = event.target.id();
        onPaperSelect(paperId);
      });

      // Hover effects - highlight neighborhood
      cy.on('mouseover', 'node', (event) => {
        const node = event.target;
        const neighborhood = node.neighborhood().add(node);

        cy.elements().addClass('dimmed');
        neighborhood.removeClass('dimmed').addClass('highlighted');

        // Show tooltip
        const paper = papers.find((p) => p.id === node.id());
        if (paper) {
          const renderedPos = node.renderedPosition();
          setHoveredPaper(paper);
          setTooltipPos({ x: renderedPos.x, y: renderedPos.y });
        }
      });

      cy.on('mouseout', 'node', () => {
        cy.elements().removeClass('dimmed highlighted');
        setHoveredPaper(null);
      });

      // Double-click to fit
      cy.on('dbltap', () => {
        cy.fit(cy.elements(), 50);
      });
    },
    [onPaperSelect, papers]
  );

  // Re-run layout when elements or layout type change
  useEffect(() => {
    if (cyRef.current && elements.length > 0) {
      const layout = cyRef.current.layout(getLayoutConfig(layoutType));
      layout.run();
    }
  }, [elements.length, layoutType, getLayoutConfig]);

  // Zoom controls
  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.2);
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() / 1.2);
    }
  };

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.fit(cyRef.current.elements(), 50);
    }
  };

  // Toggle role filter
  const toggleRole = (role: ThesisRole) => {
    setActiveRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) {
        next.delete(role);
      } else {
        next.add(role);
      }
      return next;
    });
  };

  if (papers.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        Add papers to see your knowledge graph
      </div>
    );
  }

  return (
    <div className="h-full w-full relative" ref={containerRef}>
      <CytoscapeComponent
        elements={elements}
        stylesheet={stylesheet as any}
        layout={getLayoutConfig(layoutType)}
        cy={handleCy}
        style={{ width: '100%', height: '100%' }}
        className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg"
        wheelSensitivity={0.3}
        minZoom={0.2}
        maxZoom={3}
      />

      {/* Controls - Top Left */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        {/* Zoom Controls */}
        <div className="flex flex-col bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={18} className="text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-700"
            title="Zoom Out"
          >
            <ZoomOut size={18} className="text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={handleFit}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-700"
            title="Fit to View"
          >
            <Maximize2 size={18} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-lg shadow-lg transition-colors ${
            showFilters
              ? 'bg-indigo-500 text-white'
              : 'bg-white/95 dark:bg-gray-800/95 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="Toggle Filters"
        >
          <Filter size={18} />
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="absolute top-4 left-16 bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-lg p-4 min-w-[200px]">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Filter by Role
          </h4>
          <div className="space-y-2">
            {(Object.entries(ROLE_COLORS) as [ThesisRole, typeof ROLE_COLORS[ThesisRole]][]).map(
              ([role, colors]) => (
                <label
                  key={role}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={activeRoles.has(role)}
                    onChange={() => toggleRole(role)}
                    className="rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.bg }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {colors.label}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">
                    ({papers.filter((p) => p.thesisRole === role).length})
                  </span>
                </label>
              )
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <button
                onClick={() => setShowEdges(!showEdges)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {showEdges ? (
                  <Eye size={16} className="text-gray-600 dark:text-gray-400" />
                ) : (
                  <EyeOff size={16} className="text-gray-400" />
                )}
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Show Connections
              </span>
            </label>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Layout
            </label>
            <div className="relative">
              <select
                value={layoutType}
                onChange={(e) => setLayoutType(e.target.value as LayoutType)}
                className="w-full text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 pr-8 appearance-none text-gray-700 dark:text-gray-300"
              >
                <option value="fcose">Force-Directed (Best)</option>
                <option value="concentric">By Citations</option>
                <option value="circle">Circle</option>
                <option value="grid">Grid</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Paper Count Badge */}
      <div className="absolute top-4 right-4 bg-white/95 dark:bg-gray-800/95 rounded-lg px-3 py-2 shadow-lg">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {filteredPapers.length}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400"> papers</span>
        {filteredConnections.length > 0 && (
          <>
            <span className="text-gray-400 mx-1">·</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {filteredConnections.length}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400"> connections</span>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-gray-800/95 rounded-lg p-3 shadow-lg max-w-xs">
        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Paper Roles
        </div>
        <div className="grid grid-cols-3 gap-x-3 gap-y-1">
          {(Object.entries(ROLE_COLORS) as [ThesisRole, typeof ROLE_COLORS[ThesisRole]][]).map(
            ([role, colors]) => (
              <div key={role} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: colors.bg }}
                />
                <span className="text-[10px] text-gray-600 dark:text-gray-400 capitalize truncate">
                  {role}
                </span>
              </div>
            )
          )}
        </div>

        {showEdges && filteredConnections.length > 0 && (
          <>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-3 mb-2">
              Connection Types
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {Object.entries(CONNECTION_STYLES)
                .filter(([type]) =>
                  filteredConnections.some((c) => c.type === type)
                )
                .map(([type, style]) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <div
                      className="w-4 h-0.5"
                      style={{
                        backgroundColor: style.color,
                        borderStyle: style.style,
                      }}
                    />
                    <span className="text-[10px] text-gray-600 dark:text-gray-400 capitalize truncate">
                      {style.label}
                    </span>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 rounded-lg px-3 py-2 text-[10px] text-gray-500 dark:text-gray-400 shadow-lg">
        Click paper to view • Hover to highlight • Double-click to fit
      </div>

      {/* Hover Tooltip */}
      {hoveredPaper && (
        <div
          className="absolute pointer-events-none z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 max-w-xs"
          style={{
            left: tooltipPos.x + 20,
            top: tooltipPos.y - 20,
            transform: 'translateY(-100%)',
          }}
        >
          <h4 className="font-medium text-gray-900 dark:text-white text-sm leading-tight">
            {hoveredPaper.title}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {hoveredPaper.authors.map((a) => a.name).join(', ')}
            {hoveredPaper.year && ` (${hoveredPaper.year})`}
          </p>
          {hoveredPaper.takeaway && (
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 italic">
              "{hoveredPaper.takeaway}"
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: ROLE_COLORS[hoveredPaper.thesisRole].bg }}
            >
              {hoveredPaper.thesisRole}
            </span>
            {hoveredPaper.citationCount !== null && (
              <span className="text-[10px] text-gray-400">
                {hoveredPaper.citationCount.toLocaleString()} citations
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
