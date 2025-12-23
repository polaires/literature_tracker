# IdeaGraph UI/UX Redesign Strategy

## Overview

This document outlines a comprehensive UI redesign to address:
1. Overlapping panels and z-index chaos
2. Toolbar complexity overload
3. Inconsistent layouts between view modes
4. Underutilized screen real estate
5. Scattered AI features

## Design Principles

### 1. Unified Three-Zone Layout
All view modes share the same spatial structure:

```
+------------------------------------------------------------------+
|                        TOP: Compact Header                        |
|  [Back] [Thesis Title]        [View Modes]        [Quick Actions] |
+--------+-----------------------------------------+----------------+
|        |                                         |                |
|  LEFT  |              MAIN CANVAS                |     RIGHT      |
|  ZONE  |                                         |     ZONE       |
|        |    (Graph / List / Timeline / Args)     |                |
|  240px |                                         |     360px      |
|        |           Maximized Space               |                |
|        |                                         |   (Collapsible)|
|        |                                         |                |
+--------+-----------------------------------------+----------------+
```

### 2. Zone Responsibilities

#### TOP Zone (Header - 56px fixed)
- Thesis navigation (back button, title)
- View mode switcher (List/Graph/Timeline/Arguments)
- Essential quick actions (Add Paper dropdown)
- Minimal footprint

#### LEFT Zone (Tools & Navigation - 240px, collapsible to 48px)
- **Primary Navigation**: Paper list/tree view
- **Filters & Sort**: Collapsible filter panel
- **View Controls**: Layout options (for graph), display toggles
- **AI Command Center**: Centralized AI features button
- Collapsible to icon-only sidebar

#### MAIN Zone (Canvas - Flexible, maximized)
- Full content area for current view
- Graph canvas gets maximum space
- Consistent padding across all views
- No overlapping elements

#### RIGHT Zone (Context Panel - 360px, collapsible)
- **Paper Detail**: When paper is selected
- **Screening Mode**: Inline screening (not modal)
- **Workflow Guide**: Research workflow hints
- Smooth slide-in/out transitions
- Can be fully collapsed to maximize canvas

## Panel Stack Management

### Z-Index Hierarchy (Strict)
```
z-10: Base UI elements (sidebar, toolbars)
z-20: Floating tooltips, dropdowns
z-30: Right panel (PaperDetail, Screening)
z-40: Modal overlays (AddPaper, Search, Settings)
z-50: Critical dialogs (Confirmations, Errors)
z-60: PDF Viewer (full-screen takeover)
```

### Panel Rules
1. Only ONE panel can be open in each zone at a time
2. Opening a new panel in a zone closes the previous one
3. Modals (z-40) dim background but don't block panel zones
4. Full-screen views (PDF) replace entire layout temporarily
5. Escape key follows stack: Close topmost layer first

## View Mode Consistency

### Shared Elements Across All Views
```
+------------------------------------------------------------------+
|  [Back] Thesis Title                  [List][Graph][Timeline][Args] [+ Add] |
+--------+-----------------------------------------+----------------+
|        |                                         |                |
| Papers |         VIEW-SPECIFIC CONTENT           |  Paper Detail  |
| Filter |                                         |  (or empty)    |
| Layout |                                         |                |
|   AI   |                                         |  Workflow      |
|        |                                         |                |
+--------+-----------------------------------------+----------------+
```

### View-Specific Content

#### List View
- Card grid or list of papers
- Sortable columns
- Quick inline actions

#### Graph View
- Cytoscape canvas (maximized)
- Graph controls overlay (top-left of canvas)
- Legend overlay (bottom-left of canvas)
- Stats badge (top-right of canvas)

#### Timeline View
- Horizontal timeline with year markers
- Papers as dots/cards on timeline
- Zoom controls

#### Arguments View
- Hierarchical tree of arguments
- Grouped by thesis role
- Expandable evidence

## Component Architecture

### New Components to Create

```
src/components/layout/
├── AppShell.tsx           # Main layout wrapper with zones
├── LeftSidebar.tsx        # Collapsible left panel
├── RightPanel.tsx         # Context panel with stack management
├── TopHeader.tsx          # Compact header bar
└── PanelManager.tsx       # Panel state management context

src/components/common/
├── AICommandCenter.tsx    # Unified AI features access
└── ViewModeContent.tsx    # Wrapper for view-specific content
```

### Panel Manager Context
```typescript
interface PanelState {
  leftCollapsed: boolean;
  rightPanel: 'detail' | 'screening' | 'workflow' | null;
  activeModal: 'addPaper' | 'search' | 'settings' | 'synthesis' | null;
  fullScreenView: 'pdf' | null;
}

interface PanelActions {
  toggleLeftSidebar: () => void;
  openRightPanel: (panel: RightPanel) => void;
  closeRightPanel: () => void;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  openFullScreen: (view: FullScreenView) => void;
  closeFullScreen: () => void;
}
```

## Toolbar Consolidation

### Current (15+ buttons) → Proposed (5 groups)

#### Group 1: View Modes (Left of header)
- List | Graph | Timeline | Arguments

