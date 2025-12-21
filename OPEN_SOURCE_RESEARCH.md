# Open Source Libraries & Tools Research for IdeaGraph

> Research compiled for accelerating IdeaGraph development with proven open source solutions.

---

## Table of Contents
1. [Zotero Integration](#1-zotero-integration)
2. [Graph Visualization Libraries](#2-graph-visualization-libraries)
3. [Citation Parsing & Formatting](#3-citation-parsing--formatting)
4. [Academic Paper APIs](#4-academic-paper-apis)
5. [Similar Projects to Learn From](#5-similar-projects-to-learn-from)
6. [Recommended Tech Stack](#6-recommended-tech-stack)

---

## 1. Zotero Integration

### Zotero Web API

**Base URL**: `https://api.zotero.org/`

| Endpoint | Purpose |
|----------|---------|
| `GET /users/{userID}/items` | Retrieve all items for a user |
| `GET /users/{userID}/collections` | Get all collections |
| `GET /users/{userID}/collections/{key}/items` | Get items in specific collection |
| `POST /users/{userID}/items` | Add new items |

**Authentication**: API Key (25 characters) + User ID from https://www.zotero.org/settings/keys

**Rate Limit**: 60 requests/minute per API key

### Integration Approaches

#### Approach 1: File-Based Import (MVP - Recommended First)
```typescript
// User exports from Zotero as BibTeX, uploads to IdeaGraph
import { parse } from 'bibtex-parser';

function importBibTeX(content: string, thesisId: string): Paper[] {
  const entries = parse(content);
  return entries.map(entry => mapToPaper(entry, thesisId));
}
```

#### Approach 2: Direct API Integration (Phase 2)
```typescript
class ZoteroClient {
  private baseURL = 'https://api.zotero.org';

  constructor(private userId: string, private apiKey: string) {}

  async getCollections() {
    return fetch(`${this.baseURL}/users/${this.userId}/collections`, {
      headers: { 'Zotero-API-Key': this.apiKey }
    }).then(r => r.json());
  }

  async getCollectionItems(collectionKey: string) {
    return fetch(
      `${this.baseURL}/users/${this.userId}/collections/${collectionKey}/items`,
      { headers: { 'Zotero-API-Key': this.apiKey } }
    ).then(r => r.json());
  }
}
```

### Better BibTeX Extension
- **Website**: https://retorque.re/zotero-better-bibtex/
- Enhanced BibTeX exports with better citation keys
- Auto-export to .bib files
- **Recommend users install this for best import experience**

### Export Formats Supported
| Format | Use Case |
|--------|----------|
| BibTeX | LaTeX, citation managers |
| RIS | Universal citation format |
| CSL JSON | Citation processors |
| JSON | API/structured data |

---

## 2. Graph Visualization Libraries

### Comparison Matrix

| Library | npm Package | Stars | Performance | React | Best For |
|---------|-------------|-------|-------------|-------|----------|
| **Cytoscape.js** | `cytoscape` | ~10k | 100-1000 nodes | Wrapper | Knowledge graphs ⭐ |
| D3.js | `d3` | ~105k | 100-5000 nodes | Moderate | Custom viz |
| vis-network | `vis-network` | ~9k | 500-2000 nodes | Good | Quick setup |
| React Flow | `reactflow` | ~23k | 100-500 nodes | Native | Flowcharts |
| Sigma.js | `sigma` | ~3k | 5000+ nodes | v3 hooks | Large graphs |

### Recommendation: Cytoscape.js (Confirmed)

**Why Cytoscape.js is the right choice:**
1. Perfect for 100-1000 paper networks
2. Widely used in academic/bioinformatics contexts
3. Excellent node/edge styling (thesis roles, connection types)
4. Battle-tested, mature ecosystem
5. Good community plugins (minimap, context menus)

**React Wrapper:**
```bash
npm install cytoscape react-cytoscapejs
npm install --save-dev @types/cytoscape
```

```tsx
import CytoscapeComponent from 'react-cytoscapejs';

<CytoscapeComponent
  elements={graphElements}
  layout={{ name: 'cose', nodeRepulsion: 400000 }}
  style={{ width: '100%', height: '600px' }}
  stylesheet={cytoscapeStyles}
/>
```

**Alternative for Large Graphs (1000+ nodes)**: Consider Sigma.js v3 with `@react-sigma/core`

---

## 3. Citation Parsing & Formatting

### BibTeX Parsers

| Package | npm | Use Case |
|---------|-----|----------|
| `bibtex-parser` | bibtex-parser | Lightweight parsing |
| `@citation-js/core` | @citation-js/core | Full-featured, recommended |
| `bibtex` | bibtex | Bidirectional parsing |

### RIS Format

| Package | npm | Use Case |
|---------|-----|----------|
| `ris` | ris | Standard RIS parsing |

### Citation Formatting (APA, MLA, Chicago)

**Recommended: citation-js**
```bash
npm install @citation-js/core @citation-js/plugin-bibtex @citation-js/plugin-csl
```

```typescript
import { Cite } from '@citation-js/core';
import '@citation-js/plugin-bibtex';
import '@citation-js/plugin-csl';

// Parse BibTeX
const cite = new Cite(bibtexString);

// Format as APA
const apa = cite.format('bibliography', {
  format: 'text',
  template: 'apa',
  lang: 'en-US'
});

// Export as different formats
const json = cite.format('data', { format: 'object' });
const bibtex = cite.format('bibtex');
```

### CSL (Citation Style Language)

| Package | Use Case |
|---------|----------|
| `citeproc` | Official CSL implementation, 100+ styles |
| `@citation-js/plugin-csl` | CSL via citation-js |

### DOI Resolution

| Package | npm | Features |
|---------|-----|----------|
| `crossref-api` | crossref-api | Query CrossRef, fetch DOI metadata |
| Direct API | - | https://api.crossref.org/works/{doi} |

---

## 4. Academic Paper APIs

### Primary: Semantic Scholar API

**Base URL**: `https://api.semanticscholar.org/graph/v1`

```typescript
async function fetchByDOI(doi: string) {
  const fields = 'title,authors,year,venue,abstract,citationCount,openAccessPdf,externalIds';
  const response = await fetch(
    `https://api.semanticscholar.org/graph/v1/paper/DOI:${doi}?fields=${fields}`
  );
  return response.json();
}
```

**Features**: Abstracts, citation counts, TLDR summaries, open access links
**Rate Limit**: 100 req/sec with API key

### Fallback: CrossRef API

**Base URL**: `https://api.crossref.org/works`

```typescript
async function fetchFromCrossRef(doi: string) {
  const response = await fetch(`https://api.crossref.org/works/${doi}`, {
    headers: { 'User-Agent': 'IdeaGraph/1.0 (mailto:your@email.com)' }
  });
  return response.json();
}
```

**Rate Limit**: 50 req/sec (polite pool with User-Agent)

### Additional APIs

| API | Base URL | Best For |
|-----|----------|----------|
| **OpenAlex** | `https://api.openalex.org/` | Free, comprehensive coverage |
| **Unpaywall** | `https://api.unpaywall.org/v2/` | Open access PDF links |
| **PubMed** | E-utilities API | Life sciences, medical |
| **arXiv** | `http://export.arxiv.org/api/` | Preprints, CS/Physics |

### Unified Search Strategy

```typescript
async function fetchPaperMetadata(doi: string): Promise<PaperMetadata> {
  // 1. Try Semantic Scholar (has abstracts, TLDRs)
  try {
    return await fetchSemanticScholar(doi);
  } catch {}

  // 2. Fallback to CrossRef
  try {
    return await fetchCrossRef(doi);
  } catch {}

  // 3. Try OpenAlex
  try {
    return await fetchOpenAlex(doi);
  } catch {}

  throw new Error('Could not fetch metadata');
}

// Enrich with open access links
async function enrichWithOpenAccess(paper: Paper): Promise<Paper> {
  if (paper.doi) {
    const unpaywall = await fetch(
      `https://api.unpaywall.org/v2/${paper.doi}?email=your@email.com`
    ).then(r => r.json());

    if (unpaywall.best_oa_location?.url_for_pdf) {
      paper.pdfUrl = unpaywall.best_oa_location.url_for_pdf;
    }
  }
  return paper;
}
```

---

## 5. Similar Projects to Learn From

### Knowledge Management Tools

| Project | GitHub | Stars | Relevant Features |
|---------|--------|-------|-------------------|
| **Logseq** | logseq/logseq | ~30k | Knowledge graphs, bidirectional links |
| **Dendron** | dendronhq/dendron | ~3k | Hierarchical knowledge management |
| **TiddlyWiki** | Jermolene/TiddlyWiki5 | ~6k | Non-linear organization |

### Academic Tools

| Project | GitHub | Stars | Relevant Features |
|---------|--------|-------|-------------------|
| **ASReview** | asreview/asreview | ~500+ | AI-assisted systematic review |
| **Zotero Web Library** | zotero/web-library | - | React reference management UI |
| **Citation.js** | citation-js/citation-js | ~4k | Citation parsing/formatting |

### Graph Visualization

| Project | GitHub | Stars | Relevant Features |
|---------|--------|-------|-------------------|
| **React Flow** | xyflow/xyflow | ~28k | Node-based UI components |
| **Mermaid** | mermaid-js/mermaid | ~75k | Diagram rendering |
| **Nivo** | plouc/nivo | ~12k | React data visualization |

### Key Takeaways from Similar Projects

1. **Logseq Architecture**: Study their graph data structure and rendering
2. **Zotero Web Library**: React component patterns for reference management
3. **Citation.js**: Plugin system for format extensibility
4. **React Flow**: Node/edge interaction patterns

---

## 6. Recommended Tech Stack

### Core Dependencies

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "typescript": "^5.0.0",

    "cytoscape": "^3.28.0",
    "react-cytoscapejs": "^2.0.0",

    "@citation-js/core": "^0.7.9",
    "@citation-js/plugin-bibtex": "^0.7.9",
    "@citation-js/plugin-csl": "^0.7.9",

    "zod": "^3.22.0",
    "react-hook-form": "^7.50.0",

    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/cytoscape": "^3.19.0"
  }
}
```

