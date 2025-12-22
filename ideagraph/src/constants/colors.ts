import type { ThesisRole, ConnectionType, AnnotationColor } from '../types';

// Thesis Role Colors - consistent across all components
export const THESIS_ROLE_COLORS: Record<ThesisRole, {
  hex: string;
  glow: string;
  bg: string;
  text: string;
  label: string;
}> = {
  supports: {
    hex: '#10b981',
    glow: 'rgba(16, 185, 129, 0.4)',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    label: 'Supports',
  },
  contradicts: {
    hex: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.4)',
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    text: 'text-rose-700 dark:text-rose-300',
    label: 'Contradicts',
  },
  method: {
    hex: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.4)',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    label: 'Method',
  },
  background: {
    hex: '#64748b',
    glow: 'rgba(100, 116, 139, 0.4)',
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    text: 'text-slate-700 dark:text-slate-300',
    label: 'Background',
  },
  other: {
    hex: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.4)',
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    text: 'text-violet-700 dark:text-violet-300',
    label: 'Other',
  },
};

// Connection Type Colors - consistent across all components
export const CONNECTION_TYPE_COLORS: Record<ConnectionType, {
  hex: string;
  style: 'solid' | 'dashed' | 'dotted';
  bg: string;
  text: string;
  label: string;
  description: string;
}> = {
  supports: {
    hex: '#10b981',
    style: 'solid',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    label: 'Supports',
    description: 'provides evidence for',
  },
  contradicts: {
    hex: '#f43f5e',
    style: 'dashed',
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    text: 'text-rose-700 dark:text-rose-300',
    label: 'Contradicts',
    description: 'disagrees with',
  },
  extends: {
    hex: '#f59e0b',
    style: 'solid',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    label: 'Extends',
    description: 'builds upon',
  },
  critiques: {
    hex: '#f97316',
    style: 'dashed',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    label: 'Critiques',
    description: 'critically analyzes',
  },
  reviews: {
    hex: '#8b5cf6',
    style: 'solid',
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    text: 'text-violet-700 dark:text-violet-300',
    label: 'Reviews',
    description: 'reviews',
  },
  'uses-method': {
    hex: '#06b6d4',
    style: 'dotted',
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    text: 'text-cyan-700 dark:text-cyan-300',
    label: 'Uses Method',
    description: 'uses methodology from',
  },
  'same-topic': {
    hex: '#94a3b8',
    style: 'dotted',
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    text: 'text-slate-700 dark:text-slate-300',
    label: 'Same Topic',
    description: 'relates to same topic as',
  },
  replicates: {
    hex: '#22c55e',
    style: 'solid',
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    label: 'Replicates',
    description: 'replicates',
  },
};

// Annotation Colors for PDF highlighting
export const ANNOTATION_COLORS: Record<AnnotationColor, {
  hex: string;
  bg: string;
  text: string;
  label: string;
  description: string;
}> = {
  yellow: {
    hex: '#FFEB3B',
    bg: 'bg-yellow-200',
    text: 'text-yellow-800',
    label: 'Yellow',
    description: 'General highlight',
  },
  red: {
    hex: '#EF5350',
    bg: 'bg-red-200',
    text: 'text-red-800',
    label: 'Red',
    description: 'Important / Contradicting',
  },
  green: {
    hex: '#66BB6A',
    bg: 'bg-green-200',
    text: 'text-green-800',
    label: 'Green',
    description: 'Supporting / Agree',
  },
  blue: {
    hex: '#42A5F5',
    bg: 'bg-blue-200',
    text: 'text-blue-800',
    label: 'Blue',
    description: 'Method / Technical',
  },
  purple: {
    hex: '#AB47BC',
    bg: 'bg-purple-200',
    text: 'text-purple-800',
    label: 'Purple',
    description: 'Question / Unclear',
  },
  orange: {
    hex: '#FFA726',
    bg: 'bg-orange-200',
    text: 'text-orange-800',
    label: 'Orange',
    description: 'Review Later',
  },
};

// Reading Status Colors
export const READING_STATUS_COLORS = {
  screening: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    label: 'Screening',
  },
  'to-read': {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-700 dark:text-gray-300',
    label: 'To Read',
  },
  reading: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    label: 'Reading',
  },
  read: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    label: 'Read',
  },
  'to-revisit': {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    label: 'To Revisit',
  },
};

// Argument Strength Colors
export const ARGUMENT_STRENGTH_COLORS = {
  strong: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    label: 'Strong',
  },
  moderate: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
    label: 'Moderate',
  },
  weak: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    label: 'Weak',
  },
};
