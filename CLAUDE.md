# CLAUDE.md - IdeaGraph Project Guide

## Project Overview

**IdeaGraph** is a Literature Idea Connection Tool that helps researchers catalog and connect ideas from academic papers, rather than just collecting papers. It forces active synthesis by requiring users to articulate takeaways, arguments, evidence, and connections between papers.

**Philosophy**: Zotero catalogs papers. IdeaGraph catalogs ideas.

## Tech Stack

- **Language**: TypeScript 5.x
- **Framework**: React 18+
- **Build Tool**: Vite 5.x
- **Styling**: Tailwind CSS 3.x
- **State Management**: React Context + useReducer (or Zustand)
- **Forms**: React Hook Form + Zod validation
- **Visualization**: Cytoscape.js (force-directed graphs)
- **Icons**: Lucide React
- **Cross-Platform**: Capacitor (iOS/macOS), Tauri (Desktop)

## Project Structure

```
ideagraph/
├── src/
│   ├── components/
│   │   ├── common/          # Button, Modal, Card, etc.
│   │   ├── thesis/          # ThesisCard, ThesisList, ThesisForm
│   │   ├── paper/           # PaperCard, PaperDetail, AddPaperModal
│   │   ├── connection/      # ConnectionEditor, ConnectionBadge
│   │   └── visualization/   # GraphView, ListView, TimelineView
│   ├── hooks/               # useThesis, usePapers, useConnections, useStorage
│   ├── services/            # storage, semanticScholar, crossref, bibtexParser
│   ├── types/               # thesis.ts, paper.ts, connection.ts
│   ├── utils/               # validation, formatting, graph utilities
│   ├── context/             # AppContext, ThesisContext
│   └── pages/               # Home, ThesisView, Settings
├── ios/                     # Capacitor iOS project (generated)
├── src-tauri/               # Tauri desktop (optional)
└── dist/                    # Build output
```

## Core Data Types

### Key Entities
- **Thesis**: Central research question/hypothesis that anchors paper collection
- **Paper**: User's synthesized understanding of a paper (not just metadata)
- **Connection**: Explicit intellectual relationship between papers

### Thesis Roles
Papers can have roles relative to a thesis: `supports`, `contradicts`, `method`, `background`, `other`

### Connection Types
Papers can connect to each other: `supports`, `contradicts`, `extends`, `uses-method`, `same-topic`, `reviews`, `replicates`, `critiques`

### Reading Status
Track paper progress: `to-read`, `reading`, `read`, `to-revisit`

## Key Design Principles

1. **Takeaway is Required**: Every paper must have a one-sentence insight (10-500 chars)
2. **User Synthesis is Core**: Arguments, evidence, and connections are user-generated
3. **AI Assists, Human Confirms**: AI suggestions always require user approval
4. **LocalStorage First**: Phase 1 uses LocalStorage, IndexedDB for larger datasets later

## External APIs

### Semantic Scholar (Primary)
- Base URL: `https://api.semanticscholar.org/graph/v1`
- Get paper by DOI: `/paper/DOI:{doi}?fields=title,authors,year,venue,abstract,citationCount,openAccessPdf,externalIds`
- Rate limit: 100 req/sec with API key

### CrossRef (Fallback)
- Base URL: `https://api.crossref.org/works`
- Always include User-Agent header with contact email

## Build Commands

```bash
# Development
npm run dev

# Build for web
npm run build

# Capacitor (iOS/macOS)
npm install @capacitor/core @capacitor/cli
npx cap init "IdeaGraph" "com.yourorg.ideagraph"
npx cap add ios
npm run build && npx cap sync
npx cap open ios

# Tauri (Desktop)
npm run tauri dev
npm run tauri build
```

## Storage Keys

```typescript
const STORAGE_KEYS = {
  THESES: 'ideagraph_theses',
  PAPERS: 'ideagraph_papers',
  CONNECTIONS: 'ideagraph_connections',
  SETTINGS: 'ideagraph_settings',
  ACTIVE_THESIS: 'ideagraph_active_thesis',
  VERSION: 'ideagraph_version',
};
```

## Development Phases

1. **Phase 1 (MVP)**: Paper/thesis CRUD, connections, graph view, LocalStorage
2. **Phase 2**: Timeline view, advanced filtering, forgotten papers reminders
3. **Phase 3**: AI takeaway/connection suggestions, gap analysis
4. **Phase 4**: User accounts, cloud sync, collaboration

## Current Status

Project is in the design/planning phase. The `LITERATURE_TRACKER_DESIGN.md` file contains the complete specification including:
- Data model with TypeScript interfaces
- UI wireframes and component specs
- API integration details
- Cytoscape.js graph configuration
- AI features roadmap

## Validation Rules

- Takeaway: required, 10-500 characters
- Arguments: optional, max 10 items
- Evidence: optional, max 20 items
- ThesisRole: required, must be valid enum value

## Graph Visualization (Cytoscape.js)

- Thesis node centered, papers around it
- Color-coded by thesis role (green=supports, red=contradicts, blue=method, gray=background)
- Edge styles vary by connection type (solid=supports, dashed=contradicts)
- Interactive: click to view, hover for tooltip, drag to rearrange
