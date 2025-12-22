# AI UI Integration Strategy

## Overview

This document outlines how to integrate the new Phase 3 AI services into the IdeaGraph UI.

## New Services to Integrate

| Service | File | Integration Point |
|---------|------|-------------------|
| SPECTER Embeddings | `services/api/semanticScholar.ts` | Discovery, Similarity |
| OpenAlex API | `services/api/openAlex.ts` | Retraction, Enrichment |
| Feedback Learning | `services/ai/feedback/learner.ts` | All AI suggestions |
| LLM Re-ranking | `services/ai/reranking/index.ts` | Discovery, Connections |
| Plan-based Gap Analysis | `services/ai/gap/planBased.ts` | Gap Analysis panel |
| Hybrid Search | `services/discovery/hybridSearch.ts` | Paper Search |
| Retraction Checking | `services/intake/retractionCheck.ts` | Paper Intake |

---

## 1. Paper Intake (AddPaperModal.tsx)

### Current State
- Fetches paper by DOI from Semantic Scholar
- Shows AI analysis (role, takeaway, relevance)
- Inline suggestions with accept/edit

### Enhancements

#### 1.1 Retraction Warning
**Location**: After DOI fetch, before review step

```tsx
// Add retraction check after metadata fetch
const retractionResult = await checkIntakePaper({ doi, title });
if (retractionResult.isRetracted) {
  // Show prominent warning banner
}
```

**UI Component**: `RetractionWarningBanner`
- Red warning banner with icon
- Clear message about retraction
- "Add Anyway" vs "Cancel" options
- Link to retraction notice if available

#### 1.2 OpenAlex Enrichment
**Location**: Paper metadata display

- Show citation count from OpenAlex
- Display open access status with link
- Show top concepts/topics as tags
- Fallback if S2 data is incomplete

#### 1.3 Feedback-Adjusted Suggestions
**Location**: Role and takeaway suggestions

```tsx
// Get adjusted confidence from feedback learner
const adjustedConfidence = feedbackLearner.adjustRoleConfidence(
  thesisId,
  suggestedRole,
  baseConfidence
);

// Check if role should be reconsidered
const alternativeRole = feedbackLearner.shouldReconsiderRole(thesisId, suggestedRole);
```

**UI Changes**:
- Show "(adjusted)" badge if confidence was modified by feedback
- Show "You often change this to X" hint if pattern exists
- Track user corrections on save

---

## 2. Paper Search (PaperSearchModal.tsx)

### Current State
- Keyword search via Semantic Scholar
- Advanced filters (year, citations, type)
- Batch selection and import

### Enhancements

#### 2.1 Hybrid Search Toggle
**Location**: Search options area

```tsx
<Toggle
  label="Semantic search"
  description="Use AI embeddings to find conceptually similar papers"
  enabled={useHybridSearch}
  onChange={setUseHybridSearch}
/>
```

**Behavior**:
- When enabled, use `HybridSearchService.search()`
- Show combined score breakdown (keyword vs embedding)
- Indicate source of each result (keyword/embedding/both)

#### 2.2 Seed Paper Selection
**Location**: Above search input

```tsx
<SeedPaperSelector
  papers={collectionPapers}
  selected={seedPapers}
  onSelect={setSeedPapers}
  maxSeeds={5}
/>
```

- Allow selecting papers from collection as "seeds"
- Used for embedding-based similarity
- Shows "Find similar to these papers" label

#### 2.3 Result Annotations
**Location**: Each search result card

- Badge showing "keyword match" vs "similar content"
- Similarity score for embedding matches
- Already-in-collection indicator (existing)

---

## 3. Gap Analysis (GapAnalysis.tsx)

### Current State
- Manual gap creation
- Basic auto-detection
- Gap type/priority filtering

### Enhancements

#### 3.1 Plan-Based Analysis
**Location**: Replace current auto-detect

```tsx
// Use plan-based analyzer
const { plan, gaps } = await planBasedAnalyzer.analyze({
  thesis,
  papers,
  connections,
  onProgress: setProgress
});
```

**UI Flow**:
1. Click "Analyze Gaps"
2. Show two-step progress:
   - "Analyzing collection..." (Step 1: Plan)
   - "Verifying gaps..." (Step 2: Verify)
3. Display verified gaps with citations

#### 3.2 Analysis Plan Display
**Location**: Expandable section above gaps

```tsx
<AnalysisPlanCard plan={plan}>
  <ObservationList observations={plan.observations} />
  <ProposedGapList gaps={plan.proposedGaps} verified={verifiedGapIds} />
</AnalysisPlanCard>
```

- Shows what the AI "saw" in the collection
- Links observations to specific papers
- Highlights which proposed gaps passed verification

#### 3.3 Citation Grounding
**Location**: Each gap card

- List papers that support this gap finding
- Clickable links to view those papers
- Shows specific evidence excerpts

---

## 4. Connection Suggestions

### Current State
- Toast notifications for auto-detected connections
- ConnectionEditor for manual creation

### Enhancements

#### 4.1 LLM Re-ranking
**Location**: Before showing suggestions

```tsx
// Re-rank connection candidates
const reranked = await rerankingService.rerankConnections({
  thesis,
  candidates: rawConnections,
  papers,
  maxResults: 5
});
```

