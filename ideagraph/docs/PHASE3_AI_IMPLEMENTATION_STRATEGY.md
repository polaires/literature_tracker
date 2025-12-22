# Phase 3: AI Features Implementation Strategy

## Executive Summary

This document outlines the complete implementation strategy for Phase 3 AI features in IdeaGraph. The key principle is **AI amplification through user-curated knowledge**—the AI operates on structured synthesis data that users have created, producing suggestions that are grounded in their actual research context.

---

## Part 1: Architecture Overview

### 1.1 AI Service Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AI SERVICE LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐       │
│  │  AI Provider     │    │  Prompt Engine   │    │  Suggestion      │       │
│  │  Abstraction     │    │  (Templates)     │    │  Manager         │       │
│  │                  │    │                  │    │                  │       │
│  │  - Claude API    │    │  - Connection    │    │  - Queue         │       │
│  │  - OpenAI API    │    │  - Takeaway      │    │  - Dedup         │       │
│  │  - Ollama (local)│    │  - Gap Analysis  │    │  - Ranking       │       │
│  │  - Mock (test)   │    │  - Synthesis     │    │  - Persistence   │       │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘       │
│           │                       │                       │                  │
│           └───────────────────────┼───────────────────────┘                  │
│                                   │                                          │
│                    ┌──────────────▼──────────────┐                           │
│                    │     Context Assembler       │                           │
│                    │                             │                           │
│                    │  Gathers relevant data:     │                           │
│                    │  - Thesis info              │                           │
│                    │  - Related papers           │                           │
│                    │  - Existing connections     │                           │
│                    │  - User's arguments/evidence│                           │
│                    │  - PDF annotations          │                           │
│                    └──────────────┬──────────────┘                           │
│                                   │                                          │
└───────────────────────────────────┼──────────────────────────────────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │         App Store             │
                    │   (Zustand + LocalStorage)    │
                    └───────────────────────────────┘
```

### 1.2 File Structure for AI Services

```
ideagraph/src/services/ai/
├── index.ts                    # Public API exports
├── types.ts                    # AI-specific types
├── providers/
│   ├── index.ts                # Provider factory
│   ├── base.ts                 # Abstract provider interface
│   ├── claude.ts               # Claude/Anthropic provider
│   ├── openai.ts               # OpenAI provider
│   ├── ollama.ts               # Local Ollama provider
│   └── mock.ts                 # Mock provider for testing
├── prompts/
│   ├── index.ts                # Prompt template registry
│   ├── connection.ts           # Connection suggestion prompts
│   ├── takeaway.ts             # Takeaway refinement prompts
│   ├── argument.ts             # Argument extraction prompts
│   ├── gap.ts                  # Gap analysis prompts
│   └── synthesis.ts            # Literature review generation prompts
├── context/
│   ├── assembler.ts            # Builds context for AI calls
│   ├── paperContext.ts         # Paper-specific context
│   └── thesisContext.ts        # Thesis-wide context
├── suggestions/
│   ├── manager.ts              # Suggestion lifecycle management
│   ├── connectionSuggester.ts  # Connection suggestion logic
│   ├── takeawaySuggester.ts    # Takeaway refinement logic
│   ├── argumentExtractor.ts    # Argument extraction logic
│   └── gapDetector.ts          # AI-enhanced gap detection
└── utils/
    ├── tokenCounter.ts         # Estimate token usage
    ├── rateLimiter.ts          # API rate limiting
    └── cache.ts                # Response caching
