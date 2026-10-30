import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  Plus,
  Upload,
  Download,
  ArrowUpDown,
  Eye,
  Edit2,
  Trash2,
  FlaskConical,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Tag,
  BookOpen,
} from 'lucide-react';
import { Perfume } from '../types';
import { exportPerfumesToCsv } from '../services/export';
import { detectCategoryFromCode } from '../services/pricing';

interface PerfumeDatabaseProps {
  perfumes: Perfume[];
  onSelectPerfumeToMix: (perfume: Perfume) => void;
  onViewPerfumeDetails: (perfume: Perfume) => void;
  onEditPerfume: (perfume: Perfume) => void;
  onDeletePerfume: (id: string) => void;
  onNavigateToAddPerfume: () => void;
  onOpenPdfImport: () => void;
}

type SortField = 'name' | 'code' | 'category' | 'fragrance' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export const PerfumeDatabase: React.FC<PerfumeDatabaseProps> = ({
  perfumes,
  onSelectPerfumeToMix,
  onViewPerfumeDetails,
  onEditPerfume,
  onDeletePerfume,
  onNavigateToAddPerfume,
  onOpenPdfImport,
}) => {
  // Search and filter states
  const [globalSearch, setGlobalSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [fragranceFilter, setFragranceFilter] = useState('ALL');
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Delete confirmation modal state
  const [perfumeToDelete, setPerfumeToDelete] = useState<Perfume | null>(null);

  // Extract unique categories and fragrance families for filter dropdowns
  const categories = useMemo(() => {
    const set = new Set<string>();
    perfumes.forEach((p) => {
      if (p.category) set.add(p.category.trim());
    });
    return Array.from(set).sort();
  }, [perfumes]);

  const fragranceFamilies = useMemo(() => {
    const set = new Set<string>();
    perfumes.forEach((p) => {
      if (p.fragrance) set.add(p.fragrance.trim());
    });
    return Array.from(set).sort();
  }, [perfumes]);

  // Filtering & Sorting
  const filteredPerfumes = useMemo(() => {
    const query = globalSearch.trim().toLowerCase();

    return perfumes
      .filter((p) => {
        // Global search across ALL fields
        if (query) {
          const matchCode = p.code?.toLowerCase().includes(query);
          const matchName = p.name?.toLowerCase().includes(query);
          const matchNotes = p.notes?.toLowerCase().includes(query);
          const matchFragrance = p.fragrance?.toLowerCase().includes(query);
          const matchCategory = p.category?.toLowerCase().includes(query);
          const matchBrand = p.brand?.toLowerCase().includes(query);
          const matchDesc = p.description?.toLowerCase().includes(query);
          const matchAccords = p.accords?.toLowerCase().includes(query);

          if (
            !matchCode &&
            !matchName &&
            !matchNotes &&
            !matchFragrance &&
            !matchCategory &&
            !matchBrand &&
            !matchDesc &&
            !matchAccords
          ) {
            return false;
          }
        }

        // Category filter
        if (categoryFilter !== 'ALL' && p.category?.toLowerCase() !== categoryFilter.toLowerCase()) {
          return false;
        }

        // Fragrance filter
        if (fragranceFilter !== 'ALL' && p.fragrance?.toLowerCase() !== fragranceFilter.toLowerCase()) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA = (a[sortField] || '').toString().toLowerCase();
        let valB = (b[sortField] || '').toString().toLowerCase();

        if (sortField === 'createdAt') {
          valA = a.createdAt;
          valB = b.createdAt;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [perfumes, globalSearch, categoryFilter, fragranceFilter, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredPerfumes.length / pageSize) || 1;
  const paginatedPerfumes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPerfumes.slice(start, start + pageSize);
  }, [filteredPerfumes, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleClearFilters = () => {
    setGlobalSearch('');
    setCategoryFilter('ALL');
    setFragranceFilter('ALL');
    setSortField('code');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  const hasActiveFilters = globalSearch || categoryFilter !== 'ALL' || fragranceFilter !== 'ALL';

  return (
    <div className="space-y-6 p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-luxury text-2xl font-bold text-stone-900 flex items-center gap-2.5">
            Perfume Database
            <span className="text-sm font-sans font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300">
              {filteredPerfumes.length} {filteredPerfumes.length === 1 ? 'Entry' : 'Entries'}
            </span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Search, filter, and inspect formulation notes for every fragrance in your inventory
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            id="db-export-csv-btn"
            onClick={() => exportPerfumesToCsv(filteredPerfumes)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold border border-stone-300 shadow-2xs transition-all"
            title="Export filtered list to CSV"
          >
            <Download className="w-4 h-4 text-stone-500" />
            Export CSV
          </button>

          <button
            id="db-import-pdf-btn"
            onClick={onOpenPdfImport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white font-semibold text-xs transition-all shadow-xs"
          >
            <Upload className="w-4 h-4" />
            Import PDF
          </button>

          <button
            id="db-add-perfume-btn"
            onClick={onNavigateToAddPerfume}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Perfume
          </button>
        </div>
      </div>

      {/* Search & Comprehensive Filtering Card */}
      <div className="rounded-xl bg-white border border-stone-200 p-4 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Global Search Bar (Spans 5 cols) */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="db-global-search-input"
              type="text"
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by code, name, notes, fragrance, brand..."
              className="w-full pl-9 pr-8 py-2.5 rounded-lg bg-stone-50 border border-stone-300 text-stone-900 placeholder-stone-400 text-xs focus:outline-none focus:bg-white focus:border-emerald-600 transition-colors"
            />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter (Spans 3 cols) */}
          <div className="md:col-span-3">
            <select
              id="db-category-filter-select"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 rounded-lg bg-stone-50 border border-stone-300 text-stone-800 text-xs focus:outline-none focus:bg-white focus:border-emerald-600"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Fragrance Family Filter (Spans 3 cols) */}
          <div className="md:col-span-3">
            <select
              id="db-fragrance-filter-select"
              value={fragranceFilter}
              onChange={(e) => {
                setFragranceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 rounded-lg bg-stone-50 border border-stone-300 text-stone-800 text-xs focus:outline-none focus:bg-white focus:border-emerald-600"
            >
              <option value="ALL">All Fragrance Families ({fragranceFamilies.length})</option>
              {fragranceFamilies.map((fam) => (
                <option key={fam} value={fam}>
                  {fam}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters (Spans 1 col) */}
          <div className="md:col-span-1 flex items-center justify-end">
            {hasActiveFilters ? (
              <button
                id="db-clear-filters-btn"
                onClick={handleClearFilters}
                className="w-full py-2.5 px-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-emerald-900 text-xs font-semibold flex items-center justify-center gap-1 border border-stone-300"
                title="Clear all search queries and column filters"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            ) : (
              <button
                disabled
                className="w-full py-2.5 px-2 rounded-lg bg-stone-50 text-stone-400 text-xs flex items-center justify-center gap-1 border border-stone-200 cursor-not-allowed"
              >
                <Filter className="w-3.5 h-3.5" />
                Filter
              </button>
            )}
          </div>
        </div>

        {/* Quick Sorting Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="font-medium">Sort by:</span>
            <button
              onClick={() => handleSort('code')}
              className={`px-2.5 py-1 rounded-md border text-xs font-mono transition-colors ${
                sortField === 'code'
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-950 font-bold'
                  : 'bg-stone-50 border-stone-200 hover:border-stone-300 text-stone-600'
              }`}
            >
              Code {sortField === 'code' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('name')}
              className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${
                sortField === 'name'
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-950 font-bold'
                  : 'bg-stone-50 border-stone-200 hover:border-stone-300 text-stone-600'
              }`}
            >
              Name (A-Z) {sortField === 'name' && (sortOrder === 'asc' ? 'A→Z' : 'Z→A')}
            </button>
            <button
              onClick={() => handleSort('category')}
              className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${
                sortField === 'category'
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-950 font-bold'
                  : 'bg-stone-50 border-stone-200 hover:border-stone-300 text-stone-600'
              }`}
            >
              Category {sortField === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="py-1 px-2 rounded bg-stone-50 border border-stone-300 text-stone-700 text-xs focus:outline-none"
            >
              <option value={10}>10 per page</option>
              <option value={15}>15 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Perfume Table */}
      <div className="rounded-xl bg-white border border-stone-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 uppercase tracking-wider font-mono">
                <th
                  onClick={() => handleSort('code')}
                  className="py-3.5 px-4 font-bold cursor-pointer hover:text-emerald-800 transition-colors w-28"
                >
                  <div className="flex items-center gap-1.5">
                    Code <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3.5 px-4 font-bold cursor-pointer hover:text-emerald-800 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Perfume Name <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 font-bold hidden md:table-cell">Fragrance Family</th>
                <th className="py-3.5 px-4 font-bold hidden sm:table-cell">Category</th>
                <th className="py-3.5 px-4 font-bold hidden lg:table-cell">Olfactory Notes</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {paginatedPerfumes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500">
                    <p className="text-sm font-medium">No perfumes match your search or filter criteria.</p>
                    {hasActiveFilters && (
                      <button
                        onClick={handleClearFilters}
                        className="mt-3 text-xs text-emerald-800 hover:underline font-semibold"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedPerfumes.map((perfume) => (
                  <tr
                    key={perfume.id}
                    className="hover:bg-emerald-50/30 transition-colors group cursor-pointer"
                    onClick={() => onViewPerfumeDetails(perfume)}
                  >
                    {/* Code & Category */}
                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-emerald-950 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 group-hover:border-emerald-400">
                          {perfume.code}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100/80 text-emerald-950 border border-emerald-300">
                          Cat {detectCategoryFromCode(perfume.code)}
                        </span>
                      </div>
                    </td>

                    {/* Name & Brand */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900 group-hover:text-emerald-950 transition-colors text-sm">
                        {perfume.name}
                      </div>
                      {perfume.brand && (
                        <div className="text-[11px] text-stone-500">{perfume.brand}</div>
                      )}
                    </td>

                    {/* Fragrance Family */}
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[11px] border border-stone-200">
                        <Sparkles className="w-3 h-3 text-emerald-700" />
                        {perfume.fragrance || 'General'}
                      </span>
                    </td>

                    {/* Category Badge */}
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          perfume.category?.toLowerCase() === 'men'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : perfume.category?.toLowerCase() === 'women'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : perfume.category?.toLowerCase() === 'unisex'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-stone-100 text-stone-700 border border-stone-200'
                        }`}
                      >
                        {perfume.category || 'Unisex'}
                      </span>
                    </td>

                    {/* Notes Snippet */}
                    <td className="py-3 px-4 hidden lg:table-cell max-w-xs truncate text-stone-600 text-xs">
                      {perfume.notes || <span className="text-stone-400 italic">No notes specified</span>}
                    </td>

                    {/* Action Buttons */}
                    <td
                      className="py-3 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Mix in Calculator Shortcut */}
                        <button
                          id={`mix-perfume-${perfume.id}`}
                          onClick={() => onSelectPerfumeToMix(perfume)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-2xs transition-all"
                          title="Open in Mixing Calculator"
                        >
                          <FlaskConical className="w-3.5 h-3.5" />
                          <span>Mix</span>
                        </button>

                        {/* View Details */}
                        <button
                          onClick={() => onViewPerfumeDetails(perfume)}
                          className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors border border-stone-200"
                          title="View Full Perfume Information"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => onEditPerfume(perfume)}
                          className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-emerald-800 transition-colors border border-stone-200"
                          title="Edit Perfume"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setPerfumeToDelete(perfume)}
                          className="p-1.5 rounded-lg bg-stone-100 hover:bg-rose-50 text-stone-500 hover:text-rose-700 transition-colors border border-stone-200"
                          title="Delete Perfume"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-600">
          <div>
            Showing <span className="font-bold text-stone-900">{filteredPerfumes.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-bold text-stone-900">{Math.min(currentPage * pageSize, filteredPerfumes.length)}</span> of{' '}
            <span className="font-bold text-stone-900">{filteredPerfumes.length}</span> perfumes
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 font-mono font-medium">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {perfumeToDelete && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPerfumeToDelete(null)}
        >
          <div
            className="w-full max-w-md bg-white border border-stone-200 rounded-2xl p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-stone-900">Delete Perfume Entry?</h3>
              <p className="text-xs text-stone-600">
                Are you sure you want to remove <span className="font-bold text-stone-900">{perfumeToDelete.name}</span> (
                <span className="font-mono font-bold text-emerald-800">{perfumeToDelete.code}</span>) from your database?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPerfumeToDelete(null)}
                className="px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeletePerfume(perfumeToDelete.id);
                  setPerfumeToDelete(null);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
