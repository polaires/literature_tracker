// Graph Settings Popover
// Quick customization panel for graph appearance

import { useState, useEffect } from 'react';
import {
  Settings,
  X,
  Circle,
  GitBranch,
  Eye,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { GraphCustomization, GraphPresetName } from '../../types';
import { GRAPH_PRESETS, DEFAULT_GRAPH_CUSTOMIZATION } from '../../types';

interface GraphSettingsPopoverProps {
  onClose: () => void;
}

// Preset display names
const PRESET_LABELS: Record<GraphPresetName, string> = {
  default: 'Default',
  presentation: 'Presentation',
  dense: 'Dense Graph',
  minimalist: 'Minimalist',
  highContrast: 'High Contrast',
};

// Size mode labels
const SIZE_MODE_LABELS: Record<GraphCustomization['nodeSizeMode'], string> = {
  fixed: 'Fixed',
  citations: 'By Citations',
  connections: 'By Connections',
};

// Color mode labels
const COLOR_MODE_LABELS: Record<GraphCustomization['nodeColorMode'], string> = {
  role: 'By Role',
  year: 'By Year',
  status: 'By Status',
  subthesis: 'By Sub-thesis',
};

// Label visibility labels
const LABEL_VISIBILITY_LABELS: Record<GraphCustomization['showNodeLabels'], string> = {
  always: 'Always',
  hover: 'On Hover',
  never: 'Never',
};

// Label size labels
const LABEL_SIZE_LABELS: Record<GraphCustomization['nodeLabelSize'], string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
};

// Arrow size labels
const ARROW_SIZE_LABELS: Record<GraphCustomization['edgeArrowSize'], string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
};

// Curve style labels
const CURVE_STYLE_LABELS: Record<GraphCustomization['edgeCurveStyle'], string> = {
  bezier: 'Curved',
  straight: 'Straight',
  taxi: 'Right Angles',
};