#### Group 2: Quick Actions (Right of header)
- [+ Add Paper] dropdown
- [AI] command center button (opens left panel AI section)

#### Group 3: Left Sidebar Sections
- Paper Navigation (list/tree)
- Filters (collapsible)
- Sort Options (collapsible)
- View Controls (layout for graph, etc.)
- AI Features (collapsed section)

#### Group 4: Right Panel Tabs
- Detail | Screening | Workflow

#### Group 5: Settings (Accessible from header menu or left sidebar)
- Data Manager
- Export/Import
- AI Settings
- Keyboard Shortcuts
- Theme

## AI Features Centralization

### AI Command Center (Left Sidebar Section)
```
+---------------------------+
| AI Assistant              |
+---------------------------+
| [Analyze Current Paper]   |
| [Suggest Connections]     |
| [Find Research Gaps]      |
| [Generate Takeaway]       |
+---------------------------+
| Settings ⚙                |
| Provider: Claude ✓        |
| Suggestions: On           |
+---------------------------+
```

### Inline AI Suggestions
- Still show inline in forms (AddPaper, PaperEdit)
- Use consistent styling (purple accent)
- All trigger same AI service

## Screening Flow Redesign

### Current: Full-screen modal blocking everything
### Proposed: Right panel inline screening

```
+------------------------------------------------------------------+
|  LEFT   |              GRAPH VIEW                |    RIGHT       |
|         |                                        |  +-----------+ |
|         |                                        |  | SCREENING | |
|         |                                        |  +-----------+ |
|         |                                        |  | Paper 3/12| |
|         |                                        |  |           | |
|         |  (can still see graph context)         |  | [Title]   | |
|         |                                        |  | [Abstract]| |
|         |                                        |  |           | |
|         |                                        |  |[Exc][May] | |
|         |                                        |  |  [Include]| |
+------------------------------------------------------------------+
```

Benefits:
- Can reference graph/list while screening
- Non-blocking workflow
- Keyboard navigation still works
- Progress visible in left sidebar

## Maximizing Graph Canvas

### Current Issues
- Fixed 600px height container
- Surrounded by paddings and margins
- Discovery panel overlaps graph

### Proposed Solution
1. Graph fills entire main zone (flex-1)
2. Graph controls are overlays on canvas (already done)
3. Discovery results appear in right panel, not overlapping
4. Full-screen mode available (hide all panels)

### Graph Full-Screen Mode
- Press 'F' or click expand button
- Hides left sidebar, right panel
- Shows minimal floating controls
- Press 'Esc' to exit

## Mobile Responsiveness

### Breakpoints
- `lg` (1024px+): Full three-zone layout
- `md` (768-1023px): Collapsible left, slideover right
- `sm` (<768px): Bottom sheet for panels, single view

### Mobile Adaptations
- Left sidebar becomes hamburger menu
- Right panel becomes bottom sheet
- View modes in dropdown
- Touch-optimized graph controls

## Implementation Order

### Phase 1: Layout Foundation
1. Create AppShell with zone structure
2. Create PanelManager context
3. Migrate TopHeader (compact)
4. Migrate LeftSidebar (collapsible)
5. Migrate RightPanel (with stack management)

### Phase 2: View Mode Consistency
1. Wrap each view mode in consistent container
2. Unify padding and spacing
3. Ensure smooth transitions between modes
4. Maximize graph canvas

### Phase 3: Panel Behaviors
1. Implement panel stack (z-index hierarchy)
2. Add slide transitions
3. Escape key handling
4. Panel persistence preferences

### Phase 4: Feature Migration
1. Move screening to right panel
2. Create AI Command Center
3. Consolidate toolbar actions
4. Settings reorganization

### Phase 5: Polish
1. Keyboard shortcuts update
2. Mobile responsive adjustments
3. Animation refinements
4. User preference persistence

## File Changes Summary

### New Files
- `src/components/layout/AppShell.tsx`
- `src/components/layout/LeftSidebar.tsx`
- `src/components/layout/RightPanel.tsx`
- `src/components/layout/TopHeader.tsx`
- `src/contexts/PanelContext.tsx`
- `src/components/common/AICommandCenter.tsx`

### Modified Files
- `src/pages/ThesisView.tsx` - Major restructure to use AppShell
- `src/components/paper/PaperDetail.tsx` - Adapt to right panel
- `src/components/paper/ScreeningPanel.tsx` - Convert to non-modal
- `src/components/visualization/GraphView.tsx` - Remove stats badge (moved)
- `src/components/visualization/DiscoveryPanel.tsx` - Move to right zone

### Removed Patterns
- Standalone modals for screening
- Overlapping absolute positioned panels
- Multiple z-50 competing elements

## Success Metrics

1. **No more overlapping panels** - Clear visual hierarchy
2. **Consistent layout** - Same spatial structure across views
3. **Maximized canvas** - Graph uses all available space
4. **Reduced clicks** - Common actions within 2 clicks
5. **Discoverable AI** - Single entry point for all AI features
6. **Non-blocking workflows** - Screening doesn't block graph
