import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Download,
  Trash2,
  FlaskConical,
  Eye,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUpDown,
  Filter,
  X,
  FileText,
} from 'lucide-react';
import { MixingFormula, SalesMan } from '../types';
import { exportHistoryToCsv, exportFormulaToPdf } from '../services/export';
import { User, Users } from 'lucide-react';

interface MixingHistoryProps {
  history: MixingFormula[];
  salesmen?: SalesMan[];
  onRepeatFormula: (formula: MixingFormula) => void;
  onDeleteFormula: (id: string) => void;
  onClearHistory: () => void;
  onNavigateToCalculator: () => void;
}

export const MixingHistory: React.FC<MixingHistoryProps> = ({
  history,
  salesmen = [],
  onRepeatFormula,
  onDeleteFormula,
  onClearHistory,
  onNavigateToCalculator,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [bottleSizeFilter, setBottleSizeFilter] = useState('ALL');
  const [salesManFilter, setSalesManFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modals
  const [selectedFormulaForDetail, setSelectedFormulaForDetail] = useState<MixingFormula | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  // Available bottle sizes in history for filter
  const uniqueBottleSizes = useMemo(() => {
    const set = new Set<number>();
    history.forEach((h) => set.add(h.bottleSize));
    return Array.from(set).sort((a, b) => a - b);
  }, [history]);

  // Unique Sales Men for filter
  const uniqueSalesMen = useMemo(() => {
    const map = new Map<string, string>();
    history.forEach((h) => {
      const id = h.salesManId || 'unassigned';
      const name = h.salesManName || 'Unknown / Not Assigned';
      map.set(id, name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [history]);

  // Filtering & Sorting
  const filteredHistory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return history
      .filter((item) => {
        if (q) {
          const matchName = item.perfumeName?.toLowerCase().includes(q);
          const matchCode = item.perfumeCode?.toLowerCase().includes(q);
          const matchCustomer = item.customerName?.toLowerCase().includes(q);
          const matchBatch = item.batchNumber?.toLowerCase().includes(q);
          const matchSalesMan = item.salesManName?.toLowerCase().includes(q);
          if (!matchName && !matchCode && !matchCustomer && !matchBatch && !matchSalesMan) return false;
        }

        if (bottleSizeFilter !== 'ALL' && item.bottleSize.toString() !== bottleSizeFilter) {
          return false;
        }

        if (salesManFilter !== 'ALL') {
          if (salesManFilter === 'unassigned') {
            if (item.salesManId) return false;
          } else if (item.salesManId !== salesManFilter) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [history, searchQuery, bottleSizeFilter, salesManFilter, sortOrder]);

  const totalPages = Math.ceil(filteredHistory.length / pageSize) || 1;
  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredHistory.slice(start, start + pageSize);
  }, [filteredHistory, currentPage, pageSize]);

  return (
    <div className="space-y-6 p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-luxury text-2xl font-bold text-stone-900 flex items-center gap-2.5">
            Kprime Mixing History & Formulation Archive
            <span className="text-sm font-sans font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-200">
              {filteredHistory.length} {filteredHistory.length === 1 ? 'Batch' : 'Batches'}
            </span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Review past compounding batches, reload recipes into calculator, and export dispensing records. Permanently saved.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            id="history-export-csv-btn"
            onClick={() => exportHistoryToCsv(filteredHistory)}
            disabled={filteredHistory.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold border border-stone-300 shadow-2xs transition-all disabled:opacity-40"
          >
            <Download className="w-4 h-4 text-stone-500" />
            Export CSV
          </button>

          {history.length > 0 && (
            <button
              id="history-clear-all-btn"
              onClick={() => setConfirmClearAll(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-700 text-xs border border-stone-300 transition-colors font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear History
            </button>
          )}

          <button
            id="history-open-calculator-btn"
            onClick={onNavigateToCalculator}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all"
          >
            <FlaskConical className="w-4 h-4" />
            New Calculation
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-xl bg-white border border-stone-200 p-4 space-y-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="history-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search history by perfume, salesman, code, customer..."
              className="w-full pl-9 pr-8 py-2.5 rounded-lg bg-stone-50 border border-stone-300 text-stone-900 placeholder-stone-400 text-xs focus:outline-none focus:bg-white focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sales Man Filter */}
          <div className="sm:col-span-3">
            <select
              value={salesManFilter}
              onChange={(e) => {
                setSalesManFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 rounded-lg bg-stone-50 border border-stone-300 text-stone-800 text-xs font-semibold focus:outline-none focus:bg-white focus:border-emerald-500"
            >
              <option value="ALL">All Sales Men ({uniqueSalesMen.length})</option>
              {uniqueSalesMen.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bottle Size Filter */}
          <div className="sm:col-span-2">
            <select
              value={bottleSizeFilter}
              onChange={(e) => {
                setBottleSizeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 rounded-lg bg-stone-50 border border-stone-300 text-stone-800 text-xs focus:outline-none focus:bg-white focus:border-emerald-500"
            >
              <option value="ALL">All Bottles ({uniqueBottleSizes.length})</option>
              {uniqueBottleSizes.map((size) => (
                <option key={size} value={size.toString()}>
                  {size} ml
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div className="sm:col-span-2">
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="w-full py-2.5 px-3 rounded-lg bg-stone-50 border border-stone-300 text-stone-700 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-stone-100"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-700" />
              {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl bg-white border border-stone-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 uppercase tracking-wider font-mono">
                <th className="py-3.5 px-4 font-bold">Date & Time</th>
                <th className="py-3.5 px-4 font-bold">Sales Man</th>
                <th className="py-3.5 px-4 font-bold">Perfume / Blend</th>
                <th className="py-3.5 px-4 font-bold">Bottle / Ratio</th>
                <th className="py-3.5 px-4 font-bold">Selling Price</th>
                <th className="py-3.5 px-4 font-bold">Oil (ml & g)</th>
                <th className="py-3.5 px-4 font-bold">Alcohol (ml & g)</th>
                <th className="py-3.5 px-4 font-bold hidden lg:table-cell">Batch / Client</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {paginatedHistory.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-stone-500">
                    <History className="w-8 h-8 mx-auto text-stone-400 mb-2" />
                    <p className="text-sm font-medium">No mixing history found.</p>
                    <p className="text-xs text-stone-500 mt-1">
                      Calculations you save from the Mixing Calculator are permanently stored here.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedHistory.map((item) => {
                  const d = new Date(item.createdAt);
                  const numOils = item.numberOfOils || (item.oils ? item.oils.length : (item.mode === 'dual' ? 2 : 1));
                  return (
                    <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors group">
                      {/* Date & Time */}
                      <td className="py-3 px-4 whitespace-nowrap text-stone-500 font-mono text-[11px]">
                        <div className="text-stone-900 font-bold">{d.toLocaleDateString()}</div>
                        <div className="text-[10px] text-stone-400">{d.toLocaleTimeString()}</div>
                      </td>

                      {/* Sales Man */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">
                            {item.salesManName ? item.salesManName.slice(0, 2).toUpperCase() : 'NA'}
                          </div>
                          <span className="font-bold text-stone-900 text-xs">
                            {item.salesManName || 'Unknown / Not Assigned'}
                          </span>
                        </div>
                      </td>

                      {/* Perfume Code & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          {numOils > 1 ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-950 border border-emerald-300 uppercase tracking-wider">
                              {numOils} Oils Blend
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-stone-100 text-stone-800 border border-stone-300 uppercase tracking-wider">
                              Single Oil
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-stone-900 group-hover:text-emerald-950 text-sm">
                          {item.perfumeName}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] font-bold text-emerald-800">
                            {item.perfumeCode}
                          </span>
                          {(item.highestCategory || item.priceCategory) && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-950 border border-emerald-300">
                              Cat {item.highestCategory || item.priceCategory}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Bottle Size & Concentration */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded bg-stone-100 text-stone-800 font-mono font-bold text-xs border border-stone-200">
                          {item.bottleSize} ml
                        </span>
                        {item.bottleType && (
                          <div className="text-[10px] text-stone-500 font-medium truncate max-w-[120px]">
                            {item.bottleType}
                          </div>
                        )}
                        <div className="text-[11px] font-bold text-emerald-800 mt-0.5">
                          {item.concentration}% Oil
                        </div>
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono">
                        {item.price !== undefined ? (
                          <div className="inline-flex items-baseline gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-950 font-black text-sm shadow-2xs">
                            <span>{item.price}</span>
                            <span className="text-[10px] font-normal text-emerald-800">DH</span>
                          </div>
                        ) : (
                          <span className="text-stone-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Oil ml & grams */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono">
                        <div className="font-bold text-emerald-950">{item.oilGrams.toFixed(2)} g</div>
                        <div className="text-[11px] text-stone-500">{item.oilMl.toFixed(2)} ml</div>
                      </td>

                      {/* Alcohol ml & grams */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono">
                        <div className="font-bold text-teal-900">{item.alcoholGrams.toFixed(2)} g</div>
                        <div className="text-[11px] text-stone-500">{item.alcoholMl.toFixed(2)} ml</div>
                      </td>

                      {/* Batch / Client (Optional column) */}
                      <td className="py-3 px-4 hidden lg:table-cell text-xs text-stone-600">
                        {item.customerName && <div className="text-stone-900 font-semibold">{item.customerName}</div>}
                        {item.batchNumber && (
                          <div className="font-mono text-[10px] text-stone-500">{item.batchNumber}</div>
                        )}
                        {!item.customerName && !item.batchNumber && <span className="text-stone-400">-</span>}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* REPEAT FORMULA */}
                          <button
                            id={`repeat-formula-${item.id}`}
                            onClick={() => onRepeatFormula(item)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-2xs transition-all"
                            title="Open in calculator with these parameters"
                          >
                            <FlaskConical className="w-3.5 h-3.5" />
                            <span>Repeat Formula</span>
                          </button>

                          {/* View Details */}
                          <button
                            onClick={() => setSelectedFormulaForDetail(item)}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors border border-stone-200"
                            title="View Formula Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => onDeleteFormula(item.id)}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-rose-50 text-stone-500 hover:text-rose-700 transition-colors border border-stone-200"
                            title="Delete this history record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
          <div>
            Showing <span className="font-bold text-stone-900">{filteredHistory.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-bold text-stone-900">{Math.min(currentPage * pageSize, filteredHistory.length)}</span> of <span className="font-bold text-stone-900">{filteredHistory.length}</span> records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono font-medium">
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

      {/* Formula Detail Modal */}
      {selectedFormulaForDetail && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedFormulaForDetail(null)}
        >
          <div
            className="w-full max-w-lg bg-white border border-stone-200 rounded-3xl p-6 space-y-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-stone-200 pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-mono text-emerald-800 font-bold">
                  Kprime Formulation Record
                </span>
                <h3 className="font-serif-luxury text-xl font-bold text-stone-900 mt-1">
                  {selectedFormulaForDetail.perfumeName}
                </h3>
                <div className="font-mono text-xs text-stone-500 font-medium">
                  {selectedFormulaForDetail.perfumeCode} • {new Date(selectedFormulaForDetail.createdAt).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => setSelectedFormulaForDetail(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selling Price Callout if present */}
            {selectedFormulaForDetail.price !== undefined && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-900 text-white flex items-center justify-between shadow-md">
                <div>
                  <div className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
                    Kprime Selling Price
                  </div>
                  <div className="text-2xl font-bold font-mono">
                    {selectedFormulaForDetail.price} <span className="text-sm font-normal text-emerald-300">DH</span>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold text-emerald-200">
                    Category: {selectedFormulaForDetail.highestCategory || selectedFormulaForDetail.priceCategory || 'A'}
                  </div>
                  {selectedFormulaForDetail.bottleType && (
                    <div className="text-[11px] text-emerald-300">
                      {selectedFormulaForDetail.bottleType}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quantities Card */}
            {(selectedFormulaForDetail.oils && selectedFormulaForDetail.oils.length > 1) ||
            (selectedFormulaForDetail.mode === 'dual' && selectedFormulaForDetail.oil1 && selectedFormulaForDetail.oil2) ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(selectedFormulaForDetail.oils && selectedFormulaForDetail.oils.length > 0
                    ? selectedFormulaForDetail.oils
                    : [selectedFormulaForDetail.oil1!, selectedFormulaForDetail.oil2!]
                  ).map((oilItem, idx) => {
                    const cardBg =
                      idx === 0
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        : idx === 1
                        ? 'bg-teal-50 border-teal-200 text-teal-950'
                        : idx === 2
                        ? 'bg-stone-50 border-stone-200 text-stone-900'
                        : 'bg-emerald-100/50 border-emerald-300 text-emerald-950';

                    return (
                      <div key={idx} className={`p-3 rounded-xl border space-y-1 ${cardBg}`}>
                        <span className="text-[10px] uppercase font-bold tracking-wider flex items-center justify-between">
                          <span>Oil {idx + 1} ({oilItem.allocationPercent}%)</span>
                          <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-white/80 border border-stone-200">
                            Cat {oilItem.category || 'A'}
                          </span>
                        </span>
                        <div className="text-sm font-bold truncate">
                          {oilItem.perfumeName}
                        </div>
                        <div className="text-base font-mono font-black">
                          {oilItem.oilGrams.toFixed(2)} g
                        </div>
                        <div className="text-[10px] opacity-75 font-mono">
                          {oilItem.oilMl.toFixed(2)} ml
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider">
                      Perfumers Alcohol (Ethanol)
                    </span>
                    <div className="text-xs text-stone-600 font-mono">
                      {selectedFormulaForDetail.alcoholMl.toFixed(2)} ml ({100 - selectedFormulaForDetail.concentration}% of bottle)
                    </div>
                  </div>
                  <div className="text-xl font-mono font-bold text-teal-950">
                    {selectedFormulaForDetail.alcoholGrams.toFixed(2)} g
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                    Perfume Oil
                  </span>
                  <div className="text-2xl font-mono font-bold text-emerald-950">
                    {selectedFormulaForDetail.oilGrams.toFixed(2)} g
                  </div>
                  <div className="text-xs text-stone-600 font-mono">
                    {selectedFormulaForDetail.oilMl.toFixed(2)} ml ({selectedFormulaForDetail.concentration}%)
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider">
                    Alcohol
                  </span>
                  <div className="text-2xl font-mono font-bold text-teal-950">
                    {selectedFormulaForDetail.alcoholGrams.toFixed(2)} g
                  </div>
                  <div className="text-xs text-stone-600 font-mono">
                    {selectedFormulaForDetail.alcoholMl.toFixed(2)} ml ({100 - selectedFormulaForDetail.concentration}%)
                  </div>
                </div>
              </div>
            )}

            {/* Batch & Sales Man Info */}
            <div className="rounded-xl bg-stone-50 p-4 space-y-2 text-xs font-mono text-stone-700 border border-stone-200">
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Sales Man / Formulator:</span>
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  {selectedFormulaForDetail.salesManName || 'Unknown / Not Assigned'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Bottle Size:</span>
                <span className="font-bold text-stone-900">{selectedFormulaForDetail.bottleSize} ml</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Oil Density:</span>
                <span>{selectedFormulaForDetail.oilDensity} g/ml</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Alcohol Density:</span>
                <span>{selectedFormulaForDetail.alcoholDensity} g/ml</span>
              </div>
              {selectedFormulaForDetail.customerName && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Customer:</span>
                  <span className="text-stone-900 font-semibold">{selectedFormulaForDetail.customerName}</span>
                </div>
              )}
              {selectedFormulaForDetail.batchNumber && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Batch Ref:</span>
                  <span className="font-mono">{selectedFormulaForDetail.batchNumber}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  onRepeatFormula(selectedFormulaForDetail);
                  setSelectedFormulaForDetail(null);
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all"
              >
                <FlaskConical className="w-4 h-4" />
                Repeat This Formula in Calculator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {confirmClearAll && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setConfirmClearAll(false)}
        >
          <div
            className="w-full max-w-md bg-white border border-stone-200 rounded-2xl p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">Clear All Mixing History?</h3>
              <p className="text-xs text-stone-600 mt-1">
                This will delete all saved formulas from the persistent archive. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmClearAll(false)}
                className="px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearHistory();
                  setConfirmClearAll(false);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm"
              >
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
