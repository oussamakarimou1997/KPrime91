import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  RotateCcw,
  ArrowLeft,
  Sparkles,
  FlaskConical,
  CheckCircle2,
  AlertCircle,
  Tag,
  BookOpen,
} from 'lucide-react';
import { Perfume } from '../types';

interface AddPerfumeProps {
  perfumes: Perfume[];
  editingPerfume: Perfume | null;
  onSavePerfume: (perfumeData: Omit<Perfume, 'id' | 'createdAt' | 'updatedAt'>) => {
    success: boolean;
    error?: string;
    perfume?: Perfume;
  };
  onUpdatePerfume: (id: string, updates: Partial<Omit<Perfume, 'id' | 'createdAt'>>) => {
    success: boolean;
    error?: string;
    perfume?: Perfume;
  };
  onCancel: () => void;
  onNavigateToCalculator: (perfume: Perfume) => void;
}

const FRAGRANCE_FAMILIES = [
  'Aromatic Fougere',
  'Amber Floral',
  'Amber Spicy',
  'Amber Woody',
  'Chypre Fruity',
  'Chypre Floral',
  'Citrus Aromatic',
  'Floral Aldehyde',
  'Floral Fruity Gourmand',
  'Leather',
  'Oriental Vanilla',
  'Woody Aromatic',
  'Woody Aquatic',
  'Woody Spicy',
  'Fresh Aquatic',
];

const CATEGORIES = ['Men', 'Women', 'Unisex', 'Niche', 'Designer'];

