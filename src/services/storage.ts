import { Perfume, MixingFormula, AppSettings, SalesMan, SimilarSearchHistoryItem } from '../types';
import { DEFAULT_PERFUMES } from '../data/defaultPerfumes';

const STORAGE_KEYS = {
  PERFUMES: 'kprime_perfumes_v1',
  HISTORY: 'kprime_mixing_history_v1',
  SETTINGS: 'kprime_settings_v1',
  SALESMEN: 'kprime_salesmen_v1',
  SIMILAR_HISTORY: 'kprime_similar_history_v1',
};

export const DEFAULT_SALESMEN: SalesMan[] = [
  { id: 'sm-001', name: 'Ahmed El Mansouri', status: 'active', createdAt: '2026-08-01T08:30:00.000Z', phone: '+212 661-234567' },
  { id: 'sm-002', name: 'Youssef Alami', status: 'active', createdAt: '2026-08-01T09:00:00.000Z', phone: '+212 662-345678' },
  { id: 'sm-003', name: 'Omar Bennani', status: 'active', createdAt: '2026-08-05T10:15:00.000Z', phone: '+212 663-456789' },
  { id: 'sm-004', name: 'Fatima Zahra', status: 'active', createdAt: '2026-08-10T11:00:00.000Z', phone: '+212 664-567890' },
];

// Legacy keys for seamless zero-loss migration
const LEGACY_HISTORY_KEYS = [
  'perfume_atelier_history_v2',
  'perfume_atelier_history_v1',
  'atelier_mixing_history',
  'k_pime_history_v1',
];

const LEGACY_PERFUMES_KEYS = [
  'perfume_atelier_perfumes_v2',
  'perfume_atelier_perfumes_v1',
  'atelier_perfumes',
];

const LEGACY_SETTINGS_KEYS = [
  'perfume_atelier_settings_v2',
  'perfume_atelier_settings_v1',
];

export const DEFAULT_SETTINGS: AppSettings = {
  oilDensity: 1.00, // g/ml
  alcoholDensity: 0.789, // g/ml
  bottleSizes: [9.8, 15, 36, 55, 59, 86, 105],
  defaultConcentration: 30,
  roundingPrecision: 2,
  currencySymbol: 'DH',
  chatSoundEnabled: true,
  chatToastsEnabled: true,
};

// Initial sample history for fresh installs
export const INITIAL_SAMPLE_HISTORY: MixingFormula[] = [
  {
    id: 'hist-001',
    perfumeId: 'perf-B014',
    perfumeCode: 'B014',
    perfumeName: 'Sauvage',
    numberOfOils: 1,
    bottleSize: 36,
    concentration: 30,
    oilMl: 10.80,
    oilGrams: 10.80,
    alcoholMl: 25.20,
    alcoholGrams: 19.88,
    oilDensity: 1.00,
    alcoholDensity: 0.789,
    totalVolume: 36,
    price: 65,
    priceCategory: 'B',
    highestCategory: 'B',
    bottleType: '36ml Standard',
    customerName: 'Karim Bennani',
    batchNumber: 'BATCH-2026-08A',
    notes: 'Signature Eau de Parfum mix',
    salesManId: 'sm-001',
    salesManName: 'Ahmed El Mansouri',
    createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
  },
  {
    id: 'hist-002',
    perfumeId: 'perf-D002+perf-A014',
    perfumeCode: 'D002+A014',
    perfumeName: '2 Oils Blend: Aventus (60%) + Invictus (40%)',
    mode: 'dual',
    numberOfOils: 2,
    highestCategory: 'D',
    oils: [
      {
        perfumeId: 'perf-D002',
        perfumeCode: 'D002',
        perfumeName: 'Aventus',
        category: 'D',
        allocationPercent: 60,
        oilMl: 11.55,
        oilGrams: 11.55,
      },
      {
        perfumeId: 'perf-A014',
        perfumeCode: 'A014',
        perfumeName: 'Invictus',
        category: 'A',
        allocationPercent: 40,
        oilMl: 7.70,
        oilGrams: 7.70,
      },
    ],
    oil1: {
      perfumeId: 'perf-D002',
      perfumeCode: 'D002',
      perfumeName: 'Aventus',
      category: 'D',
      allocationPercent: 60,
      oilMl: 11.55,
      oilGrams: 11.55,
    },
    oil2: {
      perfumeId: 'perf-A014',
      perfumeCode: 'A014',
      perfumeName: 'Invictus',
      category: 'A',
      allocationPercent: 40,
      oilMl: 7.70,
      oilGrams: 7.70,
    },
    bottleSize: 55,
    concentration: 35,
    oilMl: 19.25,
    oilGrams: 19.25,
    alcoholMl: 35.75,
    alcoholGrams: 28.21,
    oilDensity: 1.00,
    alcoholDensity: 0.789,
    totalVolume: 55,
    price: 145,
    priceCategory: 'D',
    bottleType: '55ml Unpolish',
    customerName: 'Yassine Alami',
    batchNumber: 'BATCH-2026-08B',
    notes: 'Custom 2-oil VIP blend with Category D pricing',
    salesManId: 'sm-002',
    salesManName: 'Youssef Alami',
    createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
  },
];

