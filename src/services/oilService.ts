import { OilRecord } from '../types';

const STORAGE_KEY = 'kprime_oil_records_v1';

export const DEFAULT_SAMPLE_OIL_RECORDS: OilRecord[] = [
  {
    id: 'oil_rec_1',
    date: '2026-10-30',
    oil_name: 'Bergamot Reggio Calabria',
    type: 'consumption',
    quantity: 120,
    amount: 84.0,
    notes: 'Formulation batch B-204 Sauvage Extrait',
    created_at: '2026-10-30T09:15:00.000Z',
  },
  {
    id: 'oil_rec_2',
    date: '2026-10-30',
    oil_name: 'Oud Cambodi Pure Extract',
    type: 'income',
    quantity: 50,
    amount: 350.0,
    notes: 'Client bespoke direct purchase (Mr. Alami)',
    created_at: '2026-10-30T11:45:00.000Z',
  },
  {
    id: 'oil_rec_3',
    date: '2026-10-29',
    oil_name: 'French Lavender Grasse',
    type: 'consumption',
    quantity: 95,
    amount: 47.5,
    notes: 'Dual-oil blend batch #44',
    created_at: '2026-10-29T14:20:00.000Z',
  },
  {
    id: 'oil_rec_4',
    date: '2026-10-29',
    oil_name: 'Rose Damascena Absolu',
    type: 'income',
    quantity: 100,
    amount: 480.0,
    notes: 'Wholesale delivery to VIP partner atelier',
    created_at: '2026-10-29T16:00:00.000Z',
  },
  {
    id: 'oil_rec_5',
    date: '2026-10-28',
    oil_name: 'Virginian Cedarwood',
    type: 'consumption',
    quantity: 200,
    amount: 62.0,
    notes: 'Base notes maceration for Woody Aromatic line',
    created_at: '2026-10-28T10:30:00.000Z',
  },
  {
    id: 'oil_rec_6',
    date: '2026-10-25',
    oil_name: 'Ambroxan Crystal Dilution',
    type: 'consumption',
    quantity: 150,
    amount: 112.5,
    notes: 'Fixative compounding for amber accords',
    created_at: '2026-10-25T13:10:00.000Z',
  },
  {
    id: 'oil_rec_7',
    date: '2026-10-22',
    oil_name: 'Italian Mandarine Essence',
    type: 'income',
    quantity: 250,
    amount: 195.0,
    notes: 'Retail bottle customization order',
    created_at: '2026-10-22T15:40:00.000Z',
  },
  {
    id: 'oil_rec_8',
    date: '2026-10-15',
    oil_name: 'Mysore Sandalwood Oil',
    type: 'income',
    quantity: 60,
    amount: 520.0,
    notes: 'Pure oil concentrate 60ml vial sale',
    created_at: '2026-10-15T11:00:00.000Z',
  },
];

export function getCachedOilRecords(): OilRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SAMPLE_OIL_RECORDS));
      return DEFAULT_SAMPLE_OIL_RECORDS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SAMPLE_OIL_RECORDS;
  } catch (err) {
    console.error('Failed reading cached oil records:', err);
    return DEFAULT_SAMPLE_OIL_RECORDS;
  }
}

export function saveCachedOilRecords(records: OilRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent('kprime_oil_records_updated', { detail: records }));
  } catch (err) {
    console.error('Failed saving cached oil records:', err);
  }
}

/**
 * Fetch records from API (`GET /api/oil-records`)
 * Falls back to local cached records if offline or error
 */
export async function fetchOilRecords(): Promise<OilRecord[]> {
  try {
    const res = await fetch('/api/oil-records');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && Array.isArray(data.records)) {
      saveCachedOilRecords(data.records);
      return data.records;
    }
  } catch (err) {
    console.warn('Backend fetch /api/oil-records failed, using local cache:', err);
  }
  return getCachedOilRecords();
}

/**
 * Add a new record (`POST /api/oil-records`)
 */
export async function addOilRecord(
  recordData: Omit<OilRecord, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): Promise<OilRecord> {
  const now = new Date().toISOString();
  const newRecord: OilRecord = {
    id: recordData.id || `oil_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    date: recordData.date || now.split('T')[0],
    oil_name: recordData.oil_name.trim(),
    type: recordData.type,
    quantity: Math.max(0, Number(recordData.quantity) || 0),
    amount: Math.max(0, Number(recordData.amount) || 0),
    notes: recordData.notes?.trim() || '',
    unit: recordData.unit || 'ml',
    created_at: now,
    updated_at: now,
  };

  // Immediate local update for zero latency
  const current = getCachedOilRecords();
  const updated = [newRecord, ...current.filter((r) => r.id !== newRecord.id)];
  saveCachedOilRecords(updated);

  // Sync to API
  try {
    const res = await fetch('/api/oil-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord),
    });
    if (res.ok) {
      const result = await res.json();
      if (result.record) {
        return result.record;
      }
    }
  } catch (err) {
    console.warn('Failed syncing new record to /api/oil-records:', err);
  }

  return newRecord;
}

/**
 * Delete a record (`DELETE /api/oil-records/:id`)
 */
export async function deleteOilRecord(id: string): Promise<boolean> {
  // Immediate local removal
  const current = getCachedOilRecords();
  const updated = current.filter((r) => r.id !== id);
  saveCachedOilRecords(updated);

  // Sync to API
  try {
    const res = await fetch(`/api/oil-records/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn(`Failed deleting record ${id} on server:`, err);
    return true; // Still removed locally
  }
}
