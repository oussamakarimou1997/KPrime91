import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Database,
  ArrowRight,
  RefreshCw,
  Check,
} from 'lucide-react';
import { Perfume, ExtractedPerfume } from '../types';
import { parsePdfFile } from '../services/pdfParser';
import { generateSamplePerfumePdf } from '../services/export';

interface PdfImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (perfumes: ExtractedPerfume[], mode: 'merge' | 'replace') => void;
  currentPerfumeCount: number;
}

export const PdfImportModal: React.FC<PdfImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  currentPerfumeCount,
}) => {
  if (!isOpen) return null;

  // Step states: 'upload' | 'parsing' | 'preview'
  const [step, setStep] = useState<'upload' | 'parsing' | 'preview'>('upload');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Parsing results
  const [extractedItems, setExtractedItems] = useState<ExtractedPerfume[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  // Error & loading
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        processPdfFile(file);
      } else {
        setErrorMessage('Please upload a valid PDF document (.pdf)');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processPdfFile(file);
    }
  };

  const processPdfFile = async (file: File) => {
    setSelectedFile(file);
    setErrorMessage('');
    setStep('parsing');
    setLoadingStatus('Extracting text and analyzing PDF structure with Gemini AI...');

    try {
      const result = await parsePdfFile(file);

      if (!result.success || !result.perfumes || result.perfumes.length === 0) {
        setErrorMessage(
          result.error || 'Could not extract perfume records from this PDF. Please check file format.'
        );
        setStep('upload');
        return;
      }

      setExtractedItems(result.perfumes);
      // Select all by default
      const allIds = new Set<number>(result.perfumes.map((_, i) => i));
      setSelectedItemIds(allIds);
      setStep('preview');
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during PDF parsing.');
      setStep('upload');
    }
  };

  const toggleSelectAll = () => {
    if (selectedItemIds.size === extractedItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(extractedItems.map((_, i) => i)));
    }
  };

  const toggleSelectItem = (index: number) => {
    const next = new Set(selectedItemIds);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedItemIds(next);
  };

  const handleConfirmImport = () => {
    const itemsToImport = extractedItems.filter((_, i) => selectedItemIds.has(i));
    if (itemsToImport.length === 0) {
      setErrorMessage('Please select at least one perfume to import.');
      return;
    }

    onImportComplete(itemsToImport, importMode);
    handleResetModal();
    onClose();
  };

  const handleResetModal = () => {
    setStep('upload');
    setSelectedFile(null);
    setExtractedItems([]);
    setSelectedItemIds(new Set());
    setErrorMessage('');
    setImportMode('merge');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white border border-stone-200 rounded-3xl p-6 lg:p-8 space-y-6 shadow-2xl animate-fade-in relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-stone-200 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              Intelligent PDF Data Importer
            </div>
            <h2 className="font-serif-luxury text-2xl font-bold text-stone-900">
              Import Perfumes from PDF Document
            </h2>
            <p className="text-xs text-stone-500">
              Upload price lists, formula sheets, or catalog PDFs to populate your database automatically.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-center gap-3 text-rose-800 text-xs shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Upload File Area */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 lg:p-12 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer flex flex-col items-center justify-center space-y-4 ${
                dragActive
                  ? 'border-emerald-600 bg-emerald-50/60 scale-[1.01]'
                  : 'border-stone-300 bg-stone-50 hover:border-emerald-600/60 hover:bg-emerald-50/20'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center shadow-sm border border-emerald-300">
                <Upload className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Drop your Perfume PDF here, or <span className="text-emerald-800 underline">browse files</span>
                </h3>
                <p className="text-xs text-stone-500 mt-1 max-w-md">
                  Supports standard PDF documents containing Perfume Codes, Names, Olfactory Notes, and Categories.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex items-center gap-2 text-[11px] text-stone-500 font-mono">
                <span>PDF Format</span> • <span>Multi-page supported</span> • <span>AI Column Extraction</span>
              </div>
            </div>

            {/* Test Sample PDF Download helper */}
            <div className="rounded-xl bg-stone-50 p-4 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-700" />
                  Need a sample PDF to test the importer?
                </div>
                <div className="text-[11px] text-stone-500">
                  Download our pre-formatted luxury catalog PDF and test the extraction instantly.
                </div>
              </div>

              <button
                type="button"
                onClick={generateSamplePerfumePdf}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-stone-100 text-emerald-900 text-xs font-semibold border border-stone-300 shadow-2xs transition-all flex-shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Download Sample PDF
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Loading / Parsing Progress */}
        {step === 'parsing' && (
          <div className="py-16 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-emerald-700 animate-spin mx-auto" />
            <h3 className="font-serif-luxury text-lg font-bold text-stone-900">
              Parsing & Extracting Perfume Records...
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
              {loadingStatus}
            </p>
          </div>
        )}

        {/* STEP 3: Preview Extracted Records Before Importing */}
        {step === 'preview' && (
          <div className="space-y-5">
            {/* Top Summary & Mode Selection */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200">
              <div className="space-y-1">
                <div className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Extracted {extractedItems.length} Perfumes from "{selectedFile?.name}"
                </div>
                <div className="text-xs text-stone-500">
                  {selectedItemIds.size} of {extractedItems.length} selected for import.
                </div>
              </div>

              {/* Import Mode: Merge vs Replace */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-stone-600 font-medium">Database Action:</label>
                <select
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                  className="py-1.5 px-3 rounded-lg bg-white border border-stone-300 text-stone-800 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                >
                  <option value="merge">Merge with Existing ({currentPerfumeCount} current)</option>
                  <option value="replace">Replace Entire Database</option>
                </select>
              </div>
            </div>

            {/* Extracted Perfumes Preview Table */}
            <div className="rounded-xl border border-stone-200 overflow-hidden max-h-72 overflow-y-auto bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 sticky top-0 border-b border-stone-200 text-stone-600 uppercase tracking-wider font-mono">
                  <tr>
                    <th className="py-2.5 px-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedItemIds.size === extractedItems.length && extractedItems.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded accent-emerald-700"
                      />
                    </th>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Perfume Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Fragrance Family</th>
                    <th className="py-2.5 px-3">Olfactory Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {extractedItems.map((item, idx) => {
                    const isChecked = selectedItemIds.has(idx);
                    return (
                      <tr
                        key={idx}
                        onClick={() => toggleSelectItem(idx)}
                        className={`hover:bg-emerald-50/40 cursor-pointer transition-colors ${
                          isChecked ? 'bg-emerald-50/30' : 'opacity-60'
                        }`}
                      >
                        <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectItem(idx)}
                            className="rounded accent-emerald-700"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-950">
                          {item.code || `PERF-${(idx + 1).toString().padStart(3, '0')}`}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-stone-900">
                          {item.name}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-[10px] uppercase font-bold border border-stone-200">
                            {item.category || 'Unisex'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-stone-700 text-xs">
                          {item.fragrance || 'General'}
                        </td>
                        <td className="py-2.5 px-3 text-stone-500 text-xs max-w-xs truncate">
                          {item.notes || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={handleResetModal}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors border border-stone-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Upload Different File
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-lg bg-white hover:bg-stone-100 text-stone-600 text-xs font-semibold border border-stone-300"
                >
                  Cancel
                </button>

                <button
                  id="confirm-pdf-import-btn"
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={selectedItemIds.size === 0}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Database className="w-4 h-4" />
                  Import {selectedItemIds.size} Perfumes to Catalog
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
