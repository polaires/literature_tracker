# IdeaGraph: Literature Idea Connection Tool

## Design Document v1.0

> **Philosophy**: Zotero catalogs papers. IdeaGraph catalogs ideas.

---

## Table of Contents

1. [Vision & Problem Statement](#1-vision--problem-statement)
2. [Core Concepts](#2-core-concepts)
3. [Feature Specification](#3-feature-specification)
4. [Data Model](#4-data-model)
5. [User Interface Design](#5-user-interface-design)
6. [Technical Architecture](#6-technical-architecture)
7. [API Integrations](#7-api-integrations)
8. [Visualization System](#8-visualization-system)
9. [AI Features Roadmap](#9-ai-features-roadmap)
10. [Integration Strategy](#10-integration-strategy)
11. [Development Phases](#11-development-phases)

---

## 1. Vision & Problem Statement

### The Problem

Modern researchers face a paradox: **AI helps us read faster, but not remember better.**

With tools like ChatGPT, Claude, and specialized research assistants, PhD students and researchers can consume more papers than ever. But this creates new problems:

1. **Knowledge Evaporation**: Papers read with AI assistance are quickly forgotten
2. **Context Loss**: "Why did I save this 6 months ago?"
3. **Disconnected Insights**: Individual paper notes don't build into coherent arguments
4. **Citation ≠ Understanding**: Knowing a paper exists isn't the same as understanding its contribution

### Existing Tools Fall Short

| Tool | What It Does Well | What It Misses |
|------|-------------------|----------------|
| **Zotero** | Collecting, citing, organizing | Doesn't track ideas or reading comprehension |
| **Connected Papers** | Visual citation networks | Connections are mechanical (citations), not intellectual |
| **Notion/Obsidian** | Flexible note-taking | No structure for academic synthesis |
| **Elicit/Semantic Scholar** | Discovery, AI summaries | Doesn't integrate with YOUR understanding |

### Our Solution

**IdeaGraph** forces active synthesis by requiring researchers to articulate:
- **What is the key insight?** (Takeaway)
- **What claims does it make?** (Arguments)
- **What evidence supports those claims?** (Evidence)
- **How does it connect to my research?** (Thesis Role)
- **How does it relate to other papers I've read?** (Connections)

The result is a personal knowledge graph of **ideas**, not just papers.

---

## 2. Core Concepts

### 2.1 The Thesis

A **Thesis** is a central research question or hypothesis that anchors your literature exploration.

```
Examples:
- "What are the limitations of AlphaFold for drug discovery?"
- "How does cellular stress affect protein aggregation?"
- "What factors determine CRISPR off-target effects?"
```

**Properties**:
- Users can have multiple theses (but encouraged to focus)
- Each thesis has its own paper collection and connection graph
- Theses can be archived when research direction changes

### 2.2 The Paper Entry

A **Paper** is not just metadata—it's your synthesized understanding.

**Required Fields** (the core value):
| Field | Description | Why It Matters |
|-------|-------------|----------------|
| **Takeaway** | One sentence: what's the key insight? | Forces distillation |
| **Arguments** | What claims does the paper make? | Identifies debatable points |
| **Evidence** | What supports those claims? | Evaluates strength |
| **Thesis Role** | How does this relate to your thesis? | Contextualizes relevance |

**Auto-fetched Fields**:
- Title, Authors, Year, Journal
- DOI, URL, Abstract
- Citation count, Open Access link

### 2.3 Connections

**Connections** are explicit intellectual relationships between papers.

| Type | Meaning | Example |
|------|---------|---------|
| `supports` | Paper B provides evidence for Paper A | "Smith 2023 supports Jones 2022's hypothesis" |
| `contradicts` | Papers disagree on a key point | "These papers have opposite conclusions on X" |
| `extends` | Paper B builds on Paper A | "This paper improves the method from..." |
| `uses-method-from` | Methodological dependency | "I should use this protocol" |
| `same-topic` | Topically related, no direct link | "Both about protein folding" |
| `reviews` | One paper reviews/cites the other | "This review covers that original research" |
| `replicates` | Replication study | "Attempted to reproduce results" |
| `critiques` | Critical commentary | "This paper critiques the methodology of..." |

### 2.4 The Knowledge Graph

The **Knowledge Graph** visualizes your intellectual landscape:

```
                    ┌─────────────────────┐
                    │      THESIS         │
                    │  "My Research ??"   │
                    └─────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
   ┌──────────┐        ┌──────────┐        ┌──────────┐
   │ Paper A  │        │ Paper B  │        │ Paper C  │
   │ SUPPORTS │◄─────► │CONTRADICTS│        │ METHOD  │
   │          │ debate │          │        │         │
   └──────────┘        └──────────┘        └──────────┘
         │                    │
         │ extends            │ uses-method
         ▼                    ▼
   ┌──────────┐        ┌──────────┐
   │ Paper D  │        │ Paper E  │
   └──────────┘        └──────────┘
```

---

## 3. Feature Specification

### 3.1 Phase 1: Core MVP

#### P1.1 Thesis Management
- [ ] Create new thesis with title and description
- [ ] View list of all theses
- [ ] Archive/unarchive thesis
- [ ] Set active thesis (context for adding papers)
- [ ] Delete thesis (with confirmation)

#### P1.2 Paper Entry
- [ ] Add paper by DOI (auto-fetch metadata)
- [ ] Add paper by URL (attempt to extract DOI)
- [ ] Add paper manually (fallback)
- [ ] **Required**: Enter takeaway before saving
- [ ] **Prompted**: Enter arguments (at least one)
- [ ] **Prompted**: Enter evidence (at least one)
- [ ] Select thesis role (supports/contradicts/method/background/other)
- [ ] Set reading status (reading/read/to-revisit)
- [ ] Edit paper entry
- [ ] Delete paper (with confirmation)

#### P1.3 Paper List View
- [ ] View all papers in current thesis
- [ ] Sort by: date added, year published, reading status
- [ ] Filter by: thesis role, reading status
- [ ] Search by: title, author, takeaway, arguments
- [ ] Quick view: show takeaway on hover/expand

#### P1.4 Connection Management
- [ ] Create connection between two papers
- [ ] Select connection type
- [ ] Add connection note (why this connection?)
- [ ] View connections for a paper
- [ ] Delete connection

#### P1.5 Force-Directed Graph View
- [ ] Display thesis as central node
- [ ] Display papers as nodes around thesis
- [ ] Color-code by thesis role
- [ ] Show connections as edges
- [ ] Edge style varies by connection type
- [ ] Click node to view paper details
- [ ] Drag nodes to rearrange
- [ ] Zoom and pan
- [ ] Highlight connected papers on hover

#### P1.6 Data Persistence
- [ ] Save all data to LocalStorage
- [ ] Auto-save on changes
- [ ] Export data as JSON
- [ ] Import data from JSON
- [ ] Clear all data (with confirmation)

#### P1.7 Import/Export
- [ ] Import from BibTeX file
- [ ] Import from RIS file
- [ ] Export thesis as BibTeX
- [ ] Export thesis as Markdown (for writing)

### 3.2 Phase 2: Enhanced Features

#### P2.1 Advanced Visualization
- [ ] Timeline view (papers by publication year)
- [ ] Argument map view (hierarchical)
- [ ] Filter graph by connection type
- [ ] Cluster papers by topic
- [ ] Mini-map for large graphs

#### P2.2 Search & Discovery
- [ ] Full-text search across all theses
- [ ] "Papers I might have forgotten" (not accessed in X days)
- [ ] Find gaps: "No papers contradicting this claim"
- [ ] Citation network import (from Semantic Scholar)

#### P2.3 Collaboration (Optional)
- [ ] Share thesis as read-only link
- [ ] Export interactive graph as HTML
- [ ] Import shared thesis

### 3.3 Phase 3: AI Features

#### P3.1 AI-Assisted Entry
- [ ] Suggest takeaway from abstract (user must confirm/edit)
- [ ] Suggest arguments from full text
- [ ] Suggest evidence from full text
- [ ] **Always requires human confirmation**

#### P3.2 AI-Suggested Connections
- [ ] Analyze takeaways to suggest connections
- [ ] Identify potential contradictions
- [ ] Find methodological similarities
- [ ] Flag as "AI-suggested" (user must approve)

#### P3.3 Synthesis Assistance
- [ ] Generate literature review draft from thesis
- [ ] Summarize argument structure
- [ ] Identify strongest/weakest evidence chains

---

## 4. Data Model

### 4.1 TypeScript Interfaces

```typescript
// ============================================
// CORE TYPES
// ============================================

type ThesisRole =
  | 'supports'      // Provides evidence for thesis
  | 'contradicts'   // Argues against thesis
  | 'method'        // Provides methodology
  | 'background'    // General context
  | 'other';        // Uncategorized

type ConnectionType =
  | 'supports'      // Paper B supports Paper A's claims
  | 'contradicts'   // Papers disagree
  | 'extends'       // Paper B builds on Paper A
  | 'uses-method'   // Methodological dependency
  | 'same-topic'    // Topically related
  | 'reviews'       // Review relationship
  | 'replicates'    // Replication study
  | 'critiques';    // Critical commentary

type ReadingStatus =
  | 'to-read'       // Added but not read
  | 'reading'       // Currently reading
  | 'read'          // Finished reading
  | 'to-revisit';   // Need to re-read

// ============================================
// THESIS
// ============================================

interface Thesis {
  id: string;                    // UUID
  title: string;                 // Research question/hypothesis
  description: string;           // Longer explanation
  createdAt: string;             // ISO date
  updatedAt: string;             // ISO date
  isArchived: boolean;           // Soft delete
  paperIds: string[];            // References to papers
  connectionIds: string[];       // References to connections
}

// ============================================
// PAPER
// ============================================

interface Paper {
  id: string;                    // UUID
  thesisId: string;              // Parent thesis

  // Metadata (auto-fetched)
  doi: string | null;
  title: string;
  authors: Author[];
  year: number | null;
  journal: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  abstract: string | null;
  url: string | null;
  pdfUrl: string | null;
  citationCount: number | null;

  // User synthesis (THE CORE VALUE)
  takeaway: string;              // REQUIRED - one sentence insight
  arguments: Argument[];         // Claims the paper makes
  evidence: Evidence[];          // Supporting evidence
  assessment: string | null;     // Your critical evaluation

  // Organization
  thesisRole: ThesisRole;
  readingStatus: ReadingStatus;
  tags: string[];

  // Timestamps
  addedAt: string;               // When added to system
  readAt: string | null;         // When marked as read
  lastAccessedAt: string;        // For "forgotten papers" feature

  // Source tracking
  source: 'doi' | 'url' | 'bibtex' | 'manual';
  rawBibtex: string | null;      // Original if imported
}

interface Author {
  name: string;
  orcid?: string;
}

interface Argument {
  id: string;
  claim: string;                 // The claim being made
  strength: 'strong' | 'moderate' | 'weak' | null;
  yourAssessment: 'agree' | 'disagree' | 'uncertain' | null;
}

interface Evidence {
  id: string;
  description: string;           // What the evidence is
  type: 'experimental' | 'computational' | 'theoretical' | 'meta-analysis' | 'other';
  linkedArgumentId: string | null;  // Which argument it supports
}

// ============================================
// CONNECTION
// ============================================

interface Connection {
  id: string;
  thesisId: string;              // Parent thesis
  fromPaperId: string;           // Source paper
  toPaperId: string;             // Target paper
  type: ConnectionType;
  note: string | null;           // Why this connection?

  // AI features
  aiSuggested: boolean;          // Was this AI-generated?
  aiConfidence: number | null;   // 0-1 confidence score
  userApproved: boolean;         // Has user confirmed?

  createdAt: string;
}

// ============================================
// APPLICATION STATE
// ============================================

interface AppState {
  theses: Thesis[];
  papers: Paper[];
  connections: Connection[];
  activeThesisId: string | null;
  settings: UserSettings;
}

interface UserSettings {
  defaultView: 'list' | 'graph';
  graphLayout: 'force' | 'hierarchical' | 'timeline';
  theme: 'light' | 'dark' | 'system';
  autoSave: boolean;
  showAiSuggestions: boolean;
}
```

### 4.2 LocalStorage Schema

```typescript
// Storage keys
const STORAGE_KEYS = {
  THESES: 'ideagraph_theses',
  PAPERS: 'ideagraph_papers',
  CONNECTIONS: 'ideagraph_connections',
  SETTINGS: 'ideagraph_settings',
  ACTIVE_THESIS: 'ideagraph_active_thesis',
  VERSION: 'ideagraph_version',  // For migrations
};

// Version for data migrations
const CURRENT_VERSION = '1.0.0';
```

### 4.3 Data Validation Rules

```typescript
// Paper validation
const paperValidation = {
  takeaway: {
    required: true,
    minLength: 10,
    maxLength: 500,
    errorMessage: 'Takeaway is required (10-500 characters)'
  },
  arguments: {
    required: false,  // Prompted but not required in MVP
    minItems: 0,
    maxItems: 10
  },
  evidence: {
    required: false,
    minItems: 0,
    maxItems: 20
  },
  thesisRole: {
    required: true,
    values: ['supports', 'contradicts', 'method', 'background', 'other']
  }
};
```

---

## 5. User Interface Design

### 5.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER                                                              │
│  [Logo] IdeaGraph    [Thesis Dropdown ▼]    [Settings] [Export]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐  ┌───────────────────────────────────────────────┐ │
│  │             │  │                                                │ │
│  │  SIDEBAR    │  │              MAIN CONTENT                      │ │
│  │             │  │                                                │ │
│  │  Papers     │  │   [List View]  [Graph View]  [Timeline]        │ │
│  │  List       │  │                                                │ │
│  │             │  │   ┌─────────────────────────────────────────┐  │ │
│  │  - Paper 1  │  │   │                                         │  │ │
│  │  - Paper 2  │  │   │     Current View Content                │  │ │
│  │  - Paper 3  │  │   │     (List / Graph / Timeline)           │  │ │
│  │  ...        │  │   │                                         │  │ │
│  │             │  │   │                                         │  │ │
│  │  [+ Add]    │  │   └─────────────────────────────────────────┘  │ │
│  │             │  │                                                │ │
│  └─────────────┘  └───────────────────────────────────────────────┘ │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  DETAIL PANEL (slides in from right when paper selected)            │
│  [Paper Title]                                          [X Close]   │
│  Authors, Year, Journal                                             │
│  ─────────────────────────────────────────────────────────────────  │
│  TAKEAWAY: "One sentence insight..."                                │
│  ARGUMENTS: • Claim 1  • Claim 2                                    │
│  EVIDENCE: • Evidence 1  • Evidence 2                               │
│  CONNECTIONS: [Paper X - supports] [Paper Y - contradicts]          │
│  [Edit] [Add Connection] [Delete]                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Key Screens

#### Screen 1: Thesis Selection / Home
```
┌─────────────────────────────────────────────────────────────────┐
│                        YOUR RESEARCH                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  📚 AlphaFold Limitations                                │    │
│  │  "What are the limitations of AlphaFold for drug..."    │    │
│  │  12 papers · 8 connections · Last updated 2 days ago    │    │
│  │                                            [Open →]      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  🧬 CRISPR Off-targets                                   │    │
│  │  "What factors determine CRISPR off-target effects?"    │    │
│  │  7 papers · 3 connections · Last updated 1 week ago     │    │
│  │                                            [Open →]      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│                    [+ New Thesis]                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Screen 2: Add Paper Modal
```
┌─────────────────────────────────────────────────────────────────┐
│                       ADD NEW PAPER                      [X]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HOW WOULD YOU LIKE TO ADD THIS PAPER?                          │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   📎 DOI    │  │  📄 BibTeX  │  │  ✏️ Manual  │              │
│  │   (paste)   │  │  (import)   │  │   (type)    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Paste DOI or URL:                                       │    │
│  │  [10.1038/s41586-021-03819-2                          ]  │    │
│  │                                          [Fetch →]       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  FETCHED METADATA                                    [✓ Correct]│
│  Title: Highly accurate protein structure prediction...         │
│  Authors: Jumper, J., Evans, R., Pritzel, A., et al.           │
│  Year: 2021 | Journal: Nature                                   │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  YOUR SYNTHESIS (Required)                                       │
│                                                                  │
│  📌 Takeaway * (What's the one key insight?)                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ AlphaFold2 achieves near-experimental accuracy for      │    │
│  │ protein structure prediction using attention mechanisms │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  💬 Arguments (What claims does the paper make?)                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ + Add argument                                           │    │
│  │ • "Deep learning can solve protein folding"             │    │
│  │ • "Attention mechanisms capture co-evolution"           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  🔬 Evidence (What supports those claims?)                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ + Add evidence                                           │    │
│  │ • "Median GDT-TS of 92.4 on CASP14 targets"            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  🎯 Role in Your Thesis                                         │
│  ( ) Supports   ( ) Contradicts   (•) Method                    │
│  ( ) Background ( ) Other                                       │
│                                                                  │
│                              [Cancel]  [Save Paper]             │
└─────────────────────────────────────────────────────────────────┘
```

#### Screen 3: Graph View
```
┌─────────────────────────────────────────────────────────────────┐
│  [List]  [Graph ●]  [Timeline]              [Filter ▼] [Zoom]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                          ┌─────────┐                            │
│                          │ THESIS  │                            │
│           ┌──────────────│ AlphaFold│──────────────┐            │
│           │              │  Limits  │              │            │
│           │              └─────────┘              │            │
│           │                   │                    │            │
│           │        ┌──────────┼──────────┐        │            │
│           ▼        ▼          ▼          ▼        ▼            │
│      ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐        │
│      │Paper A ││Paper B ││Paper C ││Paper D ││Paper E │        │
│      │supports││contradict│method ││ bg    ││supports│        │
│      └────────┘└────────┘└────────┘└────────┘└────────┘        │
│           │         │                                           │
│           └────┬────┘                                           │
│                │ contradicts                                    │
│                ▼                                                 │
│                                                                  │
│  LEGEND:                                                        │
│  🟢 Supports  🔴 Contradicts  🔵 Method  ⚪ Background          │
│  ── supports  ╌╌ contradicts  ·· extends                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Component Library

Using existing design system patterns where possible:

| Component | Description | Notes |
|-----------|-------------|-------|
| `ThesisCard` | Card displaying thesis summary | Click to open |
| `PaperCard` | Compact paper display | Shows takeaway preview |
| `PaperDetail` | Full paper information panel | Slide-in from right |
| `AddPaperModal` | Multi-step paper entry | DOI → Metadata → Synthesis |
| `ConnectionEditor` | Create/edit connections | Dropdown + note field |
| `GraphView` | Force-directed visualization | Cytoscape.js |
| `ListView` | Sortable/filterable table | Virtual scroll for performance |
| `TimelineView` | Chronological display | Horizontal scroll |

---

## 6. Technical Architecture

### 6.1 Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
├─────────────────────────────────────────────────────────────────┤
│  Framework:      React 18+ with TypeScript                      │
│  State:          React Context + useReducer (or Zustand)        │
│  Styling:        Tailwind CSS (consistent with parent project)  │
│  Visualization:  Cytoscape.js                                   │
│  Forms:          React Hook Form + Zod validation               │
│  Storage:        LocalStorage (Phase 1) → IndexedDB (Phase 2)   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL APIS                               │
├─────────────────────────────────────────────────────────────────┤
│  Primary:        Semantic Scholar API (abstracts, metadata)     │
│  Fallback:       CrossRef API (DOI resolution)                  │
│  Optional:       OpenAlex API (open access links)               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    FUTURE BACKEND (Phase 3+)                    │
├─────────────────────────────────────────────────────────────────┤
│  Database:       PostgreSQL or SQLite                           │
│  API:            REST or tRPC                                   │
│  Auth:           OAuth (optional, for sync)                     │
│  AI:             OpenAI/Claude API for suggestions              │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Project Structure

```
src/
├── components/
│   ├── common/              # Shared UI components
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Card.tsx
│   │   └── ...
│   ├── thesis/              # Thesis-related components
│   │   ├── ThesisCard.tsx
│   │   ├── ThesisList.tsx
│   │   ├── ThesisForm.tsx
│   │   └── ...
│   ├── paper/               # Paper-related components
│   │   ├── PaperCard.tsx
│   │   ├── PaperDetail.tsx
│   │   ├── PaperForm.tsx
│   │   ├── AddPaperModal.tsx
│   │   └── ...
│   ├── connection/          # Connection components
│   │   ├── ConnectionEditor.tsx
│   │   ├── ConnectionBadge.tsx
│   │   └── ...
│   └── visualization/       # Graph and views
│       ├── GraphView.tsx
│       ├── ListView.tsx
│       ├── TimelineView.tsx
│       └── ...
├── hooks/
│   ├── useThesis.ts         # Thesis CRUD operations
│   ├── usePapers.ts         # Paper CRUD operations
│   ├── useConnections.ts    # Connection operations
│   ├── useStorage.ts        # LocalStorage abstraction
│   ├── useMetadataFetch.ts  # DOI/URL metadata fetching
│   └── ...
├── services/
│   ├── storage.ts           # LocalStorage/IndexedDB
│   ├── semanticScholar.ts   # Semantic Scholar API
│   ├── crossref.ts          # CrossRef API
│   ├── bibtexParser.ts      # BibTeX import
│   └── export.ts            # Export utilities
├── types/
│   ├── thesis.ts
│   ├── paper.ts
│   ├── connection.ts
│   └── index.ts
├── utils/
│   ├── validation.ts        # Zod schemas
│   ├── formatting.ts        # Citation formatting
│   ├── graph.ts             # Graph utilities
│   └── ...
├── context/
│   ├── AppContext.tsx       # Global state
│   └── ThesisContext.tsx    # Active thesis context
└── pages/
    ├── Home.tsx             # Thesis selection
    ├── ThesisView.tsx       # Main workspace
    └── Settings.tsx         # User settings
```

### 6.3 State Management

```typescript
// Context-based state management
interface AppContextType {
  // Data
  theses: Thesis[];
  papers: Paper[];
  connections: Connection[];

  // Active state
  activeThesisId: string | null;
  selectedPaperId: string | null;

  // Actions
  createThesis: (thesis: Omit<Thesis, 'id' | 'createdAt' | 'updatedAt'>) => Thesis;
  updateThesis: (id: string, updates: Partial<Thesis>) => void;
  deleteThesis: (id: string) => void;

  addPaper: (paper: Omit<Paper, 'id' | 'addedAt'>) => Paper;
  updatePaper: (id: string, updates: Partial<Paper>) => void;
  deletePaper: (id: string) => void;

  createConnection: (connection: Omit<Connection, 'id' | 'createdAt'>) => Connection;
  deleteConnection: (id: string) => void;

  // Utilities
  getPapersForThesis: (thesisId: string) => Paper[];
  getConnectionsForPaper: (paperId: string) => Connection[];
  exportThesis: (thesisId: string) => string;
  importData: (json: string) => void;
}
```

---

## 7. API Integrations

### 7.1 Semantic Scholar API

**Base URL**: `https://api.semanticscholar.org/graph/v1`

**Get paper by DOI**:
```typescript
async function fetchPaperByDOI(doi: string): Promise<PaperMetadata> {
  const response = await fetch(
    `https://api.semanticscholar.org/graph/v1/paper/DOI:${doi}?fields=title,authors,year,venue,abstract,citationCount,openAccessPdf,externalIds`
  );

  if (!response.ok) {
    throw new Error('Paper not found');
  }

  return response.json();
}
```

**Response mapping**:
```typescript
interface SemanticScholarPaper {
  paperId: string;
  title: string;
  authors: { name: string; authorId: string }[];
  year: number;
  venue: string;
  abstract: string;
  citationCount: number;
  openAccessPdf: { url: string } | null;
  externalIds: { DOI?: string; ArXiv?: string };
}

function mapToPaper(ss: SemanticScholarPaper, thesisId: string): Partial<Paper> {
  return {
    doi: ss.externalIds.DOI || null,
    title: ss.title,
    authors: ss.authors.map(a => ({ name: a.name })),
    year: ss.year,
    journal: ss.venue,
    abstract: ss.abstract,
    citationCount: ss.citationCount,
    pdfUrl: ss.openAccessPdf?.url || null,
    thesisId,
    source: 'doi',
  };
}
```

### 7.2 CrossRef API (Fallback)

**Base URL**: `https://api.crossref.org/works`

```typescript
async function fetchFromCrossRef(doi: string): Promise<PaperMetadata> {
  const response = await fetch(
    `https://api.crossref.org/works/${doi}`,
    {
      headers: {
        'User-Agent': 'IdeaGraph/1.0 (mailto:your@email.com)'
      }
    }
  );

  if (!response.ok) {
    throw new Error('Paper not found');
  }

  const data = await response.json();
  return data.message;
}
```

### 7.3 Metadata Fetch Strategy

```typescript
async function fetchPaperMetadata(identifier: string): Promise<Partial<Paper>> {
  // 1. Try to extract DOI from identifier
  const doi = extractDOI(identifier);

  if (doi) {
    // 2. Try Semantic Scholar first (has abstracts)
    try {
      const ssData = await fetchPaperByDOI(doi);
      return mapSemanticScholarToPaper(ssData);
    } catch (e) {
      console.log('Semantic Scholar failed, trying CrossRef');
    }

    // 3. Fall back to CrossRef
    try {
      const crData = await fetchFromCrossRef(doi);
      return mapCrossRefToPaper(crData);
    } catch (e) {
      console.log('CrossRef failed');
    }
  }

  // 4. Return empty if all failed
  throw new Error('Could not fetch paper metadata');
}
```

---

## 8. Visualization System

### 8.1 Cytoscape.js Configuration

```typescript
import cytoscape from 'cytoscape';

// Graph initialization
const cy = cytoscape({
  container: document.getElementById('graph-container'),

  elements: {
    nodes: [
      // Thesis node (central)
      { data: { id: 'thesis', label: thesisTitle, type: 'thesis' } },
      // Paper nodes
      ...papers.map(p => ({
        data: {
          id: p.id,
          label: p.title.slice(0, 30) + '...',
          type: 'paper',
          role: p.thesisRole,
          takeaway: p.takeaway
        }
      }))
    ],
    edges: [
      // Thesis-to-paper edges
      ...papers.map(p => ({
        data: {
          source: 'thesis',
          target: p.id,
          type: 'thesis-role',
          role: p.thesisRole
        }
      })),
      // Paper-to-paper connections
      ...connections.map(c => ({
        data: {
          source: c.fromPaperId,
          target: c.toPaperId,
          type: c.type,
          label: c.type
        }
      }))
    ]
  },

  style: [
    // Thesis node style
    {
      selector: 'node[type="thesis"]',
      style: {
        'background-color': '#6366f1',
        'label': 'data(label)',
        'width': 80,
        'height': 80,
        'font-size': '14px',
        'text-wrap': 'wrap',
        'text-max-width': '100px'
      }
    },
    // Paper node styles by role
    {
      selector: 'node[role="supports"]',
      style: { 'background-color': '#22c55e' }  // Green
    },
    {
      selector: 'node[role="contradicts"]',
      style: { 'background-color': '#ef4444' }  // Red
    },
    {
      selector: 'node[role="method"]',
      style: { 'background-color': '#3b82f6' }  // Blue
    },
    {
      selector: 'node[role="background"]',
      style: { 'background-color': '#9ca3af' }  // Gray
    },
    // Edge styles by connection type
    {
      selector: 'edge[type="contradicts"]',
      style: {
        'line-style': 'dashed',
        'line-color': '#ef4444',
        'target-arrow-color': '#ef4444'
      }
    },
    {
      selector: 'edge[type="supports"]',
      style: {
        'line-color': '#22c55e',
        'target-arrow-color': '#22c55e'
      }
    }
  ],

  layout: {
    name: 'cose',  // Force-directed layout
    idealEdgeLength: 150,
    nodeOverlap: 20,
    refresh: 20,
    fit: true,
    padding: 30,
    randomize: false,
    componentSpacing: 100,
    nodeRepulsion: 400000,
    edgeElasticity: 100,
    nestingFactor: 5,
    gravity: 80,
    numIter: 1000,
    initialTemp: 200,
    coolingFactor: 0.95,
    minTemp: 1.0
  }
});

// Event handlers
cy.on('tap', 'node[type="paper"]', (event) => {
  const paperId = event.target.id();
  onPaperSelect(paperId);
});

cy.on('mouseover', 'node[type="paper"]', (event) => {
  const takeaway = event.target.data('takeaway');
  showTooltip(takeaway, event.position);
});
```

### 8.2 Layout Options

```typescript
const layouts = {
  // Force-directed (default) - clusters related papers
  force: {
    name: 'cose',
    // ... cose options
  },

  // Concentric - thesis in center, papers in rings by role
  concentric: {
    name: 'concentric',
    concentric: (node) => {
      if (node.data('type') === 'thesis') return 3;
      if (node.data('role') === 'supports') return 2;
      if (node.data('role') === 'contradicts') return 2;
      return 1;
    },
    levelWidth: () => 1
  },

  // Hierarchical - thesis at top, papers below
  hierarchical: {
    name: 'dagre',
    rankDir: 'TB',  // Top to bottom
    nodeSep: 50,
    rankSep: 100
  },

  // Circle - simple circular layout
  circle: {
    name: 'circle',
    radius: 200
  }
};
```

### 8.3 Interactive Features

```typescript
// Highlight connections on hover
cy.on('mouseover', 'node', (e) => {
  const node = e.target;
  const neighborhood = node.neighborhood().add(node);

  cy.elements().addClass('faded');
  neighborhood.removeClass('faded');
});

cy.on('mouseout', 'node', () => {
  cy.elements().removeClass('faded');
});

// Zoom to fit on double-click
cy.on('dbltap', () => {
  cy.fit(cy.elements(), 50);
});

// Context menu for connections
cy.on('cxttap', 'node[type="paper"]', (e) => {
  showContextMenu(e.position, [
    { label: 'View Details', action: () => viewPaper(e.target.id()) },
    { label: 'Add Connection', action: () => startConnection(e.target.id()) },
    { label: 'Edit', action: () => editPaper(e.target.id()) },
    { label: 'Delete', action: () => deletePaper(e.target.id()) }
  ]);
});
```

---

## 9. AI Features Roadmap

### 9.1 Phase 3 AI Integration

**Principle**: AI assists, human confirms. Never auto-populate without user review.

#### 9.1.1 Takeaway Suggestion

```typescript
interface AISuggestion {
  suggestion: string;
  confidence: number;
  source: 'abstract' | 'full-text';
}

async function suggestTakeaway(paper: Paper): Promise<AISuggestion> {
  // Use abstract to generate suggested takeaway
  const prompt = `
    Based on this paper abstract, suggest a one-sentence takeaway
    that captures the key insight or contribution:

    Title: ${paper.title}
    Abstract: ${paper.abstract}

    The takeaway should:
    - Be one clear sentence
    - Focus on the main finding or contribution
    - Be specific, not generic
    - Be written from the reader's perspective
  `;

  // Call AI API (placeholder)
  const response = await aiAPI.complete(prompt);

  return {
    suggestion: response.text,
    confidence: response.confidence,
    source: 'abstract'
  };
}
```

#### 9.1.2 Connection Suggestions

```typescript
interface ConnectionSuggestion {
  fromPaperId: string;
  toPaperId: string;
  type: ConnectionType;
  reason: string;
  confidence: number;
}

async function suggestConnections(
  papers: Paper[]
): Promise<ConnectionSuggestion[]> {
  // Compare all paper takeaways to find potential connections
  const suggestions: ConnectionSuggestion[] = [];

  for (let i = 0; i < papers.length; i++) {
    for (let j = i + 1; j < papers.length; j++) {
      const similarity = await compareTexts(
        papers[i].takeaway + papers[i].arguments.join(' '),
        papers[j].takeaway + papers[j].arguments.join(' ')
      );

      if (similarity.score > 0.7) {
        suggestions.push({
          fromPaperId: papers[i].id,
          toPaperId: papers[j].id,
          type: similarity.relationship,
          reason: similarity.explanation,
          confidence: similarity.score
        });
      }
    }
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence);
}
```

### 9.2 AI UI Integration

```
┌─────────────────────────────────────────────────────────────────┐
│  AI SUGGESTIONS                                        [Hide]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  💡 Suggested Takeaway:                                         │
│  "AlphaFold2 achieves atomic accuracy for most proteins but    │
│   struggles with disordered regions and protein complexes"     │
│                                                                  │
│  [Use This]  [Edit & Use]  [Dismiss]                           │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  🔗 Potential Connections Found:                                │
│                                                                  │
│  Paper A ←→ Paper B                                             │
│  Type: contradicts (85% confidence)                             │
│  Reason: "Both papers discuss folding accuracy but reach       │
│          opposite conclusions about practical utility"          │
│  [Approve]  [Dismiss]                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Integration Strategy

### 10.1 Standalone vs. Integrated

This tool is designed to work both:

1. **Standalone**: As its own web application
2. **Integrated**: As a module within a larger application (like protein engineering tools)

### 10.2 Integration Points

```typescript
// Export as a React component for integration
export function LiteratureTracker({
  // Optional: pre-configured thesis
  initialThesis?: Thesis;

  // Optional: callback when paper is added
  onPaperAdded?: (paper: Paper) => void;

  // Optional: external storage adapter
  storageAdapter?: StorageAdapter;

  // Optional: custom styling
  className?: string;
  theme?: 'light' | 'dark';

  // Optional: restrict features
  features?: {
    allowMultipleTheses?: boolean;
    enableAI?: boolean;
    enableExport?: boolean;
  };
}): JSX.Element;

// Storage adapter interface for custom backends
interface StorageAdapter {
  getTheses(): Promise<Thesis[]>;
  saveThesis(thesis: Thesis): Promise<void>;
  deleteThesis(id: string): Promise<void>;
  getPapers(thesisId: string): Promise<Paper[]>;
  savePaper(paper: Paper): Promise<void>;
  deletePaper(id: string): Promise<void>;
  // ... etc
}
```

### 10.3 Integration Example

```tsx
// In parent application
import { LiteratureTracker } from '@your-org/ideagraph';

function ResearchWorkspace() {
  return (
    <div className="workspace">
      <ProteinDesignTool />

      <LiteratureTracker
        initialThesis={{
          id: 'protein-design',
          title: 'Literature for current project',
          description: 'Papers related to my protein design work'
        }}
        onPaperAdded={(paper) => {
          // Log to analytics, sync to server, etc.
          console.log('Paper added:', paper.title);
        }}
        features={{
          allowMultipleTheses: false,  // Keep focused
          enableAI: true
        }}
      />
    </div>
  );
}
```

### 10.4 Shared Dependencies

When integrating, ensure compatible versions of:
- React 18+
- Tailwind CSS (if using shared styling)
- Cytoscape.js (if parent also uses graph visualization)

---

## 11. Development Phases

### Phase 1: Core MVP (4-6 weeks)

**Goal**: Working tool with essential features

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | Setup & Data Model | Project structure, TypeScript types, LocalStorage service |
| 2 | Paper Management | Add paper (DOI fetch), paper list, paper detail view |
| 3 | Thesis Management | Create/edit/delete thesis, thesis selection |
| 4 | Connections | Create connections, connection list |
| 5 | Graph View | Cytoscape.js integration, force-directed layout |
| 6 | Polish | Import/export, search, bug fixes |

**MVP Checklist**:
- [ ] Add paper by DOI with metadata fetch
- [ ] Required takeaway entry
- [ ] Arguments and evidence capture
- [ ] Thesis role assignment
- [ ] Paper list with search/filter
- [ ] Create connections between papers
- [ ] Force-directed graph visualization
- [ ] LocalStorage persistence
- [ ] JSON export/import
- [ ] BibTeX import

### Phase 2: Enhanced Features (4 weeks)

- [ ] Timeline view
- [ ] Advanced graph filtering
- [ ] "Forgotten papers" reminders
- [ ] Reading statistics
- [ ] Multiple layout options
- [ ] Keyboard shortcuts
- [ ] Improved mobile experience

### Phase 3: AI Features (4 weeks)

- [ ] AI takeaway suggestions
- [ ] AI connection suggestions
- [ ] Literature review draft generation
- [ ] Gap analysis

### Phase 4: Collaboration & Sync (Future)

- [ ] User accounts
- [ ] Cloud sync
- [ ] Sharing theses
- [ ] Team collaboration

---

## Appendix A: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + N` | New paper |
| `Cmd/Ctrl + F` | Search |
| `Cmd/Ctrl + G` | Toggle graph/list view |
| `Cmd/Ctrl + E` | Export thesis |
| `Escape` | Close modal/panel |
| `Arrow keys` | Navigate papers in list |
| `Enter` | Open selected paper |

---

## Appendix B: Citation Format

Papers are stored with enough metadata to generate citations in any format. Default display format:

```
Jumper, J., Evans, R., Pritzel, A., et al. (2021).
Highly accurate protein structure prediction with AlphaFold.
Nature, 596(7873), 583-589.
https://doi.org/10.1038/s41586-021-03819-2
```

Export formats supported:
- BibTeX
- RIS
- APA
- MLA
- Chicago
- Vancouver

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| **Thesis** | A central research question or hypothesis that anchors paper collection |
| **Takeaway** | A one-sentence summary of a paper's key insight (user-written) |
| **Argument** | A claim or assertion made by a paper |
| **Evidence** | Data or reasoning that supports an argument |
| **Connection** | An explicit intellectual relationship between two papers |
| **Thesis Role** | How a paper relates to your thesis (supports, contradicts, etc.) |

---

*Document Version: 1.0*
*Last Updated: 2024*
*Author: Research Tools Team*
