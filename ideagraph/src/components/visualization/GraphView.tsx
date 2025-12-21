import { useEffect, useRef, useMemo } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import type { Core, ElementDefinition } from 'cytoscape';
import type { Paper, Connection, Thesis } from '../../types';

interface GraphViewProps {
  thesis: Thesis;
  papers: Paper[];
  connections: Connection[];
  onPaperSelect: (paperId: string) => void;
}

// Color mapping for thesis roles
const ROLE_COLORS: Record<string, string> = {
  supports: '#22c55e',     // green
  contradicts: '#ef4444',  // red
  method: '#3b82f6',       // blue
  background: '#9ca3af',   // gray
  other: '#a855f7',        // purple
};


export function GraphView({ thesis, papers, connections, onPaperSelect }: GraphViewProps) {
  const cyRef = useRef<Core | null>(null);

  // Build graph elements
  const elements = useMemo<ElementDefinition[]>(() => {
    const nodes: ElementDefinition[] = [
      // Thesis node (central)
      {
        data: {
          id: 'thesis',
          label: thesis.title.length > 40 ? thesis.title.slice(0, 40) + '...' : thesis.title,
          type: 'thesis',
        },
      },
      // Paper nodes
      ...papers.map((paper) => ({
        data: {
          id: paper.id,
          label: paper.title.length > 30 ? paper.title.slice(0, 30) + '...' : paper.title,
          type: 'paper',
          role: paper.thesisRole,
          takeaway: paper.takeaway,
          year: paper.year,
        },
      })),
    ];

    const edges: ElementDefinition[] = [
      // Thesis-to-paper edges
      ...papers.map((paper) => ({
        data: {
          id: `thesis-${paper.id}`,
          source: 'thesis',
          target: paper.id,
          type: 'thesis-role',
          role: paper.thesisRole,
        },
      })),
      // Paper-to-paper connections
      ...connections.map((conn) => ({
        data: {
          id: conn.id,
          source: conn.fromPaperId,
          target: conn.toPaperId,
          type: conn.type,
          label: conn.type.replace('-', ' '),
        },
      })),
    ];

    return [...nodes, ...edges];
  }, [thesis, papers, connections]);

  // Cytoscape stylesheet
  const stylesheet = useMemo(
    () => [
      // Thesis node (central, larger)
      {
        selector: 'node[type="thesis"]',
        style: {
          'background-color': '#6366f1',
          'label': 'data(label)',
          'width': 100,
          'height': 100,
          'font-size': 14,
          'text-wrap': 'wrap',
          'text-max-width': 120,
          'text-valign': 'center',
          'text-halign': 'center',
          'color': '#ffffff',
          'text-outline-color': '#6366f1',
          'text-outline-width': 2,
        },
      },
      // Paper nodes
      {
        selector: 'node[type="paper"]',
        style: {
          'background-color': '#e5e7eb',
          'label': 'data(label)',
          'width': 60,
          'height': 60,
          'font-size': 10,
          'text-wrap': 'wrap',
          'text-max-width': 80,
          'text-valign': 'bottom',
          'text-margin-y': 5,
          'color': '#374151',
        },
      },
      // Color by role - supports
      {
        selector: 'node[role="supports"]',
        style: { 'background-color': '#22c55e' },
      },
      // Color by role - contradicts
      {
        selector: 'node[role="contradicts"]',
        style: { 'background-color': '#ef4444' },
      },
      // Color by role - method
      {
        selector: 'node[role="method"]',
        style: { 'background-color': '#3b82f6' },
      },
      // Color by role - background
      {
        selector: 'node[role="background"]',
        style: { 'background-color': '#9ca3af' },
      },
      // Color by role - other
      {
        selector: 'node[role="other"]',
        style: { 'background-color': '#a855f7' },
      },
      // Thesis-to-paper edges (subtle)
      {
        selector: 'edge[type="thesis-role"]',
        style: {
          'width': 1,
          'line-color': '#d1d5db',
          'curve-style': 'bezier',
          'opacity': 0.5,
        },
      },
      // Paper-to-paper edges - supports
      {
        selector: 'edge[type="supports"]',
        style: {
          'width': 2,
          'line-color': '#22c55e',
          'target-arrow-color': '#22c55e',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'line-style': 'solid',
        },
      },
      // Paper-to-paper edges - contradicts
      {
        selector: 'edge[type="contradicts"]',
        style: {
          'width': 2,
          'line-color': '#ef4444',
          'target-arrow-color': '#ef4444',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'line-style': 'dashed',
        },
      },
      // Paper-to-paper edges - extends
      {
        selector: 'edge[type="extends"]',
        style: {
          'width': 2,
          'line-color': '#f59e0b',
          'target-arrow-color': '#f59e0b',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
        },
      },
      // Paper-to-paper edges - critiques
      {
        selector: 'edge[type="critiques"]',
        style: {
          'width': 2,
          'line-color': '#f97316',
          'target-arrow-color': '#f97316',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'line-style': 'dashed',
        },
      },
      // Paper-to-paper edges - reviews
      {
        selector: 'edge[type="reviews"]',
        style: {
          'width': 2,
          'line-color': '#8b5cf6',
          'target-arrow-color': '#8b5cf6',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
        },
      },
      // Hover state
      {
        selector: 'node:selected',
        style: {
          'border-width': 3,
          'border-color': '#6366f1',
        },
      },
      // Faded state for non-neighbors on hover
      {
        selector: '.faded',
        style: {
          'opacity': 0.2,
        },
      },
    ],
    []
  );

  // Layout configuration
  const layout = {
    name: 'cose',
    idealEdgeLength: 150,
    nodeOverlap: 20,
    refresh: 20,
    fit: true,
    padding: 50,
    randomize: false,
    componentSpacing: 100,
    nodeRepulsion: 400000,
    edgeElasticity: 100,
    nestingFactor: 5,
    gravity: 80,
    numIter: 1000,
    initialTemp: 200,
    coolingFactor: 0.95,
    minTemp: 1.0,
  };

  // Handle Cytoscape instance
  const handleCy = (cy: Core) => {
    cyRef.current = cy;

    // Click on paper node
    cy.on('tap', 'node[type="paper"]', (event) => {
      const paperId = event.target.id();
      onPaperSelect(paperId);
    });

    // Hover effects
    cy.on('mouseover', 'node', (event) => {
      const node = event.target;
      const neighborhood = node.neighborhood().add(node);
      cy.elements().addClass('faded');
      neighborhood.removeClass('faded');
    });

    cy.on('mouseout', 'node', () => {
      cy.elements().removeClass('faded');
    });

    // Double-click to fit
    cy.on('dbltap', () => {
      cy.fit(cy.elements(), 50);
    });
  };

  // Re-run layout when elements change
  useEffect(() => {
    if (cyRef.current && elements.length > 1) {
      cyRef.current.layout(layout).run();
    }
  }, [elements.length]);

  if (papers.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        Add papers to see your knowledge graph
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <CytoscapeComponent
        elements={elements}
        stylesheet={stylesheet as any}
        layout={layout}
        cy={handleCy}
        style={{ width: '100%', height: '100%' }}
        className="bg-white dark:bg-gray-900 rounded-lg"
      />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 rounded-lg p-3 text-xs shadow-lg">
        <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">Legend</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {Object.entries(ROLE_COLORS).map(([role, color]) => (
            <div key={role} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-gray-600 dark:text-gray-400 capitalize">{role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 rounded-lg px-3 py-2 text-xs text-gray-500 dark:text-gray-400 shadow-lg">
        Click paper to view • Double-click to fit • Drag to rearrange
      </div>
    </div>
  );
}