// --- Helper for safe localStorage access ---
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn(`localStorage getItem failed for key "${key}":`, e);
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`localStorage setItem failed for key "${key}":`, e);
  }
}

// --- Settings Storage ---
export function getSettings(): AppSettings {
  try {
    let raw = safeGetItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      // Check legacy settings keys
      for (const legacyKey of LEGACY_SETTINGS_KEYS) {
        const legacyVal = safeGetItem(legacyKey);
        if (legacyVal) {
          raw = legacyVal;
          safeSetItem(STORAGE_KEYS.SETTINGS, legacyVal);
          break;
        }
      }
    }

    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    let loadedSizes = Array.isArray(parsed.bottleSizes) && parsed.bottleSizes.length > 0
      ? parsed.bottleSizes.map((n: any) => Number(n)).sort((a: number, b: number) => a - b)
      : DEFAULT_SETTINGS.bottleSizes;
    
    // Auto-migrate old default array [10, 20, 35, 50, 85, 100] to new exact bottle sizes
    const isOldDefault = loadedSizes.length === 6 &&
      loadedSizes.includes(10) && loadedSizes.includes(35) && loadedSizes.includes(100);
    if (isOldDefault) {
      loadedSizes = DEFAULT_SETTINGS.bottleSizes;
    }

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      oilDensity: Number(parsed.oilDensity) || DEFAULT_SETTINGS.oilDensity,
      alcoholDensity: Number(parsed.alcoholDensity) || DEFAULT_SETTINGS.alcoholDensity,
      bottleSizes: loadedSizes,
      defaultConcentration: Number(parsed.defaultConcentration) || DEFAULT_SETTINGS.defaultConcentration,
      roundingPrecision: Number(parsed.roundingPrecision) || DEFAULT_SETTINGS.roundingPrecision,
      currencySymbol: parsed.currencySymbol || DEFAULT_SETTINGS.currencySymbol || 'DH',
    };
  } catch (e) {
    console.error('Failed to load settings:', e);
    return DEFAULT_SETTINGS;
  }
}

export const loadSettings = getSettings;

export function saveSettings(settings: AppSettings): void {
  try {
    safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('perfume_settings_updated', { detail: settings }));
    
    // Async background sync with server
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    }).catch((err) => console.warn('Background settings sync warning:', err));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function resetSettings(): AppSettings {
  saveSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

// --- Sales Team Storage ---
export function getSalesMen(): SalesMan[] {
  try {
    const raw = safeGetItem(STORAGE_KEYS.SALESMEN);
    if (!raw) return DEFAULT_SALESMEN;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_SALESMEN;
  } catch (e) {
    console.error('Failed to load salesmen:', e);
    return DEFAULT_SALESMEN;
  }
}

export const loadSalesMen = getSalesMen;

export function saveSalesMen(salesmen: SalesMan[]): void {
  try {
    safeSetItem(STORAGE_KEYS.SALESMEN, JSON.stringify(salesmen));
    window.dispatchEvent(new CustomEvent('perfume_salesmen_updated', { detail: salesmen }));

    // Background sync with server
    fetch('/api/salesmen/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ salesmen }),
    }).catch((err) => console.warn('Background salesmen sync warning:', err));
  } catch (e) {
    console.error('Failed to save salesmen:', e);
  }
}

