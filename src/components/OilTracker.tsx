import React, { useState, useEffect, useMemo } from 'react';
import {
  Droplets,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PlusCircle,
  Search,
  Filter,
  Calendar,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  FlaskConical,
  X,
  Layers,
  ChevronRight,
  ChevronDown,
  BarChart3,
  Check,
} from 'lucide-react';
import { OilRecord, OilRecordType, AppSettings, Perfume } from '../types';
import { fetchOilRecords, addOilRecord, deleteOilRecord } from '../services/oilService';

interface OilTrackerProps {
  settings: AppSettings;
  perfumes?: Perfume[];
}

type PeriodFilter = 'daily' | 'monthly' | 'custom' | 'all';
type SourceFilter = 'all' | 'auto' | 'manual';

export const OilTracker: React.FC<OilTrackerProps> = ({ settings, perfumes = [] }) => {
  // Data state
  const [records, setRecords] = useState<OilRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | OilRecordType>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('monthly');
  const [selectedPerfumeFilter, setSelectedPerfumeFilter] = useState<string | null>(null);
  const [showPerfumeBreakdown, setShowPerfumeBreakdown] = useState(true);

  // Date selectors
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Form states (Fallback manual entry)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<{
    date: string;
    oil_name: string;
    type: OilRecordType;
    quantity: string;
    amount: string;
    unit: 'ml' | 'g';
    notes: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    oil_name: '',
    type: 'consumption',
    quantity: '',
    amount: '',
    unit: 'g',
    notes: '',
  });

  // Delete confirmation modal state
  const [recordToDelete, setRecordToDelete] = useState<OilRecord | null>(null);

  const currencySymbol = settings.currencySymbol || '$';

  // Load records on mount & listen to background updates (e.g. from Mixing Calculator)
  useEffect(() => {
    loadRecords();

    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setRecords(e.detail);
      }
    };
    window.addEventListener('kprime_oil_records_updated', handleUpdate);
    return () => window.removeEventListener('kprime_oil_records_updated', handleUpdate);
  }, []);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const data = await fetchOilRecords();
      setRecords(data);
    } catch (err) {
      console.error('Failed to load oil records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: extract YYYY-MM-DD from any date representation (ISO timestamp or date string)
  const getRecordDate = (r: OilRecord): string => {
    const raw = r.date || r.created_at || '';
    if (!raw) return '';
    return raw.includes('T') ? raw.split('T')[0] : raw;
  };

  // Helper: check if a record was automatically logged by the Mixing Calculator
  const isAutoLogged = (r: OilRecord): boolean => {
    const text = (r.notes || '').toLowerCase();
    return (
      text.includes('auto-logged') ||
      text.includes('mixing calculator') ||
      text.includes('batch:') ||
      text.includes('blend')
    );
  };

  // Popular oil suggestions for manual input
  const oilSuggestions = useMemo(() => {
    const names = new Set<string>();
    const defaults = [
      'Bergamot Reggio Calabria',
      'Oud Cambodi Pure Extract',
      'French Lavender Grasse',
      'Rose Damascena Absolu',
      'Virginian Cedarwood',
      'Ambroxan Crystal Dilution',
      'Italian Mandarine Essence',
      'Mysore Sandalwood Oil',
      'Patchouli Indonesia',
      'Pink Pepper CO2',
      'Vanilla Bourbon Madagascar',
      'Vetiver Haiti',
      'Neroli Tunisia',
      'Jasmine Sambac',
      'Cardamom Guatemala',
    ];
    defaults.forEach((d) => names.add(d));
    perfumes.forEach((p) => {
      if (p.name) names.add(p.name);
      if (p.oilLabel) names.add(p.oilLabel);
    });
    return Array.from(names).slice(0, 30);
  }, [perfumes]);

  // Filtered records for the Data Table
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // 1. Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = r.oil_name.toLowerCase().includes(q);
        const matchesNotes = r.notes ? r.notes.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesNotes) return false;
      }

      // 2. Type filter
      if (typeFilter !== 'all' && r.type !== typeFilter) {
        return false;
      }

      // 3. Source filter (Auto-logged vs Manual)
      const auto = isAutoLogged(r);
      if (sourceFilter === 'auto' && !auto) return false;
      if (sourceFilter === 'manual' && auto) return false;

      // 4. Selected perfume filter from breakdown card
      if (selectedPerfumeFilter && r.oil_name !== selectedPerfumeFilter) {
        return false;
      }

      // 5. Date / Period filter (normalized for ISO timestamps)
      const recordDate = getRecordDate(r);

      if (periodFilter === 'daily') {
        return recordDate === selectedDate;
      }
      if (periodFilter === 'monthly') {
        return recordDate.startsWith(selectedMonth);
      }
      if (periodFilter === 'custom') {
        if (!recordDate) return true;
        if (customStartDate && recordDate < customStartDate) return false;
        if (customEndDate && recordDate > customEndDate) return false;
        return true;
      }
      return true; // 'all'
    });
  }, [
    records,
    searchQuery,
    typeFilter,
    sourceFilter,
    selectedPerfumeFilter,
    periodFilter,
    selectedDate,
    selectedMonth,
    customStartDate,
    customEndDate,
  ]);

  // Daily Metrics
  const dailyMetrics = useMemo(() => {
    const dailyRecords = records.filter((r) => getRecordDate(r) === selectedDate);
    let consumptionGrams = 0;
    let incomeAmount = 0;
    let consumptionAmount = 0;
    let autoCount = 0;

    dailyRecords.forEach((r) => {
      if (isAutoLogged(r)) autoCount += 1;
      if (r.type === 'consumption') {
        consumptionGrams += Number(r.quantity) || 0;
        consumptionAmount += Number(r.amount) || 0;
      } else if (r.type === 'income') {
        incomeAmount += Number(r.amount) || 0;
      }
    });

    return {
      consumptionGrams,
      incomeAmount,
      consumptionAmount,
      netBalance: incomeAmount - consumptionAmount,
      count: dailyRecords.length,
      autoCount,
    };
  }, [records, selectedDate]);

  // Monthly Metrics
  const monthlyMetrics = useMemo(() => {
    const monthRecords = records.filter((r) => getRecordDate(r).startsWith(selectedMonth));
    let consumptionGrams = 0;
    let incomeAmount = 0;
    let consumptionAmount = 0;
    let autoCount = 0;

    monthRecords.forEach((r) => {
      if (isAutoLogged(r)) autoCount += 1;
      if (r.type === 'consumption') {
        consumptionGrams += Number(r.quantity) || 0;
        consumptionAmount += Number(r.amount) || 0;
      } else if (r.type === 'income') {
        incomeAmount += Number(r.amount) || 0;
      }
    });

    return {
      consumptionGrams,
      incomeAmount,
      consumptionAmount,
      netBalance: incomeAmount - consumptionAmount,
      count: monthRecords.length,
      autoCount,
    };
  }, [records, selectedMonth]);

  // Active Period Metrics
  const activePeriodMetrics = useMemo(() => {
    let consumptionGrams = 0;
    let incomeAmount = 0;
    let consumptionAmount = 0;
    let autoCount = 0;

    filteredRecords.forEach((r) => {
      if (isAutoLogged(r)) autoCount += 1;
      if (r.type === 'consumption') {
        consumptionGrams += Number(r.quantity) || 0;
        consumptionAmount += Number(r.amount) || 0;
      } else if (r.type === 'income') {
        incomeAmount += Number(r.amount) || 0;
      }
    });

    return {
      consumptionGrams,
      incomeAmount,
      consumptionAmount,
      netBalance: incomeAmount - consumptionAmount,
      count: filteredRecords.length,
      autoCount,
    };
  }, [filteredRecords]);

  // Aggregated breakdown: Total consumed grams per perfume/oil in current period window
  const consumptionByPerfume = useMemo(() => {
    const map = new Map<
      string,
      {
        oil_name: string;
        totalGrams: number;
        batchCount: number;
        autoLoggedCount: number;
        manualCount: number;
        lastDate: string;
      }
    >();

    const periodRecords = records.filter((r) => {
      if (r.type !== 'consumption') return false;
      const recordDate = getRecordDate(r);
      if (periodFilter === 'daily') return recordDate === selectedDate;
      if (periodFilter === 'monthly') return recordDate.startsWith(selectedMonth);
      if (periodFilter === 'custom') {
        if (!recordDate) return true;
        if (customStartDate && recordDate < customStartDate) return false;
        if (customEndDate && recordDate > customEndDate) return false;
        return true;
      }
      return true;
    });

    periodRecords.forEach((r) => {
      const name = r.oil_name.trim();
      const existing = map.get(name) || {
        oil_name: name,
        totalGrams: 0,
        batchCount: 0,
        autoLoggedCount: 0,
        manualCount: 0,
        lastDate: r.date,
      };

      existing.totalGrams += Number(r.quantity) || 0;
      existing.batchCount += 1;
      if (isAutoLogged(r)) existing.autoLoggedCount += 1;
      else existing.manualCount += 1;

      if (r.date && (!existing.lastDate || r.date > existing.lastDate)) {
        existing.lastDate = r.date;
      }
      map.set(name, existing);
    });

    const items = Array.from(map.values()).sort((a, b) => b.totalGrams - a.totalGrams);
    const totalGramsAll = items.reduce((sum, item) => sum + item.totalGrams, 0);

    return {
      items,
      totalGrams: totalGramsAll,
      perfumeCount: items.length,
    };
  }, [records, periodFilter, selectedDate, selectedMonth, customStartDate, customEndDate]);

  // Handle Form Submit for Manual Entries
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.oil_name.trim()) {
      setFeedback({ type: 'error', message: 'Please specify an oil name.' });
      return;
    }
    const qty = parseFloat(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid quantity greater than 0.' });
      return;
    }
    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt < 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid monetary amount (0 or more).' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const added = await addOilRecord({
        date: formData.date,
        oil_name: formData.oil_name.trim(),
        type: formData.type,
        quantity: qty,
        amount: amt,
        unit: formData.unit,
        notes: formData.notes.trim() || 'Manual Atelier Entry',
      });

      setRecords((prev) => [added, ...prev.filter((r) => r.id !== added.id)]);
      setFeedback({
        type: 'success',
        message: `Saved ${formData.type} record for "${formData.oil_name}" (${qty} ${formData.unit})`,
      });

      setFormData({
        date: new Date().toISOString().split('T')[0],
        oil_name: '',
        type: 'consumption',
        quantity: '',
        amount: '',
        unit: 'g',
        notes: '',
      });
      setIsFormOpen(false);

      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to save record' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      await deleteOilRecord(recordToDelete.id);
      setRecords((prev) => prev.filter((r) => r.id !== recordToDelete.id));
      setRecordToDelete(null);
      setFeedback({ type: 'success', message: 'Record removed from oil_records table.' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to delete record.' });
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (filteredRecords.length === 0) return;
    const headers = ['ID', 'Date', 'Oil Name', 'Type', 'Quantity', 'Unit', 'Amount', 'Currency', 'Source', 'Notes'];
    const rows = filteredRecords.map((r) => [
      r.id,
      r.date,
      `"${(r.oil_name || '').replace(/"/g, '""')}"`,
      r.type,
      r.quantity,
      r.unit || 'g',
      r.amount,
      currencySymbol,
      isAutoLogged(r) ? 'Calculator Auto-Logged' : 'Manual Entry',
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kprime_oil_records_${periodFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-0.5 shadow-md shadow-emerald-800/20 flex items-center justify-center">
              <div className="w-full h-full bg-emerald-950 rounded-[10px] flex items-center justify-center">
                <Droplets className="w-4 h-4 text-emerald-300" />
              </div>
            </div>
            <div>
              <h1 className="font-serif-luxury text-2xl font-bold text-stone-900 tracking-wide flex items-center gap-2">
                Essential Oil Tracker
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  D1 Auto-Sync Active
                </span>
              </h1>
              <p className="text-xs text-stone-500">
                Automated consumption logging from Mixing Calculator & daily/monthly income analytics
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadRecords()}
            className="p-2 text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl shadow-xs transition-colors"
            title="Refresh database"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            onClick={handleExportCsv}
            disabled={filteredRecords.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl shadow-xs transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4 text-stone-500" />
            <span className="hidden xs:inline">Export</span> CSV
          </button>

          <button
            id="toggle-add-oil-record-btn"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 rounded-xl shadow-md shadow-emerald-900/20 transition-all group"
          >
            <PlusCircle className="w-4 h-4 transition-transform group-hover:rotate-90" />
            <span>{isFormOpen ? 'Close Form' : 'Manual Entry'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-stone-400 hover:text-stone-600 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Period Selection Controls */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Period Tabs */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl self-start">
            <button
              onClick={() => {
                setPeriodFilter('daily');
                setSelectedPerfumeFilter(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                periodFilter === 'daily'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Daily View
            </button>
            <button
              onClick={() => {
                setPeriodFilter('monthly');
                setSelectedPerfumeFilter(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                periodFilter === 'monthly'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Monthly View
            </button>
            <button
              onClick={() => {
                setPeriodFilter('custom');
                setSelectedPerfumeFilter(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                periodFilter === 'custom'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Custom Date
            </button>
            <button
              onClick={() => {
                setPeriodFilter('all');
                setSelectedPerfumeFilter(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                periodFilter === 'all'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Records
            </button>
          </div>

          {/* Date Picker Specific to Active View */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {periodFilter === 'daily' && (
              <div className="flex items-center gap-2">
                <span className="text-stone-500 font-medium">Select Day:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 text-xs font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg border border-emerald-200 transition-colors"
                >
                  Today
                </button>
              </div>
            )}

            {periodFilter === 'monthly' && (
              <div className="flex items-center gap-2">
                <span className="text-stone-500 font-medium">Select Month:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 text-xs font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
                <button
                  onClick={() => {
                    const d = new Date();
                    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                  }}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg border border-emerald-200 transition-colors"
                >
                  Current Month
                </button>
              </div>
            )}

            {periodFilter === 'custom' && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-stone-500 font-medium">Range:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 text-xs font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
                <span className="text-stone-400">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 text-xs font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Metrics Cards (Requirement 1 & 2) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Total Consumption in Grams & ML */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Total Consumption
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <FlaskConical className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif-luxury text-3xl font-bold text-stone-900">
              {activePeriodMetrics.consumptionGrams.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-xs font-mono font-bold text-amber-700 uppercase">Grams</span>
            <span className="text-xs text-stone-400">
              ({activePeriodMetrics.consumptionGrams.toFixed(1)} ML eq)
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500 flex items-center gap-1">
              <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
              Auto-Logged from Mixing:
            </span>
            <span className="font-mono font-bold text-emerald-800">
              {activePeriodMetrics.autoCount} blends
            </span>
          </div>

          {/* Sub-view indicators: Daily vs Monthly */}
          <div className="mt-2 text-[11px] text-stone-500 font-mono flex items-center justify-between border-t border-stone-50 pt-1.5">
            <span>
              Daily: <strong className="text-stone-900">{dailyMetrics.consumptionGrams.toFixed(2)} g</strong>
            </span>
            <span>
              Monthly: <strong className="text-stone-900">{monthlyMetrics.consumptionGrams.toFixed(2)} g</strong>
            </span>
          </div>
        </div>

        {/* Metric 2: Total Income ($) */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Total Income
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif-luxury text-3xl font-bold text-emerald-900">
              {currencySymbol}{' '}
              {activePeriodMetrics.incomeAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              Sales Transactions:
            </span>
            <span className="font-mono font-bold text-stone-800">
              {filteredRecords.filter((r) => r.type === 'income').length} Sales
            </span>
          </div>

          {/* Sub-view indicators: Daily vs Monthly */}
          <div className="mt-2 text-[11px] text-stone-500 font-mono flex items-center justify-between border-t border-stone-50 pt-1.5">
            <span>
              Daily: <strong className="text-stone-900">{currencySymbol} {dailyMetrics.incomeAmount.toFixed(2)}</strong>
            </span>
            <span>
              Monthly: <strong className="text-stone-900">{currencySymbol} {monthlyMetrics.incomeAmount.toFixed(2)}</strong>
            </span>
          </div>
        </div>

        {/* Metric 3: Net Balance */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs relative overflow-hidden group hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Net Balance
            </span>
            <div
              className={`p-2 rounded-xl border ${
                activePeriodMetrics.netBalance >= 0
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`font-serif-luxury text-3xl font-bold ${
                activePeriodMetrics.netBalance >= 0 ? 'text-emerald-800' : 'text-rose-800'
              }`}
            >
              {activePeriodMetrics.netBalance >= 0 ? '+' : ''}
              {currencySymbol}{' '}
              {activePeriodMetrics.netBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500">Filtered Window:</span>
            <span className="font-mono font-bold text-stone-700 capitalize">
              {periodFilter === 'all'
                ? 'All Time'
                : periodFilter === 'daily'
                ? `Day: ${selectedDate}`
                : periodFilter === 'monthly'
                ? `Month: ${selectedMonth}`
                : 'Custom Range'}
            </span>
          </div>

          {/* Sub-view indicators: Daily vs Monthly Net */}
          <div className="mt-2 text-[11px] text-stone-500 font-mono flex items-center justify-between border-t border-stone-50 pt-1.5">
            <span>
              Daily Net: <strong className={dailyMetrics.netBalance >= 0 ? 'text-emerald-800' : 'text-rose-800'}>{currencySymbol} {dailyMetrics.netBalance.toFixed(2)}</strong>
            </span>
            <span>
              Monthly Net: <strong className={monthlyMetrics.netBalance >= 0 ? 'text-emerald-800' : 'text-rose-800'}>{currencySymbol} {monthlyMetrics.netBalance.toFixed(2)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* NEW: Total Consumed Grams Per Perfume Breakdown Section (Requirement 2) */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-luxury text-sm font-bold text-stone-900">
                Consumed Grams Per Perfume
              </h3>
              <p className="text-[11px] text-stone-500">
                Aggregated consumption for{' '}
                <span className="font-semibold text-stone-700">
                  {periodFilter === 'daily'
                    ? `Day (${selectedDate})`
                    : periodFilter === 'monthly'
                    ? `Month (${selectedMonth})`
                    : periodFilter === 'custom'
                    ? `Custom Period`
                    : 'All Time'}
                </span>{' '}
                • {consumptionByPerfume.perfumeCount} unique oils used
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedPerfumeFilter && (
              <button
                onClick={() => setSelectedPerfumeFilter(null)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
              >
                <span>Clear Filter: {selectedPerfumeFilter}</span>
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={() => setShowPerfumeBreakdown(!showPerfumeBreakdown)}
              className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
              title={showPerfumeBreakdown ? 'Collapse breakdown' : 'Expand breakdown'}
            >
              {showPerfumeBreakdown ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {showPerfumeBreakdown && (
          <div className="p-4">
            {consumptionByPerfume.items.length === 0 ? (
              <div className="py-6 text-center text-stone-400 text-xs">
                No oil consumption logged yet for this period window. Compound a blend in the Mixing Calculator or add a record.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {consumptionByPerfume.items.map((perfume) => {
                  const percentOfTotal =
                    consumptionByPerfume.totalGrams > 0
                      ? (perfume.totalGrams / consumptionByPerfume.totalGrams) * 100
                      : 0;
                  const isSelected = selectedPerfumeFilter === perfume.oil_name;

                  return (
                    <div
                      key={perfume.oil_name}
                      onClick={() =>
                        setSelectedPerfumeFilter(isSelected ? null : perfume.oil_name)
                      }
                      className={`cursor-pointer rounded-xl p-3.5 border transition-all relative overflow-hidden group ${
                        isSelected
                          ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                          : 'bg-stone-50/60 hover:bg-stone-50 border-stone-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <Droplets className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                            <h4 className="text-xs font-bold text-stone-900 truncate" title={perfume.oil_name}>
                              {perfume.oil_name}
                            </h4>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-stone-500">
                            <span>{perfume.batchCount} {perfume.batchCount === 1 ? 'batch' : 'batches'}</span>
                            {perfume.autoLoggedCount > 0 && (
                              <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                                <FlaskConical className="w-2.5 h-2.5 inline" />
                                {perfume.autoLoggedCount} auto
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="font-mono text-sm font-extrabold text-stone-900">
                            {perfume.totalGrams.toFixed(2)} <span className="text-[10px] font-sans font-bold text-amber-700">g</span>
                          </div>
                          <div className="text-[10px] text-stone-400 font-mono">
                            {percentOfTotal.toFixed(1)}% of total
                          </div>
                        </div>
                      </div>

                      {/* Visual progress bar */}
                      <div className="mt-2.5 w-full bg-stone-200/80 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-600 to-amber-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.max(5, percentOfTotal))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Form Section (Fallback for adjustments or ad-hoc inventory) */}
      {isFormOpen && (
        <div className="bg-white rounded-2xl border-2 border-emerald-600/30 p-5 shadow-lg shadow-emerald-950/5 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                <PlusCircle className="w-4 h-4" />
              </div>
              <h3 className="font-serif-luxury text-base font-bold text-stone-900">
                Manual Atelier Ledger Entry
              </h3>
            </div>
            <button
              onClick={() => setIsFormOpen(false)}
              className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Field 1: Date */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">
                  Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Field 2: Record Type (Income vs Consumption) */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">
                  Record Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'consumption' })}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      formData.type === 'consumption'
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Consumption</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      formData.type === 'income'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Income</span>
                  </button>
                </div>
              </div>

              {/* Field 3: Quantity */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">
                  Quantity ({formData.unit.toUpperCase()}) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g. 10.80"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="flex-1 px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                  />
                  <div className="flex bg-stone-100 rounded-xl p-0.5 border border-stone-200">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, unit: 'g' })}
                      className={`px-2 py-1.5 text-[11px] font-bold rounded-lg ${
                        formData.unit === 'g' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-stone-500'
                      }`}
                    >
                      G
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, unit: 'ml' })}
                      className={`px-2 py-1.5 text-[11px] font-bold rounded-lg ${
                        formData.unit === 'ml' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-stone-500'
                      }`}
                    >
                      ML
                    </button>
                  </div>
                </div>
              </div>

              {/* Field 4: Amount */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">
                  Amount ({currencySymbol}) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-stone-400 font-bold text-xs">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="e.g. 0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Field 5: Oil Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">
                  Oil Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  list="oil-suggestions-list"
                  required
                  placeholder="e.g. Bergamot Reggio Calabria, 212 Men..."
                  value={formData.oil_name}
                  onChange={(e) => setFormData({ ...formData, oil_name: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                />
                <datalist id="oil-suggestions-list">
                  {oilSuggestions.map((oil, idx) => (
                    <option key={idx} value={oil} />
                  ))}
                </datalist>
              </div>

              {/* Field 6: Notes */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">
                  Notes / Batch Details
                </label>
                <input
                  type="text"
                  placeholder="e.g. Manual inventory refill, VIP flacon compounding..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 rounded-xl shadow-md shadow-emerald-900/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Record</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Data Table Section with Auto-Logged Indicators */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {/* Table Search & Filter Toolbar */}
        <div className="p-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/60">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search perfume name, formula notes, bottle size..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 text-xs font-medium placeholder-stone-400 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by Type */}
            <div className="flex items-center bg-white border border-stone-300 rounded-xl p-0.5 shadow-2xs">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  typeFilter === 'all'
                    ? 'bg-emerald-700 text-white font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => setTypeFilter('consumption')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  typeFilter === 'consumption'
                    ? 'bg-rose-700 text-white font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Consumption
              </button>
              <button
                onClick={() => setTypeFilter('income')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  typeFilter === 'income'
                    ? 'bg-emerald-700 text-white font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Income
              </button>
            </div>

            {/* Filter by Source (Auto-logged vs Manual) */}
            <div className="flex items-center bg-white border border-stone-300 rounded-xl p-0.5 shadow-2xs">
              <button
                onClick={() => setSourceFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  sourceFilter === 'all'
                    ? 'bg-stone-800 text-white font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All Sources
              </button>
              <button
                onClick={() => setSourceFilter('auto')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  sourceFilter === 'auto'
                    ? 'bg-emerald-700 text-white font-bold'
                    : 'text-stone-600 hover:text-emerald-800'
                }`}
              >
                <FlaskConical className="w-3 h-3" />
                <span>Auto-Logged</span>
              </button>
              <button
                onClick={() => setSourceFilter('manual')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  sourceFilter === 'manual'
                    ? 'bg-stone-800 text-white font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Manual
              </button>
            </div>

            <div className="text-xs text-stone-500 font-mono pl-1">
              Showing <span className="font-bold text-stone-900">{filteredRecords.length}</span> records
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-100/70 text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Oil / Perfume Blend</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Droplets className="w-8 h-8 text-stone-300 mx-auto" />
                      <p className="font-semibold text-stone-700">No records match your filters</p>
                      <p className="text-[11px] text-stone-400">
                        Calculate and save a mix in the Mixing Calculator to auto-sync, or add a manual entry.
                      </p>
                      <button
                        onClick={() => setIsFormOpen(true)}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Add Manual Record</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const isIncome = record.type === 'income';
                  const auto = isAutoLogged(record);

                  return (
                    <tr
                      key={record.id}
                      className={`hover:bg-stone-50/80 transition-colors group ${
                        auto ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono font-medium text-stone-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>{getRecordDate(record)}</span>
                          {record.date && record.date.includes('T') && (
                            <span className="text-[10px] text-stone-400 font-mono">
                              {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Oil Name */}
                      <td className="py-3.5 px-4 font-semibold text-stone-900">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              isIncome ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span className="truncate max-w-[240px]" title={record.oil_name}>
                            {record.oil_name}
                          </span>
                        </div>
                      </td>

                      {/* Source Badge (Requirement 2) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {auto ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                            <FlaskConical className="w-3 h-3 text-emerald-600" />
                            Auto-Logged
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
                            Manual
                          </span>
                        )}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isIncome ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300/80">
                            <TrendingUp className="w-3 h-3 text-emerald-700" />
                            Income
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300/80">
                            <TrendingDown className="w-3 h-3 text-rose-700" />
                            Consumption
                          </span>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-stone-800 whitespace-nowrap">
                        <span className={isIncome ? 'text-emerald-900' : 'text-stone-900'}>
                          {Number(record.quantity).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{' '}
                          <span className="text-[10px] text-stone-500 uppercase font-sans font-bold">
                            {record.unit || 'g'}
                          </span>
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap">
                        <span className={isIncome ? 'text-emerald-700 font-extrabold' : 'text-stone-800'}>
                          {isIncome ? '+' : '-'} {currencySymbol}{' '}
                          {Number(record.amount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>

                      {/* Notes */}
                      <td className="py-3.5 px-4 text-stone-500 max-w-xs truncate" title={record.notes}>
                        {record.notes ? record.notes : <span className="text-stone-300 italic">—</span>}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setRecordToDelete(record)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-luxury text-lg font-bold text-stone-900">
                  Delete Oil Record?
                </h3>
                <p className="text-xs text-stone-500">
                  This transaction will be permanently deleted from the database.
                </p>
              </div>
            </div>

            <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-500">Oil:</span>
                <span className="font-bold text-stone-900">{recordToDelete.oil_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Source:</span>
                <span className="font-bold text-emerald-800">
                  {isAutoLogged(recordToDelete) ? 'Auto-Logged (Calculator)' : 'Manual Entry'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Quantity & Amount:</span>
                <span className="font-mono font-bold">
                  {recordToDelete.quantity} {recordToDelete.unit || 'g'} / {currencySymbol}{' '}
                  {Number(recordToDelete.amount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Date:</span>
                <span className="font-mono">{recordToDelete.date}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-md shadow-rose-900/20 transition-all"
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