export const AddPerfume: React.FC<AddPerfumeProps> = ({
  perfumes,
  editingPerfume,
  onSavePerfume,
  onUpdatePerfume,
  onCancel,
  onNavigateToCalculator,
}) => {
  // Form fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [fragrance, setFragrance] = useState('Aromatic Fougere');
  const [customFragrance, setCustomFragrance] = useState('');
  const [category, setCategory] = useState('Unisex');
  const [notes, setNotes] = useState('');
  const [accords, setAccords] = useState('');
  const [description, setDescription] = useState('');

  // Status message
  const [errorMessage, setErrorMessage] = useState('');
  const [successResult, setSuccessResult] = useState<Perfume | null>(null);

  // Initialize or populate form if editing
  useEffect(() => {
    if (editingPerfume) {
      setCode(editingPerfume.code);
      setName(editingPerfume.name);
      setBrand(editingPerfume.brand || '');
      setFragrance(editingPerfume.fragrance || 'Aromatic Fougere');
      setCategory(editingPerfume.category || 'Unisex');
      setNotes(editingPerfume.notes || '');
      setAccords(editingPerfume.accords || '');
      setDescription(editingPerfume.description || '');
      setSuccessResult(null);
      setErrorMessage('');
    } else {
      handleClearForm();
    }
  }, [editingPerfume]);

  const handleClearForm = () => {
    const nextCodeNumber = perfumes.length + 1;
    const suggestedCode = `PERF-${nextCodeNumber.toString().padStart(3, '0')}`;
    
    setCode(suggestedCode);
    setName('');
    setBrand('');
    setFragrance('Aromatic Fougere');
    setCustomFragrance('');
    setCategory('Unisex');
    setNotes('');
    setAccords('');
    setDescription('');
    setErrorMessage('');
    setSuccessResult(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessResult(null);

    // Validations
    if (!code.trim()) {
      setErrorMessage('Perfume Code is required.');
      return;
    }
    if (!name.trim()) {
      setErrorMessage('Perfume Name is required.');
      return;
    }

    const finalFragrance = fragrance === 'OTHER' ? (customFragrance.trim() || 'General') : fragrance;

    const payload = {
      code: code.trim(),
      name: name.trim(),
      brand: brand.trim() || undefined,
      fragrance: finalFragrance,
      category: category,
      notes: notes.trim(),
      accords: accords.trim() || undefined,
      description: description.trim() || undefined,
    };

    if (editingPerfume) {
      const res = onUpdatePerfume(editingPerfume.id, payload);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to update perfume.');
      } else {
        setSuccessResult(res.perfume || null);
      }
    } else {
      const res = onSavePerfume(payload);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to add perfume.');
      } else {
        setSuccessResult(res.perfume || null);
      }
    }
  };

  return (
    <div className="space-y-6 p-4 lg:p-8 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="add-perfume-back-btn"
            onClick={onCancel}
            className="p-2 rounded-lg bg-white hover:bg-stone-100 text-stone-700 transition-colors border border-stone-300 shadow-2xs"
            title="Return to Database"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-serif-luxury text-2xl font-bold text-stone-900">
              {editingPerfume ? `Edit Perfume: ${editingPerfume.name}` : 'Add New Perfume'}
            </h1>
            <p className="text-xs text-stone-500">
              {editingPerfume
                ? 'Update fragrance specifications and olfactory formula records'
                : 'Register a new fragrance into your inventory and compounding calculator'}
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successResult && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <div className="text-sm font-bold text-emerald-950">
                {editingPerfume ? 'Perfume Updated Successfully!' : 'Perfume Added to Database!'}
              </div>
              <div className="text-xs text-emerald-800">
                <span className="font-bold text-stone-900">{successResult.name}</span> (
                <span className="font-mono font-semibold">{successResult.code}</span>) is now ready in the database and mixing calculator.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToCalculator(successResult)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all shadow-xs"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Mix in Calculator
            </button>
            {!editingPerfume && (
              <button
                onClick={handleClearForm}
                className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold border border-stone-200"
              >
                Add Another
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMessage && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-center gap-3 text-rose-800 text-xs shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form Container */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-white border border-stone-200 p-6 space-y-6 shadow-sm"
      >
        {/* Section 1: Identification */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2 border-b border-stone-200 pb-2">
            <Tag className="w-4 h-4 text-emerald-700" />
            1. Fragrance Identification
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Code */}
            <div>
              <label htmlFor="perfume-code-input" className="block text-xs font-semibold text-stone-700 mb-1">
                Perfume Code <span className="text-emerald-700">*</span>
              </label>
              <input
                id="perfume-code-input"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. PERF-001 or DS-102"
                required
                className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-stone-300 text-stone-900 font-mono text-sm focus:outline-none focus:bg-white focus:border-emerald-600 shadow-2xs transition-colors"
              />
              <p className="text-[10px] text-stone-500 mt-1">Unique reference code in your catalog</p>
            </div>

            {/* Name */}
            <div className="md:col-span-2">
              <label htmlFor="perfume-name-input" className="block text-xs font-semibold text-stone-700 mb-1">
                Perfume Name <span className="text-emerald-700">*</span>
              </label>
              <input
                id="perfume-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sauvage Elixir, Baccarat Rouge 540"
                required
                className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-stone-300 text-stone-900 text-sm focus:outline-none focus:bg-white focus:border-emerald-600 shadow-2xs transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Brand / House */}
            <div>
              <label htmlFor="perfume-brand-input" className="block text-xs font-semibold text-stone-700 mb-1">
                Brand / Fragrance House
              </label>
              <input
                id="perfume-brand-input"
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Dior, Tom Ford, Atelier House"
                className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-stone-300 text-stone-900 text-sm focus:outline-none focus:bg-white focus:border-emerald-600 shadow-2xs"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="perfume-category-select" className="block text-xs font-semibold text-stone-700 mb-1">
                Target Category
              </label>
              <select
                id="perfume-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-stone-300 text-stone-800 text-sm focus:outline-none focus:bg-white focus:border-emerald-600 shadow-2xs"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Fragrance Family */}
            <div>
              <label htmlFor="perfume-fragrance-select" className="block text-xs font-semibold text-stone-700 mb-1">
                Fragrance Family
              </label>
              <select
                id="perfume-fragrance-select"
                value={fragrance}
                onChange={(e) => setFragrance(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-stone-300 text-stone-800 text-sm focus:outline-none focus:bg-white focus:border-emerald-600 shadow-2xs"
              >
                {FRAGRANCE_FAMILIES.map((fam) => (
                  <option key={fam} value={fam}>
                    {fam}
                  </option>
                ))}
                <option value="OTHER">Custom Family / Other...</option>
              </select>
            </div>
          </div>

          {fragrance === 'OTHER' && (
            <div>
              <label htmlFor="custom-fragrance-input" className="block text-xs font-semibold text-emerald-900 mb-1">
                Enter Custom Fragrance Family
              </label>
              <input
                id="custom-fragrance-input"
                type="text"
                value={customFragrance}
                onChange={(e) => setCustomFragrance(e.target.value)}
                placeholder="e.g. Gourmand Aquatic, Solar Floral"
                className="w-full px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-300 text-stone-900 text-sm focus:outline-none focus:bg-white focus:border-emerald-600"
              />
            </div>
          )}
        </div>

        {/* Section 2: Olfactory Profile & Notes */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2 border-b border-stone-200 pb-2">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            2. Olfactory Formula & Scent Notes
          </h2>

          <div>
            <label htmlFor="perfume-notes-input" className="block text-xs font-semibold text-stone-700 mb-1">
              Olfactory Notes (Top / Heart / Base)
            </label>
            <textarea
              id="perfume-notes-input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bergamot, Nutmeg, Cardamom, Lavender, Amberwood, Cedarwood, Vanilla"
              className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-stone-300 text-stone-900 text-xs focus:outline-none focus:bg-white focus:border-emerald-600 leading-relaxed shadow-2xs"
            />
            <p className="text-[10px] text-stone-500 mt-1">
              Separate notes by commas or indicate Top, Heart, Base layers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Main Accords */}
            <div>
              <label htmlFor="perfume-accords-input" className="block text-xs font-semibold text-stone-700 mb-1">
                Main Accords (Optional)
              </label>
              <input
                id="perfume-accords-input"
                type="text"
                value={accords}
                onChange={(e) => setAccords(e.target.value)}
                placeholder="e.g. Warm Spicy, Woody, Amber, Powdery"
                className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-stone-300 text-stone-900 text-xs focus:outline-none focus:bg-white focus:border-emerald-600 shadow-2xs"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="perfume-description-input" className="block text-xs font-semibold text-stone-700 mb-1">
                Description / Formulator Notes
              </label>
              <input
                id="perfume-description-input"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Opulent evening fragrance with heavy sillage."
                className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-stone-300 text-stone-900 text-xs focus:outline-none focus:bg-white focus:border-emerald-600 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold border border-stone-300 transition-colors shadow-2xs"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleClearForm}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold border border-stone-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear Form
            </button>

            <button
              id="submit-perfume-btn"
              type="submit"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              {editingPerfume ? 'Update Perfume' : 'Add Perfume'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