export function addSalesMan(data: { name: string; phone?: string; notes?: string }): {
  success: boolean;
  error?: string;
  salesman?: SalesMan;
} {
  const existing = getSalesMen();
  const trimmed = data.name.trim();
  if (!trimmed) {
    return { success: false, error: 'Sales Man name is required.' };
  }
  const duplicate = existing.find((s) => s.name.trim().toLowerCase() === trimmed.toLowerCase());
  if (duplicate) {
    return { success: false, error: `A Sales Man named "${trimmed}" already exists.` };
  }

  const created: SalesMan = {
    id: 'sm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    name: trimmed,
    status: 'active',
    createdAt: new Date().toISOString(),
    phone: data.phone?.trim() || '',
    notes: data.notes?.trim() || '',
  };

  const updated = [created, ...existing];
  saveSalesMen(updated);
  return { success: true, salesman: created };
}

export function updateSalesMan(
  id: string,
  updates: Partial<Omit<SalesMan, 'id' | 'createdAt'>>
): { success: boolean; error?: string; salesman?: SalesMan } {
  const existing = getSalesMen();
  const index = existing.findIndex((s) => s.id === id);
  if (index === -1) {
    return { success: false, error: 'Sales Man not found.' };
  }

  if (updates.name) {
    const trimmed = updates.name.trim();
    const conflict = existing.find(
      (s) => s.id !== id && s.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (conflict) {
      return { success: false, error: `A Sales Man named "${trimmed}" already exists.` };
    }
  }

  const updated: SalesMan = {
    ...existing[index],
    ...updates,
  };

  existing[index] = updated;
  saveSalesMen(existing);
  return { success: true, salesman: updated };
}

export function toggleSalesManStatus(id: string): { success: boolean; salesman?: SalesMan } {
  const existing = getSalesMen();
  const index = existing.findIndex((s) => s.id === id);
  if (index === -1) return { success: false };

  const currentStatus = existing[index].status;
  const newStatus: 'active' | 'inactive' = currentStatus === 'active' ? 'inactive' : 'active';
  const updated: SalesMan = {
    ...existing[index],
    status: newStatus,
  };

  existing[index] = updated;
  saveSalesMen(existing);
  return { success: true, salesman: updated };
}

export function deleteSalesMan(id: string): { success: boolean } {
  const existing = getSalesMen();
  const filtered = existing.filter((s) => s.id !== id);
  saveSalesMen(filtered);
  return { success: true };
}

// --- Perfumes Database Storage ---
export function getPerfumes(): Perfume[] {
  try {
    let raw = safeGetItem(STORAGE_KEYS.PERFUMES);
    if (!raw) {
      // Check legacy perfumes keys
      for (const legacyKey of LEGACY_PERFUMES_KEYS) {
        const legacyVal = safeGetItem(legacyKey);
        if (legacyVal) {
          raw = legacyVal;
          safeSetItem(STORAGE_KEYS.PERFUMES, legacyVal);
          break;
        }
      }
    }

    if (!raw) return DEFAULT_PERFUMES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_PERFUMES;
  } catch (e) {
    console.error('Failed to load perfumes:', e);
    return DEFAULT_PERFUMES;
  }
}

export const loadPerfumes = getPerfumes;

export function savePerfumes(perfumes: Perfume[]): void {
  try {
    safeSetItem(STORAGE_KEYS.PERFUMES, JSON.stringify(perfumes));
    window.dispatchEvent(new CustomEvent('perfume_db_updated', { detail: perfumes }));

    // Async background sync with server
    fetch('/api/perfumes/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ perfumes }),
    }).catch((err) => console.warn('Background perfumes sync warning:', err));
  } catch (e) {
    console.error('Failed to save perfumes:', e);
  }
}

