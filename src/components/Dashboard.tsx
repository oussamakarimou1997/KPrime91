import React from 'react';
import {
  Database,
  FlaskConical,
  History,
  PlusCircle,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  Droplet,
  Scale,
  Award,
  BookOpen,
  Users,
  BarChart3,
  User,
} from 'lucide-react';
import { Perfume, MixingFormula, PageId, AppSettings, SalesMan } from '../types';

interface DashboardProps {
  perfumes: Perfume[];
  history: MixingFormula[];
  salesmen?: SalesMan[];
  settings: AppSettings;
  onNavigate: (page: PageId) => void;
  onRepeatFormula: (formula: MixingFormula) => void;
  onOpenPdfImport: () => void;
  onSelectPerfumeToMix: (perfume: Perfume) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  perfumes,
  history,
  salesmen = [],
  settings,
  onNavigate,
  onRepeatFormula,
  onOpenPdfImport,
  onSelectPerfumeToMix,
}) => {
  // Compute analytics
  const totalPerfumes = perfumes.length;
  const totalFormulas = history.length;

  // Most used perfume calculation
  const perfumeCounts: Record<string, { count: number; name: string; code: string }> = {};
  history.forEach((h) => {
    const key = h.perfumeCode || h.perfumeName;
    if (!perfumeCounts[key]) {
      perfumeCounts[key] = { count: 0, name: h.perfumeName, code: h.perfumeCode };
    }
    perfumeCounts[key].count += 1;
  });

  const sortedPerfumeUsage = Object.values(perfumeCounts).sort((a, b) => b.count - a.count);
  const mostUsedPerfume = sortedPerfumeUsage[0] || { name: 'Sauvage', code: 'B014', count: 0 };

  // Most used bottle size calculation
  const bottleSizeCounts: Record<number, number> = {};
  history.forEach((h) => {
    bottleSizeCounts[h.bottleSize] = (bottleSizeCounts[h.bottleSize] || 0) + 1;
  });
  const sortedBottleSizes = Object.entries(bottleSizeCounts).sort((a, b) => b[1] - a[1]);
  const mostUsedBottleSize = sortedBottleSizes[0] ? `${sortedBottleSizes[0][0]} ml` : '36 ml';

  // Recent formulas (last 5)
  const recentFormulas = history.slice(0, 5);

  // Fragrance category breakdown
  const categoryCounts: Record<string, number> = {};
  perfumes.forEach((p) => {
    const cat = p.category || 'Unisex';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  return (
    <div className="space-y-8 p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Luxury Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-900 border border-emerald-800 p-6 lg:p-8 shadow-md text-white">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-600/50 text-emerald-200 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Kprime Formulation & Atelier System
            </div>
            <h1 className="font-serif-luxury text-2xl lg:text-3xl font-bold text-white">
              Welcome to Kprime Perfume Atelier
            </h1>
            <p className="text-sm text-emerald-100/80 leading-relaxed">
              Calculate high-precision 1 to 4 oils formulations with automated category pricing (A, B, C, D) and exact density-based gram weights.
              Manage your fragrance catalog, import database records from PDF, and access your persistent mixing history.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="dashboard-hero-calculator-btn"
              onClick={() => onNavigate('calculator')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-sm shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02]"
            >
              <FlaskConical className="w-4 h-4 text-emerald-950" />
              Open Mixing Calculator
            </button>
            <button
              id="dashboard-hero-import-btn"
              onClick={onOpenPdfImport}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-900/60 hover:bg-emerald-800/60 text-white text-sm font-semibold border border-emerald-700 shadow-xs transition-all"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Upload PDF Database
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Perfumes */}
        <div
          id="stat-total-perfumes"
          onClick={() => onNavigate('database')}
          className="group cursor-pointer rounded-xl bg-white border border-stone-200 p-5 hover:border-emerald-500/80 transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Total Perfumes
            </span>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 group-hover:scale-110 transition-transform">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold font-serif-luxury text-stone-900">{totalPerfumes}</div>
            <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5 font-medium">
              <span>{categoryCounts['Men'] || 0} Men</span> • 
              <span>{categoryCounts['Women'] || 0} Women</span> • 
              <span>{categoryCounts['Unisex'] || 0} Unisex</span>
            </p>
          </div>
        </div>

        {/* Metric 2: Total Formulas Created */}
        <div
          id="stat-total-formulas"
          onClick={() => onNavigate('history')}
          className="group cursor-pointer rounded-xl bg-white border border-stone-200 p-5 hover:border-emerald-500/80 transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Persistent Formulas
            </span>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 group-hover:scale-110 transition-transform">
              <History className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold font-serif-luxury text-stone-900">{totalFormulas}</div>
            <p className="text-xs text-stone-500 mt-1">
              Saved permanently in Kprime history
            </p>
          </div>
        </div>

        {/* Metric 3: Most Used Perfume */}
        <div
          id="stat-most-used-perfume"
          onClick={() => onNavigate('calculator')}
          className="group cursor-pointer rounded-xl bg-white border border-stone-200 p-5 hover:border-emerald-500/80 transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Most Formulated Perfume
            </span>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-emerald-950 truncate" title={mostUsedPerfume.name}>
              {mostUsedPerfume.name}
            </div>
            <p className="text-xs text-stone-500 mt-1 flex items-center justify-between">
              <span className="font-mono text-stone-600 font-semibold">{mostUsedPerfume.code}</span>
              <span>{mostUsedPerfume.count} formulations</span>
            </p>
          </div>
        </div>

        {/* Metric 4: Most Used Bottle Size */}
        <div
          id="stat-most-used-bottle"
          onClick={() => onNavigate('settings')}
          className="group cursor-pointer rounded-xl bg-white border border-stone-200 p-5 hover:border-emerald-500/80 transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Most Used Bottle Size
            </span>
            <div className="p-2.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 group-hover:scale-110 transition-transform">
              <Droplet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold font-serif-luxury text-stone-900">{mostUsedBottleSize}</div>
            <p className="text-xs text-stone-500 mt-1">
              Standard flacon volume
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Quick Actions & Workspace Hub
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Action 1: Mixing Calculator */}
          <div
            id="quick-action-calculator"
            onClick={() => onNavigate('calculator')}
            className="group cursor-pointer rounded-xl bg-gradient-to-b from-emerald-50/80 to-white border border-emerald-200 p-5 hover:border-emerald-400 transition-all hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold mb-3 shadow-md shadow-emerald-700/30">
                <FlaskConical className="w-5 h-5" />
              </div>
              <h3 className="font-serif-luxury text-base font-bold text-stone-900 group-hover:text-emerald-900 transition-colors">
                Mixing Calculator
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Compound 1, 2, 3, or 4 oils with automatic Category price chart and exact ml/gram weights.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-800 group-hover:translate-x-1 transition-transform">
              Launch Formulator <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Action 2: Perfume Database */}
          <div
            id="quick-action-database"
            onClick={() => onNavigate('database')}
            className="group cursor-pointer rounded-xl bg-white border border-stone-200 p-5 hover:border-emerald-300 transition-all hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center font-bold mb-3 border border-stone-200">
                <Database className="w-5 h-5 text-emerald-700" />
              </div>
              <h3 className="font-serif-luxury text-base font-bold text-stone-900 group-hover:text-stone-700 transition-colors">
                Perfume Database
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Browse, search, sort, and filter your full fragrance library and olfactory notes.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-stone-600 group-hover:text-emerald-800 group-hover:translate-x-1 transition-transform">
              View Catalog ({totalPerfumes}) <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Action 3: Add Perfume */}
          <div
            id="quick-action-add"
            onClick={() => onNavigate('add-perfume')}
            className="group cursor-pointer rounded-xl bg-white border border-stone-200 p-5 hover:border-emerald-300 transition-all hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold mb-3">
                <PlusCircle className="w-5 h-5" />
              </div>
              <h3 className="font-serif-luxury text-base font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
                Add Perfume
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Register a new fragrance profile with code, category, notes, and custom description.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-stone-600 group-hover:text-emerald-700 group-hover:translate-x-1 transition-transform">
              Register New Perfume <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Action 4: Mixing History */}
          <div
            id="quick-action-history"
            onClick={() => onNavigate('history')}
            className="group cursor-pointer rounded-xl bg-white border border-stone-200 p-5 hover:border-teal-300 transition-all hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold mb-3">
                <History className="w-5 h-5" />
              </div>
              <h3 className="font-serif-luxury text-base font-bold text-stone-900 group-hover:text-teal-800 transition-colors">
                Mixing History
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Inspect archived formula cards, batch dispensing records, and repeat past blends.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-stone-600 group-hover:text-teal-700 group-hover:translate-x-1 transition-transform">
              View History ({totalFormulas}) <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Mixing Formulas & Quick Launch List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Formulas Table */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-stone-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif-luxury text-lg font-bold text-stone-900">
                Recent Mixing Formulas
              </h2>
              <p className="text-xs text-stone-500">Latest calculated and saved formulas in Kprime</p>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
            >
              All History <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentFormulas.length === 0 ? (
            <div className="py-12 text-center text-stone-500 text-sm">
              <FlaskConical className="w-8 h-8 mx-auto text-stone-400 mb-2" />
              No formulas saved yet. Open the Mixing Calculator to create your first batch!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 uppercase tracking-wider font-mono bg-stone-50/60">
                    <th className="py-2.5 px-3 font-bold">Formula / Oils</th>
                    <th className="py-2.5 px-3 font-bold">Bottle</th>
                    <th className="py-2.5 px-3 font-bold">Oil (ml / g)</th>
                    <th className="py-2.5 px-3 font-bold">Price</th>
                    <th className="py-2.5 px-3 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {recentFormulas.map((item) => (
                    <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors group">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-stone-900">{item.perfumeName}</div>
                        <div className="font-mono text-[10px] text-emerald-800 font-bold flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span>{item.perfumeCode}</span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                            Cat {item.highestCategory || item.priceCategory || 'A'}
                          </span>
                          {item.salesManName && (
                            <span className="px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 font-sans font-medium">
                              👤 {item.salesManName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded bg-stone-100 text-stone-800 font-mono font-bold border border-stone-200">
                          {item.bottleSize} ml
                        </span>
                        <div className="text-[10px] text-stone-500 mt-0.5">{item.concentration}% oil</div>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <div className="text-emerald-950 font-bold">{item.oilMl.toFixed(2)} ml</div>
                        <div className="text-stone-500 text-[11px]">{item.oilGrams.toFixed(2)} g</div>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <div className="text-emerald-700 font-bold text-sm">
                          {item.price !== undefined ? `${item.price} ${settings.currencySymbol || 'DH'}` : '—'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onRepeatFormula(item)}
                          className="px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-700 text-emerald-800 hover:text-white font-bold text-xs border border-emerald-200 transition-all shadow-2xs"
                          title="Load this formula into calculator"
                        >
                          Repeat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Mix Launchpad & Formula Transparency */}
        <div className="space-y-4">
          {/* Quick Fragrance Spotlight */}
          <div className="rounded-2xl bg-white border border-stone-200 p-5 space-y-3 shadow-sm">
            <h3 className="font-serif-luxury text-sm font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              Quick Mix Catalog Shortcuts
            </h3>
            <p className="text-xs text-stone-600">
              Select any featured perfume to launch the compounding calculator immediately:
            </p>

            <div className="space-y-2 pt-1">
              {perfumes.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelectPerfumeToMix(p)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-stone-50 hover:bg-emerald-50/70 border border-stone-200 hover:border-emerald-300 text-left transition-all group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-stone-900 group-hover:text-emerald-950 truncate">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-stone-500 truncate">{p.fragrance || p.category}</div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="font-mono text-[10px] font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                      {p.code}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-700 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Transparent Compounding Physics card */}
          <div className="rounded-2xl bg-emerald-50/50 border border-emerald-200 p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-950">
              <Scale className="w-4 h-4 text-emerald-700" />
              Kprime Formulation Reference
            </div>
            <div className="text-xs text-stone-700 space-y-1 font-mono text-[11px] bg-white p-3 rounded-xl border border-emerald-200/80 shadow-2xs">
              <div>Total Oil ml = Bottle × (% ÷ 100)</div>
              <div>Alcohol ml = Bottle − Total Oil ml</div>
              <div className="text-emerald-800 font-semibold pt-1">Price = Max Category (A &lt; B &lt; C &lt; D)</div>
              <div className="text-teal-800 font-semibold">Oil g = Oil ml × {settings.oilDensity.toFixed(2)} g/ml</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