**UI Changes**:
- Show adjusted score with "(verified)" badge
- Display rank change indicator (↑2, ↓1)
- Show LLM's reasoning for score

#### 4.2 Quick Validation
**Location**: Suggestion card action

```tsx
// Validate before showing
const validation = await rerankingService.validateConnection({
  thesis,
  fromPaper,
  toPaper,
  suggestedType,
  initialReasoning
});

if (!validation.isValid) {
  // Don't show or mark as low-confidence
}
```

---

## 5. Discovery Panel (DiscoveryPanel.tsx)

### Current State
- Shows similar papers for selected paper
- Quick-add functionality

### Enhancements

#### 5.1 Embedding Similarity
**Location**: Similarity calculation

```tsx
// Use SPECTER embeddings for better similarity
const targetEmbedding = await getPaperWithEmbedding(paper.semanticScholarId);
const similar = findSimilarByEmbedding(targetEmbedding.embedding.vector, candidates);
```

#### 5.2 Similarity Visualization
**Location**: Discovery panel header

```tsx
<SimilarityMethodToggle
  method={similarityMethod} // 'citations' | 'embeddings' | 'hybrid'
  onChange={setSimilarityMethod}
/>
```

- Toggle between citation-based and embedding-based similarity
- Show similarity scores as percentage

---

## 6. Settings (AISettings.tsx)

### Current State
- API key configuration
- Feature toggles
- Privacy controls

### Enhancements

#### 6.1 New Feature Toggles
**Location**: Features section

```tsx
<FeatureToggle
  label="Retraction checking"
  description="Check papers for retraction status during intake"
  enabled={settings.retractionChecking}
  onChange={...}
/>

<FeatureToggle
  label="Semantic search"
  description="Use AI embeddings for discovery (uses more API calls)"
  enabled={settings.semanticSearch}
  onChange={...}
/>

<FeatureToggle
  label="Feedback learning"
  description="Learn from your corrections to improve suggestions"
  enabled={settings.feedbackLearning}
  onChange={...}
/>

<FeatureToggle
  label="Plan-based gap analysis"
  description="Use two-step verification for more accurate gap detection"
  enabled={settings.planBasedGaps}
  onChange={...}
/>
```

#### 6.2 Learning Dashboard
**Location**: New expandable section

```tsx
<LearningDashboard>
  <AcceptanceRates feedbackSummary={summary} />
  <RoleTransitionPatterns transitions={preferences.roleTransitions} />
  <TakeawayStyleInfo style={preferences.takeawayStyle} />
  <Button onClick={clearLearning}>Reset Learning</Button>
</LearningDashboard>
```

#### 6.3 Cache Management
**Location**: Data management section

```tsx
<CacheStats>
  <CacheStat label="Similarity cache" stats={similarityCacheStats} onClear={...} />
  <CacheStat label="Embedding cache" stats={embeddingCacheStats} onClear={...} />
  <CacheStat label="Retraction cache" stats={retractionCacheStats} onClear={...} />
</CacheStats>
```

---

## 7. Workflow Indicators

### 7.1 Feedback Learning Badge
**Location**: AI suggestion components

When user has established patterns:
```tsx
<Badge variant="info">
  Personalized
</Badge>
```

### 7.2 Verification Status
**Location**: Gap and connection suggestions

```tsx
<VerificationBadge status={verified ? 'verified' : 'unverified'} />
```

---

## Implementation Priority

### Phase 1: Core Safety Features
1. Retraction checking in AddPaperModal
2. Basic OpenAlex enrichment

### Phase 2: Discovery Enhancements
3. Hybrid search toggle
4. Embedding similarity in Discovery

### Phase 3: Quality Improvements
5. LLM re-ranking for connections
6. Plan-based gap analysis
7. Feedback learning indicators

### Phase 4: Settings & Polish
8. New feature toggles
9. Cache management UI
10. Learning dashboard

---

## Component Files to Create/Modify

### New Components
- `components/paper/RetractionWarningBanner.tsx`
- `components/paper/SeedPaperSelector.tsx`
- `components/synthesis/AnalysisPlanCard.tsx`
- `components/settings/LearningDashboard.tsx`
- `components/settings/CacheStats.tsx`

### Modified Components
- `components/paper/AddPaperModal.tsx` - Retraction check, enrichment
- `components/paper/PaperSearchModal.tsx` - Hybrid search
- `components/paper/InlineAISuggestion.tsx` - Feedback badges
- `components/synthesis/GapAnalysis.tsx` - Plan-based analysis
- `components/settings/AISettings.tsx` - New toggles
- `components/visualization/DiscoveryPanel.tsx` - Embedding similarity

---

## Types Updates

### AISettings Type
```typescript
interface AISettings {
  // Existing...

  // New toggles
  retractionChecking: boolean;
  semanticSearch: boolean;
  feedbackLearning: boolean;
  planBasedGaps: boolean;
  llmReranking: boolean;
}
```

### Paper Type
```typescript
interface Paper {
  // Existing...

  // New fields
  isRetracted?: boolean;
  retractionCheckedAt?: string;
  openAlexId?: string;
  concepts?: string[];
}
```