export function GraphSettingsPopover({ onClose }: GraphSettingsPopoverProps) {
  const graphCustomization = useAppStore((s) => s.settings.graphCustomization);
  const updateGraphCustomization = useAppStore((s) => s.updateGraphCustomization);

  const [expandedSections, setExpandedSections] = useState({
    nodes: true,
    edges: true,
    display: true,
  });

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const applyPreset = (presetName: GraphPresetName) => {
    const preset = GRAPH_PRESETS[presetName];
    updateGraphCustomization({
      ...DEFAULT_GRAPH_CUSTOMIZATION,
      ...preset,
    });
  };

  const resetToDefaults = () => {
    updateGraphCustomization(DEFAULT_GRAPH_CUSTOMIZATION);
  };

  return (
    <div className="absolute top-16 left-4 z-30 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[calc(100%-120px)] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-stone-500" />
          <h3 className="font-semibold text-stone-800 dark:text-white text-sm">Graph Settings</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-700 rounded"
        >
          <X size={16} />
        </button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto">
        {/* Preset Selector */}
        <div className="px-4 py-3 border-b border-stone-100 dark:border-slate-700">
          <label className="block text-xs font-medium text-stone-500 dark:text-slate-400 mb-1.5">
            Preset
          </label>
          <select
            value="custom"
            onChange={(e) => applyPreset(e.target.value as GraphPresetName)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-stone-800 dark:text-white focus:ring-2 focus:ring-stone-500 focus:border-transparent"
          >
            <option value="custom" disabled>
              Custom
            </option>
            {(Object.keys(GRAPH_PRESETS) as GraphPresetName[]).map((preset) => (
              <option key={preset} value={preset}>
                {PRESET_LABELS[preset]}
              </option>
            ))}
          </select>
        </div>

        {/* Nodes Section */}
        <div className="border-b border-stone-100 dark:border-slate-700">
          <button
            onClick={() => toggleSection('nodes')}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-stone-50 dark:hover:bg-slate-700/50"
          >
            <div className="flex items-center gap-2">
              <Circle size={14} className="text-stone-400" />
              <span className="text-sm font-medium text-stone-700 dark:text-slate-200">Nodes</span>
            </div>
            {expandedSections.nodes ? (
              <ChevronUp size={14} className="text-stone-400" />
            ) : (
              <ChevronDown size={14} className="text-stone-400" />
            )}
          </button>

          {expandedSections.nodes && (
            <div className="px-4 pb-3 space-y-3">
              {/* Size Mode */}
              <div>
                <label className="block text-xs text-stone-500 dark:text-slate-400 mb-1">
                  Size
                </label>
                <div className="flex gap-2">
                  <select
                    value={graphCustomization.nodeSizeMode}
                    onChange={(e) =>
                      updateGraphCustomization({
                        nodeSizeMode: e.target.value as GraphCustomization['nodeSizeMode'],
                      })
                    }
                    className="flex-1 px-2 py-1.5 text-xs rounded border border-stone-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-stone-700 dark:text-slate-200"
                  >
                    {Object.entries(SIZE_MODE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {graphCustomization.nodeSizeMode === 'fixed' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={32}
                        max={80}
                        value={graphCustomization.nodeBaseSize}
                        onChange={(e) =>
                          updateGraphCustomization({ nodeBaseSize: Number(e.target.value) })
                        }
                        className="w-20 h-1.5 accent-stone-600"
                      />
                      <span className="text-xs text-stone-500 w-8">
                        {graphCustomization.nodeBaseSize}px
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Color Mode */}
              <div>
                <label className="block text-xs text-stone-500 dark:text-slate-400 mb-1">
                  Color
                </label>
                <select
                  value={graphCustomization.nodeColorMode}
                  onChange={(e) =>
                    updateGraphCustomization({
                      nodeColorMode: e.target.value as GraphCustomization['nodeColorMode'],
                    })
                  }
                  className="w-full px-2 py-1.5 text-xs rounded border border-stone-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-stone-700 dark:text-slate-200"
                >
                  {Object.entries(COLOR_MODE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Labels */}
              <div>
                <label className="block text-xs text-stone-500 dark:text-slate-400 mb-1">
                  Labels
                </label>
                <div className="flex gap-2">
                  <select
                    value={graphCustomization.showNodeLabels}
                    onChange={(e) =>
                      updateGraphCustomization({
                        showNodeLabels: e.target.value as GraphCustomization['showNodeLabels'],
                      })
                    }
                    className="flex-1 px-2 py-1.5 text-xs rounded border border-stone-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-stone-700 dark:text-slate-200"
                  >
                    {Object.entries(LABEL_VISIBILITY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={graphCustomization.nodeLabelSize}
                    onChange={(e) =>
                      updateGraphCustomization({
                        nodeLabelSize: e.target.value as GraphCustomization['nodeLabelSize'],
                      })
                    }
                    className="w-24 px-2 py-1.5 text-xs rounded border border-stone-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-stone-700 dark:text-slate-200"
                  >
                    {Object.entries(LABEL_SIZE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edges Section */}
        <div className="border-b border-stone-100 dark:border-slate-700">
          <button
            onClick={() => toggleSection('edges')}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-stone-50 dark:hover:bg-slate-700/50"
          >
            <div className="flex items-center gap-2">
              <GitBranch size={14} className="text-stone-400" />
              <span className="text-sm font-medium text-stone-700 dark:text-slate-200">Edges</span>
            </div>
            {expandedSections.edges ? (
              <ChevronUp size={14} className="text-stone-400" />
            ) : (
              <ChevronDown size={14} className="text-stone-400" />
            )}
          </button>

          {expandedSections.edges && (
            <div className="px-4 pb-3 space-y-3">
              {/* Width */}
              <div>
                <label className="block text-xs text-stone-500 dark:text-slate-400 mb-1">
                  Width
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={0.5}
                    value={graphCustomization.edgeBaseWidth}
                    onChange={(e) =>
                      updateGraphCustomization({ edgeBaseWidth: Number(e.target.value) })
                    }
                    className="flex-1 h-1.5 accent-stone-600"
                  />
                  <span className="text-xs text-stone-500 w-10">
                    {graphCustomization.edgeBaseWidth}px
                  </span>
                </div>
              </div>

              {/* Opacity */}
              <div>
                <label className="block text-xs text-stone-500 dark:text-slate-400 mb-1">
                  Opacity
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0.2}
                    max={1}
                    step={0.1}
                    value={graphCustomization.edgeOpacity}
                    onChange={(e) =>
                      updateGraphCustomization({ edgeOpacity: Number(e.target.value) })
                    }
                    className="flex-1 h-1.5 accent-stone-600"
                  />
                  <span className="text-xs text-stone-500 w-10">
                    {Math.round(graphCustomization.edgeOpacity * 100)}%
                  </span>
                </div>
              </div>

              {/* Style & Arrows */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-stone-500 dark:text-slate-400 mb-1">
                    Style
                  </label>
                  <select
                    value={graphCustomization.edgeCurveStyle}
                    onChange={(e) =>
                      updateGraphCustomization({
                        edgeCurveStyle: e.target.value as GraphCustomization['edgeCurveStyle'],
                      })
                    }
                    className="w-full px-2 py-1.5 text-xs rounded border border-stone-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-stone-700 dark:text-slate-200"
                  >
                    {Object.entries(CURVE_STYLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-stone-500 dark:text-slate-400 mb-1">
                    Arrows
                  </label>
                  <select
                    value={graphCustomization.edgeArrowSize}
                    onChange={(e) =>
                      updateGraphCustomization({
                        edgeArrowSize: e.target.value as GraphCustomization['edgeArrowSize'],
                      })
                    }
                    className="w-full px-2 py-1.5 text-xs rounded border border-stone-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-stone-700 dark:text-slate-200"
                  >
                    {Object.entries(ARROW_SIZE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Display Section */}
        <div className="border-b border-stone-100 dark:border-slate-700">
          <button
            onClick={() => toggleSection('display')}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-stone-50 dark:hover:bg-slate-700/50"
          >
            <div className="flex items-center gap-2">
              <Eye size={14} className="text-stone-400" />
              <span className="text-sm font-medium text-stone-700 dark:text-slate-200">Display</span>
            </div>
            {expandedSections.display ? (
              <ChevronUp size={14} className="text-stone-400" />
            ) : (
              <ChevronDown size={14} className="text-stone-400" />
            )}
          </button>

          {expandedSections.display && (
            <div className="px-4 pb-3 space-y-2">
              {/* Phantom Edges Toggle */}
              <label className="flex items-center justify-between py-1.5 cursor-pointer">
                <span className="text-xs text-stone-600 dark:text-slate-300">
                  Show phantom edges
                </span>
                <input
                  type="checkbox"
                  checked={graphCustomization.showPhantomEdges}
                  onChange={(e) =>
                    updateGraphCustomization({ showPhantomEdges: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-stone-300 text-stone-600 focus:ring-stone-500"
                />
              </label>

              {/* Phantom Edge Opacity */}
              {graphCustomization.showPhantomEdges && (
                <div className="pl-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500 dark:text-slate-400">Opacity</span>
                    <input
                      type="range"
                      min={0.1}
                      max={0.5}
                      step={0.05}
                      value={graphCustomization.phantomEdgeOpacity}
                      onChange={(e) =>
                        updateGraphCustomization({ phantomEdgeOpacity: Number(e.target.value) })
                      }
                      className="flex-1 h-1.5 accent-stone-600"
                    />
                    <span className="text-xs text-stone-500 w-8">
                      {Math.round(graphCustomization.phantomEdgeOpacity * 100)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Dim Unconnected */}
              <label className="flex items-center justify-between py-1.5 cursor-pointer">
                <span className="text-xs text-stone-600 dark:text-slate-300">
                  Dim unconnected nodes
                </span>
                <input
                  type="checkbox"
                  checked={graphCustomization.dimUnconnectedNodes}
                  onChange={(e) =>
                    updateGraphCustomization({ dimUnconnectedNodes: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-stone-300 text-stone-600 focus:ring-stone-500"
                />
              </label>

              {/* Edge Labels */}
              <label className="flex items-center justify-between py-1.5 cursor-pointer">
                <span className="text-xs text-stone-600 dark:text-slate-300">
                  Show edge labels
                </span>
                <input
                  type="checkbox"
                  checked={graphCustomization.showEdgeLabels}
                  onChange={(e) =>
                    updateGraphCustomization({ showEdgeLabels: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-stone-300 text-stone-600 focus:ring-stone-500"
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-stone-50 dark:bg-slate-700/50 border-t border-stone-200 dark:border-slate-700">
        <button
          onClick={resetToDefaults}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-stone-600 dark:text-slate-300 hover:text-stone-800 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
        >
          <RotateCcw size={12} />
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
