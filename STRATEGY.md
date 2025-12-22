# IdeaGraph: State-of-the-Art Strategy Document

## Vision: Become the "Second Brain" for Academic Synthesis

**Mission Statement**: Transform IdeaGraph from a paper management tool into the indispensable knowledge synthesis platform that bridges the gap between reading papers and producing original scholarship.

> "Zotero catalogs papers. Connected Papers shows citations. IdeaGraph catalogs **your understanding**."

---

## Part 1: Understanding the Pain Points

### 1.1 The Graduate Student & Researcher Journey

Based on extensive research, here are the critical pain points at each stage:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    THE RESEARCHER'S KNOWLEDGE WORKFLOW                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   DISCOVERY          READING           SYNTHESIS         WRITING            │
│   ─────────          ───────           ─────────         ───────            │
│                                                                              │
│   "Which papers    "What does this   "How do these     "How do I turn      │
│    are relevant?"   paper really      papers connect?"   notes into a       │
│                     contribute?"                         coherent review?"  │
│                                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   ┌─────────────┐      │
│   │ Connected   │  │ PDF Reader  │  │     ???     │   │ Word/LaTeX  │      │
│   │ Papers      │──│ + Notes     │──│   GAP!      │───│ + Zotero    │      │
│   │ Litmaps     │  │ Zotero      │  │             │   │             │      │
│   └─────────────┘  └─────────────┘  └─────────────┘   └─────────────┘      │
│                                                                              │
│   Tools exist      Tools exist      NO GOOD TOOL       Tools exist          │
│   (pretty good)    (adequate)       FOR THIS!          (adequate)           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Critical Pain Points by User Segment

#### PhD Students (Primary Target)

| Pain Point | Severity | Current Solution | Satisfaction |
|------------|----------|------------------|--------------|
| **"I forget why I saved this paper"** | Critical | None / scattered notes | 2/10 |
| **"I can't see how papers connect"** | Critical | Mental model / whiteboard | 3/10 |
| **"Literature reviews take forever"** | High | Manual synthesis | 4/10 |
| **"Zotero doesn't help me think"** | High | Obsidian (complex setup) | 5/10 |
| **"AI summaries aren't MY understanding"** | Medium | Ignore AI / re-read | 4/10 |
| **"I can't find gaps in the literature"** | High | Manual analysis | 3/10 |
| **"Screening papers is tedious"** | Medium | Spreadsheets | 5/10 |

