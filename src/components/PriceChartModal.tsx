import React, { useState } from 'react';
import {
  X,
  Tag,
  Info,
  Check,
  Search,
  Sparkles,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import {
  BOTTLE_OPTIONS,
  PRICE_MATRIX,
  CONCENTRATION_TIERS,
  PriceCategory,
  BottleOptionId,
} from '../services/pricing';

interface PriceChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCategory?: PriceCategory;
  currentBottleId?: BottleOptionId;
  currentConcentration?: number;
  currencySymbol?: string;
  onSelectOption?: (bottleId: BottleOptionId, category: PriceCategory, concentration: number) => void;
}

const CATEGORIES: PriceCategory[] = ['A', 'B', 'C', 'D'];

export const PriceChartModal: React.FC<PriceChartModalProps> = ({
  isOpen,
  onClose,
  currentCategory = 'A',
  currentBottleId = '36ml_standard',
  currentConcentration = 30,
  currencySymbol = 'DH',
  onSelectOption,
}) => {
  const [selectedBottleTab, setSelectedBottleTab] = useState<BottleOptionId | 'ALL'>('ALL');
  const [selectedCatFilter, setSelectedCatFilter] = useState<PriceCategory | 'ALL'>('ALL');

  if (!isOpen) return null;

  const bottlesToShow = selectedBottleTab === 'ALL'
    ? BOTTLE_OPTIONS
    : BOTTLE_OPTIONS.filter((b) => b.id === selectedBottleTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-stone-200 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-luxury text-xl font-bold text-stone-900 flex items-center gap-2">
                KPRIME STAFF QUICK PRICE CHART
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                  Official Selling Matrix
                </span>
              </h2>
              <p className="text-xs text-stone-500">
                Selling price only — find the bottle, category, and concentration the customer chose. Give this price BEFORE production begins.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rule Banner & Filter Controls */}
        <div className="p-4 border-b border-stone-200 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Quick Explanation */}
          <div className="flex items-center gap-2 text-xs text-stone-700 bg-emerald-50/70 border border-emerald-200/80 rounded-xl px-3 py-2">
            <Info className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              <strong className="text-emerald-950 font-bold">Category Rule:</strong> Look at the 1st letter of the perfume code (e.g. <strong>A006</strong> → <strong>Cat A</strong>, <strong>B013</strong> → <strong>Cat B</strong>).
            </span>
          </div>

          {/* Bottle Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider whitespace-nowrap mr-1">
              Filter:
            </span>
            <button
              onClick={() => setSelectedBottleTab('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedBottleTab === 'ALL'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              All Bottles
            </button>
            {BOTTLE_OPTIONS.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBottleTab(b.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedBottleTab === b.id
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                {b.shortLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Tables Container */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-stone-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bottlesToShow.map((bottle) => {
              const matrix = PRICE_MATRIX[bottle.id];
              const isCurrentBottle = bottle.id === currentBottleId;

              return (
                <div
                  key={bottle.id}
                  className={`rounded-2xl border bg-white overflow-hidden transition-all shadow-xs ${
                    isCurrentBottle
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'border-stone-200'
                  }`}
                >
                  {/* Table Title Banner */}
                  <div
                    className={`px-4 py-3 border-b flex items-center justify-between ${
                      isCurrentBottle
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-stone-100/70 border-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm">
                        {bottle.label}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-stone-700 font-semibold border border-stone-200">
                        {bottle.volumeMl} ml • {bottle.finish}
                      </span>
                    </div>

                    {isCurrentBottle && (
                      <span className="text-[10px] font-bold text-emerald-950 bg-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-700" /> Active in Calculator
                      </span>
                    )}
                  </div>

                  {/* Grid / Matrix */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-mono text-xs">
                          <th className="py-2.5 px-3 font-bold text-stone-800 text-left w-14">
                            Cat
                          </th>
                          {CONCENTRATION_TIERS.map((tier) => (
                            <th
                              key={tier}
                              className={`py-2 px-2 font-bold ${
                                currentConcentration === tier && isCurrentBottle
                                    ? 'text-emerald-900 bg-emerald-100/80 font-black'
                                  : 'text-stone-700'
                              }`}
                            >
                              {tier}%
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-xs font-mono">
                        {CATEGORIES.map((cat) => {
                          const isCurrentRow = isCurrentBottle && currentCategory === cat;
                          return (
                            <tr
                              key={cat}
                              className={`transition-colors ${
                                isCurrentRow ? 'bg-emerald-50/50' : 'hover:bg-stone-50'
                              }`}
                            >
                              <td className="py-2.5 px-3 text-left font-bold text-stone-900 bg-stone-50/50">
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold ${
                                    isCurrentRow
                                      ? 'bg-emerald-700 text-white'
                                      : 'bg-stone-200 text-stone-800'
                                  }`}
                                >
                                  {cat}
                                </span>
                              </td>

                              {CONCENTRATION_TIERS.map((tier) => {
                                const price = matrix[cat][tier];
                                const isCurrentCell =
                                  isCurrentBottle &&
                                  currentCategory === cat &&
                                  currentConcentration === tier;

                                return (
                                  <td
                                    key={tier}
                                    onClick={() => {
                                      if (onSelectOption) {
                                        onSelectOption(bottle.id, cat, tier);
                                        onClose();
                                      }
                                    }}
                                    className={`py-2 px-1 text-center transition-all cursor-pointer ${
                                      isCurrentCell
                                        ? 'bg-emerald-700 text-white font-black scale-105 shadow-sm rounded-md'
                                        : 'text-stone-800 hover:bg-emerald-100 hover:text-emerald-950 font-bold'
                                    }`}
                                    title={`Click to set: ${bottle.label} • Cat ${cat} • ${tier}% = ${price} ${currencySymbol}`}
                                  >
                                    <div className="py-0.5">
                                      {price}
                                      <span className="text-[9px] font-normal opacity-70 ml-0.5">
                                        {currencySymbol}
                                      </span>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="text-xs text-stone-500">
            Click any table cell to immediately apply that bottle, category & concentration to the Mixing Calculator.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold transition-colors"
          >
            Close Chart
          </button>
        </div>
      </div>
    </div>
  );
};
