import React, { useState } from 'react';
import {
  Sliders,
  Scale,
  Droplet,
  RotateCcw,
  Save,
  Plus,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
  Sparkles,
  Bell,
  Volume2,
} from 'lucide-react';
import { AppSettings, Perfume, MixingFormula, SalesMan } from '../types';
import { exportDatabaseBackupJson, importDatabaseBackupJson } from '../services/storage';
import { playNotificationSound } from '../services/sound';

interface SettingsProps {
  settings: AppSettings;
  perfumes: Perfume[];
  history: MixingFormula[];
  salesmen?: SalesMan[];
  onSaveSettings: (newSettings: AppSettings) => void;
  onResetSettings: () => void;
  onRestoreDefaultPerfumes: () => void;
  onImportBackup: (perfumes: Perfume[], history: MixingFormula[], settings?: AppSettings, salesmen?: SalesMan[]) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  perfumes,
  history,
  salesmen = [],
  onSaveSettings,
  onResetSettings,
  onRestoreDefaultPerfumes,
  onImportBackup,
}) => {
  // Local editable state
  const [oilDensity, setOilDensity] = useState<number>(settings.oilDensity);
  const [alcoholDensity, setAlcoholDensity] = useState<number>(settings.alcoholDensity);
  const [bottleSizes, setBottleSizes] = useState<number[]>([...settings.bottleSizes]);
  const [defaultConcentration, setDefaultConcentration] = useState<number>(settings.defaultConcentration);
  const [newBottleSize, setNewBottleSize] = useState<string>('');
  const [chatSoundEnabled, setChatSoundEnabled] = useState<boolean>(settings.chatSoundEnabled !== false);
  const [chatToastsEnabled, setChatToastsEnabled] = useState<boolean>(settings.chatToastsEnabled !== false);

  // Status feedback
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Backup file ref
  const [backupJsonInput, setBackupJsonInput] = useState<string>('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (oilDensity <= 0 || alcoholDensity <= 0) {
      setErrorMsg('Densities must be positive numbers greater than 0.');
      return;
    }
    if (bottleSizes.length === 0) {
      setErrorMsg('At least one bottle size must be configured.');
      return;
    }

    const updated: AppSettings = {
      oilDensity: Number(oilDensity),
      alcoholDensity: Number(alcoholDensity),
      bottleSizes: [...bottleSizes].sort((a, b) => a - b),
      defaultConcentration: Number(defaultConcentration),
      roundingPrecision: settings.roundingPrecision || 2,
      chatSoundEnabled,
      chatToastsEnabled,
    };

    onSaveSettings(updated);
    setSuccessMsg('Atelier settings saved successfully.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleAddBottleSize = () => {
    const val = parseFloat(newBottleSize);
    if (isNaN(val) || val <= 0) {
      setErrorMsg('Please enter a valid bottle volume (ml).');
      return;
    }
    if (bottleSizes.includes(val)) {
      setErrorMsg(`Bottle size ${val} ml is already configured.`);
      return;
    }
    setBottleSizes([...bottleSizes, val].sort((a, b) => a - b));
    setNewBottleSize('');
    setErrorMsg('');
  };

  const handleRemoveBottleSize = (sizeToRemove: number) => {
    if (bottleSizes.length <= 1) {
      setErrorMsg('You must have at least one bottle size configured.');
      return;
    }
    setBottleSizes(bottleSizes.filter((s) => s !== sizeToRemove));
  };

  const handleRestoreDefaults = () => {
    onResetSettings();
    setOilDensity(1.0);
    setAlcoholDensity(0.789);
    setBottleSizes([9.8, 15, 36, 55, 59, 86, 105]);
    setDefaultConcentration(30);
    setChatSoundEnabled(true);
    setChatToastsEnabled(true);
    setSuccessMsg('Settings restored to initial default values.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleBackupExport = () => {
    exportDatabaseBackupJson();
    setSuccessMsg('Full JSON database backup downloaded.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleBackupFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.perfumes && Array.isArray(parsed.perfumes)) {
          onImportBackup(parsed.perfumes, parsed.history || [], parsed.settings, parsed.salesmen);
          if (parsed.settings) {
            setOilDensity(parsed.settings.oilDensity);
            setAlcoholDensity(parsed.settings.alcoholDensity);
            setBottleSizes(parsed.settings.bottleSizes);
            setDefaultConcentration(parsed.settings.defaultConcentration);
          }
          setSuccessMsg(`Successfully restored ${parsed.perfumes.length} perfumes, ${(parsed.history || []).length} formulas, and ${(parsed.salesmen || []).length} sales staff.`);
          setTimeout(() => setSuccessMsg(''), 5000);
        } else {
          setErrorMsg('Invalid backup JSON format.');
        }
      } catch (err: any) {
        setErrorMsg(`Failed to parse backup file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 p-4 lg:p-8 max-w-4xl mx-auto">
      {/* Top Title */}
      <div className="border-b border-stone-200 pb-4">
        <h1 className="font-serif-luxury text-2xl font-bold text-stone-900 flex items-center gap-2.5">
          <Sliders className="w-6 h-6 text-emerald-700" />
          Atelier Settings & Physics Calibration
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Calibrate solvent densities, configure flacon bottle sizes, and manage full database backups.
        </p>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-4 flex items-center gap-3 text-emerald-950 text-xs shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-center gap-3 text-rose-800 text-xs shadow-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Gravimetric Density Configuration */}
        <div className="rounded-2xl bg-white border border-stone-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-700" />
              1. Gravimetric Liquid Densities (g/ml)
            </h2>
            <span className="text-[11px] text-stone-400 font-mono">Formula: Grams = Volume (ml) × Density</span>
          </div>

          <p className="text-xs text-stone-500 leading-relaxed">
            These values determine how many grams of perfume oil and alcohol must be weighed on a digital precision scale.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Oil Density */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2">
              <label htmlFor="oil-density-input" className="block text-xs font-bold text-emerald-950">
                Perfume Oil Density (g/ml)
              </label>
              <div className="relative">
                <input
                  id="oil-density-input"
                  type="number"
                  step="0.001"
                  min="0.5"
                  max="2.0"
                  value={oilDensity}
                  onChange={(e) => setOilDensity(parseFloat(e.target.value) || 0)}
                  className="w-full py-2.5 px-3 rounded-lg bg-white border border-stone-300 text-stone-900 font-mono font-bold text-sm focus:outline-none focus:border-emerald-600 shadow-2xs"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-mono">
                  g/ml
                </span>
              </div>
              <p className="text-[10px] text-stone-500">
                Standard pure fragrance oils typically range between 0.95 - 1.05 g/ml (Default: 1.00 g/ml).
              </p>
            </div>

            {/* Alcohol Density */}
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 space-y-2">
              <label htmlFor="alcohol-density-input" className="block text-xs font-bold text-teal-950">
                Alcohol / Ethanol Density (g/ml)
              </label>
              <div className="relative">
                <input
                  id="alcohol-density-input"
                  type="number"
                  step="0.001"
                  min="0.5"
                  max="1.5"
                  value={alcoholDensity}
                  onChange={(e) => setAlcoholDensity(parseFloat(e.target.value) || 0)}
                  className="w-full py-2.5 px-3 rounded-lg bg-white border border-stone-300 text-stone-900 font-mono font-bold text-sm focus:outline-none focus:border-teal-600 shadow-2xs"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-mono">
                  g/ml
                </span>
              </div>
              <p className="text-[10px] text-stone-500">
                Standard perfumer's denatured alcohol 96% is 0.789 g/ml (Default: 0.789 g/ml).
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Bottle Sizes Configuration */}
        <div className="rounded-2xl bg-white border border-stone-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
              <Droplet className="w-4 h-4 text-emerald-700" />
              2. Configured Bottle Sizes (ml)
            </h2>
            <span className="text-[11px] text-stone-500 font-mono">{bottleSizes.length} sizes active</span>
          </div>

          <p className="text-xs text-stone-500">
            These sizes populate the Bottle Size dropdown and quick presets in the Mixing Calculator.
          </p>

          {/* Active Sizes Pill List */}
          <div className="flex flex-wrap gap-2 pt-1">
            {bottleSizes.map((size) => (
              <div
                key={size}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 font-mono text-sm group hover:border-emerald-500 transition-colors"
              >
                <span className="font-bold text-emerald-950">{size} ml</span>
                <button
                  type="button"
                  onClick={() => handleRemoveBottleSize(size)}
                  className="text-stone-400 hover:text-rose-600 transition-colors p-0.5"
                  title={`Remove ${size} ml size`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Bottle Size Row */}
          <div className="flex items-center gap-3 pt-2 max-w-sm">
            <div className="relative flex-1">
              <input
                type="number"
                step="0.1"
                min="1"
                max="1000"
                value={newBottleSize}
                onChange={(e) => setNewBottleSize(e.target.value)}
                placeholder="Enter size (e.g. 50, 75)"
                className="w-full py-2 px-3 rounded-lg bg-stone-50 border border-stone-300 text-stone-900 font-mono text-xs focus:outline-none focus:bg-white focus:border-emerald-600 shadow-2xs"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-mono">
                ml
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddBottleSize}
              className="flex items-center gap-1 px-3.5 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold border border-stone-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-700" />
              Add Size
            </button>
          </div>
        </div>

        {/* Section 3: Team Chat Notifications & Chime */}
        <div className="rounded-2xl bg-white border border-stone-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-700" />
              3. Team Chat Real-Time Notifications
            </h2>
            <span className="text-[11px] text-stone-500 font-mono">Global In-App Alerts</span>
          </div>

          <p className="text-xs text-stone-500">
            Control visual pop-up banners and subtle audio chimes when teammates message in the shared atelier chat.
          </p>

          <div className="space-y-3 pt-1">
            {/* Pop-up notifications toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-stone-900 block">
                  In-App Pop-up Notifications (Every Page)
                </span>
                <span className="text-[11px] text-stone-500 block">
                  Show attention-grabbing slide-in toast notifications at the top-right corner when teammates send messages.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setChatToastsEnabled(!chatToastsEnabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  chatToastsEnabled ? 'bg-emerald-700' : 'bg-stone-300'
                }`}
                role="switch"
                aria-checked={chatToastsEnabled}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    chatToastsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Sound chime toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-900 block">
                    Subtle Notification Sound Chime
                  </span>
                  <button
                    type="button"
                    onClick={() => playNotificationSound()}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-semibold transition-colors"
                    title="Click to preview the luxury notification chime"
                  >
                    <Volume2 className="w-3 h-3" />
                    Test Sound
                  </button>
                </div>
                <span className="text-[11px] text-stone-500 block">
                  Plays a discrete luxury 2-tone chime when another team member posts a new message.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setChatSoundEnabled(!chatSoundEnabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  chatSoundEnabled ? 'bg-emerald-700' : 'bg-stone-300'
                }`}
                role="switch"
                aria-checked={chatSoundEnabled}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    chatSoundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Save / Reset Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-white hover:bg-stone-100 text-stone-600 hover:text-stone-900 text-xs font-semibold border border-stone-300 transition-colors shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restore Factory Defaults
          </button>

          <button
            id="save-settings-btn"
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all hover:scale-[1.02]"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </form>

      {/* Section 4: Data Management & Backup */}
      <div className="rounded-2xl bg-white border border-stone-200 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-700" />
            4. Database Backups & Seed Data
          </h2>
          <span className="text-[11px] text-stone-500 font-mono">
            {perfumes.length} Perfumes • {history.length} Formulas • {salesmen.length} Staff
          </span>
        </div>

        <p className="text-xs text-stone-500">
          Export full JSON backups of your catalog and formulation history, or restore seed perfumes.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Export JSON Backup */}
          <button
            type="button"
            onClick={handleBackupExport}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-semibold border border-stone-200 transition-colors shadow-2xs"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            Download Backup JSON
          </button>

          {/* Import JSON Backup */}
          <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-semibold border border-stone-200 transition-colors cursor-pointer shadow-2xs">
            <Upload className="w-4 h-4 text-teal-700" />
            Restore Backup JSON
            <input
              type="file"
              accept=".json"
              onChange={handleBackupFileSelected}
              className="hidden"
            />
          </label>

          {/* Restore Seed Perfumes */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset database to initial curated perfumes? Current data will be replaced.')) {
                onRestoreDefaultPerfumes();
                setSuccessMsg('Perfume database reset to curated library.');
                setTimeout(() => setSuccessMsg(''), 4000);
              }
            }}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-stone-50 hover:bg-rose-50 text-stone-700 hover:text-rose-700 text-xs font-semibold border border-stone-200 transition-colors shadow-2xs"
          >
            <RefreshCw className="w-4 h-4 text-stone-500" />
            Reload Seed Catalog
          </button>
        </div>
      </div>
    </div>
  );
};
