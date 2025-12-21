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
  }

  export default class CytoscapeComponent extends Component<CytoscapeComponentProps> {}
}
