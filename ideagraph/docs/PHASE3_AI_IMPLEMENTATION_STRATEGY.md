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

## Part 9: Implementation Status & New Features (December 2024 Update)

### 9.1 Implementation Status

| Feature | Status | Location |
|---------|--------|----------|
| AI Provider Abstraction | ✅ Complete | `services/ai/providers/` |
| Claude Provider | ✅ Complete | `providers/claude.ts` |
| Mock Provider | ✅ Complete | `providers/mock.ts` |
| Context Assembler | ✅ Complete | `context/assembler.ts` |
| Connection Suggestions | ✅ Complete | `prompts/connection.ts` |
| Takeaway Suggestions | ✅ Complete | `prompts/takeaway.ts` |
| Argument Extraction | ✅ Complete | `prompts/argument.ts` |
| Gap Analysis | ✅ Complete | `prompts/gap.ts` |
| Unified Paper Intake | ✅ **NEW** | `prompts/intake.ts` |
| Discovery Service | ✅ **NEW** | `services/discovery/` |
| Screening Suggestions | ✅ **NEW** | `prompts/screening.ts` |
| Feedback Tracking | ✅ **NEW** | `services/ai/feedback/` |
| AI Settings UI | ✅ Complete | `components/settings/AISettings.tsx` |
| Review Generation | ⏳ Pending | - |

### 9.2 New Feature: Unified Paper Intake

**Location**: `services/ai/prompts/intake.ts`

The unified intake prompt analyzes new papers comprehensively in a single AI call:

```typescript
interface PaperIntakeAnalysis {
  // Thesis role suggestion with reasoning
  thesisRole: ThesisRole;
  roleConfidence: number;
  roleReasoning: string;

  // Takeaway suggestion with alternatives
  takeaway: string;
  takeawayConfidence: number;
  alternativeTakeaways: string[];

  // Key arguments extracted from abstract
  arguments: {
    claim: string;
    strength: 'strong' | 'moderate' | 'weak';
    evidenceType: string;
  }[];

  // Overall relevance score (0-100)
  relevanceScore: number;
  relevanceReasoning: string;

  // Potential connections to existing papers
  potentialConnections: {
    paperId: string;
    connectionType: string;
    reasoning: string;
  }[];
}
```

**UI Integration**: `components/paper/AIIntakePanel.tsx`
- Shows relevance score with color-coded badge
- Displays suggested role with confidence
- Allows one-click application of suggestions
- Shows alternative takeaways for selection

### 9.3 New Feature: Thesis-Aware Discovery Service

**Location**: `services/discovery/index.ts`

Combines AI-generated search strategies with Semantic Scholar for intelligent paper discovery:

```typescript
class DiscoveryService {
  // Generate search strategies based on thesis gaps
  async generateSearchStrategies(params: {
    thesis: Thesis;
    papers: Paper[];
    gaps?: GapSuggestion[];
  }): Promise<SearchStrategy[]>;

  // Score papers for thesis relevance
  async scoreRelevance(params: {
    thesis: Thesis;
    candidatePapers: SemanticScholarPaper[];
  }): Promise<PaperRelevanceScore[]>;

  // Full discovery pipeline
  async discoverPapers(params: {
    thesis: Thesis;
    papers: Paper[];
    gaps?: GapSuggestion[];
    maxResults?: number;
  }): Promise<DiscoveryResult[]>;
}
```

**Search Strategy Types**:
- `supporting-evidence`: Evidence that supports thesis claims
- `counterargument`: Papers that challenge the thesis
- `methodology`: Methodological approaches to use
- `recent-work`: Recent publications not in collection
- `foundational`: Classic/seminal papers
- `application`: Practical applications

### 9.4 New Feature: AI Screening Suggestions

**Location**: `services/ai/prompts/screening.ts`

Helps with batch paper screening decisions:

```typescript
interface ScreeningSuggestion {
  paperId: string;
  decision: 'include' | 'exclude' | 'maybe';
  confidence: number;
  reasoning: string;
  suggestedRole?: ThesisRole;      // For include decisions
  suggestedTakeaway?: string;      // For include decisions
  exclusionReason?: string;        // For exclude decisions
}
```

### 9.5 New Feature: Feedback Tracking Service

**Location**: `services/ai/feedback/index.ts`

Persists user feedback on AI suggestions for future improvement:

