import { useState, useRef, useEffect } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import type { Thesis, ThesisRole, ReadingStatus, ScreeningDecision } from '../../types';

interface FilterDropdownProps {
  theses: Thesis[];
  filterThesis: string | 'all';
  filterRole: ThesisRole | 'all';
  filterStatus: ReadingStatus | 'all';
  filterScreening: ScreeningDecision | 'all';
  onFilterChange: (filters: {
    thesis: string | 'all';
    role: ThesisRole | 'all';
    status: ReadingStatus | 'all';
    screening: ScreeningDecision | 'all';
  }) => void;
  onClear: () => void;
}

const ROLE_OPTIONS: { value: ThesisRole | 'all'; label: string }[] = [
  { value: 'all', label: 'All Roles' },
  { value: 'supports', label: 'Supports' },
  { value: 'contradicts', label: 'Contradicts' },
  { value: 'method', label: 'Method' },
  { value: 'background', label: 'Background' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS: { value: ReadingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'screening', label: 'Screening' },
  { value: 'to-read', label: 'To Read' },
  { value: 'reading', label: 'Reading' },
  { value: 'read', label: 'Read' },
  { value: 'to-revisit', label: 'To Revisit' },
];

const SCREENING_OPTIONS: { value: ScreeningDecision | 'all'; label: string }[] = [
  { value: 'all', label: 'All Decisions' },
  { value: 'pending', label: 'Pending' },
  { value: 'include', label: 'Include' },
  { value: 'exclude', label: 'Exclude' },
  { value: 'maybe', label: 'Maybe' },
];

export function FilterDropdown({
  theses,
  filterThesis,
  filterRole,
  filterStatus,
  filterScreening,
  onFilterChange,
  onClear,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Count active filters
  const activeCount = [filterThesis, filterRole, filterStatus, filterScreening]
    .filter((f) => f !== 'all').length;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (
    key: 'thesis' | 'role' | 'status' | 'screening',
    value: string
  ) => {
    onFilterChange({
      thesis: key === 'thesis' ? value : filterThesis,
      role: key === 'role' ? (value as ThesisRole | 'all') : filterRole,
      status: key === 'status' ? (value as ReadingStatus | 'all') : filterStatus,
      screening: key === 'screening' ? (value as ScreeningDecision | 'all') : filterScreening,
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
          activeCount > 0
            ? 'bg-stone-800 text-white border-stone-800 hover:bg-stone-700'
            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
        }`}
      >
        <Filter size={16} />
        <span className="text-sm font-medium">Filters</span>
        {activeCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-stone-800 text-xs font-bold">
            {activeCount}
          </span>
        )}
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-stone-200 py-3 z-50">
          {/* Header */}
          <div className="px-4 pb-3 mb-2 border-b border-stone-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-stone-700">Filter Papers</span>
            {activeCount > 0 && (
              <button
                onClick={() => {
                  onClear();
                }}
                className="text-xs text-stone-500 hover:text-stone-700 flex items-center gap-1"
              >
                <X size={12} />
                Clear all
              </button>
            )}
          </div>

          {/* Thesis Filter */}
          <div className="px-4 mb-3">
            <label className="block text-xs font-medium text-stone-500 mb-1.5">
              Thesis
            </label>
            <select
              value={filterThesis}
              onChange={(e) => handleChange('thesis', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-stone-300"
            >
              <option value="all">All Theses</option>
              {theses.filter(t => !t.isArchived).map((thesis) => (
                <option key={thesis.id} value={thesis.id}>
                  {thesis.title.length > 30 ? thesis.title.slice(0, 30) + '...' : thesis.title}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div className="px-4 mb-3">
            <label className="block text-xs font-medium text-stone-500 mb-1.5">
              Thesis Role
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleChange('role', option.value)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    filterRole === option.value
                      ? 'bg-stone-800 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="px-4 mb-3">
            <label className="block text-xs font-medium text-stone-500 mb-1.5">
              Reading Status
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleChange('status', option.value)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    filterStatus === option.value
                      ? 'bg-stone-800 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Screening Filter */}
          <div className="px-4">
            <label className="block text-xs font-medium text-stone-500 mb-1.5">
              Screening Decision
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SCREENING_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleChange('screening', option.value)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    filterScreening === option.value
                      ? 'bg-stone-800 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
