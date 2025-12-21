declare module 'react-cytoscapejs' {
  import { Core, ElementDefinition, LayoutOptions, CytoscapeOptions } from 'cytoscape';
  import { Component } from 'react';

  interface CytoscapeComponentProps {
    elements: ElementDefinition[];
    stylesheet?: CytoscapeOptions['style'];
    layout?: LayoutOptions;
    cy?: (cy: Core) => void;
    style?: React.CSSProperties;
    className?: string;
    zoom?: number;
    pan?: { x: number; y: number };
    minZoom?: number;
    maxZoom?: number;
    zoomingEnabled?: boolean;
    userZoomingEnabled?: boolean;
    panningEnabled?: boolean;
    userPanningEnabled?: boolean;
    boxSelectionEnabled?: boolean;
    autoungrabify?: boolean;
    autounselectify?: boolean;
    wheelSensitivity?: number;
  }

  export default class CytoscapeComponent extends Component<CytoscapeComponentProps> {}
}

// Cytoscape layout extensions
declare module 'cytoscape-fcose' {
  import cytoscape from 'cytoscape';
  const fcose: cytoscape.Ext;
  export default fcose;
}

declare module 'cytoscape-dagre' {
  import cytoscape from 'cytoscape';
  const dagre: cytoscape.Ext;
  export default dagre;
}

declare module 'cytoscape-cose-bilkent' {
  import cytoscape from 'cytoscape';
  const coseBilkent: cytoscape.Ext;
  export default coseBilkent;
}