```typescript
interface AIFeedbackRecord {
  id: string;
  type: FeedbackType;  // 'intake-role' | 'intake-takeaway' | 'connection' | 'screening'
  thesisId: string;
  paperId?: string;
  aiSuggestion: {
    value: unknown;
    confidence: number;
  };
  userAction: FeedbackAction;  // 'accepted' | 'edited' | 'dismissed' | 'overridden'
  userValue?: unknown;
  timestamp: string;
}
```

**Feedback Summary**:
- Tracks acceptance rate per thesis
- Records role override patterns
- Enables future prompt improvement

### 9.6 Updated File Structure

```
ideagraph/src/services/
├── ai/
│   ├── index.ts
│   ├── types.ts
│   ├── providers/
│   │   ├── index.ts
│   │   ├── claude.ts
│   │   └── mock.ts
│   ├── prompts/
│   │   ├── index.ts
│   │   ├── connection.ts
│   │   ├── takeaway.ts
│   │   ├── argument.ts
│   │   ├── gap.ts
│   │   ├── intake.ts        # NEW: Unified paper analysis
│   │   ├── discovery.ts     # NEW: Search strategy generation
│   │   └── screening.ts     # NEW: Batch screening suggestions
│   ├── context/
│   │   └── assembler.ts
│   ├── suggestions/
│   │   └── manager.ts
│   └── feedback/            # NEW
│       └── index.ts
├── discovery/               # NEW
│   └── index.ts
└── api/
    └── semanticScholar.ts   # Existing, used by discovery
```

### 9.7 React Hooks

```typescript
// Existing
import { useAI } from '../hooks/useAI';
const {
  analyzePaperForIntake,  // NEW: Unified intake
  intakeAnalysis,         // NEW: Current intake result
  clearIntakeAnalysis,    // NEW: Reset intake
  // ... existing methods
} = useAI();

// NEW
import { useDiscovery } from '../hooks/useDiscovery';
const {
  discoverPapers,
  discoverFromPaper,
  generateStrategies,
  results,
  strategies,
  isDiscovering,
  progress,
} = useDiscovery();
```

### 9.8 UI Components

| Component | Location | Purpose |
|-----------|----------|---------|
| AIIntakePanel | `components/paper/AIIntakePanel.tsx` | Displays unified intake results |
| AISettings | `components/settings/AISettings.tsx` | AI configuration |
| (Future) DiscoveryPanel | - | Display discovery results |
| (Future) ScreeningAIPanel | - | Show screening suggestions |

---

## Part 10: Remaining Work

### 10.1 Priority Items

1. **Review Generation** (`prompts/synthesis.ts`)
   - Generate literature review sections from user synthesis
   - Theme-based paragraph generation
   - Citation formatting

2. **Discovery UI Integration**
   - Add discovery panel to GraphView
   - Show AI-scored results with relevance
   - Quick-add from discovery results

3. **Screening UI Integration**
   - Add AI suggestions to ScreeningPanel
   - Batch screening mode
   - Accept/reject workflow

### 10.2 Technical Debt

1. Add `utils/rateLimiter.ts` for API rate limiting
2. Add `utils/cache.ts` for response caching
3. Add `utils/tokenCounter.ts` for token estimation
4. Implement Ollama provider for local inference
5. Add API key encryption

### 10.3 Future Enhancements

1. **Continuous Learning**: Use feedback data to improve prompts
2. **Embeddings**: Local similarity computation without API calls
3. **Batch Operations**: Queue-based processing for thesis-wide analysis
4. **Export Integration**: Generate Word/LaTeX review drafts

---

## Part 11: December 2024 Enhancement - Cognitive AI Integration

### 11.1 Problem Analysis

The initial AI integration had several UX issues:
1. **Disconnected Experience**: AI panel felt like an optional extra, not part of the workflow
2. **Cold Start Problem**: No meaningful suggestions with fewer than 3 papers
3. **Token Budget at Scale**: Sent all papers as context, expensive with large collections
4. **Manual Trigger Required**: User had to explicitly request AI analysis

### 11.2 Solution: Inline AI Suggestions

**Replaced**: Separate `AIIntakePanel` component
**With**: Inline suggestions directly under each form field

