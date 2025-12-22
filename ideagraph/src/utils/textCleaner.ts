/**
 * Text cleaning utilities for handling XML markup and other formatting issues
 * from external APIs like Semantic Scholar, CrossRef, etc.
 */

/**
 * Strip JATS XML tags from text (commonly found in abstracts from Semantic Scholar)
 * Examples: <jats:p>, <jats:sup>, <jats:italic>, etc.
 */
export function stripJatsXml(text: string | null | undefined): string {
  if (!text) return '';

  return text
    // Remove all JATS XML tags (e.g., <jats:p>, </jats:p>, <jats:sup>, etc.)
    .replace(/<\/?jats:[^>]+>/gi, '')
    // Also handle other common XML namespaced tags
    .replace(/<\/?mml:[^>]+>/gi, '') // MathML tags
    .replace(/<\/?xlink:[^>]+>/gi, '') // XLink tags
    // Handle generic XML-like tags that might slip through
    .replace(/<\/?[a-z]+:[^>]+>/gi, '')
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Clean abstract text for display - strips XML and normalizes whitespace
 */
export function cleanAbstract(text: string | null | undefined): string {
  return stripJatsXml(text);
}