### Installation Command

```bash
npm install cytoscape react-cytoscapejs @citation-js/core @citation-js/plugin-bibtex @citation-js/plugin-csl zod react-hook-form zustand

npm install --save-dev @types/cytoscape
```

### Implementation Priority

#### Phase 1: MVP
1. **BibTeX import** via `@citation-js/core`
2. **DOI metadata fetch** via Semantic Scholar + CrossRef
3. **Graph visualization** via Cytoscape.js
4. **LocalStorage persistence**

#### Phase 2: Enhanced
1. **Zotero API integration** (direct collection import)
2. **Multiple export formats** (APA, MLA, Chicago via citation-js)
3. **Open access links** via Unpaywall API
4. **Advanced graph layouts**

#### Phase 3: AI Features
1. **Takeaway suggestions** from abstracts
2. **Connection suggestions** from text similarity
3. **Gap analysis**

---

## Quick Reference: npm Packages

| Category | Package | Purpose |
|----------|---------|---------|
| Graph | `cytoscape` | Core graph library |
| Graph | `react-cytoscapejs` | React wrapper |
| Citations | `@citation-js/core` | Citation parsing/formatting |
| Citations | `@citation-js/plugin-bibtex` | BibTeX support |
| Citations | `@citation-js/plugin-csl` | CSL styles (APA, MLA, etc.) |
| Validation | `zod` | Schema validation |
| Forms | `react-hook-form` | Form management |
| State | `zustand` | State management |

---

*Research compiled: December 2025*
*For IdeaGraph Literature Tracking Tool*
