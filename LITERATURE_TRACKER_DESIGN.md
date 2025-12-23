# IdeaGraph: Literature Idea Connection Tool

## Design Document v2.0

> **Philosophy**: Zotero catalogs papers. IdeaGraph catalogs ideas.

### Implementation Status Summary

| Phase | Status | Completion |
|-------|--------|------------|
| **Phase 1: Core MVP** | ✅ Complete | 100% |
| **Phase 2: Enhanced Features** | ✅ Complete | 100% |
| **Phase 2.5: Screening Workflow** | ✅ Complete | 100% |
| **Phase 2.6: Synthesis Tools** | ✅ Complete | 100% |
| **Phase 3: AI Features** | ✅ Complete | 100% |
| **Phase 4: Collaboration** | 🔄 Partial | 20% (Clustering only) |

**Current Tech Stack**: React 19 + TypeScript 5.9 + Vite 7 + Tailwind 4 + Zustand 5 + Cytoscape.js + react-pdf-highlighter

**Last Audit**: December 2025

---

## Table of Contents

0. [Architecture Review & Critique](#0-architecture-review--critique)
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

## 0. Architecture Review & Critique

> **Audit Date**: December 2025
> **Status**: Implementation has significantly outpaced documentation

### 0.1 Implementation vs. Design: Key Discrepancies

#### ✅ What's Working Well

| Area | Design Intent | Implementation Reality | Assessment |
|------|---------------|----------------------|------------|
| **State Management** | Zustand with persist | ✅ Correctly implemented with `ideagraph-storage` key | Excellent |
| **PDF Storage** | IndexedDB | ✅ Properly implemented with `idb` library | Excellent |
| **Core CRUD** | Thesis/Paper/Connection | ✅ All operations work correctly | Excellent |
| **Graph Visualization** | Cytoscape.js | ✅ Multiple layouts (fcose, concentric, circle, grid) | Excellent |
| **API Integration** | Semantic Scholar + CrossRef | ✅ Both implemented with rate limiting | Excellent |

#### ⚠️ Documentation Gaps (Features Implemented but Not Documented)

1. **Phase 2.5: PRISMA-style Screening Workflow**
   - `ScreeningDecision`: pending/include/exclude/maybe
   - `ExclusionReason`: 10 predefined reasons
   - Batch screening operations
   - Screening statistics dashboard

2. **Phase 2.6: Synthesis Tools**
   - `ReviewSection`: Organize papers into literature review sections
   - `SynthesisTheme`: Cross-paper thematic analysis
   - `ResearchGap`: Gap detection (with auto-inference from data)
   - `EvidenceSynthesis`: Aggregate evidence across papers
   - Synthesis matrix visualization

3. **Phase 3: AI Features (FULLY IMPLEMENTED)**
   - Multi-provider support: Claude, OpenAI, Ollama, Mock
   - Connection suggestions with confidence scores
   - Takeaway suggestions grounded in thesis context
   - Argument extraction from abstracts
   - Gap analysis using plan-based reasoning
   - Paper intake analysis (role + relevance + takeaway)
   - Feedback recording and learning
   - Adaptive context based on collection size

4. **Phase 4: Paper Clustering (Partial)**
   - `PaperCluster`: Manual paper grouping
   - Collapse/expand clusters in graph view
   - Color-coded cluster visualization

5. **Additional APIs Implemented**
   - **OpenAlex API**: Full implementation for paper lookup, search, related works, retraction checking
   - **Hybrid Discovery Search**: Combines Semantic Scholar + OpenAlex
   - **Retraction Checking**: Via OpenAlex + Semantic Scholar

### 0.2 Storage Architecture Critique

#### Current Storage Keys (Fragmented)

| Key | Purpose | File | TTL | Issues |
|-----|---------|------|-----|--------|
| `ideagraph-storage` | Main Zustand state | useAppStore.ts | None | ✅ OK |
| `ideagraph_ai_settings` | AI provider config | useAI.ts | None | ⚠️ Should be in Zustand |
| `ideagraph_similarity_cache` | Paper similarity | semanticScholar.ts | 7 days | ⚠️ Scattered cache |
| `ideagraph_embedding_cache` | SPECTER embeddings | semanticScholar.ts | None | ⚠️ 200 paper limit |
| `ideagraph_retraction_cache` | Retraction checks | retractionCheck.ts | 7 days | ⚠️ Scattered cache |
| `ideagraph_feedback_storage` | AI feedback | feedback/index.ts | None | ⚠️ Should be in Zustand |
| `ideagraph-pdfs` | PDF files | pdfStorage.ts | None | ✅ OK (IndexedDB) |

#### Problems Identified

1. **Cache Fragmentation**: 6+ localStorage keys scattered across codebase with inconsistent naming
2. **No Centralized Cache Manager**: TTLs handled manually in each service
3. **AI Settings Isolated**: Stored separately from main app state, creating two state management patterns
4. **VERSION Key Unused**: Defined in types but never checked—no migration system
5. **No Storage Quota Monitoring**: Risk of localStorage overflow (5-10MB limit)
6. **No Multi-Tab Conflict Resolution**: Last-write-wins could cause data loss

### 0.3 Data Model Drift

#### Design vs. Implementation

| Interface | Design Document | Actual Implementation | Status |
|-----------|-----------------|----------------------|--------|
| `ReadingStatus` | to-read, reading, read, to-revisit | + `screening` | ⚠️ Not documented |
| `Paper.source` | doi, url, bibtex, manual | + `zotero`, `search` | ⚠️ Not documented |
| `Paper` fields | 25 fields | 31 fields (+screening, semanticScholarId) | ⚠️ Not documented |
| `AppState` | 5 collections | 10 collections | ⚠️ Missing 5 new types |

#### New Types Not in Design Document

```typescript
// Phase 2.5
ScreeningDecision, ExclusionReason

// Phase 2.6
ReviewSection, SynthesisTheme, ResearchGap, EvidenceSynthesis

// Phase 3
AISettings, AIProviderType, AITaskType, AITask, AIError
ConnectionSuggestion, TakeawaySuggestion, ArgumentSuggestion, GapSuggestion

// Phase 4
PaperCluster
```

### 0.4 Recommendations

#### Immediate Actions

1. **Consolidate AI Settings into Zustand Store**
   ```typescript
   // Move from separate localStorage to:
   interface AppStore {
     // ... existing
     aiSettings: AISettings;  // Add here
   }
   ```

2. **Create Centralized Cache Manager**
   ```typescript
   // src/services/cache.ts
   export const cacheManager = {
     get(key: CacheKey): T | null,
     set(key: CacheKey, data: T, ttl?: number): void,
     invalidate(key: CacheKey): void,
     clear(): void,
     getStats(): { used: number; quota: number },
   };
   ```

3. **Implement Data Migration System**
   ```typescript
   const CURRENT_VERSION = '2.0.0';
   const migrations = {
     '1.0.0 -> 1.1.0': migrateScreeningFields,
     '1.1.0 -> 2.0.0': migrateAISettings,
   };
   ```

#### Medium-Term Improvements

4. **Add Storage Quota Monitoring**
   - Warn users when approaching localStorage limits
   - Implement automatic cache eviction

5. **Multi-Tab Synchronization**
   - Use BroadcastChannel API or localStorage events
   - Implement optimistic locking with timestamps

6. **Update This Design Document**
   - Add Phase 2.5 and 2.6 sections
   - Update Phase 3 to reflect actual implementation
   - Document all new data types
   - Add storage architecture section

### 0.5 Assessment Summary

| Category | Score | Notes |
|----------|-------|-------|
| **Core Features** | ⭐⭐⭐⭐⭐ | Thesis/Paper/Connection CRUD excellent |
| **AI Integration** | ⭐⭐⭐⭐⭐ | Full multi-provider AI with feedback |
| **PDF Annotations** | ⭐⭐⭐⭐⭐ | Zotero-like with IdeaGraph linking |
| **Storage Reliability** | ⭐⭐⭐⭐ | Works but fragmented caching |
| **Documentation Accuracy** | ⭐⭐ | Significantly outdated |
| **Migration Safety** | ⭐⭐ | No versioning or migration system |
| **Multi-Tab Safety** | ⭐⭐ | No conflict resolution |

**Overall**: The implementation has grown well beyond the documented design. The core architecture is sound, but technical debt is accumulating in storage management and documentation. Priority should be given to consolidating caches, implementing migrations, and updating this document.

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

#### P1.1 Thesis Management ✅ COMPLETE
- [x] Create new thesis with title and description
- [x] View list of all theses
- [x] Archive/unarchive thesis
- [x] Set active thesis (context for adding papers)
- [x] Delete thesis (with confirmation)

#### P1.2 Paper Entry ✅ COMPLETE
- [x] Add paper by DOI (auto-fetch metadata via Semantic Scholar + CrossRef fallback)
- [x] Add paper by URL (attempt to extract DOI)
- [x] Add paper manually (fallback)
- [x] **Required**: Enter takeaway before saving (min 10 characters enforced)
- [x] **Prompted**: Enter arguments (with strength and assessment)
- [x] **Prompted**: Enter evidence (with type classification)
- [x] Select thesis role (supports/contradicts/method/background/other)
- [x] Set reading status (to-read/reading/read/to-revisit)
- [x] Edit paper entry (full modal with arguments/evidence management)
- [x] Delete paper (with confirmation)

#### P1.3 Paper List View ✅ COMPLETE
- [x] View all papers in current thesis
- [x] Sort by: date added, title, year published, citation count, reading status
- [x] Filter by: thesis role, reading status
- [x] Search by: title, author, takeaway, tags
- [x] Quick view: show takeaway in paper cards

#### P1.4 Connection Management ✅ COMPLETE
- [x] Create connection between two papers
- [x] Select connection type (8 types with icons and descriptions)
- [x] Add connection note (why this connection?)
- [x] View connections for a paper
- [x] Delete connection
- [x] Direction indicator with swap functionality

#### P1.5 Force-Directed Graph View ✅ COMPLETE
- [x] Display papers as nodes
- [x] Color-code by thesis role (5 distinct colors)
- [x] Show connections as edges
- [x] Edge style varies by connection type (solid/dashed/dotted)
- [x] Click node to view paper details
- [x] Drag nodes to rearrange
- [x] Zoom and pan controls
- [x] Highlight connected papers on hover
- [x] Multiple layout algorithms (fcose, concentric, circle, grid)
- [x] Filter by role with toggles
- [x] Show/hide edges toggle
- [x] Hover tooltips with paper info

#### P1.6 Data Persistence ✅ COMPLETE
- [x] Save all data to LocalStorage (via Zustand persist middleware)
- [x] Auto-save on changes
- [x] Export data as JSON
- [x] Import data from JSON
- [x] Clear all data (with double confirmation)

#### P1.7 Import/Export ✅ COMPLETE
- [x] Import from BibTeX file (basic regex parser)
- [x] Import from RIS file (full RIS parser with all common tags)
- [x] Export thesis as BibTeX
- [x] Export thesis as Markdown (grouped by role)

### 3.2 Phase 2: Enhanced Features

#### P2.1 Advanced Visualization ⚠️ PARTIALLY COMPLETE
- [x] Timeline view (papers by publication year)
- [x] Argument map view (hierarchical) - papers organized by thesis role with expandable arguments/evidence
- [x] Filter graph by connection type (via role filter toggles)
- [ ] Cluster papers by topic
- [ ] Mini-map for large graphs

#### P2.2 Search & Discovery ⚠️ PARTIALLY COMPLETE
- [ ] Full-text search across all theses
- [x] "Papers I might have forgotten" (shows papers not accessed in 14+ days)
- [ ] Find gaps: "No papers contradicting this claim"
- [ ] Citation network import (from Semantic Scholar)
- [x] Reading statistics dashboard (by status and role)

#### P2.4 PDF Reader & Annotations ✅ COMPLETE
- [x] In-app PDF viewer (react-pdf-highlighter + PDF.js)
- [x] Text highlighting with 6 colors (yellow, red, green, blue, purple, orange)
- [x] Area/rectangle selection for figures and tables
- [x] Annotation comments and notes
- [x] Annotation sidebar with search and organization
- [x] Link annotations to Arguments (IdeaGraph integration)
- [x] Link annotations to Evidence (IdeaGraph integration)
- [x] Export annotation text to paper takeaway
- [x] PDF storage in IndexedDB (offline support)
- [x] Upload PDF from local file or URL
- [x] Page-organized annotation view

#### P2.5 Screening Workflow ✅ COMPLETE (PRISMA-style)

> **Implementation Note**: Added for systematic review support

- [x] Screening queue with pending/include/exclude/maybe decisions
- [x] 10 predefined exclusion reasons (not-relevant, wrong-study-type, duplicate, etc.)
- [x] Custom exclusion notes for "other" reason
- [x] Batch screening operations
- [x] Screening statistics dashboard
- [x] Auto-transition from 'screening' to 'to-read' on include

**New Types**:
```typescript
type ScreeningDecision = 'pending' | 'include' | 'exclude' | 'maybe';
type ExclusionReason = 'not-relevant' | 'wrong-study-type' | 'duplicate' |
  'no-full-text' | 'wrong-population' | 'wrong-outcome' |
  'low-quality' | 'language' | 'date-range' | 'other';
```

#### P2.6 Synthesis Tools ✅ COMPLETE

> **Implementation Note**: Literature review writing support

- [x] Review sections for organizing papers
- [x] Synthesis themes for cross-paper analysis
- [x] Research gap tracking (user-defined and auto-detected)
- [x] Evidence synthesis across papers
- [x] Synthesis matrix visualization (themes × papers)
- [x] Argument clustering by claim similarity

**New Types**:
```typescript
interface ReviewSection {
  id: string;
  thesisId: string;
  title: string;
  description: string | null;
  order: number;
  paperIds: string[];
  createdAt: string;
}

interface SynthesisTheme {
  id: string;
  thesisId: string;
  name: string;
  description: string | null;
  color: string;
  paperIds: string[];
  relatedArgumentIds: string[];
  createdAt: string;
}

interface ResearchGap {
  id: string;
  thesisId: string;
  title: string;
  description: string;
  type: 'knowledge' | 'methodological' | 'population' |
        'theoretical' | 'temporal' | 'geographic' | 'contradictory';
  priority: 'high' | 'medium' | 'low';
  evidenceSource: 'user' | 'inferred';
  relatedPaperIds: string[];
  futureResearchNote: string | null;
  createdAt: string;
}

interface EvidenceSynthesis {
  id: string;
  thesisId: string;
  claim: string;
  supportingPaperIds: string[];
  contradictingPaperIds: string[];
  evidenceStrength: 'strong' | 'moderate' | 'weak' | 'conflicting';
  consensusNote: string | null;
  createdAt: string;
}
```

#### P2.7 Collaboration (Optional)
- [ ] Share thesis as read-only link
- [ ] Export interactive graph as HTML
- [ ] Import shared thesis

### 3.3 Phase 3: AI Features ✅ COMPLETE

> **Implementation Note**: Full AI system implemented in `src/services/ai/` with multi-provider support

#### P3.1 AI-Assisted Entry ✅ COMPLETE
- [x] Suggest takeaway from abstract (user must confirm/edit)
- [x] Suggest thesis role based on abstract analysis
- [x] Extract arguments from abstracts with strength assessment
- [x] Unified paper intake analysis (role + takeaway + arguments + relevance)
- [x] **Always requires human confirmation**

#### P3.2 AI-Suggested Connections ✅ COMPLETE
- [x] Analyze takeaways to suggest connections
- [x] Identify potential contradictions
- [x] Find methodological similarities
- [x] Flag as "AI-suggested" with confidence scores (user must approve)
- [x] Grounding in user's existing synthesis (takeaways, arguments)

#### P3.3 Gap Analysis ✅ COMPLETE
- [x] AI-powered gap detection using plan-based reasoning
- [x] Auto-detection of contradictory findings
- [x] Identify temporal gaps (outdated literature)
- [x] Detect methodological gaps (missing evidence types)
- [x] Find knowledge gaps from weak arguments

#### P3.4 Provider Support ✅ COMPLETE
- [x] Claude API (primary, via Anthropic)
- [x] OpenAI API (alternative)
- [x] Ollama (local models)
- [x] Mock provider (for testing/demos)

#### P3.5 Feedback & Learning ✅ COMPLETE
- [x] Record accept/dismiss actions on suggestions
- [x] Store feedback for future model improvements
- [x] Adaptive context based on collection size (cold start → mature)

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
// PDF ANNOTATIONS (Zotero-like)
// ============================================

type AnnotationType =
  | 'highlight'     // Text highlight with color
  | 'underline'     // Text underline
  | 'note'          // Sticky note at position
  | 'area'          // Rectangle selection (screenshot)
  | 'text';         // Text insertion annotation

type AnnotationColor =
  | 'yellow'        // Default highlight
  | 'red'           // Important/contradicting
  | 'green'         // Supporting/agree
  | 'blue'          // Method/technical
  | 'purple'        // Question/unclear
  | 'orange';       // Review later

interface PDFAnnotation {
  id: string;
  paperId: string;              // Links to Paper
  type: AnnotationType;
  color: AnnotationColor;

  // Position (viewport-independent for storage)
  position: ScaledPosition;

  // Content
  selectedText?: string;        // For highlights/underlines
  comment?: string;             // User's note/comment
  imageDataUrl?: string;        // For area selections (base64)

  // IdeaGraph Integration - THE KEY DIFFERENTIATOR
  linkedArgumentId?: string;    // Link highlight to an argument
  linkedEvidenceId?: string;    // Link highlight to evidence
  exportedToTakeaway?: boolean; // Was this exported to paper takeaway?
  tags: string[];               // User tags for organization

  // Metadata
  createdAt: string;
  updatedAt: string;
  pageLabel?: string;           // Display label (e.g., "p. 5")
}

// For PDF file storage (IndexedDB)
interface PDFFile {
  id: string;
  paperId: string;
  filename: string;
  fileSize: number;
  // ArrayBuffer stored separately in IndexedDB
  addedAt: string;
  lastOpenedAt: string;
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

### 6.1 Cross-Platform Strategy

IdeaGraph is designed to run on multiple platforms from a single codebase:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SINGLE REACT CODEBASE                         │
│              (TypeScript + Tailwind + Cytoscape.js)              │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │     WEB     │    │   iOS App   │    │   Desktop   │
   │             │    │   macOS App │    │ (Optional)  │
   │   Vite      │    │  Capacitor  │    │   Tauri     │
   │   (build)   │    │  (wrapper)  │    │  (wrapper)  │
   └─────────────┘    └─────────────┘    └─────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
   Browser/PWA          App Store           Native Binary
```

**Why This Stack?**

| Requirement | Solution | Benefit |
|-------------|----------|---------|
| Web integration | React + Vite | Matches parent project exactly |
| iOS/macOS apps | Capacitor | Same codebase, native app wrapper |
| Desktop apps | Tauri | Already set up in parent project |
| Code reuse | Single React codebase | Write once, deploy everywhere |
| Consistent styling | Tailwind CSS | Same design on all platforms |

### 6.2 Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                      CORE FRAMEWORK (✅ IMPLEMENTED)             │
├─────────────────────────────────────────────────────────────────┤
│  Language:       TypeScript 5.9.3                                │
│  Framework:      React 19.2.0                                    │
│  Build Tool:     Vite 7.2.4                                      │
│  Styling:        Tailwind CSS 4.1.18                             │
│  State:          Zustand 5.0.9 (with persist middleware)         │
│  Routing:        React Router DOM 7.11.0                         │
│  Forms:          React Hook Form 7.69.0 + Zod 4.2.1              │
│  Visualization:  Cytoscape.js 3.33.1 + cytoscape-fcose 2.2.0     │
│  Icons:          Lucide React 0.562.0                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    PLATFORM WRAPPERS                             │
├─────────────────────────────────────────────────────────────────┤
│  iOS/macOS:      Capacitor 5.x                                   │
│                  - Native app wrapper for Apple platforms        │
│                  - Access to native APIs (file system, etc.)     │
│                  - App Store deployment ready                    │
│                                                                  │
│  Desktop:        Tauri 1.x (Optional)                            │
│                  - Already configured in parent project          │
│                  - Smaller bundle than Electron                  │
│                  - Windows/macOS/Linux support                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        STORAGE (✅ IMPLEMENTED)                  │
├─────────────────────────────────────────────────────────────────┤
│  App State:      LocalStorage via Zustand persist middleware     │
│                  - Storage key: 'ideagraph-storage'              │
│                  - Auto-save on all state changes                │
│  PDF Files:      IndexedDB via 'idb' library ✅                  │
│                  - Storage key: 'ideagraph-pdfs'                 │
│                  - Stores PDF ArrayBuffers for offline access    │
│                  - Indexed by paperId for fast lookup            │
│  Future:         Optional cloud sync (PostgreSQL/SQLite backend) │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL APIS (✅ IMPLEMENTED)              │
├─────────────────────────────────────────────────────────────────┤
│  Primary:        Semantic Scholar API ✅                         │
│                  - Paper metadata, abstracts, citations          │
│                  - TLDR summaries (pre-fills takeaway field)     │
│                  - SPECTER embeddings (768-dim vectors)          │
│                  - Similar paper discovery (Connected Papers-like)│
│                  - Rate limit: 100 req/sec with API key          │
│                                                                  │
│  Secondary:      OpenAlex API ✅                                 │
│                  - 209M+ works, free and open                    │
│                  - Retraction checking                           │
│                  - Related works discovery                       │
│                  - Concept/topic extraction for auto-tagging     │
│                                                                  │
│  Fallback:       CrossRef API ✅                                 │
│                  - DOI resolution, comprehensive coverage        │
│                  - Rate limit: 50 req/sec (polite pool)          │
│                                                                  │
│  AI Providers:   Multiple ✅                                     │
│                  - Claude API (Anthropic)                        │
│                  - OpenAI API                                    │
│                  - Ollama (local models)                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    FUTURE BACKEND (Phase 3+)                     │
├─────────────────────────────────────────────────────────────────┤
│  Database:       PostgreSQL or SQLite                            │
│  API:            REST or tRPC                                    │
│  Auth:           OAuth (optional, for sync)                      │
│  AI:             Claude/OpenAI API for suggestions               │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Capacitor Setup (iOS/macOS)

**Installation:**

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor
npx cap init "IdeaGraph" "com.yourorg.ideagraph"

# Add iOS platform
npm install @capacitor/ios
npx cap add ios

# Build and sync
npm run build
npx cap sync

# Open in Xcode
npx cap open ios
```

**capacitor.config.ts:**

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourorg.ideagraph',
  appName: 'IdeaGraph',
  webDir: 'dist',
  server: {
    // For development
    url: 'http://localhost:5173',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    // For macOS Catalyst support
    scheme: 'IdeaGraph'
  },
  plugins: {
    // Enable keyboard accessory bar for better text input
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  }
};

export default config;
```

**Useful Capacitor Plugins:**

| Plugin | Purpose |
|--------|---------|
| `@capacitor/filesystem` | Save/load JSON exports |
| `@capacitor/share` | Share thesis/papers |
| `@capacitor/clipboard` | Copy DOI/citations |
| `@capacitor/keyboard` | Better text input handling |
| `@capacitor/status-bar` | Native status bar styling |

### 6.4 Platform-Specific Considerations

**iOS/macOS (Capacitor):**
```typescript
// Detect platform for conditional features
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform(); // 'ios', 'android', 'web'

// Example: Use native file picker on iOS, web file input on browser
if (isNative) {
  // Use Capacitor Filesystem plugin
} else {
  // Use standard File API
}
```

**Responsive Design:**
```typescript
// Tailwind breakpoints work across all platforms
// Mobile-first approach ensures good iOS experience

// Example component
<div className="
  p-4 md:p-6           // Padding: mobile vs desktop
  grid grid-cols-1      // Single column on mobile
  md:grid-cols-2        // Two columns on tablet
  lg:grid-cols-3        // Three columns on desktop
">
```

**Safe Areas (iOS notch/Dynamic Island):**
```css
/* In your global CSS */
.app-container {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

### 6.5 Project Structure

```
ideagraph/
├── src/                        # React application source
│   ├── components/
│   │   ├── common/             # Shared UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Card.tsx
│   │   │   └── ...
│   │   ├── thesis/             # Thesis-related components
│   │   │   ├── ThesisCard.tsx
│   │   │   ├── ThesisList.tsx
│   │   │   ├── ThesisForm.tsx
│   │   │   └── ...
│   │   ├── paper/              # Paper-related components
│   │   │   ├── PaperCard.tsx
│   │   │   ├── PaperDetail.tsx
│   │   │   ├── PaperForm.tsx
│   │   │   ├── AddPaperModal.tsx
│   │   │   └── ...
│   │   ├── connection/         # Connection components
│   │   │   ├── ConnectionEditor.tsx
│   │   │   ├── ConnectionBadge.tsx
│   │   │   └── ...
│   │   ├── visualization/      # Graph and views
│   │   │   ├── GraphView.tsx
│   │   │   ├── ListView.tsx
│   │   │   ├── TimelineView.tsx
│   │   │   └── ...
│   │   └── pdf/                # PDF reader & annotations ✅
│   │       ├── PDFViewer.tsx   # Main PDF viewer with react-pdf-highlighter
│   │       ├── PDFUpload.tsx   # Upload PDF from file or URL
│   │       ├── AnnotationSidebar.tsx  # Sidebar with annotation list
│   │       └── index.ts        # Component exports
│   ├── hooks/
│   │   ├── useThesis.ts        # Thesis CRUD operations
│   │   ├── usePapers.ts        # Paper CRUD operations
│   │   ├── useConnections.ts   # Connection operations
│   │   ├── useStorage.ts       # LocalStorage abstraction
│   │   ├── useMetadataFetch.ts # DOI/URL metadata fetching
│   │   ├── usePlatform.ts      # Platform detection (web/iOS/desktop)
│   │   └── ...
│   ├── services/
│   │   ├── storage.ts          # LocalStorage/IndexedDB
│   │   ├── pdfStorage.ts       # PDF file storage in IndexedDB ✅
│   │   ├── semanticScholar.ts  # Semantic Scholar API
│   │   ├── crossref.ts         # CrossRef API
│   │   ├── bibtexParser.ts     # BibTeX import
│   │   ├── export.ts           # Export utilities
│   │   └── platform/           # Platform-specific services
│   │       ├── filesystem.ts   # Capacitor/Web file handling
│   │       └── share.ts        # Native share functionality
│   ├── lib/
│   │   └── pdfWorker.ts        # PDF.js worker configuration ✅
│   ├── types/
│   │   ├── thesis.ts
│   │   ├── paper.ts
│   │   ├── connection.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── validation.ts       # Zod schemas
│   │   ├── formatting.ts       # Citation formatting
│   │   ├── graph.ts            # Graph utilities
│   │   └── ...
│   ├── context/
│   │   ├── AppContext.tsx      # Global state
│   │   └── ThesisContext.tsx   # Active thesis context
│   ├── pages/
│   │   ├── Home.tsx            # Thesis selection
│   │   ├── ThesisView.tsx      # Main workspace
│   │   └── Settings.tsx        # User settings
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css               # Global styles + safe areas
│
├── public/                     # Static assets
│
├── ios/                        # Capacitor iOS project (generated)
│   ├── App/
│   │   ├── App.xcodeproj
│   │   └── ...
│   └── Podfile
│
├── src-tauri/                  # Tauri desktop (optional)
│   ├── src/
│   ├── tauri.conf.json
│   └── Cargo.toml
│
├── dist/                       # Build output (git-ignored)
│
├── package.json
├── capacitor.config.ts         # Capacitor configuration
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

### 6.6 State Management

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

### Phase 1: Core MVP ✅ COMPLETE

**Goal**: Working tool with essential features

| Week | Focus | Deliverables | Status |
|------|-------|--------------|--------|
| 1 | Setup & Data Model | Project structure, TypeScript types, LocalStorage service | ✅ Done |
| 2 | Paper Management | Add paper (DOI fetch), paper list, paper detail view | ✅ Done |
| 3 | Thesis Management | Create/edit/delete thesis, thesis selection | ✅ Done |
| 4 | Connections | Create connections, connection list | ✅ Done |
| 5 | Graph View | Cytoscape.js integration, force-directed layout | ✅ Done |
| 6 | Polish | Import/export, search, bug fixes | ✅ Done |

**MVP Checklist**:
- [x] Add paper by DOI with metadata fetch (Semantic Scholar + CrossRef)
- [x] Required takeaway entry (min 10 characters)
- [x] Arguments and evidence capture (with strength/assessment)
- [x] Thesis role assignment
- [x] Paper list with search/filter/sort
- [x] Create connections between papers (8 types)
- [x] Force-directed graph visualization (multiple layouts)
- [x] LocalStorage persistence (Zustand persist)
- [x] JSON export/import
- [x] BibTeX import/export
- [x] Markdown export

### Phase 2: Enhanced Features ✅ COMPLETE (~95%)

- [x] Timeline view
- [x] Advanced graph filtering (by role)
- [x] "Forgotten papers" reminders (shows papers not accessed in 14+ days)
- [x] Reading statistics (dashboard with status/role breakdown)
- [x] Multiple layout options (fcose, concentric, circle, grid)
- [x] Keyboard shortcuts (⌘N, ⌘F, ⌘G, ⌘E, Escape, arrows)
- [x] Improved mobile experience (safe areas, touch targets, input sizing)
- [x] RIS import (full parser supporting all common RIS tags)
- [x] **PDF Reader & Annotations** (Zotero-like, MIT licensed)
  - react-pdf-highlighter + PDF.js for rendering
  - 6 highlight colors (yellow, red, green, blue, purple, orange)
  - Area selection for figures/tables
  - Annotation comments and notes
  - Link annotations to Arguments/Evidence (IdeaGraph integration)
  - Export selected text to paper takeaway
  - IndexedDB storage for offline PDF access
- [x] Argument map view (hierarchical) - papers organized by thesis role with expandable arguments/evidence

### Phase 2.5: Screening Workflow ✅ COMPLETE

- [x] PRISMA-style screening queue
- [x] Include/exclude/maybe decisions
- [x] 10 exclusion reason types
- [x] Batch screening operations
- [x] Screening statistics

### Phase 2.6: Synthesis Tools ✅ COMPLETE

- [x] Review sections for organizing papers
- [x] Synthesis themes for cross-paper analysis
- [x] Research gap tracking (manual + auto-detected)
- [x] Evidence synthesis across papers
- [x] Synthesis matrix visualization

### Phase 3: AI Features ✅ COMPLETE

- [x] AI takeaway suggestions (context-aware)
- [x] AI connection suggestions (with confidence)
- [x] Argument extraction from abstracts
- [x] Gap analysis (plan-based reasoning)
- [x] Paper intake analysis (role + relevance + takeaway)
- [x] Multi-provider: Claude, OpenAI, Ollama
- [x] Feedback recording for learning

### Phase 4: Collaboration & Sync (Partial - 20%)

- [x] Paper clustering (manual grouping)
- [x] Cluster visualization in graph
- [ ] User accounts
- [ ] Cloud sync
- [ ] Sharing theses
- [ ] Team collaboration
- [ ] Export interactive graph as HTML

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

*Document Version: 2.0*
*Last Updated: December 2025*
*Author: Research Tools Team*
*Audit Status: Implementation verified against codebase*