```
┌─────────────────────────────────────────────────────────────────┐
│ Takeaway *                                                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [User's takeaway text...]                                    │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ✨ AI Suggestion (87%)                              [Use]   │ │
│ │ "This paper demonstrates that X leads to Y, which..."       │ │
│ │ ▸ 2 alternatives                                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Role in Your Thesis                                              │
│ [Supports] [Contradicts] [Method] [Background] [Other]          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ✨ Suggested: Supports (92%)                      [Apply]   │ │
│ │ ▸ Show reasoning                                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**New Components**:
- `InlineRoleSuggestion` - Suggests thesis role directly under role selector
- `InlineTakeawaySuggestion` - Shows takeaway suggestions under text area
- `InlineRelevanceIndicator` - Color-coded relevance score badge
- `InlineConnectionPreview` - Preview of potential connections
- `AIAnalysisStatus` - Shows analysis state (analyzing/complete/error)

**Location**: `components/paper/InlineAISuggestion.tsx`

### 11.3 Adaptive AI Behavior

New service that adjusts AI behavior based on collection size:

```typescript
// services/ai/context/adaptive.ts

type CollectionTier = 'cold-start' | 'growing' | 'established' | 'large';

function getCollectionTier(paperCount: number): CollectionTier {
  if (paperCount <= 2) return 'cold-start';
  if (paperCount <= 10) return 'growing';
  if (paperCount <= 50) return 'established';
  return 'large';
}
```

**Tier-Based Behavior**:

| Tier | Papers | Auto-Trigger | Role Suggestions | Context Size |
|------|--------|--------------|------------------|--------------|
| Cold Start | 0-2 | No | Disabled | All |
| Growing | 3-10 | Yes | Enabled | All |
| Established | 11-50 | Yes | Enabled | 20 selected |
| Large | 50+ | No (user trigger) | Enabled | 15 selected |

**Cold Start Handling**:
- Shows guidance message: "Add 3+ papers to enable AI role suggestions"
- Takeaway suggestions still available (don't need collection context)
- Connection suggestions disabled (need papers to connect to)

### 11.4 Smart Context Selection

For large collections, only relevant papers are included in AI context:

```typescript
// services/ai/context/adaptive.ts

function selectContextPapers(
  allPapers: Paper[],
  targetPaper: { title: string; abstract?: string | null },
  config: AdaptiveConfig
): Paper[] {
  // Score by:
  // 1. Word overlap with target paper
  // 2. Recency bonus
  // 3. Role diversity (include variety)
  // Then take top N based on tier
}
```

**Context Budget by Tier**:
- Cold Start: Include everything, add abstracts
- Growing: Include all, add abstracts
- Established: Select 20 papers, skip abstracts
- Large: Select 15 papers, skip abstracts, minimal context

### 11.5 Auto-Connection Service

Automatically queues and analyzes papers for connections when added:

```typescript
// services/ai/autoConnect/index.ts

class AutoConnectService {
  queuePaper(params: { paper, thesis, allPapers, connections, aiSettings }): string | null;
  getSuggestionsForPaper(paperId: string): ConnectionSuggestion[] | null;
  getQueueStatus(): { pending, processing, completed, failed };
}
```

**Configuration**:
- `minPapersRequired`: 3 (don't queue until growing tier)
- `maxQueueSize`: 10 (prevent runaway queuing)
- `processingDelay`: 2000ms (avoid rate limits)
- `autoApplyConfidence`: 0.9 (very high confidence only)

**React Hook**: `hooks/useAutoConnect.ts`
- Watches for new papers and auto-queues
- Manages pending suggestions state
- Provides accept/dismiss actions

**UI Component**: `components/paper/ConnectionSuggestionToast.tsx`
- Floating toast showing pending connection suggestions
- Expand/collapse for details
- Accept or dismiss per suggestion

### 11.6 Updated File Structure

```
ideagraph/src/
├── services/ai/
│   ├── context/
│   │   ├── index.ts          # Updated exports
│   │   ├── assembler.ts      # Existing
│   │   └── adaptive.ts       # NEW: Tier-based behavior
│   └── autoConnect/
│       └── index.ts          # NEW: Auto-connection queue
├── hooks/
│   ├── useAI.ts              # Updated with intake
│   ├── useDiscovery.ts       # Existing
│   └── useAutoConnect.ts     # NEW: Auto-connection hook
└── components/paper/
    ├── AddPaperModal.tsx     # Updated with inline suggestions
    ├── InlineAISuggestion.tsx     # NEW: Inline suggestion components
    ├── ConnectionSuggestionToast.tsx  # NEW: Connection toast
    └── AIIntakePanel.tsx     # Deprecated (still available)