export function addPerfume(newPerfume: Omit<Perfume, 'id' | 'createdAt' | 'updatedAt'>): { success: boolean; error?: string; perfume?: Perfume } {
  const existing = getPerfumes();
  const trimmedCode = newPerfume.code.trim();
  const duplicate = existing.find(p => p.code.trim().toLowerCase() === trimmedCode.toLowerCase());
  
  if (duplicate) {
    return {
      success: false,
      error: `A perfume with code "${trimmedCode}" already exists (${duplicate.name}).`,
    };
  }

  const now = new Date().toISOString();
  const created: Perfume = {
    ...newPerfume,
    id: 'perf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    code: trimmedCode,
    name: newPerfume.name.trim(),
    notes: newPerfume.notes?.trim() || '',
    fragrance: newPerfume.fragrance?.trim() || 'General',
    category: newPerfume.category?.trim() || 'Unisex',
    createdAt: now,
    updatedAt: now,
  };

  const updatedList = [created, ...existing];
  savePerfumes(updatedList);
  return { success: true, perfume: created };
}

export function updatePerfume(id: string, updates: Partial<Omit<Perfume, 'id' | 'createdAt'>>): { success: boolean; error?: string; perfume?: Perfume } {
  const existing = getPerfumes();
  const index = existing.findIndex(p => p.id === id);
  if (index === -1) {
    return { success: false, error: 'Perfume not found in database.' };
  }

  if (updates.code) {
    const trimmedCode = updates.code.trim();
    const conflict = existing.find(p => p.id !== id && p.code.trim().toLowerCase() === trimmedCode.toLowerCase());
    if (conflict) {
      return { success: false, error: `Code "${trimmedCode}" is already in use by ${conflict.name}.` };
    }
  }

  const updated: Perfume = {
    ...existing[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  existing[index] = updated;
  savePerfumes(existing);
  return { success: true, perfume: updated };
}

export function deletePerfume(id: string): { success: boolean } {
  const existing = getPerfumes();
  const filtered = existing.filter(p => p.id !== id);
  savePerfumes(filtered);
  return { success: true };
}

export function restoreDefaultPerfumes(): Perfume[] {
  savePerfumes(DEFAULT_PERFUMES);
  return DEFAULT_PERFUMES;
}

// --- Mixing History Storage ---
export function getHistory(): MixingFormula[] {
  try {
    let raw = safeGetItem(STORAGE_KEYS.HISTORY);
    if (!raw) {
      // Check legacy history keys for seamless zero-loss migration
      for (const legacyKey of LEGACY_HISTORY_KEYS) {
        const legacyVal = safeGetItem(legacyKey);
        if (legacyVal) {
          try {
            const parsedLegacy = JSON.parse(legacyVal);
            if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
              raw = legacyVal;
              safeSetItem(STORAGE_KEYS.HISTORY, legacyVal);
              break;
            }
          } catch {
            // continue
          }
        }
      }
    }

    if (!raw) return INITIAL_SAMPLE_HISTORY;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_SAMPLE_HISTORY;
  } catch (e) {
    console.error('Failed to load history:', e);
    return INITIAL_SAMPLE_HISTORY;
  }
}

export const loadHistory = getHistory;

export function saveHistory(history: MixingFormula[]): void {
  try {
    safeSetItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    window.dispatchEvent(new CustomEvent('perfume_history_updated', { detail: history }));

    // Async background sync with persistent server storage
    fetch('/api/history/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history }),
    }).catch((err) => console.warn('Background history sync warning:', err));
  } catch (e) {
    console.error('Failed to save history:', e);
  }
}

export function saveFormula(formula: Omit<MixingFormula, 'id' | 'createdAt'>): MixingFormula {
  const existing = getHistory();
  const created: MixingFormula = {
    ...formula,
    id: 'form_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    createdAt: new Date().toISOString(),
  };

  const updated = [created, ...existing.filter(h => h.id !== created.id)];
  
  // 1. Immediately save to LocalStorage (synchronous guarantee)
  safeSetItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('perfume_history_updated', { detail: updated }));

  // 2. Immediately save to persistent backend server
  fetch('/api/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(created),
  }).catch((err) => console.warn('Failed to post formula to backend:', err));

  return created;
}

export const addHistoryFormula = saveFormula;

