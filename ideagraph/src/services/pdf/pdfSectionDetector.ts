// PDF Section Detection Service
// Detects common academic paper sections using heuristics

import type { ExtractedPage } from './pdfTextExtractor';

export type SectionType =
  | 'abstract'
  | 'introduction'
  | 'background'
  | 'methods'
  | 'results'
  | 'discussion'
  | 'conclusion'
  | 'references'
  | 'acknowledgments'
  | 'supplementary'
  | 'unknown';

export interface DetectedSection {
  type: SectionType;
  title: string;
  content: string;
  startPage: number;
  endPage: number;
  startIndex: number;
  endIndex: number;
  confidence: number;
}

export interface SectionDetectionResult {
  sections: DetectedSection[];
  hasAbstract: boolean;
  hasMethods: boolean;
  hasResults: boolean;
  hasConclusion: boolean;
}

// Section heading patterns (case-insensitive)
const SECTION_PATTERNS: Record<SectionType, RegExp[]> = {
  abstract: [
    /^abstract\s*$/i,
    /^summary\s*$/i,
  ],
  introduction: [
    /^1\.?\s*introduction\s*$/i,
    /^introduction\s*$/i,
    /^i\.?\s*introduction\s*$/i,
    /^1\.\s*background\s+and\s+introduction\s*$/i,
  ],
  background: [
    /^2?\.?\s*background\s*$/i,
    /^related\s+work\s*$/i,
    /^literature\s+review\s*$/i,
    /^theoretical\s+framework\s*$/i,
  ],
  methods: [
    /^\d?\.?\s*methods?\s*$/i,
    /^\d?\.?\s*methodology\s*$/i,
    /^\d?\.?\s*materials?\s+and\s+methods?\s*$/i,
    /^\d?\.?\s*experimental\s+(methods?|procedures?|design)\s*$/i,
    /^\d?\.?\s*study\s+design\s*$/i,
    /^ii\.?\s*methods?\s*$/i,
  ],
  results: [
    /^\d?\.?\s*results?\s*$/i,
    /^\d?\.?\s*findings?\s*$/i,
    /^\d?\.?\s*results?\s+and\s+discussion\s*$/i,
    /^iii\.?\s*results?\s*$/i,
  ],
  discussion: [
    /^\d?\.?\s*discussion\s*$/i,
    /^\d?\.?\s*analysis\s*$/i,
    /^iv\.?\s*discussion\s*$/i,
  ],
  conclusion: [
    /^\d?\.?\s*conclusions?\s*$/i,
    /^\d?\.?\s*concluding\s+remarks?\s*$/i,
    /^\d?\.?\s*summary\s+and\s+conclusions?\s*$/i,
    /^\d?\.?\s*final\s+remarks?\s*$/i,
    /^v\.?\s*conclusions?\s*$/i,
  ],
  references: [
    /^references?\s*$/i,
    /^bibliography\s*$/i,
    /^works?\s+cited\s*$/i,
    /^literature\s+cited\s*$/i,
  ],
  acknowledgments: [
    /^acknowledgm?ents?\s*$/i,
    /^funding\s*$/i,
  ],
  supplementary: [
    /^suppl(ementary|emental)\s*(materials?|information|data)?\s*$/i,
    /^appendix\s*$/i,
    /^supporting\s+information\s*$/i,
  ],
  unknown: [],
};

// Keywords that indicate section content (for confidence scoring)
const SECTION_KEYWORDS: Record<SectionType, string[]> = {
  abstract: ['objective', 'purpose', 'aim', 'we investigated', 'this study', 'findings suggest'],
  introduction: ['background', 'previous studies', 'it is known', 'the purpose of this'],
  background: ['prior work', 'previous research', 'literature', 'framework'],
  methods: ['participants', 'subjects', 'procedure', 'protocol', 'analysis', 'statistical', 'experiment', 'sample size'],
  results: ['found', 'observed', 'showed', 'significantly', 'p <', 'p =', 'figure', 'table'],
  discussion: ['our findings', 'these results', 'consistent with', 'in contrast', 'limitation'],
  conclusion: ['in conclusion', 'we conclude', 'future research', 'implications'],
  references: [],
  acknowledgments: ['thank', 'funded by', 'grant', 'support'],
  supplementary: ['additional', 'supplementary'],
  unknown: [],
};

/**
 * Find potential section headings in text
 */
function findSectionHeadings(
  fullText: string,
  pages: ExtractedPage[]
): Array<{ type: SectionType; title: string; index: number; page: number; confidence: number }> {
  const headings: Array<{ type: SectionType; title: string; index: number; page: number; confidence: number }> = [];

  // Split into lines for analysis
  const lines = fullText.split('\n');
  let charIndex = 0;
  let currentPage = 1;

  // Calculate page boundaries
  const pageBoundaries: number[] = [0];
  for (const page of pages) {
    pageBoundaries.push(pageBoundaries[pageBoundaries.length - 1] + page.text.length + 2); // +2 for \n\n
  }

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Update current page
    while (currentPage < pages.length && charIndex >= pageBoundaries[currentPage]) {
      currentPage++;
    }

    // Skip empty lines or very long lines (unlikely to be headings)
    if (trimmedLine.length === 0 || trimmedLine.length > 100) {
      charIndex += line.length + 1;
      continue;
    }

    // Check against section patterns
    for (const [sectionType, patterns] of Object.entries(SECTION_PATTERNS)) {
      if (sectionType === 'unknown') continue;

      for (const pattern of patterns) {
        if (pattern.test(trimmedLine)) {
          headings.push({
            type: sectionType as SectionType,
            title: trimmedLine,
            index: charIndex,
            page: currentPage,
            confidence: 0.9, // High confidence for pattern match
          });
          break;
        }
      }
    }

    charIndex += line.length + 1;
  }

  return headings;
}

