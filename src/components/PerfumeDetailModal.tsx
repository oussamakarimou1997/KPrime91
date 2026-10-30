import React from 'react';
import {
  X,
  Sparkles,
  FlaskConical,
  Edit2,
  Calendar,
  Tag,
  BookOpen,
  Award,
  Layers,
} from 'lucide-react';
import { Perfume } from '../types';
import { detectCategoryFromCode } from '../services/pricing';

interface PerfumeDetailModalProps {
  perfume: Perfume | null;
  onClose: () => void;
  onSelectToMix: (perfume: Perfume) => void;
  onEdit: (perfume: Perfume) => void;
}

export const PerfumeDetailModal: React.FC<PerfumeDetailModalProps> = ({
  perfume,
  onClose,
  onSelectToMix,
  onEdit,
}) => {
  if (!perfume) return null;

  const priceCategory = detectCategoryFromCode(perfume.code);

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white border border-stone-200 rounded-3xl p-6 lg:p-8 space-y-6 shadow-2xl animate-fade-in relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-stone-200 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-emerald-100 text-emerald-950 border border-emerald-300">
                {perfume.code}
              </span>
              <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded bg-emerald-700 text-white shadow-2xs">
                Pricing: Category {priceCategory}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  perfume.category?.toLowerCase() === 'men'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : perfume.category?.toLowerCase() === 'women'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-emerald-100 text-emerald-950 border border-emerald-200'
                }`}
              >
                {perfume.category || 'Unisex'}
              </span>
            </div>
            <h2 className="font-serif-luxury text-2xl font-bold text-stone-900">
              {perfume.name}
            </h2>
            {perfume.brand && (
              <p className="text-xs text-stone-500 font-medium">
                Fragrance House: <span className="text-stone-800 font-semibold">{perfume.brand}</span>
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fragrance Classification & Family */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-900 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              Scent Group / Family
            </span>
            <div className="text-sm font-semibold text-stone-900">
              {perfume.scentGroup || perfume.fragrance || 'General Fragrance'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-stone-600 tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Main Accords
            </span>
            <div className="text-sm font-semibold text-stone-800">
              {perfume.accords || 'N/A'}
            </div>
          </div>
        </div>

        {/* Oil Reference & Commercial Match */}
        {(perfume.oilLabel || perfume.reference) && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {perfume.oilLabel && (
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-900 block">Supplier Oil Name</span>
                <span className="font-mono font-bold text-emerald-950">{perfume.oilLabel}</span>
              </div>
            )}
            {perfume.reference && (
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-900 block">Commercial Fragrance Inspiration</span>
                <span className="text-stone-800 font-semibold">{perfume.reference}</span>
              </div>
            )}
          </div>
        )}

        {/* Olfactory Notes Breakdown */}
        <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
          <span className="text-[10px] uppercase font-bold text-emerald-900 tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-700" />
            Olfactory Pyramid & Formula Notes
          </span>
          <p className="text-xs text-stone-700 leading-relaxed">
            {perfume.notes || <span className="text-stone-400 italic">No notes detailed for this perfume.</span>}
          </p>
        </div>

        {/* Description / Atelier Notes */}
        {perfume.description && (
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-stone-600 tracking-wider">
              Atelier Formulator Notes
            </span>
            <p className="text-xs text-stone-600 leading-relaxed italic">
              "{perfume.description}"
            </p>
          </div>
        )}

        {/* Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-200">
          <div className="text-[11px] text-stone-400 font-mono">
            Catalog ID: {perfume.id.slice(0, 8)}...
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                onEdit(perfume);
                onClose();
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors border border-stone-200"
            >
              <Edit2 className="w-3.5 h-3.5 text-stone-500" />
              Edit Information
            </button>

            <button
              onClick={() => {
                onSelectToMix(perfume);
                onClose();
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all hover:scale-[1.02]"
            >
              <FlaskConical className="w-4 h-4" />
              Compound in Calculator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