export function deleteFormula(id: string): { success: boolean } {
  const existing = getHistory();
  const updated = existing.filter(h => h.id !== id);
  
  // 1. LocalStorage
  safeSetItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('perfume_history_updated', { detail: updated }));

  // 2. Backend
  fetch(`/api/history/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }).catch((err) => console.warn('Failed to delete formula on backend:', err));

  return { success: true };
}

export const deleteHistoryFormula = deleteFormula;

export function clearHistory(): void {
  safeSetItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
  window.dispatchEvent(new CustomEvent('perfume_history_updated', { detail: [] }));
  fetch('/api/history', { method: 'DELETE' }).catch((err) => console.warn('Failed to clear backend history:', err));
}

// --- Initial sync on App launch to reconcile server and localStorage ---
export async function initStorageSync(
  onHistoryUpdate?: (history: MixingFormula[]) => void,
  onPerfumesUpdate?: (perfumes: Perfume[]) => void,
  onSettingsUpdate?: (settings: AppSettings) => void,
  onSalesMenUpdate?: (salesmen: SalesMan[]) => void
): Promise<void> {
  try {
    // 1. Reconcile Mixing History
    const hasLocalHistory = safeGetItem(STORAGE_KEYS.HISTORY) !== null || LEGACY_HISTORY_KEYS.some(k => safeGetItem(k) !== null);
    const localHistory = getHistory();
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.history) && data.history.length > 0) {
          // Merge local and server history by id without duplicates
          const map = new Map<string, MixingFormula>();
          data.history.forEach((h: MixingFormula) => {
            if (h && h.id) map.set(h.id, h);
          });
          if (hasLocalHistory) localHistory.forEach((h: MixingFormula) => {
            if (h && h.id) map.set(h.id, h);
          });
          const merged = Array.from(map.values()).sort((a, b) => {
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          });
          safeSetItem(STORAGE_KEYS.HISTORY, JSON.stringify(merged));
          if (onHistoryUpdate) onHistoryUpdate(merged);
        } else if (hasLocalHistory && localHistory.length > 0) {
          // Push local history to server
          fetch('/api/history/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history: localHistory }),
          }).catch(() => {});
        }
      }
    } catch {
      // Backend not reached or offline, fallback to localHistory already loaded
    }

    // 2. Reconcile Perfumes Database
    const hasLocalPerfumes = safeGetItem(STORAGE_KEYS.PERFUMES) !== null || LEGACY_PERFUMES_KEYS.some(k => safeGetItem(k) !== null);
    const localPerfumes = getPerfumes();
    try {
      const res = await fetch('/api/perfumes');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.perfumes) && data.perfumes.length > 0) {
          safeSetItem(STORAGE_KEYS.PERFUMES, JSON.stringify(data.perfumes));
          if (onPerfumesUpdate) onPerfumesUpdate(data.perfumes);
        } else if (hasLocalPerfumes && localPerfumes.length > 0) {
          fetch('/api/perfumes/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ perfumes: localPerfumes }),
          }).catch(() => {});
        }
      }
    } catch {}

    // 3. Reconcile Settings
    const hasLocalSettings = safeGetItem(STORAGE_KEYS.SETTINGS) !== null || LEGACY_SETTINGS_KEYS.some(k => safeGetItem(k) !== null);
    const localSettings = getSettings();
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data && data.settings) {
          safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
          if (onSettingsUpdate) onSettingsUpdate(data.settings);
        } else if (hasLocalSettings) {
          fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: localSettings }),
          }).catch(() => {});
        }
      }
    } catch {}

    // 4. Reconcile Salesmen
    const hasLocalSalesMen = safeGetItem(STORAGE_KEYS.SALESMEN) !== null;
    const localSalesMen = getSalesMen();
    try {
      const res = await fetch('/api/salesmen');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.salesmen) && data.salesmen.length > 0) {
          // Merge salesmen by id
          const map = new Map<string, SalesMan>();
          data.salesmen.forEach((s: SalesMan) => {
            if (s && s.id) map.set(s.id, s);
          });
          if (hasLocalSalesMen) localSalesMen.forEach((s: SalesMan) => {
            if (s && s.id) map.set(s.id, s);
          });
          const merged = Array.from(map.values());
          safeSetItem(STORAGE_KEYS.SALESMEN, JSON.stringify(merged));
          if (onSalesMenUpdate) onSalesMenUpdate(merged);
        } else if (hasLocalSalesMen && localSalesMen.length > 0) {
          fetch('/api/salesmen/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ salesmen: localSalesMen }),
          }).catch(() => {});
        }
      }
    } catch {}
  } catch (err) {
    console.error('initStorageSync error:', err);
  }
}

// --- Full Database JSON Backup and Restore ---
export function exportDatabaseBackupJson(): void {
  const backup = {
    exportedAt: new Date().toISOString(),
    appName: 'Kprime',
    version: '2.5',
    perfumes: getPerfumes(),
    history: getHistory(),
    settings: getSettings(),
    salesmen: getSalesMen(),
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kprime_perfume_database_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importDatabaseBackupJson(jsonString: string): {
  success: boolean;
  error?: string;
  perfumesCount?: number;
  historyCount?: number;
  salesmenCount?: number;
} {
  try {
    const data = JSON.parse(jsonString);
    if (!data.perfumes || !Array.isArray(data.perfumes)) {
      return { success: false, error: 'Invalid backup file: missing perfumes catalog.' };
    }

    savePerfumes(data.perfumes);
    if (data.history && Array.isArray(data.history)) {
      saveHistory(data.history);
    }
    if (data.settings) {
      saveSettings(data.settings);
    }
    if (data.salesmen && Array.isArray(data.salesmen)) {
      saveSalesMen(data.salesmen);
    }

    return {
      success: true,
      perfumesCount: data.perfumes.length,
      historyCount: (data.history || []).length,
      salesmenCount: (data.salesmen || []).length,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to parse JSON file.' };
  }
}

// --- Reset to default factory state ---
export function resetDatabaseToDefaults(): void {
  savePerfumes(DEFAULT_PERFUMES);
  saveHistory(INITIAL_SAMPLE_HISTORY);
  saveSettings(DEFAULT_SETTINGS);
  saveSalesMen(DEFAULT_SALESMEN);
}

// --- Similar Perfume Search History Storage ---
export function getSimilarHistory(): SimilarSearchHistoryItem[] {
  try {
    const raw = safeGetItem(STORAGE_KEYS.SIMILAR_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch (e) {
    console.error('Failed to load similar perfume history:', e);
    return [];
  }
}

export function saveSimilarHistory(history: SimilarSearchHistoryItem[]): void {
  try {
    safeSetItem(STORAGE_KEYS.SIMILAR_HISTORY, JSON.stringify(history));
    window.dispatchEvent(new CustomEvent('perfume_similar_history_updated', { detail: history }));

    // Sync with backend
    fetch('/api/similar-perfume/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(history[0] || {}),
    }).catch(() => {});
  } catch (e) {
    console.error('Failed to save similar history:', e);
  }
}

export function addSimilarHistory(item: Omit<SimilarSearchHistoryItem, 'id' | 'createdAt'>): SimilarSearchHistoryItem {
  const existing = getSimilarHistory();
  const created: SimilarSearchHistoryItem = {
    ...item,
    id: 'sim_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    createdAt: new Date().toISOString(),
  };

  // Avoid duplicate recent searches for the exact same query
  const filtered = existing.filter(
    (h) => h.query.trim().toLowerCase() !== item.query.trim().toLowerCase()
  );
  const updated = [created, ...filtered].slice(0, 50);

  safeSetItem(STORAGE_KEYS.SIMILAR_HISTORY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('perfume_similar_history_updated', { detail: updated }));

  // Post to backend
  fetch('/api/similar-perfume/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(created),
  }).catch((err) => console.warn('Failed to save search history to backend:', err));

  return created;
}

export function deleteSimilarHistoryItem(id: string): void {
  const existing = getSimilarHistory();
  const updated = existing.filter((h) => h.id !== id);
  safeSetItem(STORAGE_KEYS.SIMILAR_HISTORY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('perfume_similar_history_updated', { detail: updated }));

  fetch(`/api/similar-perfume/history/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }).catch(() => {});
}

export function clearSimilarHistory(): void {
  safeSetItem(STORAGE_KEYS.SIMILAR_HISTORY, JSON.stringify([]));
  window.dispatchEvent(new CustomEvent('perfume_similar_history_updated', { detail: [] }));

  fetch('/api/similar-perfume/history', {
    method: 'DELETE',
  }).catch(() => {});
}

