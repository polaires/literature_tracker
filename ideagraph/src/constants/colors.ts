import type { ThesisRole, ConnectionType, AnnotationColor } from '../types';

/**
 * Soft Design System Colors
 * Inspired by Linear's muted palette and Notion's warm neutrals
 * All colors are softer and more muted for a calm, professional aesthetic
 */

// Thesis Role Colors - softer, more muted versions
export const THESIS_ROLE_COLORS: Record<ThesisRole, {
  hex: string;
  glow: string;
  bg: string;
  text: string;
  label: string;
}> = {
  supports: {
    hex: '#34d399',  // Softer emerald
    glow: 'rgba(52, 211, 153, 0.2)',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    label: 'Supports',
  },
  contradicts: {
    hex: '#fb7185',  // Softer rose
    glow: 'rgba(251, 113, 133, 0.2)',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-600 dark:text-rose-400',
    label: 'Contradicts',
  },
  method: {
    hex: '#60a5fa',  // Softer blue
    glow: 'rgba(96, 165, 250, 0.2)',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
    label: 'Method',
  },
  background: {
    hex: '#94a3b8',  // Muted slate
    glow: 'rgba(148, 163, 184, 0.2)',
    bg: 'bg-slate-100/80 dark:bg-slate-800/40',
    text: 'text-slate-600 dark:text-slate-400',
    label: 'Background',
  },
  other: {
    hex: '#a78bfa',  // Soft violet
    glow: 'rgba(167, 139, 250, 0.2)',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    text: 'text-violet-600 dark:text-violet-400',
    label: 'Other',
  },
};

// Connection Type Colors - softer, more muted versions
export const CONNECTION_TYPE_COLORS: Record<ConnectionType, {
  hex: string;
  style: 'solid' | 'dashed' | 'dotted';
  bg: string;
  text: string;
  label: string;
  description: string;
}> = {
  supports: {
    hex: '#34d399',
    style: 'solid',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    label: 'Supports',
    description: 'provides evidence for',
  },
  contradicts: {
    hex: '#fb7185',
    style: 'dashed',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-600 dark:text-rose-400',
    label: 'Contradicts',
    description: 'disagrees with',
  },
  extends: {
    hex: '#fbbf24',  // Softer amber
    style: 'solid',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
    label: 'Extends',
    description: 'builds upon',
  },
  critiques: {
    hex: '#fb923c',  // Softer orange
    style: 'dashed',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    text: 'text-orange-600 dark:text-orange-400',
    label: 'Critiques',
    description: 'critically analyzes',
  },
  reviews: {
    hex: '#a78bfa',  // Soft violet
    style: 'solid',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    text: 'text-violet-600 dark:text-violet-400',
    label: 'Reviews',
    description: 'reviews',
  },
  'uses-method': {
    hex: '#22d3ee',  // Softer cyan
    style: 'dotted',
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    text: 'text-cyan-600 dark:text-cyan-400',
    label: 'Uses Method',
    description: 'uses methodology from',
  },
  'same-topic': {
    hex: '#94a3b8',  // Muted slate
    style: 'dotted',
    bg: 'bg-slate-100/80 dark:bg-slate-800/40',
    text: 'text-slate-600 dark:text-slate-400',
    label: 'Same Topic',
    description: 'relates to same topic as',
  },
  replicates: {
    hex: '#4ade80',  // Softer green
    style: 'solid',
    bg: 'bg-green-50 dark:bg-green-950/40',
    text: 'text-green-600 dark:text-green-400',
    label: 'Replicates',
    description: 'replicates',
  },
};

// Annotation Colors for PDF highlighting - softer tones
export const ANNOTATION_COLORS: Record<AnnotationColor, {
  hex: string;
  bg: string;
  text: string;
  label: string;
  description: string;
}> = {
  yellow: {
    hex: '#fef08a',  // Softer yellow
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    label: 'Yellow',
    description: 'General highlight',
  },
  red: {
    hex: '#fecaca',  // Softer red
    bg: 'bg-red-100',
    text: 'text-red-700',
    label: 'Red',
    description: 'Important / Contradicting',
  },
  green: {
    hex: '#bbf7d0',  // Softer green
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: 'Green',
    description: 'Supporting / Agree',
  },
  blue: {
    hex: '#bfdbfe',  // Softer blue
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    label: 'Blue',
    description: 'Method / Technical',
  },
  purple: {
    hex: '#ddd6fe',  // Softer purple
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    label: 'Purple',
    description: 'Question / Unclear',
  },
  orange: {
    hex: '#fed7aa',  // Softer orange
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    label: 'Orange',
    description: 'Review Later',
  },
};

// Reading Status Colors - softer, badge-like appearance
export const READING_STATUS_COLORS = {
  screening: {
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    text: 'text-violet-600 dark:text-violet-400',
    label: 'Screening',
  },
  'to-read': {
    bg: 'bg-stone-100 dark:bg-stone-800/40',
    text: 'text-stone-600 dark:text-stone-400',
    label: 'To Read',
  },
  reading: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
    label: 'Reading',
  },
  read: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    label: 'Read',
  },
  'to-revisit': {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
    label: 'To Revisit',
  },
};

// Argument Strength Colors - softer, more neutral presentation
export const ARGUMENT_STRENGTH_COLORS = {
  strong: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800/50',
    label: 'Strong',
    icon: 'CircleDot',
  },
  moderate: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800/50',
    label: 'Moderate',
    icon: 'Circle',
  },
  weak: {
    bg: 'bg-stone-100 dark:bg-stone-800/30',
    text: 'text-stone-500 dark:text-stone-400',
    border: 'border-stone-200 dark:border-stone-700/50',
    label: 'Weak',
    icon: 'CircleDashed',
  },
};

// Argument Assessment Colors - softer, user-friendly appearance
export const ARGUMENT_ASSESSMENT_COLORS = {
  agree: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800/50',
    label: 'Agree',
    icon: 'ThumbsUp',
  },
  disagree: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    text: 'text-rose-500 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800/50',
    label: 'Disagree',
    icon: 'ThumbsDown',
  },
  uncertain: {
    bg: 'bg-stone-100 dark:bg-stone-800/30',
    text: 'text-stone-500 dark:text-stone-400',
    border: 'border-stone-200 dark:border-stone-700/50',
    label: 'Uncertain',
    icon: 'HelpCircle',
  },
};
