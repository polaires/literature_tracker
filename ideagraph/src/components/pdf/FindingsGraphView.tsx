// FindingsGraphView Component
// Mini Cytoscape graph for visualizing paper-level findings and connections

import { useEffect, useRef, useState, useCallback, memo, useMemo } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import type { Core, ElementDefinition, EventObject } from 'cytoscape';
import type {
  ExtractedFinding,
  IntraPaperConnection,
  FindingType,
  IntraPaperConnectionType,
} from '../../types/paperGraph';
import {
  CheckCircle2,
  Sparkles,
  X,
} from 'lucide-react';

// =============================================================================
// Constants - Color mappings for finding types and connection types
// =============================================================================

export const FINDING_TYPE_COLORS: Record<FindingType, string> = {
  'central-finding': '#f59e0b',    // Amber
  'supporting-finding': '#22c55e', // Green
  'methodological': '#3b82f6',     // Blue
  'limitation': '#f97316',         // Orange
  'implication': '#a855f7',        // Purple
  'open-question': '#06b6d4',      // Cyan
  'background': '#78716c',         // Stone
};

export const FINDING_TYPE_DARK_COLORS: Record<FindingType, string> = {
  'central-finding': '#fbbf24',
  'supporting-finding': '#4ade80',
  'methodological': '#60a5fa',
  'limitation': '#fb923c',
  'implication': '#c084fc',
  'open-question': '#22d3ee',
  'background': '#a8a29e',
};

export const INTRA_CONNECTION_COLORS: Record<IntraPaperConnectionType, string> = {
  'supports': '#22c55e',    // Green
  'contradicts': '#ef4444', // Red
  'extends': '#3b82f6',     // Blue
  'requires': '#f97316',    // Orange
  'explains': '#a855f7',    // Purple
  'qualifies': '#78716c',   // Stone
};

const FINDING_TYPE_LABELS: Record<FindingType, string> = {
  'central-finding': 'Central',
  'supporting-finding': 'Supporting',
  'methodological': 'Method',
  'limitation': 'Limitation',
  'implication': 'Implication',
  'open-question': 'Question',
  'background': 'Background',
};

// =============================================================================
// Types
// =============================================================================

export interface FindingsGraphViewProps {
  findings: ExtractedFinding[];
  connections: IntraPaperConnection[];
  onFindingClick?: (findingId: string) => void;
  onFindingVerify?: (findingId: string, verified: boolean) => void;
  compact?: boolean; // For smaller containers like AI panel
  className?: string;
  showTooltip?: boolean;
}

interface TooltipData {
  finding: ExtractedFinding;
  position: { x: number; y: number };
}

// =============================================================================
// Stylesheet
// =============================================================================

function getStylesheet(compact: boolean) {
  const nodeSize = compact ? 28 : 36;
  const fontSize = compact ? 8 : 10;
  const edgeWidth = compact ? 1.5 : 2;

  return [
    // Base node style
    {
      selector: 'node',
      style: {
        'width': nodeSize,
        'height': nodeSize,
        'background-color': 'data(color)',
        'border-width': 2,
        'border-color': '#d1d5db',
        'label': 'data(shortLabel)',
        'font-size': fontSize,
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 4,
        'color': '#57534e',
        'text-outline-color': '#ffffff',
        'text-outline-width': 1,
        'text-wrap': 'ellipsis',
        'text-max-width': compact ? '60px' : '80px',
        'opacity': 'data(opacity)',
      } as Record<string, unknown>,
    },
    // Verified findings have green border
    {
      selector: 'node[?verified]',
      style: {
        'border-color': '#22c55e',
        'border-width': 3,
      } as Record<string, unknown>,
    },
    // Hovered node
    {
      selector: 'node:active, node:selected',
      style: {
        'border-color': '#0ea5e9',
        'border-width': 3,
        'overlay-color': '#0ea5e9',
        'overlay-padding': 4,
        'overlay-opacity': 0.15,
      } as Record<string, unknown>,
    },
    // Central findings are slightly larger
    {
      selector: 'node[findingType = "central-finding"]',
      style: {
        'width': nodeSize * 1.3,
        'height': nodeSize * 1.3,
        'font-size': fontSize + 1,
        'font-weight': 'bold' as const,
      } as Record<string, unknown>,
    },
    // Base edge style
    {
      selector: 'edge',
      style: {
        'width': edgeWidth,
        'line-color': 'data(color)',
        'target-arrow-color': 'data(color)',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'opacity': 0.7,
        'arrow-scale': compact ? 0.8 : 1,
      } as Record<string, unknown>,
    },
    // Contradicts edges are dashed
    {
      selector: 'edge[connectionType = "contradicts"]',
      style: {
        'line-style': 'dashed',
      } as Record<string, unknown>,
    },
    // Requires edges are dotted
    {
      selector: 'edge[connectionType = "requires"]',
      style: {
        'line-style': 'dotted',
      } as Record<string, unknown>,
    },
    // Qualifies edges are dashed
    {
      selector: 'edge[connectionType = "qualifies"]',
      style: {
        'line-style': 'dashed',
      } as Record<string, unknown>,
    },
    // Hovered edge
    {
      selector: 'edge:active, edge:selected',
      style: {
        'width': edgeWidth + 1,
        'opacity': 1,
        'overlay-color': '#0ea5e9',
        'overlay-padding': 4,
        'overlay-opacity': 0.15,
      } as Record<string, unknown>,
    },
  ];
}