Sources: [HN Discussion on Scientific Literature Pain Points](https://news.ycombinator.com/item?id=41041678), [PhD Success Research Paper Challenges](https://phdsuccess.ae/research-paper-writing-pain-points/), [Zotero Forums](https://forums.zotero.org/discussion/102181/discuss-zotero-and-the-needs-of-novice-researchers)

#### Postdocs & Early-Career Researchers

| Pain Point | Severity | Notes |
|------------|----------|-------|
| **"Collaborating on literature is hard"** | High | No good shared synthesis tools |
| **"My PhD notes are obsolete"** | Medium | Knowledge doesn't transfer |
| **"I need to onboard new students"** | High | No way to share knowledge graphs |

#### Principal Investigators & Lab Leads

| Pain Point | Severity | Notes |
|------------|----------|-------|
| **"I can't see what my students understand"** | Medium | No visibility into synthesis |
| **"Grant writing needs lit review fast"** | High | Time pressure |
| **"Keeping up with the field"** | High | Information overload |

---

## Part 2: Competitive Landscape Analysis

### 2.1 Current Tool Categories

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        RESEARCH TOOL LANDSCAPE 2025                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  REFERENCE MANAGERS          DISCOVERY TOOLS           NOTE-TAKING           │
│  ─────────────────          ───────────────           ──────────            │
│  • Zotero ⭐                 • Connected Papers ⭐      • Obsidian ⭐          │
│  • Mendeley                  • Litmaps ⭐              • Notion              │
│  • EndNote                   • ResearchRabbit ⭐       • Roam                │
│  • Paperpile                 • Semantic Scholar       • Logseq              │
│                              • Elicit                                        │
│                                                                               │
│  Focus: Collection           Focus: Finding           Focus: Writing         │
│  Weakness: No synthesis      Weakness: Citation-      Weakness: No           │
│                              based only               structure for          │
│                                                       academic work          │
│                                                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  AI RESEARCH ASSISTANTS      SYSTEMATIC REVIEW        KNOWLEDGE GRAPHS       │
│  ─────────────────────       ────────────────         ────────────────       │
│  • Elicit                    • Covidence              • Scite                │
│  • Consensus                 • Rayyan                 • Inciteful            │
│  • SciSpace                  • DistillerSR            • CiteGraph            │
│  • ChatGPT + papers                                                          │
│                                                                               │
│  Focus: Q&A                  Focus: Formal            Focus: Citation        │
│  Weakness: Not YOUR          protocols                networks               │
│  understanding               Weakness: Overkill       Weakness: Mechanical   │
│                              for exploratory          connections only       │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Competitor Deep Dive

#### Connected Papers
- **Strength**: Beautiful visual clustering, shows "similar" papers
- **Weakness**: Citations only—no intellectual connections
- **Gap IdeaGraph fills**: User-defined "supports/contradicts" relationships

#### Litmaps
- **Strength**: Configurable X/Y axes (year vs citations), monitoring
- **Weakness**: Still citation-based, no synthesis
- **Gap IdeaGraph fills**: Arguments, evidence, takeaways

#### ResearchRabbit
- **Strength**: Free, Zotero integration, endless exploration
- **Weakness**: Discovery-focused, no synthesis tools
- **Gap IdeaGraph fills**: Active knowledge construction

#### Obsidian + Zotero
- **Strength**: Zettelkasten method, bidirectional links
- **Weakness**: Requires complex setup, no academic structure
- **Gap IdeaGraph fills**: Out-of-box academic synthesis structure

#### Elicit / Consensus / SciSpace
- **Strength**: AI-powered Q&A across papers
- **Weakness**: Answers aren't YOUR understanding
- **Gap IdeaGraph fills**: "AI assists, human confirms" philosophy

### 2.3 The Blue Ocean Opportunity

**No existing tool combines:**
1. ✅ Structured academic synthesis (takeaways, arguments, evidence)
2. ✅ User-defined intellectual connections (not just citations)
3. ✅ Visual knowledge graph of YOUR understanding
4. ✅ PRISMA-compliant screening workflow
5. ✅ Gap analysis across your literature
6. ✅ Literature review export from synthesis

**IdeaGraph is uniquely positioned to own the "Synthesis Layer"**

---

## Part 3: IdeaGraph's Unique Value Proposition

### 3.1 Core Differentiators

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     IDEAGRAPH'S UNIQUE VALUE PROPOSITION                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. FORCED SYNTHESIS ──────────────────────────────────────────────────────  │
│     "You can't add a paper without a takeaway"                               │
│                                                                              │
│     Unlike Zotero: Papers without takeaways = papers forgotten               │
│     The 10-500 character limit forces distillation                           │
│                                                                              │
│  2. INTELLECTUAL CONNECTIONS (not just citations) ────────────────────────   │
│     "Paper A CONTRADICTS Paper B" vs "Paper A cites Paper B"                 │
│                                                                              │
│     Unlike Connected Papers: You decide the relationship meaning             │
│     8 connection types capture the nuance of academic debate                 │
│                                                                              │
│  3. ARGUMENT-EVIDENCE STRUCTURE ──────────────────────────────────────────   │
│     "What claims? What evidence? How strong?"                                │
│                                                                              │
│     Unlike Obsidian: Built-in academic structure, not DIY                    │
│     Strength + assessment = critical reading, not passive storage            │
│                                                                              │
│  4. THESIS-CENTRIC ORGANIZATION ──────────────────────────────────────────   │
│     "Every paper has a role in answering my research question"               │
│                                                                              │
│     Unlike flat libraries: Papers organized by intellectual purpose          │
│     5 thesis roles (supports/contradicts/method/background/other)            │
│                                                                              │
│  5. VISUAL KNOWLEDGE GRAPH ───────────────────────────────────────────────   │
│     "See your intellectual landscape at a glance"                            │
│                                                                              │
│     Unlike lists: Connections become visible patterns                        │
│     Debates, gaps, and clusters emerge visually                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Tagline Options

1. **"Catalog ideas, not just papers"** (current)
2. **"From reading to understanding"**
3. **"Your academic second brain"**
4. **"The synthesis layer for research"**
5. **"Read with purpose. Connect with meaning."**

---

## Part 4: Strategic Roadmap to State-of-the-Art

### 4.1 Phase 3: Intelligent Synthesis (Q1-Q2 2025)

**Goal**: Add AI-powered features that accelerate synthesis while preserving human understanding

#### 3.1 Smart Takeaway Assistance
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ADD PAPER: "10.1038/s41586-021-03819-2"                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  📌 Your Takeaway (required)                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                                                                          ││
│  │                                                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ✨ AI Suggestions (click to use as starting point):                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ "AlphaFold2 achieves near-experimental accuracy for protein structure   ││
│  │  prediction, solving a 50-year grand challenge in biology"              ││
│  │                                                    [Use] [Edit & Use]   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ "Attention mechanisms in AlphaFold2 implicitly learn co-evolutionary    ││
│  │  patterns without explicit MSA features"                                 ││
│  │                                                    [Use] [Edit & Use]   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ⚠️ AI suggestions are starting points. Always verify and personalize.       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Implementation**:
- Use Claude/GPT-4 API with paper abstract + title
- Generate 2-3 diverse takeaway suggestions
- User MUST edit or confirm (never auto-accept)
- Store whether AI-assisted for transparency

#### 3.2 Connection Discovery Engine
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔗 SUGGESTED CONNECTIONS                                    [Refresh] [×]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  High Confidence (>85%):                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 🔴 "Smith 2022" CONTRADICTS "Jones 2021"                                ││
│  │    Reason: Opposite conclusions on protein stability in cellular env.   ││
│  │    Your takeaways mention conflicting experimental conditions            ││
│  │                                            [Accept] [Dismiss] [Review]  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  Medium Confidence (60-85%):                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 🔵 "Chen 2023" USES-METHOD-FROM "Wang 2020"                             ││
│  │    Reason: Both papers use CRISPR-Cas9 with similar guide RNA design    ││
│  │    Evidence types match: experimental → experimental                     ││
│  │                                            [Accept] [Dismiss] [Review]  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ────────────────────────────────────────────────────────────────────────    │
│  📊 6 suggestions generated from 24 papers. 2 accepted, 1 dismissed.         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Implementation**:
- Embed takeaways + arguments using sentence transformers
- Compare embeddings to find semantic similarity
- Rule-based logic for contradiction detection (opposite thesis roles, similar topics)
- Method matching via evidence type classification
- Always require human approval

#### 3.3 Intelligent Gap Analysis
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔍 LITERATURE GAP ANALYSIS                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  DETECTED GAPS:                                                              │
│                                                                              │
│  🟡 METHODOLOGICAL GAP (High Priority)                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ "No papers in your collection use in vivo validation"                    ││
│  │                                                                          ││
│  │ 8 papers use computational methods                                        ││
│  │ 3 papers use in vitro experiments                                        ││
│  │ 0 papers use in vivo validation                                          ││
│  │                                                                          ││
│  │ Suggested search: "in vivo + [your topic keywords]"                      ││
│  │                               [Search Semantic Scholar] [Dismiss]        ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  🔴 CONTRADICTORY EVIDENCE (Critical)                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ "Unresolved debate: 3 papers support vs 2 papers contradict"             ││
│  │                                                                          ││
│  │ Supporting: Smith 2022, Jones 2021, Chen 2023                            ││
│  │ Contradicting: Wang 2022, Lee 2023                                       ││
│  │                                                                          ││
│  │ No reconciliation paper found. Consider searching for meta-analyses.     ││
│  │                               [View Debate Graph] [Search Reviews]       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  🟢 TEMPORAL GAP (Medium Priority)                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ "70% of your papers are >3 years old"                                    ││
│  │                                                                          ││
│  │ Your field may have recent advances. Consider monitoring for new work.   ││
│  │                               [Set Up Alerts] [Search 2023-2025]         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Gap Types to Detect**:
1. **Methodological**: Missing evidence types
2. **Temporal**: Outdated literature
3. **Contradictory**: Unresolved debates
4. **Population**: Missing demographic coverage
5. **Theoretical**: Claims without theoretical backing
6. **Replication**: Key findings not replicated
7. **Geographic**: Regional bias in studies

#### 3.4 Literature Review Draft Generation
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📝 GENERATE LITERATURE REVIEW                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Based on your thesis: "What are the limitations of AlphaFold for drug..."  │
│                                                                              │
│  Structure Options:                                                          │
│  ○ Chronological (by publication year)                                       │
│  ● Thematic (by thesis role)                                                 │
│  ○ Methodological (by evidence type)                                         │
│  ○ Argumentative (supporting vs. contradicting)                              │
│                                                                              │
│  Include:                                                                    │
│  ☑ Thesis statement introduction                                             │
│  ☑ Paper summaries (from your takeaways)                                     │
│  ☑ Connection analysis (supports/contradicts/extends)                        │
│  ☑ Gap identification section                                                │
│  ☑ Future directions                                                         │
│  ☐ Full argument-evidence mapping                                            │
│                                                                              │
│  Citation Style: [APA 7th ▼]                                                 │
│                                                                              │
│  ────────────────────────────────────────────────────────────────────────    │
│                                                                              │
│  ⚠️ This generates a DRAFT based on YOUR synthesis. Always review & edit.    │
│                                                                              │
│                                        [Preview] [Generate Markdown]         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Phase 4: Enhanced Visualization (Q2 2025)

**Goal**: Match and exceed Litmaps/Connected Papers visualization

#### 4.1 Configurable Scatter Plot View (Litmaps-style)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  GRAPH VIEW    [Force ▼]  [Scatter]  [Timeline]  [Arguments]                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  X-Axis: [Publication Year ▼]     Y-Axis: [Citation Count ▼]                │
│  Node Size: [Number of Connections ▼]     Color: [Thesis Role ▼]            │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                                                                          ││
│  │  Citations                                                               ││
│  │     ▲                                                                    ││
│  │     │                          ◉ (large = many connections)              ││
│  │  500│                    ●                                               ││
│  │     │                                    ●                               ││
│  │     │              ●                                                     ││
│  │  100│        ●                 ●     ●                                   ││
│  │     │    ●       ●         ●                     ●                       ││
│  │     │  ●   ●   ●     ●                       ●                           ││
│  │   10│●                                                                   ││
│  │     │                                                                    ││
│  │     └────────────────────────────────────────────────────────────► Year  ││
│  │        2018    2019    2020    2021    2022    2023    2024              ││
│  │                                                                          ││
│  │  🟢 Supports  🔴 Contradicts  🔵 Method  ⚪ Background  🟣 Other          ││
│  │                                                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  💡 High-impact recent papers appear in the top-right quadrant              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Axis Options**:
- X: Publication Year, Similarity (UMAP), Added Date
- Y: Citation Count, Log Citations, Connection Count, Reading Status
- Size: Citations, Connections, Evidence Count, Argument Count
- Color: Thesis Role, Reading Status, Evidence Type, Custom Tags

#### 4.2 Semantic Similarity Clustering
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SIMILARITY VIEW (UMAP Projection of Takeaways)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                                                                          ││
│  │        [Cluster A: "Protein Structure"]                                  ││
│  │              ●  ●  ●                                                     ││
│  │            ●      ●                                                      ││
│  │                                                                          ││
│  │                              [Cluster B: "Drug Discovery"]               ││
│  │                                  ●  ●                                    ││
│  │        ●  (bridge paper)        ●   ●  ●                                 ││
│  │                                                                          ││
│  │                                                                          ││
│  │  [Cluster C: "Methods"]                                                  ││
│  │        ●  ●  ●                                                           ││
│  │          ●                                                               ││
│  │                                                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  Auto-detected clusters: 3    Bridge papers: 1 (connects A ↔ B)             │
│                                                                              │
│  💡 Papers cluster by semantic similarity of YOUR takeaways, not citations   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 4.3 Debate View (Argumentation Visualization)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DEBATE VIEW: "Does AlphaFold work for disordered proteins?"                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│            SUPPORTS                    │           CONTRADICTS              │
│     ────────────────────               │     ────────────────────           │
│                                        │                                    │
│     ┌──────────────────┐               │     ┌──────────────────┐           │
│     │ Smith 2022       │               │     │ Wang 2023        │           │
│     │ "Works for       │               │     │ "Fails on IDPs"  │           │
│     │  partial order"  │               │     │                  │           │
│     │ [Strong] [Agree] │               │     │ [Strong] [Agree] │           │
│     └────────┬─────────┘               │     └────────┬─────────┘           │
│              │                         │              │                     │
│              ▼                         │              ▼                     │
│     ┌──────────────────┐               │     ┌──────────────────┐           │
│     │ Evidence:        │               │     │ Evidence:        │           │
│     │ • 85% accuracy   │               │     │ • 30% accuracy   │           │
│     │   on molten glob │               │     │   on fully IDP   │           │
│     └──────────────────┘               │     └──────────────────┘           │
│                                        │                                    │
│  ───────────────────────────────────────────────────────────────────────────│
│                                                                              │
│  🤔 RECONCILIATION: Different definitions of "disordered" may explain       │
│     the apparent contradiction. Consider: "partially ordered" vs "fully IDP"│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 4.4 Citation Flow View (Prior/Derivative)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CITATION FLOW for "AlphaFold2 (Jumper 2021)"                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│     BUILDS ON (Prior Work)           │     BUILT UPON (Derivative Work)    │
│     ────────────────────             │     ─────────────────────────        │
│                                      │                                      │
│     ┌────────────┐                   │                   ┌────────────┐     │
│     │ ResNet     │                   │                   │ AF-Multimer│     │
│     │ (2015)     │                   │                   │ (2022)     │     │
│     └────────────┘                   │                   └────────────┘     │
│            │                         │                          │           │
│     ┌────────────┐                   │                   ┌────────────┐     │
│     │ Attention  │                   │                   │ RoseTTAFold│     │
│     │ (2017)     │                   │                   │ (2021)     │     │
│     └────────────┘                   │                   └────────────┘     │
│            │                         │                          │           │
│     ┌────────────┐    ┌─────────────────────────┐       ┌────────────┐     │
│     │ Evoformer  │───▶│     AlphaFold2          │──────▶│ ESMFold    │     │
│     │ (2020)     │    │     (Jumper 2021)       │       │ (2023)     │     │
│     └────────────┘    │       ⭐ Selected        │       └────────────┘     │
│                       └─────────────────────────┘                           │
│                                      │                                      │
│  ───────────────────────────────────────────────────────────────────────────│
│                                                                              │
│  📊 3 foundational papers → AlphaFold2 → 12 derivative works in collection   │
│                                                [Import Suggestions]          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Phase 5: WebGL Performance & 3D (Q3 2025)

**Goal**: Handle 500+ paper collections with smooth performance

#### Implementation: Reagraph Integration

Current: Cytoscape.js (Canvas-based, ~100 papers max smooth)
Future: Reagraph (WebGL-based, 1000+ papers smooth)

```typescript
// Migration path
import { GraphCanvas, useSelection } from 'reagraph';

function KnowledgeGraph3D({ papers, connections }) {
  return (
    <GraphCanvas
      nodes={papers.map(p => ({
        id: p.id,
        label: truncate(p.title, 30),
        fill: ROLE_COLORS[p.thesisRole],
        size: Math.log10(p.citationCount + 1) * 10
      }))}
      edges={connections.map(c => ({
        source: c.fromPaperId,
        target: c.toPaperId,
        label: c.type
      }))}
      cameraMode="3d"  // Enable 3D exploration
      layoutType="forceDirected3d"
      clusterAttribute="thesisRole"  // Auto-cluster by role
      sizingType="pagerank"  // Size by importance
    />
  );
}
```

**Benefits**:
- 10x performance for large graphs
- Native 3D exploration
- Built-in clustering
- PageRank/Centrality sizing
- Path finding between papers

### 4.4 Phase 6: Collaboration & Sharing (Q4 2025)

**Goal**: Enable team-based literature synthesis

#### 6.1 Share Thesis as Read-Only

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SHARE THESIS                                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  📤 Share "AlphaFold Limitations" thesis                                     │
│                                                                              │
│  Share Link:                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ https://ideagraph.app/share/abc123xyz                        [Copy] 📋 ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  Permissions:                                                                │
│  ● View only (can explore graph, read takeaways)                             │
│  ○ View + Export (can download as JSON/Markdown)                             │
│  ○ Collaborative (can suggest additions - requires account)                  │
│                                                                              │
│  Expiration:                                                                 │
│  ○ Never expires                                                             │
│  ● Expires in [30 ▼] days                                                    │
│                                                                              │
│  Include:                                                                    │
│  ☑ Paper metadata and takeaways                                              │
│  ☑ Connections and notes                                                     │
│  ☐ Your critical assessments (agree/disagree)                                │
│  ☐ Private notes on papers                                                   │
│                                                                              │
│                                              [Cancel]  [Generate Link]       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 6.2 Lab/Team Knowledge Base

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAB KNOWLEDGE BASE: "Smith Lab - Protein Engineering"                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Shared Theses:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 📚 AlphaFold Applications      │ 45 papers │ Dr. Smith        │ Active ││
│  │ 📚 CRISPR Base Editing         │ 32 papers │ PhD: Alice       │ Active ││
│  │ 📚 Protein Stability 2024      │ 28 papers │ Postdoc: Bob     │ Archive││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  Activity Feed:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 🆕 Alice added "Chen 2024" to CRISPR Base Editing           2 hours ago ││
│  │ 🔗 Bob connected "Wang" → "Lee" as contradicts              Yesterday   ││
│  │ 💬 Dr. Smith commented on "AlphaFold for IDPs"              2 days ago  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  🔍 Search across all lab literature: [                             ] 🔎    │
│                                                                              │
│  ────────────────────────────────────────────────────────────────────────    │
│  Members: 5 │ Total Papers: 105 │ Connections: 87                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.5 Phase 7: Platform Expansion (2026)

1. **Mobile-First PWA**: Full functionality on phone/tablet
2. **Zotero Plugin**: Sync papers bidirectionally
3. **Browser Extension**: Add papers from anywhere
4. **VS Code Extension**: Literature for coding projects
5. **API for Integrations**: Let other tools connect

---

## Part 5: Technical Enhancements Roadmap

### 5.1 Graph Visualization Improvements

| Enhancement | Priority | Complexity | Impact |
|-------------|----------|------------|--------|
| Configurable X/Y axes | High | Medium | High |
| Node sizing by metrics | High | Low | Medium |
| Performance opts (hideEdgesOnViewport) | High | Low | High |
| Semantic clustering (UMAP) | Medium | High | High |
| WebGL rendering (Reagraph) | Medium | High | High |
| 3D exploration mode | Low | Medium | Medium |
| Mini-map navigation | Low | Low | Medium |
| Prior/derivative view | Medium | Medium | High |

### 5.2 Immediate Performance Wins

Add to `GraphView.tsx`:

```typescript
// For large graphs (50+ papers)
const performanceConfig = {
  hideEdgesOnViewport: papers.length > 50,
  textureOnViewport: papers.length > 100,
  wheelSensitivity: 0.2,
  minZoom: 0.1,
  maxZoom: 3,
};
```

### 5.3 AI Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AI INTEGRATION ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         USER INTERFACE                                 │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │  │
│  │  │ Takeaway    │ │ Connection  │ │ Gap         │ │ Review      │      │  │
│  │  │ Suggestions │ │ Suggestions │ │ Analysis    │ │ Generation  │      │  │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘      │  │
│  └─────────┼───────────────┼───────────────┼───────────────┼─────────────┘  │
│            │               │               │               │                 │
│            ▼               ▼               ▼               ▼                 │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      AI SERVICE LAYER                                  │  │
│  │                                                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    PROMPT ENGINEERING                            │  │  │
│  │  │  • Role: "Academic research assistant"                          │  │  │
│  │  │  • Context: Thesis question + existing papers                   │  │  │
│  │  │  • Task-specific templates                                      │  │  │
│  │  │  • Output formatting (JSON schemas)                             │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                                │                                       │  │
│  │                                ▼                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    EMBEDDING SERVICE                             │  │  │
│  │  │  • Sentence transformers for takeaways                          │  │  │
│  │  │  • Semantic similarity computation                              │  │  │
│  │  │  • Clustering (UMAP/t-SNE)                                      │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                                │                                       │  │
│  │                                ▼                                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │  │
│  │  │ Claude API   │  │ OpenAI API   │  │ Local LLM    │                 │  │
│  │  │ (Primary)    │  │ (Fallback)   │  │ (Privacy)    │                 │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                 │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ⚠️ PRINCIPLE: AI ASSISTS, HUMAN CONFIRMS                                    │
│     All AI outputs are suggestions. User approval required for all actions.  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 6: Go-To-Market Strategy

### 6.1 Target User Segments (Priority Order)

1. **PhD Students** (Primary)
   - Pain: Literature reviews, comprehensive exams
   - Channel: Academic Twitter, Reddit r/GradSchool, r/PhD
   - Conversion: Free forever for students

2. **Postdocs** (Secondary)
   - Pain: Publishing, grant applications
   - Channel: Lab recommendations, conferences
   - Conversion: Freemium → Team plans

3. **Research Labs** (Growth)
   - Pain: Knowledge transfer, onboarding
   - Channel: PI recommendations, university licenses
   - Conversion: Team/Enterprise plans

### 6.2 Pricing Strategy

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0/forever | 3 theses, 100 papers each, local storage |
| **Pro** | $8/month | Unlimited, AI features, cloud sync |
| **Team** | $15/user/month | Collaboration, shared knowledge bases |
| **Academic** | 50% off | Verified .edu email |

### 6.3 Launch Checklist

- [ ] Landing page with demo video
- [ ] Product Hunt launch
- [ ] Academic Twitter thread
- [ ] Reddit posts (r/PhD, r/GradSchool, r/AcademicBibliology)
- [ ] University library outreach
- [ ] Conference demos (AGU, APS, etc.)
- [ ] Zotero forum post

---

## Part 7: Success Metrics

### 7.1 North Star Metric

**"Papers with Takeaways"** - Total number of papers with user-written takeaways

This captures:
- User acquisition (more users = more papers)
- Engagement (users actually synthesizing, not just saving)
- Value creation (takeaways = understanding)

### 7.2 Key Performance Indicators

| Metric | Target (6 months) | Why It Matters |
|--------|-------------------|----------------|
| Monthly Active Users | 10,000 | Growth |
| Papers per User | 25+ | Engagement |
| Takeaways per Paper | 100% | Core value |
| Connections per Thesis | 10+ | Deep synthesis |
| Retention (30-day) | 60% | Product-market fit |
| NPS | 50+ | User satisfaction |

### 7.3 Feature Success Metrics

| Feature | Success Metric | Target |
|---------|----------------|--------|
| AI Takeaway Suggestions | % used as starting point | 40% |
| AI Connection Suggestions | % approved | 30% |
| Gap Analysis | % act on suggestions | 25% |
| Review Generation | % exported | 20% |
| Collaboration | % shared theses | 15% |

---

## Part 8: Competitive Moat

### 8.1 Why IdeaGraph Wins Long-Term

1. **Network Effects**: Shared knowledge bases become more valuable with more users
2. **Data Moat**: User-generated takeaways/connections can't be replicated
3. **Switching Cost**: Invested synthesis is hard to recreate elsewhere
4. **Academic Trust**: "AI assists, human confirms" builds credibility
5. **Integration Lock-in**: Deep Zotero/Semantic Scholar integration

### 8.2 Defensibility Against Big Players

| Competitor | Their Likely Move | Our Defense |
|------------|-------------------|-------------|
| Zotero | Add synthesis features | Already 2 years ahead; different philosophy |
| Semantic Scholar | Add note-taking | Discovery vs synthesis are different products |
| Notion | Academic templates | Generic tool can't match specialized UX |
| Elicit | More synthesis | AI-first ≠ human-first understanding |

---

## Conclusion: The Path to State-of-the-Art

IdeaGraph has a **unique opportunity** to own the "synthesis layer" in academic research workflows. No existing tool combines:

1. ✅ Forced active synthesis (takeaways required)
2. ✅ User-defined intellectual connections
3. ✅ Visual knowledge graphs of understanding
4. ✅ AI assistance with human confirmation
5. ✅ Gap analysis and review generation

**The next 12 months should focus on:**

1. **Q1 2025**: AI features (takeaway/connection suggestions, gap analysis)
2. **Q2 2025**: Advanced visualization (configurable axes, clustering)
3. **Q3 2025**: Performance & 3D (WebGL, large graph support)
4. **Q4 2025**: Collaboration (sharing, team knowledge bases)

**The vision**: Every graduate student's "second brain" for academic synthesis.

---

*Strategy Document v1.0*
*Last Updated: December 2025*
*Author: IdeaGraph Team*

---

## Sources & References

### Pain Point Research
- [HN: Worst pain points with scientific literature](https://news.ycombinator.com/item?id=41041678)
- [PhD Success: Research Paper Writing Pain Points](https://phdsuccess.ae/research-paper-writing-pain-points/)
- [Zotero Forums: Novice Researcher Needs](https://forums.zotero.org/discussion/102181/discuss-zotero-and-the-needs-of-novice-researchers)
- [My Private PhD: Systematic Review Challenges](https://www.myprivatephd.com/blog/5-common-challenges-of-systematic-literature-review-in-phd-theses/)

### Competitor Analysis
- [Effortless Academic: Litmaps vs ResearchRabbit vs Connected Papers](https://effortlessacademic.com/litmaps-vs-researchrabbit-vs-connected-papers-the-best-literature-review-tool-in-2025/)
- [Litmaps Documentation](https://docs.litmaps.com/en/articles/9181490-use-and-edit-litmaps-visualization)
- [ResearchRabbit](https://www.researchrabbit.ai/)
- [Connected Papers](https://www.connectedpapers.com/)

### Technical References
- [Cytoscape.js Performance Optimization](https://deepwiki.com/cytoscape/cytoscape.js/8-performance-optimization)
- [Cytoscape.js fcose Layout](https://github.com/iVis-at-Bilkent/cytoscape.js-fcose)
- [Reagraph: WebGL Graph Visualization](https://reagraph.dev/)
- [Local Citation Network (Open Source)](https://github.com/diegodlh/Local-Citation-Network)
- [Citation Gecko (Open Source)](https://github.com/CitationGecko/gecko-react)

### Academic Workflow
- [Zotero + Obsidian Academic Workflow](https://medium.com/@alexandraphelan/an-updated-academic-workflow-zotero-obsidian-cffef080addd)
- [Zettelkasten Method](https://zettelkasten.de/posts/building-a-second-brain-and-zettelkasten/)
- [AI Tools for Literature Review 2025](https://effortlessacademic.com/using-ai-for-literature-review-in-2025/)
- [Research Gap Identification Tools](https://answerthis.io/ai/research-gap-finder)
