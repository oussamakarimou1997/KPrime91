import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  User,
  Users,
  TrendingUp,
  TrendingDown,
  Droplet,
  FlaskConical,
  Printer,
  Download,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Percent,
  Clock,
  Tag,
  CheckCircle2,
  Filter,
  RefreshCw,
  Scale,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { SalesMan, MixingFormula } from '../types';
import {
  exportSalesManDailyReportPdf,
  exportTeamDailyReportPdf,
  exportSalesManDailyReportCsv,
  exportTeamDailyReportCsv,
  exportTeamMultiDayComparisonCsv,
} from '../services/export';

interface ReportsProps {
  salesmen: SalesMan[];
  history: MixingFormula[];
  currencySymbol?: string;
  initialSalesManId?: string | null;
  onNavigateToCalculatorWithSalesMan?: (salesManId: string) => void;
  onNavigateToCalculator?: (salesManId: string) => void;
  onNavigateToSalesTeam?: () => void;
  onNavigateToStaff?: () => void;
}

const CATEGORY_COLORS = {
  A: '#047857', // Emerald
  B: '#0f766e', // Teal
  C: '#0369a1', // Sky/Cyan
  D: '#4338ca', // Indigo
  Unknown: '#64748b',
};

const BOTTLE_CHART_COLORS = ['#059669', '#10b981', '#34d399', '#0d9488', '#14b8a6', '#0284c7', '#6366f1', '#8b5cf6'];

