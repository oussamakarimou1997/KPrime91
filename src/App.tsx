import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { PerfumeDatabase } from './components/PerfumeDatabase';
import { AddPerfume } from './components/AddPerfume';
import { MixingCalculator } from './components/MixingCalculator';
import { SimilarPerfume } from './components/SimilarPerfume';
import { MixingHistory } from './components/MixingHistory';
import { SalesTeam } from './components/SalesTeam';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { OilTracker } from './components/OilTracker';
import { PdfImportModal } from './components/PdfImportModal';
import { PerfumeDetailModal } from './components/PerfumeDetailModal';
import { AppLockModal } from './components/AppLockModal';
import {
  getPerfumes,
  savePerfumes,
  addPerfume,
  updatePerfume,
  deletePerfume,
  getHistory,
  saveFormula,
  deleteFormula,
  clearHistory,
  getSettings,
  saveSettings,
  resetSettings,
  restoreDefaultPerfumes,
  getSalesMen,
  saveSalesMen,
  addSalesMan,
  updateSalesMan,
  deleteSalesMan,
  initStorageSync,
} from './services/storage';
import { Perfume, MixingFormula, AppSettings, PageId, ExtractedPerfume, SalesMan } from './types';

export function App() {
  // Navigation State
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // App Data States (Persisted in LocalStorage + Server File System)
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [history, setHistory] = useState<MixingFormula[]>([]);
  const [salesmen, setSalesmen] = useState<SalesMan[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getSettings());

  // Contextual Action States
  const [preselectedPerfume, setPreselectedPerfume] = useState<Perfume | null>(null);
  const [preselectedFormula, setPreselectedFormula] = useState<MixingFormula | null>(null);
  const [preselectedSalesManId, setPreselectedSalesManId] = useState<string | undefined>(undefined);
  const [editingPerfume, setEditingPerfume] = useState<Perfume | null>(null);
  const [viewingDetailPerfume, setViewingDetailPerfume] = useState<Perfume | null>(null);

  // Modals
  const [isPdfImportOpen, setIsPdfImportOpen] = useState(false);

  // App Lock Authentication State (Session persisted in localStorage)
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('atelier_app_unlocked') !== 'true';
    } catch {
      return true;
    }
  });

  const handleUnlock = (enteredPasscode: string): boolean => {
    const configuredPasscode =
      settings?.appPasscode ||
      ((import.meta as any).env?.VITE_APP_PASSCODE as string) ||
      '123456';
    if (enteredPasscode.trim() === configuredPasscode.trim()) {
      try {
        localStorage.setItem('atelier_app_unlocked', 'true');
      } catch (e) {
        console.warn('localStorage setItem failed:', e);
      }
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const handleLock = () => {
    try {
      localStorage.removeItem('atelier_app_unlocked');
    } catch (e) {
      console.warn('localStorage removeItem failed:', e);
    }
    setIsLocked(true);
  };

  // Initial Load from LocalStorage + Background Server Sync + Real-time Listeners
  useEffect(() => {
    // 1. Initial immediate local load
    setPerfumes(getPerfumes());
    setHistory(getHistory());
    setSalesmen(getSalesMen());
    setSettings(getSettings());

    // 2. Real-time storage change listeners
    const handleHistoryUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setHistory(e.detail);
      }
    };
    const handlePerfumesUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setPerfumes(e.detail);
      }
    };
    const handleSalesmenUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setSalesmen(e.detail);
      }
    };
    const handleSettingsUpdate = (e: any) => {
      if (e.detail) {
        setSettings(e.detail);
      }
    };

    window.addEventListener('perfume_history_updated', handleHistoryUpdate);
    window.addEventListener('perfume_db_updated', handlePerfumesUpdate);
    window.addEventListener('perfume_salesmen_updated', handleSalesmenUpdate);
    window.addEventListener('perfume_settings_updated', handleSettingsUpdate);

    // 3. Background server reconciliation for persistent storage across reloads/restarts
    initStorageSync(
      (serverHistory) => setHistory(serverHistory),
      (serverPerfumes) => setPerfumes(serverPerfumes),
      (serverSettings) => setSettings(serverSettings),
      (serverSalesmen) => setSalesmen(serverSalesmen)
    );

    return () => {
      window.removeEventListener('perfume_history_updated', handleHistoryUpdate);
      window.removeEventListener('perfume_db_updated', handlePerfumesUpdate);
      window.removeEventListener('perfume_salesmen_updated', handleSalesmenUpdate);
      window.removeEventListener('perfume_settings_updated', handleSettingsUpdate);
    };
  }, []);

  // Handlers for Navigation & Context Setup
  const handleNavigate = (page: PageId) => {
    setCurrentPage(page);
    setMobileSidebarOpen(false);
    // Reset specific target states if manually navigating
    if (page !== 'calculator') {
      setPreselectedPerfume(null);
      setPreselectedFormula(null);
      setPreselectedSalesManId(undefined);
    }
    if (page !== 'add-perfume') {
      setEditingPerfume(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Launch Calculator with specific perfume
  const handleSelectPerfumeToMix = (perfume: Perfume) => {
    setPreselectedPerfume(perfume);
    setPreselectedFormula(null);
    setCurrentPage('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Launch Calculator with specific Sales Man
  const handleMixWithSalesMan = (salesManId: string) => {
    setPreselectedSalesManId(salesManId);
    setPreselectedFormula(null);
    setPreselectedPerfume(null);
    setCurrentPage('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Launch Calculator repeating a formula from History
  const handleRepeatFormula = (formula: MixingFormula) => {
    setPreselectedFormula(formula);
    setPreselectedPerfume(null);
    if (formula.salesManId) {
      setPreselectedSalesManId(formula.salesManId);
    }
    setCurrentPage('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Launch Edit Perfume form
  const handleEditPerfume = (perfume: Perfume) => {
    setEditingPerfume(perfume);
    setCurrentPage('add-perfume');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sales Staff Operations
  const handleAddSalesMan = (data: Omit<SalesMan, 'id' | 'createdAt'>) => {
    const created = addSalesMan(data);
    setSalesmen(getSalesMen());
    return created;
  };

  const handleUpdateSalesMan = (id: string, updates: Partial<Omit<SalesMan, 'id' | 'createdAt'>>) => {
    const updated = updateSalesMan(id, updates);
    setSalesmen(getSalesMen());
    return updated;
  };

  const handleDeleteSalesMan = (id: string) => {
    const ok = deleteSalesMan(id);
    if (ok) {
      setSalesmen(getSalesMen());
    }
    return ok;
  };

  // Database operations
  const handleSaveNewPerfume = (data: Omit<Perfume, 'id' | 'createdAt' | 'updatedAt'>) => {
    const result = addPerfume(data);
    if (result.success && result.perfume) {
      setPerfumes(getPerfumes());
    }
    return result;
  };

  const handleUpdateExistingPerfume = (id: string, updates: Partial<Omit<Perfume, 'id' | 'createdAt'>>) => {
    const result = updatePerfume(id, updates);
    if (result.success && result.perfume) {
      setPerfumes(getPerfumes());
      if (editingPerfume?.id === id) {
        setEditingPerfume(null);
      }
    }
    return result;
  };

  const handleDeletePerfume = (id: string) => {
    const success = deletePerfume(id);
    if (success) {
      setPerfumes(getPerfumes());
    }
  };

  // Mixing History operations
  const handleSaveFormula = (formulaData: Omit<MixingFormula, 'id' | 'createdAt'>) => {
    const saved = saveFormula(formulaData);
    setHistory(getHistory());
    return saved;
  };

  const handleDeleteFormula = (id: string) => {
    const success = deleteFormula(id);
    if (success) {
      setHistory(getHistory());
    }
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  // Settings operations
  const handleSaveSettings = (newSettings: AppSettings) => {
    saveSettings(newSettings);
    setSettings(newSettings);
  };

  const handleResetSettings = () => {
    const reset = resetSettings();
    setSettings(reset);
  };

  const handleRestoreDefaultPerfumes = () => {
    const restored = restoreDefaultPerfumes();
    setPerfumes(restored);
  };

  // PDF Import completion handler
  const handlePdfImportComplete = (extracted: ExtractedPerfume[], mode: 'merge' | 'replace') => {
    const now = new Date().toISOString();
    const newPerfumeList: Perfume[] = extracted.map((item, index) => {
      const code = item.code?.trim() || `PERF-${(perfumes.length + index + 1).toString().padStart(3, '0')}`;
      return {
        id: `perf_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
        code,
        name: item.name.trim(),
        brand: item.brand?.trim(),
        fragrance: item.fragrance?.trim() || 'General Fragrance',
        category: item.category?.trim() || 'Unisex',
        notes: item.notes?.trim() || '',
        accords: item.accords?.trim(),
        description: item.description?.trim(),
        createdAt: now,
        updatedAt: now,
      };
    });

    let finalPerfumes: Perfume[];
    if (mode === 'replace') {
      finalPerfumes = newPerfumeList;
    } else {
      // Merge mode: append or update matching codes
      const existingMap = new Map(perfumes.map((p) => [p.code.toLowerCase(), p]));
      newPerfumeList.forEach((newItem) => {
        const key = newItem.code.toLowerCase();
        if (existingMap.has(key)) {
          const old = existingMap.get(key)!;
          existingMap.set(key, { ...old, ...newItem, id: old.id, updatedAt: now });
        } else {
          existingMap.set(key, newItem);
        }
      });
      finalPerfumes = Array.from(existingMap.values());
    }

    savePerfumes(finalPerfumes);
    setPerfumes(finalPerfumes);
    setCurrentPage('database');
  };

  // Full backup import
  const handleImportBackup = (
    importedPerfumes: Perfume[],
    importedHistory: MixingFormula[],
    importedSettings?: AppSettings,
    importedSalesMen?: SalesMan[]
  ) => {
    savePerfumes(importedPerfumes);
    setPerfumes(importedPerfumes);
    if (importedHistory) {
      localStorage.setItem('kprime_mixing_history_v1', JSON.stringify(importedHistory));
      setHistory(importedHistory);
    }
    if (importedSalesMen) {
      saveSalesMen(importedSalesMen);
      setSalesmen(importedSalesMen);
    }
    if (importedSettings) {
      saveSettings(importedSettings);
      setSettings(importedSettings);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans antialiased selection:bg-emerald-200 selection:text-emerald-950 relative">
      {/* App Lock Password Protection Modal (Blocking Overlay) */}
      <AppLockModal isOpen={isLocked} onUnlock={handleUnlock} />

      {/* Main Layout Container - Blurred and interactions disabled when locked */}
      <div
        className={`flex min-h-screen transition-all duration-300 ${
          isLocked ? 'pointer-events-none select-none filter blur-sm' : ''
        }`}
        aria-hidden={isLocked}
      >
        {/* Left Sidebar Navigation */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          perfumeCount={perfumes.length}
          historyCount={history.length}
          salesmenCount={salesmen.length}
          settings={settings}
          onOpenPdfImport={() => setIsPdfImportOpen(true)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onLockApp={handleLock}
        />

        {/* Main App Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Sticky Top Header Bar */}
        <Header
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onOpenPdfImport={() => setIsPdfImportOpen(true)}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          perfumeCount={perfumes.length}
          />

        {/* Page Content Rendering */}
        <main className="flex-1 pb-16">
          {currentPage === 'dashboard' && (
            <Dashboard
              perfumes={perfumes}
              history={history}
              settings={settings}
              onNavigate={handleNavigate}
              onRepeatFormula={handleRepeatFormula}
              onOpenPdfImport={() => setIsPdfImportOpen(true)}
              onSelectPerfumeToMix={handleSelectPerfumeToMix}
            />
          )}

          {currentPage === 'database' && (
            <PerfumeDatabase
              perfumes={perfumes}
              onSelectPerfumeToMix={handleSelectPerfumeToMix}
              onViewPerfumeDetails={(p) => setViewingDetailPerfume(p)}
              onEditPerfume={handleEditPerfume}
              onDeletePerfume={handleDeletePerfume}
              onNavigateToAddPerfume={() => {
                setEditingPerfume(null);
                handleNavigate('add-perfume');
              }}
              onOpenPdfImport={() => setIsPdfImportOpen(true)}
            />
          )}

          {currentPage === 'add-perfume' && (
            <AddPerfume
              perfumes={perfumes}
              editingPerfume={editingPerfume}
              onSavePerfume={handleSaveNewPerfume}
              onUpdatePerfume={handleUpdateExistingPerfume}
              onCancel={() => handleNavigate('database')}
              onNavigateToCalculator={handleSelectPerfumeToMix}
            />
          )}

          {currentPage === 'calculator' && (
            <MixingCalculator
              perfumes={perfumes}
              salesmen={salesmen}
              settings={settings}
              preselectedPerfume={preselectedPerfume}
              preselectedFormula={preselectedFormula}
              preselectedSalesManId={preselectedSalesManId}
              onSaveFormula={handleSaveFormula}
              onNavigateToHistory={() => handleNavigate('history')}
              onNavigateToSettings={() => handleNavigate('settings')}
            />
          )}

          {currentPage === 'oil-tracker' && (
            <OilTracker
              settings={settings}
              perfumes={perfumes}
            />
          )}

          {currentPage === 'similar-perfume' && (
            <SimilarPerfume
              perfumes={perfumes}
              onSelectPerfumeToMix={handleSelectPerfumeToMix}
              onViewPerfumeDetail={(p) => setViewingDetailPerfume(p)}
              onNavigate={handleNavigate}
            />
          )}

          {currentPage === 'history' && (
            <MixingHistory
              history={history}
              salesmen={salesmen}
              onRepeatFormula={handleRepeatFormula}
              onDeleteFormula={handleDeleteFormula}
              onClearHistory={handleClearHistory}
              onNavigateToCalculator={() => handleNavigate('calculator')}
            />
          )}

          {currentPage === 'reports' && (
            <Reports
              salesmen={salesmen}
              history={history}
              onNavigateToCalculator={handleMixWithSalesMan}
              onNavigateToStaff={() => handleNavigate('sales-team')}
            />
          )}

          {currentPage === 'sales-team' && (
            <SalesTeam
              salesmen={salesmen}
              history={history}
              onAddSalesMan={handleAddSalesMan}
              onUpdateSalesMan={handleUpdateSalesMan}
              onDeleteSalesMan={handleDeleteSalesMan}
              onNavigateToMix={handleMixWithSalesMan}
              onNavigateToReport={() => handleNavigate('reports')}
            />
          )}

          {currentPage === 'settings' && (
            <Settings
              settings={settings}
              perfumes={perfumes}
              history={history}
              salesmen={salesmen}
              onSaveSettings={handleSaveSettings}
              onResetSettings={handleResetSettings}
              onRestoreDefaultPerfumes={handleRestoreDefaultPerfumes}
              onImportBackup={handleImportBackup}
            />
          )}
        </main>
      </div>

      {/* PDF Import Modal */}
      <PdfImportModal
        isOpen={isPdfImportOpen}
        onClose={() => setIsPdfImportOpen(false)}
        onImportComplete={handlePdfImportComplete}
        currentPerfumeCount={perfumes.length}
      />

      {/* Perfume Full Details Modal */}
      <PerfumeDetailModal
        perfume={viewingDetailPerfume}
        onClose={() => setViewingDetailPerfume(null)}
        onSelectToMix={handleSelectPerfumeToMix}
        onEdit={handleEditPerfume}
      />
      </div>
    </div>
  );
}

export default App;

