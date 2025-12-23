# CLAUDE.md - IdeaGraph Project Guide

## Project Overview

**IdeaGraph** is a Literature Idea Connection Tool that helps researchers catalog and connect ideas from academic papers, rather than just collecting papers. It forces active synthesis by requiring users to articulate takeaways, arguments, evidence, and connections between papers.

**Philosophy**: Zotero catalogs papers. IdeaGraph catalogs ideas.

## Tech Stack

- **Language**: TypeScript 5.x
- **Framework**: React 19+
- **Build Tool**: Vite 7.x
- **Styling**: Tailwind CSS 4.x
- **State Management**: Zustand 5.x with persist middleware
- **Forms**: React Hook Form + Zod validation
- **Visualization**: Cytoscape.js (force-directed graphs)
- **Icons**: Lucide React
- **PDF Handling**: pdfjs-dist + react-pdf-highlighter
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
│   ├── hooks/               # useAI, useStorage, useAutoConnect, useDiscovery
│   ├── services/
│   │   ├── ai/              # AI providers, suggestions, prompts, feedback
│   │   ├── api/             # semanticScholar, crossref, openAlex
│   │   ├── cache/           # Centralized cache manager
│   │   ├── storage/         # Migrations, quota monitoring, multi-tab sync
│   │   └── discovery/       # Paper discovery, hybrid search
│   ├── store/               # useAppStore (Zustand)
│   ├── types/               # thesis.ts, paper.ts, connection.ts
│   ├── utils/               # validation, formatting, graph utilities
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

## Storage Architecture

### Main Store (Zustand with persist)
- **Key**: `ideagraph-storage`
- **Contents**: All app state (theses, papers, connections, annotations, settings, aiSettings)
- **Persistence**: Automatic via Zustand persist middleware
- **Multi-tab Sync**: BroadcastChannel API with fallback to storage events

### Storage Keys
```typescript
const STORAGE_KEYS = {
  MAIN_STORE: 'ideagraph-storage',      // Zustand persisted state
  VERSION: 'ideagraph_version',          // Schema version for migrations
  CACHE_METRICS: 'ideagraph_cache_metrics', // Cache hit/miss stats
};
```

### Cache System (Centralized)
Located in `src/services/cache/cacheManager.ts`:
- **similarity**: Paper similarity results (TTL: 7 days, max 100 entries)
- **embedding**: SPECTER embeddings (TTL: 30 days, max 200 entries)
- **paperMetadata**: Paper details (TTL: 24 hours, max 500 entries)
- **searchResults**: Search results (TTL: 1 hour, max 50 entries)
- **aiSuggestions**: AI suggestion cache (TTL: 4 hours, max 100 entries)

### Data Migrations
Located in `src/services/storage/migrations.ts`:
- Version tracking via `ideagraph_version` key
- Auto-runs on app startup before rendering
- Current version: 2
- Migration 1: Initial schema setup
- Migration 2: Consolidate AI settings into main store

### Storage Quota Monitoring
Located in `src/services/storage/quotaMonitor.ts`:
- Monitors localStorage + IndexedDB usage
- Warning at 75%, critical at 90%
- Provides cleanup suggestions
- Periodic monitoring with subscriptions

### Multi-Tab Synchronization
Located in `src/services/storage/multiTabSync.ts`:
- Uses BroadcastChannel for real-time sync
- Leader election for state requests
- Automatic state merge on external updates
- Cache clear notifications across tabs

## Development Phases

1. **Phase 1 (MVP)**: Paper/thesis CRUD, connections, graph view, LocalStorage ✅
2. **Phase 2**: Timeline view, advanced filtering, PDF reader, screening workflow ✅
3. **Phase 3**: AI takeaway/connection suggestions, gap analysis ✅ (partial)
4. **Phase 4**: User accounts, cloud sync, collaboration (planned)

## Current Status

Project is in active development with Phase 1-3 features implemented:
- Full paper/thesis/connection CRUD with Zustand persistence
- PDF reader with annotation support (react-pdf-highlighter)
- AI integration (Claude, OpenAI, Ollama) for suggestions
- Paper discovery with Semantic Scholar API
- Centralized cache management
- Data migration system
- Multi-tab synchronization
- Storage quota monitoring

See `LITERATURE_TRACKER_DESIGN.md` for the complete specification.

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

## AI Integration

### Providers
Located in `src/services/ai/providers/`:
- **Claude** (primary): Anthropic API with third-party provider support
- **OpenAI**: OpenAI-compatible endpoints
- **Ollama**: Local inference
- **Mock**: Testing provider

### AI Settings (in Zustand store)
```typescript
interface AISettings {
  provider: 'claude' | 'openai' | 'ollama' | 'mock';
  apiKey: string | null;
  apiBaseUrl: string | null;  // For third-party providers
  enableConnectionSuggestions: boolean;
  enableTakeawaySuggestions: boolean;
  enableArgumentExtraction: boolean;
  enableGapAnalysis: boolean;
  // ... more settings
}
```

### AI Features
- Connection suggestions between papers
- Takeaway generation from abstracts
- Argument extraction
- Research gap analysis
- Paper intake analysis (role, relevance)

## Key Hooks

- **useAppStore**: Main Zustand store with all CRUD operations
- **useAI**: AI suggestion management (uses store for settings)
- **useStorage**: Storage quota, cache management, multi-tab info
- **useDiscovery**: Paper discovery with Semantic Scholar
- **useAutoConnect**: Automatic connection suggestions