export const Reports: React.FC<ReportsProps> = ({
  salesmen,
  history,
  currencySymbol = 'DH',
  initialSalesManId,
  onNavigateToCalculatorWithSalesMan,
  onNavigateToCalculator,
  onNavigateToSalesTeam,
  onNavigateToStaff,
}) => {
  const handleNavCalculator = onNavigateToCalculatorWithSalesMan || onNavigateToCalculator;
  const handleNavSalesTeam = onNavigateToSalesTeam || onNavigateToStaff;
  // Main Tab Navigation
  const [activeTab, setActiveTab] = useState<'salesman' | 'team'>('salesman');

  // Common Date Selector (Format: YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Selected Sales Man for Single Report
  const [selectedSalesManId, setSelectedSalesManId] = useState<string>(
    initialSalesManId || (salesmen[0]?.id || 'all')
  );

  // Team multi-day chart range
  const [teamRangeDays, setTeamRangeDays] = useState<number>(7);

  // Notification feedback
  const [notification, setNotification] = useState<string>('');
  const triggerNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // Quick date pickers
  const handleQuickDate = (type: 'today' | 'yesterday' | '7daysAgo') => {
    const d = new Date();
    if (type === 'yesterday') {
      d.setDate(d.getDate() - 1);
    } else if (type === '7daysAgo') {
      d.setDate(d.getDate() - 7);
    }
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  // Helper to extract formatted date from mix createdAt
  const getMixDateStr = (createdAt: string) => {
    return new Date(createdAt).toISOString().slice(0, 10);
  };

  // ----------------------------------------------------
  // SECTION 1: SALES MAN DAILY REPORT CALCULATIONS
  // ----------------------------------------------------
  const salesManOptions = useMemo(() => {
    const list = [...salesmen];
    // Check if there are mixes with unknown / unassigned salesmen
    const hasUnassigned = history.some((h) => !h.salesManId || !salesmen.some((s) => s.id === h.salesManId));
    if (hasUnassigned) {
      list.push({
        id: 'unassigned',
        name: 'Unknown / Not Assigned',
        code: 'N/A',
        status: 'inactive',
        isActive: false,
        createdAt: '',
      });
    }
    return list;
  }, [salesmen, history]);

  // Current active salesman object
  const currentSalesMan = useMemo(() => {
    if (selectedSalesManId === 'unassigned') {
      return {
        id: 'unassigned',
        name: 'Unknown / Not Assigned',
        code: 'N/A',
        isActive: false,
        createdAt: '',
      };
    }
    return salesmen.find((s) => s.id === selectedSalesManId) || salesmen[0] || null;
  }, [selectedSalesManId, salesmen]);

  // Mixes for the selected Sales Man on the selected date
  const salesManDailyMixes = useMemo(() => {
    if (!currentSalesMan) return [];

    return history.filter((mix) => {
      const isDateMatch = getMixDateStr(mix.createdAt) === selectedDate;
      if (!isDateMatch) return false;

      if (currentSalesMan.id === 'unassigned') {
        return !mix.salesManId || !salesmen.some((s) => s.id === mix.salesManId);
      }
      return mix.salesManId === currentSalesMan.id;
    });
  }, [history, selectedDate, currentSalesMan, salesmen]);

  // Sales Man Summary Totals
  const salesManDailySummary = useMemo(() => {
    const totalMixes = salesManDailyMixes.length;
    const totalBottles = totalMixes;
    const totalOilMl = salesManDailyMixes.reduce((sum, m) => sum + (m.oilMl || 0), 0);
    const totalOilGrams = salesManDailyMixes.reduce((sum, m) => sum + (m.oilGrams || 0), 0);
    const totalAlcoholMl = salesManDailyMixes.reduce((sum, m) => sum + (m.alcoholMl || 0), 0);
    const totalAlcoholGrams = salesManDailyMixes.reduce((sum, m) => sum + (m.alcoholGrams || 0), 0);
    const totalRevenue = salesManDailyMixes.reduce((sum, m) => sum + (m.price || 0), 0);
    const avgMixValue = totalMixes > 0 ? totalRevenue / totalMixes : 0;

    // Peak category
    const catCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    salesManDailyMixes.forEach((m) => {
      const cat = m.highestCategory || m.priceCategory || 'A';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });
    let highestCategory = 'A';
    let maxCatCount = -1;
    Object.entries(catCounts).forEach(([cat, cnt]) => {
      if (cnt > maxCatCount) {
        maxCatCount = cnt;
        highestCategory = cat;
      }
    });

    return {
      totalMixes,
      totalBottles,
      totalOilMl,
      totalOilGrams,
      totalAlcoholMl,
      totalAlcoholGrams,
      totalRevenue,
      avgMixValue,
      highestCategory: totalMixes > 0 ? highestCategory : 'N/A',
    };
  }, [salesManDailyMixes]);

  // Sales Man Bottle Size Breakdown
  const salesManBottleBreakdown = useMemo(() => {
    const map = new Map<number, { size: number; count: number; oilMl: number; revenue: number }>();
    salesManDailyMixes.forEach((m) => {
      const bSize = m.bottleSize || 36;
      const existing = map.get(bSize) || { size: bSize, count: 0, oilMl: 0, revenue: 0 };
      existing.count += 1;
      existing.oilMl += m.oilMl || 0;
      existing.revenue += m.price || 0;
      map.set(bSize, existing);
    });

    return Array.from(map.values()).sort((a, b) => a.size - b.size);
  }, [salesManDailyMixes]);

  // Sales Man Category Breakdown
  const salesManCategoryBreakdown = useMemo(() => {
    const map = new Map<string, { category: string; count: number; revenue: number }>();
    (['A', 'B', 'C', 'D'] as const).forEach((cat) => {
      map.set(cat, { category: cat, count: 0, revenue: 0 });
    });

    salesManDailyMixes.forEach((m) => {
      const cat = m.highestCategory || m.priceCategory || 'A';
      const existing = map.get(cat) || { category: cat, count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += m.price || 0;
      map.set(cat, existing);
    });

    return Array.from(map.values()).filter((c) => c.count > 0 || c.revenue > 0);
  }, [salesManDailyMixes]);

  // ----------------------------------------------------
  // SECTION 2: TEAM DAILY REPORT CALCULATIONS
  // ----------------------------------------------------
  // All mixes on selectedDate
  const teamDailyMixes = useMemo(() => {
    return history.filter((mix) => getMixDateStr(mix.createdAt) === selectedDate);
  }, [history, selectedDate]);

  // All mixes on previous day (selectedDate - 1 day)
  const previousDayStr = useMemo(() => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }, [selectedDate]);

  const teamPreviousDayMixes = useMemo(() => {
    return history.filter((mix) => getMixDateStr(mix.createdAt) === previousDayStr);
  }, [history, previousDayStr]);

  // Team Today Summary
  const teamDailySummary = useMemo(() => {
    const totalMixes = teamDailyMixes.length;
    const totalBottles = totalMixes;
    const totalOilMl = teamDailyMixes.reduce((sum, m) => sum + (m.oilMl || 0), 0);
    const totalOilGrams = teamDailyMixes.reduce((sum, m) => sum + (m.oilGrams || 0), 0);
    const totalAlcoholMl = teamDailyMixes.reduce((sum, m) => sum + (m.alcoholMl || 0), 0);
    const totalAlcoholGrams = teamDailyMixes.reduce((sum, m) => sum + (m.alcoholGrams || 0), 0);
    const totalRevenue = teamDailyMixes.reduce((sum, m) => sum + (m.price || 0), 0);
    const avgMixValue = totalMixes > 0 ? totalRevenue / totalMixes : 0;

    const uniqueSalesMen = new Set(teamDailyMixes.map((m) => m.salesManId || 'unassigned'));

    return {
      totalMixes,
      totalBottles,
      totalOilMl,
      totalOilGrams,
      totalAlcoholMl,
      totalAlcoholGrams,
      totalRevenue,
      avgMixValue,
      activeSalesMenCount: uniqueSalesMen.size,
    };
  }, [teamDailyMixes]);

  // Team Previous Day Summary
  const teamPreviousDaySummary = useMemo(() => {
    const totalMixes = teamPreviousDayMixes.length;
    const totalRevenue = teamPreviousDayMixes.reduce((sum, m) => sum + (m.price || 0), 0);
    const totalOilMl = teamPreviousDayMixes.reduce((sum, m) => sum + (m.oilMl || 0), 0);

    return {
      totalMixes,
      totalRevenue,
      totalOilMl,
    };
  }, [teamPreviousDayMixes]);

  // Day-over-Day Deltas
  const comparisonDeltas = useMemo(() => {
    const revDiff = teamDailySummary.totalRevenue - teamPreviousDaySummary.totalRevenue;
    const revPct = teamPreviousDaySummary.totalRevenue > 0
      ? (revDiff / teamPreviousDaySummary.totalRevenue) * 100
      : (teamDailySummary.totalRevenue > 0 ? 100 : 0);

    const mixDiff = teamDailySummary.totalMixes - teamPreviousDaySummary.totalMixes;
    const mixPct = teamPreviousDaySummary.totalMixes > 0
      ? (mixDiff / teamPreviousDaySummary.totalMixes) * 100
      : (teamDailySummary.totalMixes > 0 ? 100 : 0);

    const oilDiff = teamDailySummary.totalOilMl - teamPreviousDaySummary.totalOilMl;
    const oilPct = teamPreviousDaySummary.totalOilMl > 0
      ? (oilDiff / teamPreviousDaySummary.totalOilMl) * 100
      : (teamDailySummary.totalOilMl > 0 ? 100 : 0);

    return {
      revDiff,
      revPct,
      mixDiff,
      mixPct,
      oilDiff,
      oilPct,
    };
  }, [teamDailySummary, teamPreviousDaySummary]);

  // Individual Sales Man Performance Breakdown for the selected Date
  const teamSalesMenPerformance = useMemo(() => {
    const map = new Map<
      string,
      {
        salesManId: string;
        salesManName: string;
        code: string;
        mixes: number;
        bottles: number;
        oilMl: number;
        alcoholMl: number;
        revenue: number;
        avgMixValue: number;
        sharePercent: number;
      }
    >();

    // Seed known salesmen
    salesmen.forEach((s) => {
      map.set(s.id, {
        salesManId: s.id,
        salesManName: s.name,
        code: s.code || '',
        mixes: 0,
        bottles: 0,
        oilMl: 0,
        alcoholMl: 0,
        revenue: 0,
        avgMixValue: 0,
        sharePercent: 0,
      });
    });

    // Populate with daily mixes
    teamDailyMixes.forEach((m) => {
      const sId = m.salesManId || 'unassigned';
      let entry = map.get(sId);
      if (!entry) {
        entry = {
          salesManId: sId,
          salesManName: m.salesManName || 'Unknown / Not Assigned',
          code: 'N/A',
          mixes: 0,
          bottles: 0,
          oilMl: 0,
          alcoholMl: 0,
          revenue: 0,
          avgMixValue: 0,
          sharePercent: 0,
        };
        map.set(sId, entry);
      }

      entry.mixes += 1;
      entry.bottles += 1;
      entry.oilMl += m.oilMl || 0;
      entry.alcoholMl += m.alcoholMl || 0;
      entry.revenue += m.price || 0;
    });

    const totalRev = teamDailySummary.totalRevenue;

    const list = Array.from(map.values()).map((item) => {
      item.avgMixValue = item.mixes > 0 ? item.revenue / item.mixes : 0;
      item.sharePercent = totalRev > 0 ? (item.revenue / totalRev) * 100 : 0;
      return item;
    });

    // Sort by revenue descending (top performers first)
    return list.sort((a, b) => b.revenue - a.revenue);
  }, [salesmen, teamDailyMixes, teamDailySummary.totalRevenue]);

  // Multi-day historical team performance (last N days)
  const multiDayHistoricalData = useMemo(() => {
    const days = teamRangeDays;
    const result: {
      date: string;
      displayDate: string;
      mixes: number;
      bottles: number;
      revenue: number;
      oilMl: number;
      alcoholMl: number;
    }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().slice(0, 10);
      const displayStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });

      const dayMixes = history.filter((m) => getMixDateStr(m.createdAt) === dStr);
      const mixes = dayMixes.length;
      const revenue = dayMixes.reduce((sum, m) => sum + (m.price || 0), 0);
      const oilMl = dayMixes.reduce((sum, m) => sum + (m.oilMl || 0), 0);
      const alcoholMl = dayMixes.reduce((sum, m) => sum + (m.alcoholMl || 0), 0);

      result.push({
        date: dStr,
        displayDate: displayStr,
        mixes,
        bottles: mixes,
        revenue,
        oilMl,
        alcoholMl,
      });
    }

    return result;
  }, [selectedDate, teamRangeDays, history]);

  // ----------------------------------------------------
  // EXPORT HANDLERS
  // ----------------------------------------------------
  const handleExportSalesManPdf = () => {
    if (!currentSalesMan) return;
    exportSalesManDailyReportPdf({
      salesManName: currentSalesMan.name,
      selectedDate,
      mixes: salesManDailyMixes,
      summary: salesManDailySummary,
      bottleBreakdown: salesManBottleBreakdown,
      categoryBreakdown: salesManCategoryBreakdown,
      currencySymbol,
    });
    triggerNotify(`PDF report downloaded for ${currentSalesMan.name} (${selectedDate}).`);
  };

  const handleExportSalesManCsv = () => {
    if (!currentSalesMan) return;
    exportSalesManDailyReportCsv({
      salesManName: currentSalesMan.name,
      selectedDate,
      mixes: salesManDailyMixes,
      currencySymbol,
    });
    triggerNotify(`CSV data exported for ${currentSalesMan.name}.`);
  };

  const handleExportTeamPdf = () => {
    exportTeamDailyReportPdf({
      selectedDate,
      summary: teamDailySummary,
      salesMenPerformance: teamSalesMenPerformance,
      currencySymbol,
    });
    triggerNotify(`Team Daily PDF report downloaded for ${selectedDate}.`);
  };

  const handleExportTeamCsv = () => {
    exportTeamDailyReportCsv({
      selectedDate,
      salesMenPerformance: teamSalesMenPerformance,
    });
    triggerNotify(`Team Daily CSV exported for ${selectedDate}.`);
  };

  const handleExportMultiDayCsv = () => {
    exportTeamMultiDayComparisonCsv(multiDayHistoricalData);
    triggerNotify(`Multi-day comparison data exported.`);
  };

  return (
    <div className="space-y-6 p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Top Banner / Hero Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="font-serif-luxury text-2xl font-bold text-stone-900">
              Reports & Sales Tracking
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Audit individual staff productivity, inspect daily mixing logs, and analyze team revenue performance comparisons.
          </p>
        </div>

        {/* Tab Selector: Single Sales Man vs Team Report */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('salesman')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'salesman'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Sales Man Daily</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'team'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team Daily & Comparison</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-4 flex items-center gap-2.5 text-emerald-950 text-xs shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{notification}</span>
        </div>
      )}

      {/* COMMON FILTER TOOLBAR: Date Selector & Quick Pickers */}
      <div className="rounded-2xl bg-white border border-stone-200 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Date Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
            <Calendar className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>Audit Date:</span>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-stone-300 bg-stone-50 font-mono text-xs text-stone-900 focus:outline-none focus:bg-white focus:border-emerald-600 font-bold"
          />

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleQuickDate('today')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                selectedDate === todayStr
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleQuickDate('yesterday')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200"
            >
              Yesterday
            </button>
          </div>
        </div>

        {/* Specific Tab Controls / Sales Man Selector in Sales Man Tab */}
        {activeTab === 'salesman' ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
              <User className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              <span>Select Sales Man:</span>
            </div>

            <select
              value={selectedSalesManId}
              onChange={(e) => setSelectedSalesManId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-stone-300 bg-stone-50 text-xs text-stone-900 font-bold focus:outline-none focus:bg-white focus:border-emerald-600 min-w-[200px]"
            >
              {salesManOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.code ? `(${s.code})` : ''} {!s.isActive && s.id !== 'unassigned' ? '[Inactive]' : ''}
                </option>
              ))}
            </select>

            {onNavigateToSalesTeam && (
              <button
                type="button"
                onClick={onNavigateToSalesTeam}
                className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline"
              >
                Manage Staff
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
            <Users className="w-4 h-4 text-emerald-700" />
            <span>Analyzing all {salesmen.length} sales team members combined</span>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: SALES MAN DAILY REPORT CONTENT */}
      {/* ======================================================== */}
      {activeTab === 'salesman' && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-950 text-emerald-50 p-4 rounded-2xl border border-emerald-900 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-300">
                  Sales Man Daily Performance
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-0.5">
                {currentSalesMan?.name || 'Staff Member'}
              </h2>
              <div className="text-xs text-emerald-200/80 font-mono mt-0.5">
                Staff ID: {currentSalesMan?.code || 'N/A'} · Report Date: {selectedDate}
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleExportSalesManPdf}
                disabled={salesManDailyMixes.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / PDF Sheet</span>
              </button>

              <button
                type="button"
                onClick={handleExportSalesManCsv}
                disabled={salesManDailyMixes.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-emerald-100 text-xs font-semibold border border-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              {onNavigateToCalculatorWithSalesMan && currentSalesMan && currentSalesMan.id !== 'unassigned' && (
                <button
                  type="button"
                  onClick={() => onNavigateToCalculatorWithSalesMan(currentSalesMan.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 text-xs font-bold shadow-xs transition-colors"
                >
                  <FlaskConical className="w-3.5 h-3.5 text-emerald-700" />
                  <span>New Mix</span>
                </button>
              )}
            </div>
          </div>

          {/* Key Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                <FlaskConical className="w-3.5 h-3.5 text-emerald-700" />
                Total Mixes
              </div>
              <div className="text-2xl font-mono font-black text-stone-900 mt-1">
                {salesManDailySummary.totalMixes}
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">Formulations performed</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                Total Revenue
              </div>
              <div className="text-2xl font-mono font-black text-emerald-950 mt-1">
                {salesManDailySummary.totalRevenue.toLocaleString()}{' '}
                <span className="text-xs font-bold text-stone-500">{currencySymbol}</span>
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">Daily gross sales</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-emerald-700" />
                Avg Mix Value
              </div>
              <div className="text-2xl font-mono font-black text-stone-900 mt-1">
                {salesManDailySummary.avgMixValue.toFixed(1)}{' '}
                <span className="text-xs font-bold text-stone-500">{currencySymbol}</span>
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">Average ticket price</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 text-emerald-700" />
                Total Oil Used
              </div>
              <div className="text-2xl font-mono font-black text-emerald-800 mt-1">
                {salesManDailySummary.totalOilMl.toFixed(1)} <span className="text-xs text-stone-500">ml</span>
              </div>
              <div className="text-[10px] font-mono text-stone-400 mt-0.5">
                {salesManDailySummary.totalOilGrams.toFixed(1)} g mass
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-teal-700" />
                Alcohol Top-up
              </div>
              <div className="text-2xl font-mono font-black text-teal-900 mt-1">
                {salesManDailySummary.totalAlcoholMl.toFixed(1)} <span className="text-xs text-stone-500">ml</span>
              </div>
              <div className="text-[10px] font-mono text-stone-400 mt-0.5">
                {salesManDailySummary.totalAlcoholGrams.toFixed(1)} g mass
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
                Peak Category
              </div>
              <div className="text-2xl font-mono font-black text-stone-900 mt-1">
                Cat {salesManDailySummary.highestCategory}
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">Most compounded</div>
            </div>
          </div>

          {/* Visual Charts: Bottle Size Breakdown & Category Distribution */}
          {salesManDailyMixes.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Bottle Sizes Chart */}
              <div className="lg:col-span-7 rounded-2xl bg-white border border-stone-200 p-5 shadow-xs">
                <h3 className="font-bold text-stone-900 text-sm mb-1 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-emerald-700" />
                  Mixes & Revenue by Bottle Size
                </h3>
                <p className="text-xs text-stone-500 mb-4">
                  Count of bottles compounded and revenue generated per volume tier
                </p>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesManBottleBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="size"
                        tickFormatter={(v) => `${v}ml`}
                        stroke="#64748b"
                        fontSize={11}
                      />
                      <YAxis stroke="#64748b" fontSize={11} yAxisId="left" />
                      <YAxis
                        stroke="#64748b"
                        fontSize={11}
                        orientation="right"
                        yAxisId="right"
                      />
                      <Tooltip
                        formatter={(val: any, name: any) => [
                          name === 'revenue' ? `${val} ${currencySymbol}` : val,
                          name === 'revenue' ? 'Revenue' : 'Mix Count',
                        ]}
                        labelFormatter={(v) => `Bottle: ${v} ml`}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar yAxisId="left" dataKey="count" fill="#047857" name="Mixes Count" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="revenue" fill="#0f766e" name="Revenue (DH)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Price Category Distribution */}
              <div className="lg:col-span-5 rounded-2xl bg-white border border-stone-200 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-sm mb-1 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-700" />
                    Price Category Mix Distribution
                  </h3>
                  <p className="text-xs text-stone-500 mb-2">
                    Proportion of Category A, B, C, D fragrances compounded
                  </p>

                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={salesManCategoryBreakdown}
                          dataKey="count"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={65}
                          innerRadius={30}
                          paddingAngle={3}
                        >
                          {salesManCategoryBreakdown.map((entry) => (
                            <Cell
                              key={`cell-${entry.category}`}
                              fill={CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS] || '#64748b'}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any, name: any) => [`${value} mixes`, `Category ${name}`]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Categories Table Summary */}
                <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-stone-100 text-center">
                  {['A', 'B', 'C', 'D'].map((cat) => {
                    const found = salesManCategoryBreakdown.find((c) => c.category === cat);
                    return (
                      <div key={cat} className="bg-stone-50 p-2 rounded-xl border border-stone-200/80">
                        <div className="text-[10px] font-bold text-stone-500">Cat {cat}</div>
                        <div className="text-sm font-black font-mono text-stone-900 mt-0.5">
                          {found ? found.count : 0}
                        </div>
                        <div className="text-[10px] text-emerald-800 font-bold">
                          {found ? `${found.revenue} ${currencySymbol}` : '0'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Detailed Mixing History Table for this Sales Man on this date */}
          <div className="rounded-2xl bg-white border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-stone-50/80 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">
                  Compounding History Log ({salesManDailyMixes.length} Record{salesManDailyMixes.length === 1 ? '' : 's'})
                </h3>
                <p className="text-xs text-stone-500">
                  Detailed timeline of every perfume mix created on {selectedDate}
                </p>
              </div>
            </div>

            {salesManDailyMixes.length === 0 ? (
              <div className="p-12 text-center text-stone-500 text-xs">
                <FlaskConical className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="font-bold text-stone-700">No mixing records found for this date.</p>
                <p className="mt-1 text-stone-400">
                  Select a different date or choose another Sales Man from the dropdown above.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-emerald-950 text-white text-[11px] uppercase tracking-wider font-bold">
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Bottle & Conc.</th>
                      <th className="py-3 px-4">Formula Composition (Oils Blended)</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 font-mono">Oil Qty</th>
                      <th className="py-3 px-4 font-mono">Alcohol</th>
                      <th className="py-3 px-4 font-mono">Price</th>
                      <th className="py-3 px-4">Batch / Client</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {salesManDailyMixes.map((mix) => {
                      const timeStr = new Date(mix.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const oilsList =
                        mix.oils && mix.oils.length > 0
                          ? mix.oils
                          : [
                              mix.oil1 || {
                                perfumeCode: mix.perfumeCode,
                                perfumeName: mix.perfumeName,
                                allocationPercent: 100,
                                oilMl: mix.oilMl,
                                oilGrams: mix.oilGrams,
                                category: mix.priceCategory || 'A',
                              },
                            ];

                      const numOils = mix.numberOfOils || oilsList.length || 1;

                      return (
                        <tr key={mix.id} className="hover:bg-emerald-50/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-stone-900">
                            {timeStr}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-stone-900 font-mono">
                              {mix.bottleSize} ml
                            </span>
                            <span className="text-[10px] text-stone-500 block">
                              @{mix.concentration}% conc.
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1 max-w-xs">
                              <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                                  {numOils} Oil{numOils > 1 ? 's' : ''}
                                </span>
                              </div>
                              {oilsList.map((o, i) => (
                                <div key={i} className="text-[11px] flex items-center justify-between gap-2 text-stone-600">
                                  <span className="truncate">
                                    <b className="font-mono text-stone-800">{o.perfumeCode}</b> {o.perfumeName}
                                  </span>
                                  <span className="font-mono text-[10px] font-bold text-emerald-800 flex-shrink-0">
                                    {o.allocationPercent}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-950 border border-emerald-300">
                              Cat {mix.highestCategory || mix.priceCategory || 'A'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <div className="font-bold text-emerald-900">{mix.oilMl.toFixed(2)} ml</div>
                            <div className="text-[10px] text-stone-400">{mix.oilGrams.toFixed(2)} g</div>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <div className="text-teal-900 font-bold">{mix.alcoholMl.toFixed(2)} ml</div>
                            <div className="text-[10px] text-stone-400">{mix.alcoholGrams.toFixed(2)} g</div>
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-stone-900">
                            {mix.price !== undefined ? `${mix.price} ${currencySymbol}` : '-'}
                          </td>
                          <td className="py-3 px-4 text-stone-500 text-[11px]">
                            {mix.customerName && <div className="font-bold text-stone-800 truncate">{mix.customerName}</div>}
                            {mix.batchNumber && <div className="font-mono text-[10px] text-stone-400">{mix.batchNumber}</div>}
                            {!mix.customerName && !mix.batchNumber && <span className="text-stone-300">-</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: TEAM DAILY & COMPARISON REPORT CONTENT */}
      {/* ======================================================== */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-950 text-emerald-50 p-4 rounded-2xl border border-emerald-900 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-300">
                  Team Daily Performance & Staff Ranking
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-0.5">
                Kprime Boutique Team Audit
              </h2>
              <div className="text-xs text-emerald-200/80 font-mono mt-0.5">
                Date: {selectedDate} · Active Compounding Staff: {teamDailySummary.activeSalesMenCount} Sales Men
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleExportTeamPdf}
                disabled={teamDailyMixes.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Team PDF</span>
              </button>

              <button
                type="button"
                onClick={handleExportTeamCsv}
                disabled={teamDailyMixes.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-emerald-100 text-xs font-semibold border border-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Team CSV</span>
              </button>
            </div>
          </div>

          {/* Team Key Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                <FlaskConical className="w-3.5 h-3.5 text-emerald-700" />
                Total Team Mixes
              </div>
              <div className="text-2xl font-mono font-black text-stone-900 mt-1">
                {teamDailySummary.totalMixes}
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">Bottles mixed across shop</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                Total Team Revenue
              </div>
              <div className="text-2xl font-mono font-black text-emerald-950 mt-1">
                {teamDailySummary.totalRevenue.toLocaleString()}{' '}
                <span className="text-xs font-bold text-stone-500">{currencySymbol}</span>
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">Total shop daily earnings</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-emerald-700" />
                Avg Ticket Value
              </div>
              <div className="text-2xl font-mono font-black text-stone-900 mt-1">
                {teamDailySummary.avgMixValue.toFixed(1)}{' '}
                <span className="text-xs font-bold text-stone-500">{currencySymbol}</span>
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">Per formula average</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 text-emerald-700" />
                Total Oil Dispensed
              </div>
              <div className="text-2xl font-mono font-black text-emerald-800 mt-1">
                {teamDailySummary.totalOilMl.toFixed(1)} <span className="text-xs text-stone-500">ml</span>
              </div>
              <div className="text-[10px] font-mono text-stone-400 mt-0.5">
                {teamDailySummary.totalOilGrams.toFixed(1)} g total mass
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-700" />
                Active Sales Staff
              </div>
              <div className="text-2xl font-mono font-black text-stone-900 mt-1">
                {teamDailySummary.activeSalesMenCount}
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">Formulators on shift</div>
            </div>
          </div>

          {/* DAY-OVER-DAY COMPARISON CARDS (Today vs Yesterday) */}
          <div className="rounded-2xl bg-stone-900 text-stone-100 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Day-over-Day Comparison: {selectedDate} vs. {previousDayStr}
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Comparison against previous calendar day performance
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Revenue Comparison */}
              <div className="bg-stone-800/80 p-4 rounded-xl border border-stone-700/80">
                <div className="text-[10px] uppercase font-bold text-stone-400">Revenue Variance</div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xl font-mono font-black text-white">
                    {teamDailySummary.totalRevenue.toLocaleString()} {currencySymbol}
                  </span>
                  <span
                    className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-md ${
                      comparisonDeltas.revDiff >= 0
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {comparisonDeltas.revDiff >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {comparisonDeltas.revDiff >= 0 ? '+' : ''}
                    {comparisonDeltas.revDiff.toLocaleString()} {currencySymbol} ({comparisonDeltas.revPct.toFixed(1)}%)
                  </span>
                </div>
                <div className="text-[10px] text-stone-400 mt-1 font-mono">
                  Prev Day: {teamPreviousDaySummary.totalRevenue.toLocaleString()} {currencySymbol}
                </div>
              </div>

              {/* Mixes Count Comparison */}
              <div className="bg-stone-800/80 p-4 rounded-xl border border-stone-700/80">
                <div className="text-[10px] uppercase font-bold text-stone-400">Mixes Volume Variance</div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xl font-mono font-black text-white">
                    {teamDailySummary.totalMixes} mixes
                  </span>
                  <span
                    className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-md ${
                      comparisonDeltas.mixDiff >= 0
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {comparisonDeltas.mixDiff >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {comparisonDeltas.mixDiff >= 0 ? '+' : ''}
                    {comparisonDeltas.mixDiff} ({comparisonDeltas.mixPct.toFixed(1)}%)
                  </span>
                </div>
                <div className="text-[10px] text-stone-400 mt-1 font-mono">
                  Prev Day: {teamPreviousDaySummary.totalMixes} mixes
                </div>
              </div>

              {/* Oil Volume Comparison */}
              <div className="bg-stone-800/80 p-4 rounded-xl border border-stone-700/80">
                <div className="text-[10px] uppercase font-bold text-stone-400">Oil Consumption Variance</div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xl font-mono font-black text-white">
                    {teamDailySummary.totalOilMl.toFixed(1)} ml
                  </span>
                  <span
                    className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-md ${
                      comparisonDeltas.oilDiff >= 0
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-stone-500/20 text-stone-300'
                    }`}
                  >
                    {comparisonDeltas.oilDiff >= 0 ? '+' : ''}
                    {comparisonDeltas.oilDiff.toFixed(1)} ml ({comparisonDeltas.oilPct.toFixed(1)}%)
                  </span>
                </div>
                <div className="text-[10px] text-stone-400 mt-1 font-mono">
                  Prev Day: {teamPreviousDaySummary.totalOilMl.toFixed(1)} ml
                </div>
              </div>
            </div>
          </div>

          {/* TEAM PERFORMANCE RANKING TABLE */}
          <div className="rounded-2xl bg-white border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-stone-50/80 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">
                  Sales Man Daily Performance Ranking ({selectedDate})
                </h3>
                <p className="text-xs text-stone-500">
                  Individual output, mix counts, and revenue contribution percentages
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-emerald-950 text-white text-[11px] uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Rank & Sales Man</th>
                    <th className="py-3 px-4 text-center">Mixes Done</th>
                    <th className="py-3 px-4 text-right font-mono">Oil Used (ml)</th>
                    <th className="py-3 px-4 text-right font-mono">Alcohol (ml)</th>
                    <th className="py-3 px-4 text-right font-mono">Revenue Generated</th>
                    <th className="py-3 px-4 text-right font-mono">Avg Ticket</th>
                    <th className="py-3 px-4 w-48">Team Revenue Share %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {teamSalesMenPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-400">
                        No team activity recorded for {selectedDate}.
                      </td>
                    </tr>
                  ) : (
                    teamSalesMenPerformance.map((s, idx) => {
                      const isTop1 = idx === 0 && s.revenue > 0;
                      return (
                        <tr
                          key={s.salesManId}
                          className={`hover:bg-emerald-50/40 transition-colors ${
                            isTop1 ? 'bg-emerald-50/20' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 font-bold text-stone-900">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                                  idx === 0 && s.revenue > 0
                                    ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300'
                                    : idx === 1 && s.revenue > 0
                                    ? 'bg-stone-300 text-stone-800'
                                    : idx === 2 && s.revenue > 0
                                    ? 'bg-amber-700 text-amber-100'
                                    : 'bg-stone-100 text-stone-500'
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <div>
                                <span className="font-bold text-stone-900">{s.salesManName}</span>
                                {s.code && (
                                  <span className="font-mono text-[10px] text-stone-500 ml-1.5">
                                    ({s.code})
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-stone-800 text-sm">
                            {s.mixes}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-900">
                            {s.oilMl.toFixed(1)} ml
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-teal-800">
                            {s.alcoholMl.toFixed(1)} ml
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-stone-900 text-sm">
                            {s.revenue.toLocaleString()} {currencySymbol}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-stone-600 font-bold">
                            {s.avgMixValue.toFixed(1)} {currencySymbol}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden border border-stone-200">
                                <div
                                  className="bg-emerald-700 h-full rounded-full transition-all"
                                  style={{ width: `${Math.min(100, Math.max(0, s.sharePercent))}%` }}
                                />
                              </div>
                              <span className="font-mono font-bold text-[11px] text-emerald-950 w-12 text-right">
                                {s.sharePercent.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* HISTORICAL MULTI-DAY TEAM TRENDS & COMPARISONS */}
          <div className="rounded-2xl bg-white border border-stone-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-700" />
                  Historical Multi-Day Team Performance Trend
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Analyze daily revenue and compounding volumes leading up to {selectedDate}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Range Selector */}
                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setTeamRangeDays(days)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        teamRangeDays === days
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Last {days} Days
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleExportMultiDayCsv}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold border border-stone-200 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-stone-600" />
                  <span>Export Trend</span>
                </button>
              </div>
            </div>

            {/* Multi-Day Chart */}
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={multiDayHistoricalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="displayDate" stroke="#64748b" fontSize={11} />
                  <YAxis yAxisId="left" stroke="#047857" fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" stroke="#0f766e" fontSize={11} />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      name === 'Revenue (DH)' ? `${val} ${currencySymbol}` : val,
                      name,
                    ]}
                    labelFormatter={(v, item) => {
                      const found = multiDayHistoricalData.find((d) => d.displayDate === v);
                      return found ? `Date: ${found.date}` : v;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar
                    yAxisId="left"
                    dataKey="revenue"
                    name="Revenue (DH)"
                    fill="#047857"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="mixes"
                    name="Mixes Done"
                    fill="#0ea5e9"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
