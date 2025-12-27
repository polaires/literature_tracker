import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUp, ChevronDown, Tag } from 'lucide-react';
import type { Paper, Thesis, ThesisRole, ReadingStatus } from '../../types';
import { THESIS_ROLE_COLORS, READING_STATUS_COLORS } from '../../constants/colors';
import { useAppStore } from '../../store/useAppStore';

type SortField = 'title' | 'year' | 'addedAt' | 'citationCount' | 'thesisRole' | 'readingStatus';

interface PapersTableProps {
  papers: Paper[];
  theses: Thesis[];
  onPaperClick?: (paperId: string, thesisId: string) => void;
}

export function PapersTable({ papers, theses, onPaperClick }: PapersTableProps) {
  const navigate = useNavigate();
  const setActiveThesis = useAppStore((s) => s.setActiveThesis);

  const [sortField, setSortField] = useState<SortField>('addedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Create thesis lookup map
  const thesisMap = useMemo(() => {
    const map = new Map<string, Thesis>();
    theses.forEach((t) => map.set(t.id, t));
    return map;
  }, [theses]);

  // Sort papers
  const sortedPapers = useMemo(() => {
    const sorted = [...papers].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'year':
          comparison = (a.year || 0) - (b.year || 0);
          break;
        case 'addedAt':
          comparison = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
          break;
        case 'citationCount':
          comparison = (a.citationCount || 0) - (b.citationCount || 0);
          break;
        case 'thesisRole':
          comparison = a.thesisRole.localeCompare(b.thesisRole);
          break;
        case 'readingStatus':
          comparison = a.readingStatus.localeCompare(b.readingStatus);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [papers, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleRowClick = (paper: Paper) => {
    if (onPaperClick) {
      onPaperClick(paper.id, paper.thesisId);
    } else {
      setActiveThesis(paper.thesisId);
      navigate(`/thesis/${paper.thesisId}?paper=${paper.id}`);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp size={14} className="text-stone-600" />
    ) : (
      <ChevronDown size={14} className="text-stone-600" />
    );
  };

  const formatAuthors = (authors: { name: string }[]) => {
    if (authors.length === 0) return 'Unknown';
    if (authors.length === 1) return authors[0].name;
    return `${authors[0].name} et al.`;
  };

  if (papers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
        <p className="text-stone-500">No papers found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200">
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider cursor-pointer hover:bg-stone-100 transition-colors"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-1">
                  Title
                  <SortIcon field="title" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider w-32">
                Authors
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider cursor-pointer hover:bg-stone-100 transition-colors w-20"
                onClick={() => handleSort('year')}
              >
                <div className="flex items-center gap-1">
                  Year
                  <SortIcon field="year" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider w-40">
                Thesis
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider cursor-pointer hover:bg-stone-100 transition-colors w-28"
                onClick={() => handleSort('thesisRole')}
              >
                <div className="flex items-center gap-1">
                  Role
                  <SortIcon field="thesisRole" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider cursor-pointer hover:bg-stone-100 transition-colors w-28"
                onClick={() => handleSort('readingStatus')}
              >
                <div className="flex items-center gap-1">
                  Status
                  <SortIcon field="readingStatus" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider w-32">
                Tags
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-semibold text-stone-600 uppercase tracking-wider cursor-pointer hover:bg-stone-100 transition-colors w-20"
                onClick={() => handleSort('citationCount')}
              >
                <div className="flex items-center justify-end gap-1">
                  Cit.
                  <SortIcon field="citationCount" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {sortedPapers.map((paper) => {
              const thesis = thesisMap.get(paper.thesisId);
              const roleColors = THESIS_ROLE_COLORS[paper.thesisRole as ThesisRole];
              const statusColors = READING_STATUS_COLORS[paper.readingStatus as ReadingStatus];

              return (
                <tr
                  key={paper.id}
                  className="hover:bg-stone-50 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(paper)}
                >
                  <td className="px-4 py-3">
                    <div className="max-w-md">
                      <p className="text-sm font-medium text-stone-800 line-clamp-2">
                        {paper.title}
                      </p>
                      {paper.takeaway && (
                        <p className="text-xs text-stone-500 mt-1 line-clamp-1">
                          {paper.takeaway}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-stone-600 truncate block max-w-[120px]">
                      {formatAuthors(paper.authors)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-stone-600">
                      {paper.year || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-stone-600 truncate block max-w-[150px]" title={thesis?.title}>
                      {thesis?.title || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${roleColors?.bg || 'bg-stone-100'} ${roleColors?.text || 'text-stone-600'}`}>
                      {roleColors?.label || paper.thesisRole}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors?.bg || 'bg-stone-100'} ${statusColors?.text || 'text-stone-600'}`}>
                      {statusColors?.label || paper.readingStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[120px]">
                      {paper.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded text-xs"
                        >
                          <Tag size={10} />
                          {tag}
                        </span>
                      ))}
                      {paper.tags.length > 2 && (
                        <span className="text-xs text-stone-400">
                          +{paper.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-stone-600">
                      {paper.citationCount?.toLocaleString() || '—'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer with count */}
      <div className="px-4 py-3 bg-stone-50 border-t border-stone-200">
        <p className="text-xs text-stone-500">
          Showing {papers.length} paper{papers.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