```

### 11.7 Key Improvements Summary

1. **Cognitive Integration**: AI suggestions appear inline with form fields
2. **Adaptive Behavior**: Different experience for 2 papers vs 50 papers
3. **Token Efficiency**: Smart context selection for large collections
4. **Auto-Connection**: Background analysis when papers are added
5. **Cold Start Handling**: Clear guidance for new users
6. **Progressive Disclosure**: Suggestions expandable, not overwhelming

---

## Part 12: Open Source Integration Strategy (December 2024)

Based on research into open-source AI tools for academic literature, this section outlines enhancements using external APIs and proven patterns from tools like ASReview, PaperQA2, LitLLM, and Semantic Scholar.

### 12.1 Implementation Priority Matrix

| Priority | Feature | API/Pattern | Server Needed | Effort |
|----------|---------|-------------|---------------|--------|
| **High** | SPECTER embeddings via S2 API | Semantic Scholar | No | Low |
| **High** | OpenAlex backup/enrichment | OpenAlex | No | Low |
| **High** | Feedback-driven learning | ASReview pattern | No | Medium |
| **Medium** | LLM re-ranking for connections | PaperQA2 pattern | No | Medium |
| **Medium** | Plan-based gap generation | LitLLM pattern | No | Low |
| **Medium** | Hybrid search (keyword + embedding) | Scholar Inbox | No | Medium |
| **Low** | Retraction checking | OpenAlex/Crossref | No | Low |

### 12.2 SPECTER Embeddings via Semantic Scholar API

**Problem**: Need semantic similarity between papers without hosting ML models.

**Solution**: Semantic Scholar provides pre-computed SPECTER embeddings via their API.

```typescript
// services/api/semanticScholar.ts - Add embedding field

interface SemanticScholarPaper {
  // ... existing fields
  embedding?: {
    model: string;
    vector: number[];
  };
}

// Fetch with embedding
const FIELDS_WITH_EMBEDDING = FIELDS + ',embedding.specter_v2';

export async function getPaperWithEmbedding(paperId: string): Promise<SemanticScholarPaper> {
  const url = `${BASE_URL}/paper/${paperId}?fields=${FIELDS_WITH_EMBEDDING}`;
  const response = await rateLimitedFetch(url);
  return response.json();
}

// Calculate cosine similarity between two papers
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

**Use Cases**:
- Find similar papers in collection without LLM call
- Pre-filter candidates before LLM scoring (save tokens)
- Local similarity search for connections

### 12.3 OpenAlex Integration

**Problem**: Semantic Scholar rate limits; need richer metadata (citations, retractions, open access).

**Solution**: Add OpenAlex as backup and enrichment source.

```typescript
// services/api/openAlex.ts

const OPENALEX_BASE = 'https://api.openalex.org';

export interface OpenAlexWork {
  id: string;
  doi: string;
  title: string;
  publication_year: number;
  cited_by_count: number;
  is_retracted: boolean;
  is_oa: boolean;
  primary_location?: {
    source?: { display_name: string };
  };
  authorships: Array<{
    author: { display_name: string };
  }>;
  abstract_inverted_index?: Record<string, number[]>;
  concepts: Array<{
    display_name: string;
    score: number;
  }>;
}

export async function getWorkByDOI(doi: string): Promise<OpenAlexWork | null> {
  const url = `${OPENALEX_BASE}/works/doi:${encodeURIComponent(doi)}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'IdeaGraph/1.0 (mailto:your@email.com)' }
  });
  if (!response.ok) return null;
  return response.json();
}

