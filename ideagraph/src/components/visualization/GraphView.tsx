import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import type { Core, ElementDefinition } from 'cytoscape';
import type { Paper, Connection, ThesisRole } from '../../types';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Eye,
  EyeOff,
  LayoutGrid,
  X,
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
  onPaperSelect: (paperId: string) => void;
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

type LayoutType = 'fcose' | 'concentric' | 'circle' | 'grid';

export function GraphView({ papers, connections, onPaperSelect }: GraphViewProps) {
  const cyRef = useRef<Core | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<ReturnType<Core['layout']> | null>(null);
  const isFirstRender = useRef(true);

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

  // Memoized filtered data
  const filteredPapers = useMemo(
    () => papers.filter((p) => activeRoles.has(p.thesisRole)),
    [papers, activeRoles]
  );

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

  // Build graph elements
  const elements = useMemo<ElementDefinition[]>(() => {
    const nodes: ElementDefinition[] = filteredPapers.map((paper) => ({
      data: {
        id: paper.id,
        label: paper.title.length > 20 ? paper.title.slice(0, 20) + '…' : paper.title,
        role: paper.thesisRole,
        year: paper.year,
        citationCount: paper.citationCount || 0,
      },
    }));

    const edges: ElementDefinition[] = showEdges
      ? filteredConnections.map((conn) => ({
          data: {
            id: conn.id,
            source: conn.fromPaperId,
            target: conn.toPaperId,
            type: conn.type,
          },
        }))
      : [];

    return [...nodes, ...edges];
  }, [filteredPapers, filteredConnections, showEdges]);

  // Professional stylesheet with smooth styling
  const stylesheet = useMemo(
    () => [
      {
        selector: 'node',
        style: {
          'background-color': '#64748b',
          'background-opacity': 0.95,
          label: 'data(label)',
          width: 44,
          height: 44,
          'font-size': 10,
          'font-weight': 500,
          'font-family': 'Inter, system-ui, sans-serif',
          'text-wrap': 'wrap',
          'text-max-width': 80,
          'text-valign': 'bottom',
          'text-margin-y': 8,
          color: '#475569',
          'text-outline-color': '#ffffff',
          'text-outline-width': 2,
          'text-outline-opacity': 0.8,
          'border-width': 2,
          'border-color': '#ffffff',
          'border-opacity': 0.8,
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

  // Layout configurations optimized for smoothness
  const getLayoutConfig = useCallback(
    (type: LayoutType, animate = true) => {
      const baseConfig = {
        animate,
        animationDuration: animate ? 600 : 0,
        animationEasing: 'ease-out-cubic' as const,
        fit: true,
        padding: 50,
      };

      switch (type) {
        case 'fcose':
          return {
            name: 'fcose',
            ...baseConfig,
            quality: 'proof',
            randomize: false,
            nodeRepulsion: () => 6000,
            idealEdgeLength: () => 100,
            edgeElasticity: () => 0.45,
            nestingFactor: 0.1,
            gravity: 0.4,
            gravityRange: 3.8,
            numIter: 2500,
            tile: true,
            tilingPaddingVertical: 20,
            tilingPaddingHorizontal: 20,
            nodeDimensionsIncludeLabels: false,
          };
        case 'concentric':
          return {
            name: 'concentric',
            ...baseConfig,
            minNodeSpacing: 60,
            concentric: (node: { data: (key: string) => number }) => {
              return Math.log10((node.data('citationCount') || 1) + 1) * 10;
            },
            levelWidth: () => 2,
            spacingFactor: 1.2,
          };
        case 'circle':
          return {
            name: 'circle',
            ...baseConfig,
            spacingFactor: 1.8,
            avoidOverlap: true,
          };
        case 'grid':
          return {
            name: 'grid',
            ...baseConfig,
            rows: Math.ceil(Math.sqrt(filteredPapers.length)),
            avoidOverlap: true,
            avoidOverlapPadding: 20,
          };
        default:
          return { name: 'fcose', ...baseConfig };
      }
    },
    [filteredPapers.length]
  );

  // Run layout with proper cleanup
  const runLayout = useCallback(
    (animate = true) => {
      if (!cyRef.current || elements.length === 0) return;

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
    [elements.length, layoutType, getLayoutConfig]
  );

  // Initialize cytoscape
  const handleCy = useCallback(
    (cy: Core) => {
      cyRef.current = cy;

      // Smooth zooming
      cy.on('zoom', () => {
        cy.style().update();
      });

      // Click handler
      cy.on('tap', 'node', (event) => {
        onPaperSelect(event.target.id());
      });

      // Hover effects with smooth transitions
      cy.on('mouseover', 'node', (event) => {
        const node = event.target;
        const neighborhood = node.neighborhood().add(node);

        cy.elements().addClass('dimmed');
        neighborhood.removeClass('dimmed').addClass('highlighted');

        const paper = papers.find((p) => p.id === node.id());
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
    [onPaperSelect, papers, runLayout]
  );

  // Re-run layout when filter or layout type changes
  useEffect(() => {
    if (cyRef.current && !isFirstRender.current) {
      runLayout(true);
    }
  }, [filteredPapers.length, showEdges, layoutType]);

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
        elements={elements}
        stylesheet={stylesheet as any}
        layout={{ name: 'preset' }}
        cy={handleCy}
        style={{ width: '100%', height: '100%' }}
        className="bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
        wheelSensitivity={0.2}
        minZoom={0.3}
        maxZoom={2.5}
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

        {/* Filter Panel */}
        {showFilters && (
          <div className="absolute top-0 left-24 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 min-w-[220px] animate-in fade-in slide-in-from-left-2 duration-200">
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
              {(Object.entries(ROLE_COLORS) as [ThesisRole, typeof ROLE_COLORS[ThesisRole]][]).map(
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

            {/* Layout Selector */}
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 px-1">
                Layout
              </label>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { value: 'fcose', label: 'Auto' },
                  { value: 'concentric', label: 'Citations' },
                  { value: 'circle', label: 'Circle' },
                  { value: 'grid', label: 'Grid' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setLayoutType(value as LayoutType)}
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
            </div>
          </div>
        )}
      </div>

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
        </div>
      </div>

      {/* Compact Legend - Bottom Left */}
      <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5">
        <div className="flex items-center gap-3">
          {(Object.entries(ROLE_COLORS) as [ThesisRole, typeof ROLE_COLORS[ThesisRole]][])
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
        </div>
      </div>

      {/* Instructions - Bottom Right */}
      <div className="absolute bottom-4 right-4 text-[11px] text-slate-400 dark:text-slate-500">
        Click to select • Hover to explore • Scroll to zoom
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