// =============================================================================
// Layout configuration
// =============================================================================

function getLayoutConfig(nodeCount: number, compact: boolean) {
  // Use concentric layout for small graphs, fcose for larger
  if (nodeCount <= 3) {
    return {
      name: 'circle',
      padding: compact ? 20 : 30,
      animate: false,
    };
  }

  return {
    name: 'fcose',
    quality: 'proof',
    animate: false,
    randomize: true,
    fit: true,
    padding: compact ? 15 : 25,
    // Node repulsion
    nodeRepulsion: Math.min(4000 + nodeCount * 200, 8000),
    idealEdgeLength: compact ? 60 : 80,
    edgeElasticity: 0.45,
    // Gravity to keep compact
    gravity: 0.5,
    gravityRange: 2.0,
    // Iterations
    numIter: Math.min(1500 + nodeCount * 50, 3000),
    // Tiling for disconnected components
    tile: true,
    tilingPaddingVertical: compact ? 15 : 25,
    tilingPaddingHorizontal: compact ? 15 : 25,
  };
}

// =============================================================================
// Component
// =============================================================================

export const FindingsGraphView = memo(function FindingsGraphView({
  findings,
  connections,
  onFindingClick,
  onFindingVerify,
  compact = false,
  className = '',
  showTooltip = true,
}: FindingsGraphViewProps) {
  const cyRef = useRef<Core | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  // Build graph elements
  const elements = useMemo((): ElementDefinition[] => {
    const nodes: ElementDefinition[] = findings.map((finding) => {
      const color = isDarkMode
        ? FINDING_TYPE_DARK_COLORS[finding.findingType]
        : FINDING_TYPE_COLORS[finding.findingType];

      // Opacity based on confidence (0.5 baseline + 0.5 * confidence)
      const opacity = 0.5 + (finding.confidence * 0.5);

      // Short label for display
      const shortLabel = finding.title.length > 15
        ? finding.title.slice(0, 15) + '...'
        : finding.title;

      return {
        data: {
          id: finding.id,
          label: finding.title,
          shortLabel,
          findingType: finding.findingType,
          color,
          opacity,
          verified: finding.userVerified,
          confidence: finding.confidence,
        },
      };
    });

    const edges: ElementDefinition[] = connections.map((conn) => ({
      data: {
        id: conn.id,
        source: conn.fromFindingId,
        target: conn.toFindingId,
        connectionType: conn.connectionType,
        color: INTRA_CONNECTION_COLORS[conn.connectionType],
        explanation: conn.explanation,
      },
    }));

    return [...nodes, ...edges];
  }, [findings, connections, isDarkMode]);

  // Handle Cytoscape instance
  const handleCy = useCallback((cy: Core) => {
    cyRef.current = cy;

    // Click handler for nodes
    cy.on('tap', 'node', (e: EventObject) => {
      const nodeId = e.target.id();
      if (onFindingClick) {
        onFindingClick(nodeId);
      }

      // Show tooltip if enabled
      if (showTooltip && containerRef.current) {
        const finding = findings.find(f => f.id === nodeId);
        if (finding) {
          const renderedPos = e.target.renderedPosition();
          setTooltip({
            finding,
            position: {
              x: renderedPos.x,
              y: renderedPos.y - 10,
            },
          });
        }
      }
    });

    // Double-click to verify
    cy.on('dbltap', 'node', (e: EventObject) => {
      const nodeId = e.target.id();
      const finding = findings.find(f => f.id === nodeId);
      if (finding && onFindingVerify) {
        onFindingVerify(nodeId, !finding.userVerified);
      }
    });

    // Close tooltip when clicking background
    cy.on('tap', (e: EventObject) => {
      if (e.target === cy) {
        setTooltip(null);
      }
    });

    // Run layout
    const layout = cy.layout(getLayoutConfig(findings.length, compact));
    layout.run();
  }, [findings, onFindingClick, onFindingVerify, showTooltip, compact]);

  // Close tooltip handler
  const closeTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

  // If no findings, show empty state
  if (findings.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 text-stone-400 dark:text-slate-500 ${className}`}>
        <Sparkles className="w-10 h-10 mb-2 opacity-50" />
        <p className="text-sm">No findings to display</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Legend */}
      <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1 max-w-[calc(100%-16px)]">
        {Object.entries(FINDING_TYPE_LABELS).map(([type, label]) => {
          const hasType = findings.some(f => f.findingType === type);
          if (!hasType) return null;

          return (
            <span
              key={type}
              className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: isDarkMode
                    ? FINDING_TYPE_DARK_COLORS[type as FindingType]
                    : FINDING_TYPE_COLORS[type as FindingType]
                }}
              />
              <span className="text-stone-600 dark:text-slate-300">{label}</span>
            </span>
          );
        })}
      </div>

      {/* Graph */}
      <CytoscapeComponent
        elements={elements}
        stylesheet={getStylesheet(compact)}
        cy={handleCy}
        style={{
          width: '100%',
          height: compact ? '200px' : '300px',
          backgroundColor: isDarkMode ? '#1e293b' : '#fafaf9',
          borderRadius: '0.5rem',
        }}
        wheelSensitivity={0.3}
        minZoom={0.3}
        maxZoom={2}
        boxSelectionEnabled={false}
        autounselectify={true}
      />

      {/* Stats bar */}
      <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-stone-500 dark:text-slate-400">
        <span>
          {findings.length} finding{findings.length !== 1 ? 's' : ''}
          {connections.length > 0 && ` • ${connections.length} connection${connections.length !== 1 ? 's' : ''}`}
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          {findings.filter(f => f.userVerified).length} verified
        </span>
      </div>

      {/* Tooltip */}
      {tooltip && showTooltip && (
        <div
          className="absolute z-20 w-64 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-stone-200 dark:border-slate-700"
          style={{
            left: Math.min(tooltip.position.x, (containerRef.current?.clientWidth || 300) - 270),
            top: Math.max(0, tooltip.position.y - 120),
          }}
        >
          <button
            onClick={closeTooltip}
            className="absolute top-2 right-2 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-slate-300"
          >
            <X className="w-3 h-3" />
          </button>

          <div className="flex items-start gap-2 mb-2">
            <span
              className="px-1.5 py-0.5 text-[10px] font-medium rounded"
              style={{
                backgroundColor: `${FINDING_TYPE_COLORS[tooltip.finding.findingType]}20`,
                color: FINDING_TYPE_COLORS[tooltip.finding.findingType],
              }}
            >
              {FINDING_TYPE_LABELS[tooltip.finding.findingType]}
            </span>
            {tooltip.finding.userVerified && (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
          </div>

          <h4 className="text-sm font-medium text-stone-800 dark:text-white mb-1">
            {tooltip.finding.title}
          </h4>

          <p className="text-xs text-stone-600 dark:text-slate-300 line-clamp-3 mb-2">
            {tooltip.finding.description}
          </p>

          <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-slate-400">
            <span>Confidence: {Math.round(tooltip.finding.confidence * 100)}%</span>
            {tooltip.finding.pageNumbers.length > 0 && (
              <span>p. {tooltip.finding.pageNumbers.join(', ')}</span>
            )}
          </div>

          {onFindingVerify && (
            <button
              onClick={() => {
                onFindingVerify(tooltip.finding.id, !tooltip.finding.userVerified);
                closeTooltip();
              }}
              className={`mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tooltip.finding.userVerified
                  ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {tooltip.finding.userVerified ? 'Verified' : 'Mark as Verified'}
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default FindingsGraphView;