export async function searchWorks(query: string, options?: {
  limit?: number;
  filter?: string;
}): Promise<OpenAlexWork[]> {
  const params = new URLSearchParams({
    search: query,
    per_page: String(options?.limit || 20),
  });
  if (options?.filter) params.set('filter', options.filter);

  const url = `${OPENALEX_BASE}/works?${params}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.results || [];
}

// Reconstruct abstract from inverted index
export function reconstructAbstract(inverted: Record<string, number[]>): string {
  const words: [string, number][] = [];
  for (const [word, positions] of Object.entries(inverted)) {
    for (const pos of positions) {
      words.push([word, pos]);
    }
  }
  words.sort((a, b) => a[1] - b[1]);
  return words.map(w => w[0]).join(' ');
}
```

**Benefits**:
- 100k free requests/day (no auth needed)
- `is_retracted` field for safety
- `is_oa` for open access status
- `concepts` for automatic tagging
- Fallback when S2 rate limited

### 12.4 Feedback-Driven Learning (ASReview Pattern)

**Problem**: AI suggestions don't improve from user corrections.

**Solution**: Use existing FeedbackService to weight future suggestions.

```typescript
// services/ai/feedback/learner.ts

import { getFeedbackService, type AIFeedbackRecord } from './index';
import type { ThesisRole } from '../../../types';

/**
 * Learn from user feedback to improve suggestions
 */
export class FeedbackLearner {
  /**
   * Get role override patterns for a thesis
   * Returns: { 'background->supports': 5, ... } meaning AI suggested background
   * but user chose supports 5 times
   */
  getRoleOverridePatterns(thesisId: string): Map<string, number> {
    const service = getFeedbackService();
    const records = service.exportData()
      .filter(r => r.thesisId === thesisId && r.type === 'intake-role' && r.userAction === 'overridden');

    const patterns = new Map<string, number>();
    for (const r of records) {
      const key = `${r.aiSuggestion.value}->${r.userValue}`;
      patterns.set(key, (patterns.get(key) || 0) + 1);
    }
    return patterns;
  }

  /**
   * Adjust role confidence based on past corrections
   */
  adjustRoleConfidence(
    thesisId: string,
    suggestedRole: ThesisRole,
    baseConfidence: number
  ): { role: ThesisRole; confidence: number } {
    const patterns = this.getRoleOverridePatterns(thesisId);

    // Check if this role is frequently overridden
    let overrideCount = 0;
    let preferredRole: ThesisRole | null = null;
    let maxOverrides = 0;

    for (const [pattern, count] of patterns) {
      const [from, to] = pattern.split('->') as [ThesisRole, ThesisRole];
      if (from === suggestedRole) {
        overrideCount += count;
        if (count > maxOverrides) {
          maxOverrides = count;
          preferredRole = to;
        }
      }
    }

    // If frequently overridden (>3 times), reduce confidence
    if (overrideCount >= 3 && preferredRole) {
      return {
        role: preferredRole,
        confidence: Math.min(baseConfidence + 0.1, 0.95),
      };
    }

    // Slight penalty if sometimes overridden
    const penalty = Math.min(overrideCount * 0.05, 0.2);
    return {
      role: suggestedRole,
      confidence: Math.max(baseConfidence - penalty, 0.3),
    };
  }

  /**
   * Get acceptance rate by suggestion type
   */
  getAcceptanceRates(thesisId: string): Record<string, number> {
    const service = getFeedbackService();
    const records = service.exportData().filter(r => r.thesisId === thesisId);

    const byType: Record<string, { accepted: number; total: number }> = {};
    for (const r of records) {
      if (!byType[r.type]) byType[r.type] = { accepted: 0, total: 0 };
      byType[r.type].total++;
      if (r.userAction === 'accepted') byType[r.type].accepted++;
    }

    const rates: Record<string, number> = {};
    for (const [type, stats] of Object.entries(byType)) {
      rates[type] = stats.total > 0 ? stats.accepted / stats.total : 0;
    }
    return rates;
  }
}

// Singleton
let learnerInstance: FeedbackLearner | null = null;
export function getFeedbackLearner(): FeedbackLearner {
  if (!learnerInstance) learnerInstance = new FeedbackLearner();
  return learnerInstance;
}
```

### 12.5 LLM Re-Ranking for Connections (PaperQA2 Pattern)

**Problem**: Connection suggestions ranked only by embedding similarity, misses semantic nuance.

**Solution**: Add LLM re-ranking step after initial candidate selection.

```typescript
// services/ai/prompts/rerank.ts

export const RERANK_SYSTEM_PROMPT = `You are a research expert evaluating potential connections between academic papers.

Given a target paper and candidate connections, re-rank them by:
1. Actual intellectual relationship (not just topic similarity)
2. How useful this connection would be for a literature review
3. Whether the connection type is accurate

Be critical - downrank weak or superficial connections.`;

export function buildRerankPrompt(params: {
  targetPaper: { title: string; takeaway: string };
  candidates: Array<{
    id: string;
    title: string;
    takeaway: string;
    proposedType: string;
    initialScore: number;
  }>;
}): string {
  const candidateList = params.candidates
    .map((c, i) => `${i + 1}. [${c.proposedType}] "${c.title}"
   Takeaway: ${c.takeaway}
   Initial score: ${c.initialScore}`)
    .join('\n\n');

  return `TARGET PAPER:
"${params.targetPaper.title}"
Takeaway: ${params.targetPaper.takeaway}

CANDIDATE CONNECTIONS:
${candidateList}

Re-rank these candidates. For each, provide:
- finalScore: 0-100 (your assessment of connection quality)
- revisedType: The connection type you think is most accurate
- reasoning: Brief explanation

Return JSON array ordered by finalScore descending:
[
  { "id": "...", "finalScore": 85, "revisedType": "extends", "reasoning": "..." }
]`;
}
```

### 12.6 Plan-Based Gap Analysis (LitLLM Pattern)

**Problem**: Gap analysis can hallucinate or miss structure.

**Solution**: Two-step generation - first create plan, then fill sections.

```typescript
// services/ai/prompts/gap.ts - Enhanced

export function buildGapPlanPrompt(params: {
  thesis: { title: string; description: string };
  papers: Array<{ title: string; takeaway: string; thesisRole: string }>;
}): string {
  return `THESIS: "${params.thesis.title}"
${params.thesis.description}

CURRENT COVERAGE (${params.papers.length} papers):
${params.papers.map(p => `- [${p.thesisRole}] ${p.title}`).join('\n')}

Create a PLAN for gap analysis. Identify 3-5 categories of gaps:
1. What evidence types are missing?
2. What methodological approaches are underrepresented?
3. What perspectives or counterarguments need exploration?
4. What time periods or contexts lack coverage?

Return JSON:
{
  "gaps": [
    {
      "category": "Counterarguments",
      "description": "What to look for...",
      "suggestedSearches": ["query 1", "query 2"],
      "priority": "high" | "medium" | "low"
    }
  ]
}`;
}

export function buildGapDetailPrompt(
  gap: { category: string; description: string },
  searchResults: Array<{ title: string; abstract: string }>
): string {
  return `GAP TO FILL: ${gap.category}
${gap.description}

SEARCH RESULTS:
${searchResults.map((r, i) => `${i + 1}. "${r.title}"\n${r.abstract?.slice(0, 300)}...`).join('\n\n')}

Evaluate which of these papers would best fill this gap. Return JSON:
{
  "recommendations": [
    { "index": 1, "relevance": 85, "reasoning": "..." }
  ]
}`;
}
```

### 12.7 Hybrid Search for Discovery

**Problem**: Keyword search misses semantic matches; embedding search misses specific terms.

**Solution**: Combine both and merge results.

```typescript
// services/discovery/hybridSearch.ts

import { searchPapers } from '../api/semanticScholar';
import { searchWorks } from '../api/openAlex';
import { cosineSimilarity, getPaperWithEmbedding } from '../api/semanticScholar';

interface HybridSearchResult {
  paperId: string;
  title: string;
  abstract: string | null;
  keywordScore: number;
  embeddingScore: number;
  combinedScore: number;
  source: 'semantic_scholar' | 'openalex';
}

export async function hybridSearch(params: {
  query: string;
  seedPaperIds?: string[]; // Papers to use for embedding similarity
  limit?: number;
}): Promise<HybridSearchResult[]> {
  const { query, seedPaperIds = [], limit = 20 } = params;

  // Step 1: Keyword search from multiple sources
  const [s2Results, oaResults] = await Promise.all([
    searchPapers(query, { limit: 30 }),
    searchWorks(query, { limit: 30 }),
  ]);

  // Merge and dedupe by DOI
  const candidates = new Map<string, HybridSearchResult>();

  for (const paper of s2Results.papers) {
    const doi = paper.externalIds?.DOI;
    if (doi && !candidates.has(doi)) {
      candidates.set(doi, {
        paperId: paper.paperId,
        title: paper.title,
        abstract: paper.abstract,
        keywordScore: 0.8, // From primary source
        embeddingScore: 0,
        combinedScore: 0,
        source: 'semantic_scholar',
      });
    }
  }

  for (const work of oaResults) {
    if (work.doi && !candidates.has(work.doi)) {
      candidates.set(work.doi, {
        paperId: work.id,
        title: work.title,
        abstract: work.abstract_inverted_index
          ? reconstructAbstract(work.abstract_inverted_index)
          : null,
        keywordScore: 0.6, // From secondary source
        embeddingScore: 0,
        combinedScore: 0,
        source: 'openalex',
      });
    }
  }

  // Step 2: Embedding similarity (if seed papers provided)
  if (seedPaperIds.length > 0) {
    // Get seed embeddings
    const seedEmbeddings: number[][] = [];
    for (const id of seedPaperIds.slice(0, 3)) {
      try {
        const paper = await getPaperWithEmbedding(id);
        if (paper.embedding?.vector) {
          seedEmbeddings.push(paper.embedding.vector);
        }
      } catch (e) {
        console.warn('Failed to get embedding for', id);
      }
    }

    // Score candidates by embedding similarity
    if (seedEmbeddings.length > 0) {
      for (const [doi, candidate] of candidates) {
        if (candidate.source === 'semantic_scholar') {
          try {
            const paper = await getPaperWithEmbedding(candidate.paperId);
            if (paper.embedding?.vector) {
              const similarities = seedEmbeddings.map(seed =>
                cosineSimilarity(seed, paper.embedding!.vector)
              );
              candidate.embeddingScore = Math.max(...similarities);
            }
          } catch (e) {
            // Skip embedding for this candidate
          }
        }
      }
    }
  }

  // Step 3: Combine scores
  for (const candidate of candidates.values()) {
    // Weighted combination: 60% keyword, 40% embedding
    candidate.combinedScore =
      candidate.keywordScore * 0.6 +
      candidate.embeddingScore * 0.4;
  }

  // Step 4: Sort and return
  return Array.from(candidates.values())
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, limit);
}
```

### 12.8 Retraction Checking

**Problem**: Users might add retracted papers without knowing.

**Solution**: Check OpenAlex `is_retracted` field during intake.

```typescript
// services/api/retractionCheck.ts

import { getWorkByDOI } from './openAlex';

export interface RetractionStatus {
  isRetracted: boolean;
  checkedAt: string;
  source: 'openalex' | 'crossref' | 'unknown';
}

export async function checkRetraction(doi: string): Promise<RetractionStatus> {
  try {
    const work = await getWorkByDOI(doi);
    if (work) {
      return {
        isRetracted: work.is_retracted,
        checkedAt: new Date().toISOString(),
        source: 'openalex',
      };
    }
  } catch (e) {
    console.warn('Retraction check failed:', e);
  }

  return {
    isRetracted: false,
    checkedAt: new Date().toISOString(),
    source: 'unknown',
  };
}
```

**UI Integration**: Show warning banner in AddPaperModal if paper is retracted.

### 12.9 Updated File Structure

```
ideagraph/src/services/
├── api/
│   ├── semanticScholar.ts    # Add embedding field
│   ├── openAlex.ts           # NEW: OpenAlex API client
│   └── retractionCheck.ts    # NEW: Retraction checking
├── ai/
│   ├── feedback/
│   │   ├── index.ts          # Existing feedback storage
│   │   └── learner.ts        # NEW: Feedback-driven learning
│   ├── prompts/
│   │   ├── rerank.ts         # NEW: LLM re-ranking prompts
│   │   └── gap.ts            # Enhanced with plan-based approach
│   └── ...
└── discovery/
    ├── index.ts              # Existing discovery service
    └── hybridSearch.ts       # NEW: Hybrid search
```

### 12.10 Implementation Order

**Phase 1 - Foundation (Week 1)**:
1. ✅ Add OpenAlex API client
2. ✅ Add retraction checking
3. ✅ Add SPECTER embedding support to S2 client

**Phase 2 - Intelligence (Week 2)**:
4. ✅ Implement FeedbackLearner
5. ✅ Add hybrid search
6. ✅ Implement plan-based gap analysis

**Phase 3 - Refinement (Week 3)**:
7. ✅ Add LLM re-ranking for connections
8. ✅ UI integration for all features
9. ✅ Testing and optimization

---

*Document Version: 4.0*
*Updated: December 2024*
*For: IdeaGraph Phase 3 Implementation*