/**
 * Detect abstract section (often before first heading)
 */
function detectAbstract(fullText: string, pages: ExtractedPage[]): DetectedSection | null {
  // Look for explicit "Abstract" heading
  const abstractMatch = fullText.match(/\babstract\b/i);

  if (abstractMatch) {
    const startIndex = abstractMatch.index || 0;

    // Find end of abstract (next section or double newline after ~500 chars)
    let endIndex = fullText.indexOf('\n\n', startIndex + 100);
    if (endIndex === -1 || endIndex - startIndex > 3000) {
      endIndex = Math.min(startIndex + 2000, fullText.length);
    }

    // Look for next section heading
    const afterAbstract = fullText.slice(startIndex + 8);
    const nextSectionMatch = afterAbstract.match(/\n\s*(1\.?\s*)?introduction\b/i);
    if (nextSectionMatch && nextSectionMatch.index) {
      endIndex = startIndex + 8 + nextSectionMatch.index;
    }

    const content = fullText.slice(startIndex, endIndex).replace(/^abstract\s*/i, '').trim();

    // Determine page range
    let startPage = 1;
    let endPage = 1;
    let charCount = 0;
    for (let i = 0; i < pages.length; i++) {
      if (charCount <= startIndex && charCount + pages[i].text.length > startIndex) {
        startPage = i + 1;
      }
      if (charCount <= endIndex && charCount + pages[i].text.length > endIndex) {
        endPage = i + 1;
        break;
      }
      charCount += pages[i].text.length + 2;
    }

    return {
      type: 'abstract',
      title: 'Abstract',
      content,
      startPage,
      endPage,
      startIndex,
      endIndex,
      confidence: 0.95,
    };
  }

  return null;
}

/**
 * Calculate confidence score for a section based on content keywords
 */
function calculateSectionConfidence(content: string, type: SectionType): number {
  const keywords = SECTION_KEYWORDS[type];
  if (!keywords || keywords.length === 0) return 0.5;

  let matches = 0;
  const lowerContent = content.toLowerCase();

  for (const keyword of keywords) {
    if (lowerContent.includes(keyword.toLowerCase())) {
      matches++;
    }
  }

  // Base confidence on keyword matches
  const keywordConfidence = Math.min(0.3, matches * 0.1);
  return 0.6 + keywordConfidence; // 0.6 to 0.9 range
}

/**
 * Detect sections in a PDF document
 */
export function detectSections(
  fullText: string,
  pages: ExtractedPage[]
): SectionDetectionResult {
  const sections: DetectedSection[] = [];

  // Try to detect abstract first
  const abstract = detectAbstract(fullText, pages);
  if (abstract) {
    sections.push(abstract);
  }

  // Find section headings
  const headings = findSectionHeadings(fullText, pages);

  // Convert headings to sections with content
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const nextHeading = headings[i + 1];

    const startIndex = heading.index;
    const endIndex = nextHeading ? nextHeading.index : fullText.length;

    // Extract content (skip the heading line itself)
    const headingEndIndex = fullText.indexOf('\n', startIndex);
    const content = fullText.slice(
      headingEndIndex !== -1 ? headingEndIndex + 1 : startIndex,
      endIndex
    ).trim();

    // Calculate page range
    let startPage = heading.page;
    let endPage = heading.page;
    let charCount = 0;
    for (let p = 0; p < pages.length; p++) {
      if (charCount <= endIndex && charCount + pages[p].text.length > endIndex) {
        endPage = p + 1;
        break;
      }
      charCount += pages[p].text.length + 2;
    }

    const confidence = calculateSectionConfidence(content, heading.type);

    sections.push({
      type: heading.type,
      title: heading.title,
      content,
      startPage,
      endPage,
      startIndex,
      endIndex,
      confidence,
    });
  }

  // Sort sections by start index
  sections.sort((a, b) => a.startIndex - b.startIndex);

  return {
    sections,
    hasAbstract: sections.some(s => s.type === 'abstract'),
    hasMethods: sections.some(s => s.type === 'methods'),
    hasResults: sections.some(s => s.type === 'results'),
    hasConclusion: sections.some(s => s.type === 'conclusion'),
  };
}

/**
 * Get section by type
 */
export function getSectionByType(
  result: SectionDetectionResult,
  type: SectionType
): DetectedSection | null {
  return result.sections.find(s => s.type === type) || null;
}

/**
 * Get multiple sections by type
 */
export function getSectionsByTypes(
  result: SectionDetectionResult,
  types: SectionType[]
): DetectedSection[] {
  return result.sections.filter(s => types.includes(s.type));
}

/**
 * Get combined content from multiple section types
 */
export function getCombinedSectionContent(
  result: SectionDetectionResult,
  types: SectionType[],
  maxLength?: number
): string {
  const sections = getSectionsByTypes(result, types);
  let content = sections.map(s => s.content).join('\n\n');

  if (maxLength && content.length > maxLength) {
    content = content.slice(0, maxLength) + '...';
  }

  return content;
}