```

---

## Part 2: Core AI Features Implementation

### 2.1 Feature: AI-Suggested Connections

**Priority**: P0 (Highest)
**Amplification Factor**: Very High
**Complexity**: Medium

#### Data Flow

```
User Views Paper in Graph
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Context Assembler collects:                                      │
│ • Target paper: takeaway, arguments, evidence, abstract          │
│ • All other papers in thesis: takeaways, arguments               │
│ • Existing connections (to avoid duplicates)                     │
│ • Citation network data from Semantic Scholar                    │
│ • Thesis description (research focus)                            │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Connection Suggester analyzes:                                   │
│ 1. Semantic similarity of takeaways                              │
│ 2. Argument overlap/contradiction detection                      │
│ 3. Citation relationships (A cites B?)                           │
│ 4. Methodological similarities                                   │
│ 5. Temporal relationships (extends earlier work?)                │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ AI Provider returns structured suggestions:                      │
│ {                                                                │
│   targetPaperId: "...",                                          │
│   suggestedConnections: [                                        │
│     {                                                            │
│       paperId: "paper-123",                                      │
│       type: "contradicts",                                       │
│       confidence: 0.87,                                          │
│       reasoning: "Both papers study X but reach opposite...",    │
│       evidence: ["Takeaway mentions...", "Argument 2 states..."] │
│     }                                                            │
│   ]                                                              │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ UI presents suggestions with:                                    │
│ • Confidence badge (high/medium/low)                             │
│ • Reasoning explanation                                          │
│ • Evidence highlights from user's own notes                      │
│ • [Accept] [Edit & Accept] [Dismiss] actions                     │
└─────────────────────────────────────────────────────────────────┘
```

#### Prompt Template (connection.ts)

```typescript
export const CONNECTION_SUGGESTION_PROMPT = `
You are analyzing academic papers for a researcher studying: "{thesis_description}"

TARGET PAPER:
Title: {target_title}
Takeaway (researcher's insight): {target_takeaway}
Arguments identified by researcher:
{target_arguments}

CANDIDATE PAPERS IN COLLECTION:
{candidate_papers}

EXISTING CONNECTIONS (do not suggest duplicates):
{existing_connections}

CITATION DATA:
{citation_relationships}

Analyze potential intellectual relationships between the TARGET paper and CANDIDATE papers.

For each suggested connection, provide:
1. connection_type: One of [supports, contradicts, extends, uses-method, same-topic, reviews, replicates, critiques]
2. confidence: 0.0-1.0 based on evidence strength
3. reasoning: 1-2 sentences explaining WHY this connection exists
4. evidence: Specific quotes/references from the researcher's takeaways/arguments that support this connection

IMPORTANT:
- Prioritize connections where the researcher's own synthesis (takeaways, arguments) provides evidence
- Higher confidence when multiple signals align (takeaway + arguments + citation)
- Only suggest connections with confidence >= 0.6
- Maximum 5 suggestions per request

Return JSON array of suggestions.
`;
```

#### Integration Point: ConnectionEditor.tsx

```typescript
// Location: src/components/connection/ConnectionEditor.tsx
// Replace placeholder at line 348-349

interface AISuggestion {
  paperId: string;
  paperTitle: string;
  type: ConnectionType;
  confidence: number;
  reasoning: string;
  evidence: string[];
}

// New component to display AI suggestions
const AISuggestionPanel: React.FC<{
  suggestions: AISuggestion[];
  onAccept: (suggestion: AISuggestion) => void;
  onDismiss: (paperId: string) => void;
  isLoading: boolean;
}> = ({ suggestions, onAccept, onDismiss, isLoading }) => {
  // Implementation details...
};
```

---

### 2.2 Feature: AI-Assisted Takeaway Refinement

**Priority**: P0
**Amplification Factor**: High
**Complexity**: Medium

#### Differentiation from Generic AI

| Generic AI Summary | IdeaGraph AI Takeaway |
|-------------------|----------------------|
| "This paper presents a method for..." | "For YOUR thesis on [X], the key insight is..." |
| Based only on abstract | Uses abstract + thesis context + related papers |
| Generic language | Framed relative to user's research question |
| No connection to existing work | References similar papers user has read |

#### Context Assembly

```typescript
interface TakeawayContext {
  // Paper being summarized
  paper: {
    title: string;
    abstract: string;
    tldr?: string;  // Semantic Scholar TLDR if available
    fieldsOfStudy?: string[];
  };

  // User's research context
  thesis: {
    title: string;
    description: string;
  };

  // Related papers for framing
  relatedPapers: {
    title: string;
    takeaway: string;
    thesisRole: ThesisRole;
  }[];

  // Optional: User's existing draft takeaway
  draftTakeaway?: string;

  // Optional: PDF annotations if available
  highlights?: {
    text: string;
    comment?: string;
  }[];
}
```

#### Prompt Template (takeaway.ts)

```typescript
export const TAKEAWAY_SUGGESTION_PROMPT = `
You are helping a researcher articulate the key insight from a paper.

RESEARCHER'S THESIS:
"{thesis_title}"
{thesis_description}

PAPER TO SUMMARIZE:
Title: {paper_title}
Abstract: {abstract}
{tldr_section}

RELATED PAPERS THE RESEARCHER HAS READ:
{related_papers}

{highlights_section}

{draft_section}

Generate a takeaway that:
1. Is ONE clear sentence (10-500 characters)
2. Focuses on what matters for THIS researcher's thesis
3. Captures the main contribution/finding, not just the topic
4. Is specific and actionable, not generic
5. Uses language consistent with the researcher's other takeaways

{refinement_instructions}

Return JSON:
{
  "suggestion": "The takeaway text...",
  "confidence": 0.85,
  "reasoning": "Why this framing is relevant to the thesis...",
  "alternatives": ["Alternative framing 1...", "Alternative framing 2..."]
}
`;
```

---

### 2.3 Feature: Argument & Evidence Extraction

**Priority**: P1
**Amplification Factor**: High
**Complexity**: Medium

#### Value Proposition

Users often skip adding arguments/evidence because it's tedious. AI can:
1. Pre-populate suggested arguments from abstract + PDF highlights
2. Auto-classify evidence types based on description
3. Suggest strength assessments based on language used

#### Prompt Template (argument.ts)

```typescript
export const ARGUMENT_EXTRACTION_PROMPT = `
Extract key arguments (claims) from this paper's abstract and the researcher's notes.

PAPER:
Title: {title}
Abstract: {abstract}

RESEARCHER'S HIGHLIGHTS FROM PDF:
{pdf_highlights}

RESEARCHER'S TAKEAWAY:
{takeaway}

For each argument, provide:
1. claim: The specific claim being made (1-2 sentences)
2. strength_suggestion: "strong" | "moderate" | "weak" based on language certainty
3. evidence_snippets: Relevant quotes from abstract/highlights
4. evidence_type: "experimental" | "computational" | "theoretical" | "meta-analysis" | "other"

Return max 5 arguments, prioritizing:
- Claims central to the paper's contribution
- Claims with clear supporting evidence in the text
- Claims relevant to the researcher's takeaway

Return JSON array.
`;
```

---

### 2.4 Feature: AI-Enhanced Gap Analysis

**Priority**: P1
**Amplification Factor**: High
**Complexity**: Medium

#### Current Rule-Based Detection (Already Implemented)

```typescript
// From useAppStore.ts detectGaps()
// Currently detects:
// - Contradictory findings (papers with 'contradicts' connections)
// - Temporal gaps (>50% papers >5 years old)
// - Methodological gaps (missing evidence types)
// - Knowledge gaps (papers with weak arguments)
```

#### AI Enhancement

AI can provide:
1. **Richer gap descriptions**: Instead of "Temporal gap: 60% papers >5 years", generate "Your literature on [topic] lacks recent perspectives on [specific aspect] that has evolved significantly since 2020"
2. **Gap type inference**: Detect gaps not covered by rules (theoretical frameworks missing, geographic limitations, etc.)
3. **Future research suggestions**: Generate specific research questions to address gaps

#### Prompt Template (gap.ts)

```typescript
export const GAP_ANALYSIS_PROMPT = `
Analyze this research collection for gaps in the literature coverage.

THESIS:
{thesis_title}
{thesis_description}

PAPERS SUMMARY:
Total: {paper_count}
By Role: {role_breakdown}
By Year: {year_distribution}
By Evidence Type: {evidence_breakdown}

ARGUMENTS OVERVIEW:
{argument_clusters}

EXISTING CONNECTIONS:
{connection_summary}

CONTRADICTIONS IDENTIFIED:
{contradictions}

Identify gaps in this literature collection:

GAP TYPES TO CONSIDER:
- knowledge: Missing understanding in a key area
- methodological: Lack of certain study types
- population: Limited scope of subjects/contexts
- theoretical: Missing conceptual frameworks
- temporal: Outdated or missing recent work
- geographic: Limited geographic coverage
- contradictory: Unresolved disagreements

For each gap found:
1. type: Gap type from above
2. title: Short descriptive title (5-10 words)
3. description: 2-3 sentences explaining the gap
4. priority: "high" | "medium" | "low" based on thesis relevance
5. related_papers: Paper IDs that highlight this gap
6. future_research: Suggested research question to address this gap

Return JSON array of gaps.
`;
```

---

### 2.5 Feature: Literature Review Draft Generation

**Priority**: P2
**Amplification Factor**: Very High
**Complexity**: High

#### Why This Is Powerful

User has already done the hard work:
- Organized papers into themes
- Written takeaways capturing key insights
- Created connections showing relationships
- Assessed argument strength

AI synthesizes this into prose, NOT by reading papers, but by composing user's own synthesis.

#### Output Structure

```typescript
interface ReviewDraft {
  sections: ReviewDraftSection[];
  bibliography: string;  // Formatted citations
  wordCount: number;
}

interface ReviewDraftSection {
  theme: string;
  content: string;  // Prose paragraph(s)
  citations: string[];  // In-text citations used
  confidence: number;  // How well-supported by user data
  suggestedExpansions: string[];  // Where user might add more
}
```

#### Prompt Template (synthesis.ts)

```typescript
export const LITERATURE_REVIEW_PROMPT = `
Generate a literature review section based on the researcher's synthesis.

THESIS:
{thesis_title}

THEME FOR THIS SECTION:
{theme_name}: {theme_description}

PAPERS IN THIS THEME (with researcher's synthesis):
{papers_with_synthesis}

CONNECTIONS BETWEEN THESE PAPERS:
{relevant_connections}

ARGUMENT CLUSTERS:
{argument_clusters}

Generate a literature review section that:
1. Opens with the theme's central question/topic
2. Synthesizes findings across papers using the researcher's takeaways
3. Highlights agreements and disagreements
4. Uses proper academic tone
5. Includes in-text citations (Author, Year) format

IMPORTANT:
- Only make claims supported by the researcher's synthesis data
- Do not invent findings or interpretations
- Flag areas where more papers might strengthen the section
- Keep to 200-400 words per section

Return JSON:
{
  "content": "The generated prose...",
  "citations_used": ["Smith 2023", "Jones 2022"],
  "confidence": 0.8,
  "expansion_suggestions": ["Consider adding papers on...", ...]
}
`;
```

---

## Part 3: Complementary Features Needed

To maximize AI feature effectiveness, these supporting features should be added:

### 3.1 AI Settings & Configuration

```typescript
interface AISettings {
  // Provider selection
  provider: 'claude' | 'openai' | 'ollama' | 'none';
  apiKey?: string;  // Encrypted in storage
  ollamaEndpoint?: string;  // For local inference

  // Feature toggles
  enableConnectionSuggestions: boolean;
  enableTakeawaySuggestions: boolean;
  enableArgumentExtraction: boolean;
  enableGapAnalysis: boolean;
  enableReviewGeneration: boolean;

  // Behavior
  autoSuggestOnPaperAdd: boolean;
  suggestionConfidenceThreshold: number;  // 0.0-1.0
  maxSuggestionsPerRequest: number;

  // Privacy
  sendAbstractsToAI: boolean;  // Some users may want local-only
  sendPDFHighlights: boolean;
}
```

### 3.2 Suggestion History & Feedback

Track what users accept/reject to improve suggestions over time:

```typescript
interface SuggestionRecord {
  id: string;
  type: 'connection' | 'takeaway' | 'argument' | 'gap';
  suggestion: object;
  action: 'accepted' | 'edited' | 'dismissed';
  editedTo?: object;  // If user modified before accepting
  timestamp: string;
  feedbackNote?: string;  // Optional user explanation
}
```

### 3.3 Batch Processing Queue

For thesis-wide analysis (gap detection, review generation):

```typescript
interface AITaskQueue {
  tasks: AITask[];
  currentTask: AITask | null;

  enqueue(task: AITask): void;
  process(): Promise<void>;
  cancel(taskId: string): void;
  getProgress(): { completed: number; total: number; current?: string };
}

interface AITask {
  id: string;
  type: 'connection-scan' | 'gap-analysis' | 'review-generation';
  thesisId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;  // 0-100
  result?: object;
  error?: string;
}
```

### 3.4 Enhanced Data Fields

Add fields to existing types to support AI features:

```typescript
// Add to Paper interface
interface Paper {
  // ... existing fields ...

  // AI assistance tracking
  aiTakeawaySuggested?: boolean;
  aiTakeawayAccepted?: boolean;
  aiArgumentsExtracted?: boolean;

  // Embedding for similarity (computed once)
  embedding?: number[];  // Optional: for local similarity computation
}

// Add to Connection interface
interface Connection {
  // ... existing fields ...

  // Enhanced AI tracking
  suggestionSource?: 'citation-network' | 'takeaway-similarity' | 'argument-match';
  dismissedAt?: string;  // Track dismissed suggestions
}

// Add to Thesis interface
interface Thesis {
  // ... existing fields ...

  // AI analysis state
  lastGapAnalysis?: string;  // ISO timestamp
  lastConnectionScan?: string;
  reviewDraftGenerated?: boolean;
}
```

### 3.5 Keyboard Shortcuts for AI Actions

```typescript
const AI_SHORTCUTS = {
  'Cmd+Shift+S': 'suggestConnections',     // Suggest connections for selected paper
  'Cmd+Shift+T': 'refineTakeaway',         // Refine takeaway with AI
  'Cmd+Shift+A': 'extractArguments',       // Extract arguments from abstract
  'Cmd+Shift+G': 'runGapAnalysis',         // Run gap analysis for thesis
  'Cmd+Shift+R': 'generateReviewDraft',    // Generate review section
};
```

### 3.6 Visual Indicators for AI Content

```typescript
// Color coding system
const AI_VISUAL_INDICATORS = {
  // Connection badges
  aiSuggested: 'border-amber-400 bg-amber-50',
  aiApproved: 'border-green-400 bg-green-50',
  aiDismissed: 'border-gray-300 bg-gray-50 opacity-50',

  // Confidence indicators
  highConfidence: 'text-green-600',    // >= 0.8
  mediumConfidence: 'text-amber-600',  // 0.6-0.8
  lowConfidence: 'text-red-600',       // < 0.6

  // Icons
  aiIcon: Sparkles,
  userIcon: User,
  hybridIcon: UserCheck,  // AI suggested, user approved
};
```

---

## Part 4: Implementation Roadmap

### Phase 3.1: Foundation (Week 1-2)

1. **Create AI service layer structure**
   - Provider abstraction (start with Claude)
   - Prompt template system
   - Context assembler

2. **Add AI settings UI**
   - API key configuration
   - Feature toggles
   - Provider selection

3. **Update data types**
   - Add AI tracking fields to Paper, Connection
   - Create SuggestionRecord type
   - Add embedding field (optional)

### Phase 3.2: Connection Suggestions (Week 3-4)

1. **Implement ConnectionSuggester**
   - Citation network analysis
   - Takeaway similarity computation
   - Argument matching

2. **Build suggestion UI in ConnectionEditor**
   - Suggestion panel component
   - Accept/Edit/Dismiss workflow
   - Confidence visualization

3. **Add suggestion persistence**
   - Track accepted/dismissed
   - Avoid re-suggesting dismissed

### Phase 3.3: Takeaway & Argument Assistance (Week 5-6)

1. **Implement TakeawaySuggester**
   - Context-aware prompts
   - Alternative suggestions
   - Refinement mode

2. **Implement ArgumentExtractor**
   - Abstract parsing
   - PDF highlight integration
   - Evidence type classification

3. **Integrate into AddPaperModal and PaperEditModal**
   - Suggestion buttons
   - Inline editing
   - Preview before accept

### Phase 3.4: Gap Analysis Enhancement (Week 7-8)

1. **Enhance detectGaps with AI**
   - Rich descriptions
   - Future research suggestions
   - Priority inference

2. **Update GapAnalysis.tsx**
   - Display AI-enhanced gaps
   - Toggle between rule-based and AI
   - Export gap report

### Phase 3.5: Review Generation (Week 9-10)

1. **Implement ReviewGenerator**
   - Theme-based section generation
   - Argument synthesis
   - Citation formatting

2. **Build Review Draft UI**
   - Section-by-section generation
   - Inline editing
   - Export to Markdown/Word

3. **Confidence indicators**
   - Flag under-supported sections
   - Suggest additional papers

### Phase 3.6: Polish & Optimization (Week 11-12)

1. **Local inference support (Ollama)**
   - Privacy-focused option
   - Offline capability

2. **Caching & rate limiting**
   - Response caching
   - Token usage tracking
   - API cost estimation

3. **Feedback integration**
   - Track user corrections
   - Improve prompts based on patterns

---

## Part 5: API & Data Flow Specifications

### 5.1 AI Provider Interface

```typescript
// src/services/ai/providers/base.ts

export interface AIProvider {
  name: string;
  isConfigured(): boolean;

  // Core completion method
  complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;

  // Structured output (JSON)
  completeJSON<T>(prompt: string, schema: JSONSchema, options?: CompletionOptions): Promise<T>;

  // Token estimation
  estimateTokens(text: string): number;
}

export interface CompletionOptions {
  maxTokens?: number;
  temperature?: number;  // Default 0.3 for factual tasks
  stopSequences?: string[];
}

export interface CompletionResult {
  text: string;
  tokensUsed: { input: number; output: number };
  finishReason: 'complete' | 'length' | 'stop';
}
```

### 5.2 Suggestion Flow Interface

```typescript
// src/services/ai/suggestions/manager.ts

export interface SuggestionManager {
  // Connection suggestions
  suggestConnectionsForPaper(
    paperId: string,
    options?: { maxSuggestions?: number }
  ): Promise<ConnectionSuggestion[]>;

  suggestConnectionsForThesis(
    thesisId: string,
    options?: { maxPerPaper?: number }
  ): Promise<Map<string, ConnectionSuggestion[]>>;

  // Takeaway suggestions
  suggestTakeaway(
    paper: Partial<Paper>,
    thesisContext: ThesisContext
  ): Promise<TakeawaySuggestion>;

  refineTakeaway(
    currentTakeaway: string,
    paper: Partial<Paper>,
    thesisContext: ThesisContext
  ): Promise<TakeawaySuggestion>;

  // Argument extraction
  extractArguments(
    paper: Paper,
    pdfHighlights?: PDFAnnotation[]
  ): Promise<ArgumentSuggestion[]>;

  // Gap analysis
  analyzeGaps(
    thesisId: string
  ): Promise<GapSuggestion[]>;

  // Review generation
  generateReviewSection(
    theme: SynthesisTheme,
    papers: Paper[],
    connections: Connection[]
  ): Promise<ReviewSectionDraft>;

  // Feedback
  recordFeedback(
    suggestionId: string,
    action: 'accepted' | 'edited' | 'dismissed',
    editedTo?: object
  ): void;
}
```

### 5.3 Store Actions for AI

```typescript
// Add to useAppStore.ts

interface AIStoreActions {
  // Suggestion state
  pendingSuggestions: {
    connections: Map<string, ConnectionSuggestion[]>;
    takeaways: Map<string, TakeawaySuggestion>;
    arguments: Map<string, ArgumentSuggestion[]>;
    gaps: GapSuggestion[];
  };

  // Actions
  setPendingConnectionSuggestions: (
    paperId: string,
    suggestions: ConnectionSuggestion[]
  ) => void;

  acceptConnectionSuggestion: (
    paperId: string,
    suggestion: ConnectionSuggestion
  ) => Connection;

  dismissConnectionSuggestion: (
    paperId: string,
    targetPaperId: string
  ) => void;

  acceptTakeawaySuggestion: (
    paperId: string,
    takeaway: string
  ) => void;

  acceptArgumentSuggestions: (
    paperId: string,
    arguments: Argument[]
  ) => void;

  clearPendingSuggestions: (paperId?: string) => void;
}
```

---

## Part 6: UI Component Specifications

### 6.1 AI Suggestion Badge Component

```typescript
// src/components/ai/SuggestionBadge.tsx

interface SuggestionBadgeProps {
  confidence: number;
  source?: 'citation' | 'takeaway' | 'argument' | 'ai';
  onClick?: () => void;
}

// Visual:
// [🤖 87%] - High confidence, AI suggested
// [📚 72%] - Medium confidence, citation-based
// [💡 65%] - Lower confidence, takeaway similarity
```

### 6.2 Connection Suggestion Card

```typescript
// src/components/ai/ConnectionSuggestionCard.tsx

interface ConnectionSuggestionCardProps {
  suggestion: ConnectionSuggestion;
  onAccept: () => void;
  onEdit: () => void;
  onDismiss: () => void;
}

// Layout:
// ┌────────────────────────────────────────────────┐
// │ 📄 Paper Title                        [87%] 🤖 │
// │ ─────────────────────────────────────────────── │
// │ Suggested: contradicts                         │
// │                                                │
// │ "Both papers study X but your takeaway notes   │
// │  they reach opposite conclusions about Y"      │
// │                                                │
// │ Evidence from your notes:                      │
// │ • "Paper A claims..." (your takeaway)          │
// │ • "Evidence shows..." (your argument)          │
// │                                                │
// │ [✓ Accept]  [✏️ Edit]  [✗ Dismiss]             │
// └────────────────────────────────────────────────┘
```

### 6.3 Takeaway Suggestion Inline

```typescript
// Integration in AddPaperModal.tsx / PaperEditModal.tsx

// Below takeaway textarea:
// ┌────────────────────────────────────────────────┐
// │ 💡 AI Suggestion (85% confidence)              │
// │                                                │
// │ "For your thesis on [X], this paper's key      │
// │  insight is that [specific finding] which      │
// │  [relates to your research question]"          │
// │                                                │
// │ [Use This]  [Use as Starting Point]  [Dismiss] │
// │                                                │
// │ 📝 Alternative framings:                       │
// │ • "This paper demonstrates..."                 │
// │ • "The key contribution is..."                 │
// └────────────────────────────────────────────────┘
```

### 6.4 Gap Analysis Enhancement Panel

```typescript
// Enhancement to GapAnalysis.tsx

// ┌────────────────────────────────────────────────┐
// │ 🔍 AI-Detected Gap                    [HIGH]   │
// │ ─────────────────────────────────────────────── │
// │ Methodological Gap                             │
// │                                                │
// │ "Your collection lacks computational studies   │
// │  validating the experimental findings from     │
// │  Smith 2023 and Jones 2022. This limits the   │
// │  generalizability of your conclusions."        │
// │                                                │
// │ Related Papers: [Smith 2023] [Jones 2022]      │
// │                                                │
// │ 🔬 Suggested Research Question:                │
// │ "How do computational models compare to        │
// │  experimental observations for [topic]?"       │
// │                                                │
// │ [Save Gap]  [Edit]  [Dismiss]                  │
// └────────────────────────────────────────────────┘
```

---

## Part 7: Testing Strategy

### 7.1 Mock Provider for Development

```typescript
// src/services/ai/providers/mock.ts

export class MockAIProvider implements AIProvider {
  private mockResponses: Map<string, object>;

  async completeJSON<T>(prompt: string): Promise<T> {
    // Return deterministic mock responses based on prompt patterns
    // Enables UI development without API costs
  }
}
```

### 7.2 Test Scenarios

1. **Connection Suggestions**
   - Two papers with opposing takeaways → suggests "contradicts"
   - Paper A cites Paper B → suggests "extends" or "uses-method"
   - Papers with overlapping keywords → suggests "same-topic"

2. **Takeaway Refinement**
   - Generic abstract → context-specific takeaway
   - Technical abstract + biomedical thesis → appropriate framing
   - Existing draft → improved version

3. **Gap Detection**
   - All old papers → temporal gap
   - No experimental evidence → methodological gap
   - Contradictory papers → unresolved contradiction

---

## Part 8: Privacy & Security Considerations

### 8.1 Data Sent to AI Providers

| Data Type | Sent by Default | User Control |
|-----------|-----------------|--------------|
| Thesis title/description | Yes | Required for context |
| Paper titles | Yes | Required |
| User takeaways | Yes | Toggle: sendUserSynthesis |
| Paper abstracts | Yes | Toggle: sendAbstracts |
| PDF highlights | Optional | Toggle: sendPDFHighlights |
| Full paper text | Never | Not implemented |

### 8.2 Local Inference Option

For privacy-conscious users, support Ollama:

```typescript
// src/services/ai/providers/ollama.ts

export class OllamaProvider implements AIProvider {
  private endpoint: string;  // e.g., http://localhost:11434
  private model: string;     // e.g., llama2, mistral

  // All inference happens locally
  // No data leaves user's machine
}
```

### 8.3 API Key Security

```typescript
// Store encrypted in localStorage
// Never log or display full key
// Clear on logout/data export

const secureStorage = {
  setAPIKey(provider: string, key: string): void {
    const encrypted = encrypt(key, getUserSecret());
    localStorage.setItem(`ai_key_${provider}`, encrypted);
  },

  getAPIKey(provider: string): string | null {
    const encrypted = localStorage.getItem(`ai_key_${provider}`);
    if (!encrypted) return null;
    return decrypt(encrypted, getUserSecret());
  }
};
```

---

## Appendix A: Prompt Engineering Guidelines

1. **Be specific about output format**: Always request JSON with explicit schema
2. **Ground in user data**: Reference thesis, takeaways, arguments explicitly
3. **Set confidence expectations**: Ask for confidence scores
4. **Limit scope**: Cap suggestions (max 5 connections, max 3 arguments)
5. **Explain reasoning**: Always request explanation for suggestions
6. **Avoid hallucination**: Emphasize using only provided data

## Appendix B: Error Handling

```typescript
// Common error scenarios and handling

enum AIErrorType {
  RATE_LIMITED = 'rate_limited',      // Retry with backoff
  INVALID_KEY = 'invalid_key',        // Prompt reconfiguration
  CONTEXT_TOO_LONG = 'context_long',  // Truncate context
  PARSE_ERROR = 'parse_error',        // Retry with simpler prompt
  NETWORK_ERROR = 'network_error',    // Retry or offline mode
}

const handleAIError = (error: AIError): UserMessage => {
  switch (error.type) {
    case AIErrorType.RATE_LIMITED:
      return { text: 'AI service is busy. Retrying in 30 seconds...', retry: true };
    case AIErrorType.INVALID_KEY:
      return { text: 'Please check your API key in Settings.', action: 'openSettings' };
    // ...
  }
};
```

---

*Document Version: 1.0*
*Created: December 2024*
*For: IdeaGraph Phase 3 Implementation*
