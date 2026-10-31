import { findInEncyclopedia } from '../src/data/fragranceEncyclopedia';
import { searchAndExtractWebPerfume } from '../src/services/webFragranceSearch';

interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
}

type JsonRecord = Record<string, any>;
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
const error = (message: string, status = 400) => json({ error: message }, status);
async function body(request: Request): Promise<JsonRecord> {
  try { return await request.json() as JsonRecord; } catch { throw new Error('Invalid JSON request body'); }
}
async function list(db: D1Database, collection: string): Promise<any[]> {
  const result = await db.prepare('SELECT payload FROM app_records WHERE collection = ? ORDER BY created_at DESC').bind(collection).all<{payload:string}>();
  return result.results.map(row => JSON.parse(row.payload));
}
async function saveMany(db: D1Database, collection: string, items: any[], replace = true) {
  const statements: D1PreparedStatement[] = [];
  if (replace) statements.push(db.prepare('DELETE FROM app_records WHERE collection = ?').bind(collection));
  for (const item of items) {
    if (!item || typeof item !== 'object' || !item.id) continue;
    statements.push(db.prepare('INSERT INTO app_records(collection,id,payload,created_at,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(collection,id) DO UPDATE SET payload=excluded.payload,created_at=excluded.created_at,updated_at=excluded.updated_at')
      .bind(collection, String(item.id), JSON.stringify(item), item.createdAt || null, item.updatedAt || null));
  }
  if (statements.length) await db.batch(statements);
}
async function saveOne(db: D1Database, collection: string, item: any) {
  const id = String(item.id || `${collection}_${crypto.randomUUID()}`);
  const value = { ...item, id, createdAt: item.createdAt || new Date().toISOString() };
  await db.prepare('INSERT INTO app_records(collection,id,payload,created_at,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(collection,id) DO UPDATE SET payload=excluded.payload,created_at=excluded.created_at,updated_at=excluded.updated_at')
    .bind(collection, id, JSON.stringify(value), value.createdAt, value.updatedAt || null).run();
  return value;
}
async function gemini(env: Env, prompt: string, jsonMode = true) {
  if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured in Cloudflare Worker secrets.');
  const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: jsonMode ? { responseMimeType: 'application/json' } : {} }),
  });
  const data: any = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `Gemini request failed (${response.status})`);
  return data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';
    const method = request.method.toUpperCase();
    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': url.origin, 'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS', 'access-control-allow-headers': 'Content-Type,Authorization' } });
    if (!path.startsWith('/api/')) return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not found', { status: 404 });
    if (!env.DB) return error('D1 database binding DB is missing.', 500);

    try {
      if (path === '/api/health' && method === 'GET') return json({ status: 'ok', appName: 'Kprime', geminiAvailable: !!env.GEMINI_API_KEY, storage: 'Cloudflare D1', timestamp: new Date().toISOString() });

      if (path === '/api/perfumes' && method === 'GET') { const perfumes = await list(env.DB, 'perfumes'); return json({ perfumes, count: perfumes.length }); }
      if (path === '/api/perfumes/sync' && method === 'POST') { const b = await body(request); if (!Array.isArray(b.perfumes)) return error('perfumes array required'); await saveMany(env.DB, 'perfumes', b.perfumes); return json({ success: true, count: b.perfumes.length }); }

      if (path === '/api/history' && method === 'GET') { const history = await list(env.DB, 'history'); return json({ history, count: history.length }); }
      if (path === '/api/history' && method === 'POST') { const item = await body(request); if (!item || typeof item !== 'object') return error('Valid formula object required'); const formula = await saveOne(env.DB, 'history', item); return json({ success: true, formula, count: (await list(env.DB, 'history')).length }); }
      if (path === '/api/history/sync' && method === 'POST') { const b = await body(request); if (!Array.isArray(b.history)) return error('history array required'); await saveMany(env.DB, 'history', b.history, false); const history = await list(env.DB, 'history'); return json({ success: true, count: history.length, history }); }
      if (path === '/api/history' && method === 'DELETE') { await env.DB.prepare("DELETE FROM app_records WHERE collection='history'").run(); return json({ success: true, count: 0 }); }
      if (path.startsWith('/api/history/') && method === 'DELETE') { const id = decodeURIComponent(path.slice('/api/history/'.length)); await env.DB.prepare('DELETE FROM app_records WHERE collection=? AND id=?').bind('history', id).run(); return json({ success: true }); }

      if (path === '/api/settings' && method === 'GET') { const row = await env.DB.prepare("SELECT payload FROM app_settings WHERE id='main'").first<{payload:string}>(); return json({ settings: row ? JSON.parse(row.payload) : null }); }
      if (path === '/api/settings' && method === 'POST') { const b = await body(request); if (!b.settings || typeof b.settings !== 'object') return error('settings object required'); await env.DB.prepare("INSERT INTO app_settings(id,payload,updated_at) VALUES('main',?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at").bind(JSON.stringify(b.settings), new Date().toISOString()).run(); return json({ success: true, settings: b.settings }); }

      if (path === '/api/salesmen' && method === 'GET') { const salesmen = await list(env.DB, 'salesmen'); return json({ salesmen, count: salesmen.length }); }
      if (path === '/api/salesmen/sync' && method === 'POST') { const b = await body(request); if (!Array.isArray(b.salesmen)) return error('salesmen array required'); await saveMany(env.DB, 'salesmen', b.salesmen); return json({ success: true, count: b.salesmen.length }); }
      if (path === '/api/salesmen' && method === 'POST') { const item = await body(request); if (!item.name) return error('Salesman name is required'); const salesman = await saveOne(env.DB, 'salesmen', item); return json({ success: true, salesman }); }
      if (path.startsWith('/api/salesmen/') && method === 'PUT') { const id = decodeURIComponent(path.slice('/api/salesmen/'.length)); const updates = await body(request); const rows = await list(env.DB, 'salesmen'); const current = rows.find(s => s.id === id); if (!current) return error('Salesman not found', 404); const salesman = await saveOne(env.DB, 'salesmen', { ...current, ...updates, id }); return json({ success: true, salesman }); }

      if (path === '/api/similar-perfume/history' && method === 'GET') { const history = await list(env.DB, 'similar_history'); return json({ history, count: history.length }); }
      if (path === '/api/similar-perfume/history' && method === 'POST') { const item = await body(request); if (!item.query) return error('Valid history item required'); const old = await list(env.DB, 'similar_history'); const filtered = old.filter(h => h.id !== item.id && h.query?.toLowerCase() !== item.query.toLowerCase()); const saved = await saveOne(env.DB, 'similar_history', item); await saveMany(env.DB, 'similar_history', [saved, ...filtered].slice(0, 50)); return json({ success: true, item: saved }); }
      if (path.startsWith('/api/similar-perfume/history/') && method === 'DELETE') { const id = decodeURIComponent(path.slice('/api/similar-perfume/history/'.length)); await env.DB.prepare('DELETE FROM app_records WHERE collection=? AND id=?').bind('similar_history', id).run(); return json({ success: true }); }
      if (path === '/api/similar-perfume/history' && method === 'DELETE') { await env.DB.prepare("DELETE FROM app_records WHERE collection='similar_history'").run(); return json({ success: true, count: 0 }); }

      if (path === '/api/oil-records' && method === 'GET') {
        try {
          const res = await env.DB.prepare('SELECT * FROM oil_records ORDER BY date DESC, created_at DESC').all<any>();
          return json({ records: res.results, count: res.results.length });
        } catch {
          const fallback = await list(env.DB, 'oil_records');
          return json({ records: fallback, count: fallback.length });
        }
      }
      if (path === '/api/oil-records' && method === 'POST') {
        const item = await body(request);
        if (!item || !item.oil_name) return error('Oil name is required');
        const id = String(item.id || `oil_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
        const now = new Date().toISOString();
        const record = {
          id,
          date: item.date || now.split('T')[0],
          oil_name: String(item.oil_name).trim(),
          type: item.type === 'consumption' ? 'consumption' : 'income',
          quantity: Number(item.quantity) || 0,
          amount: Number(item.amount) || 0,
          notes: item.notes ? String(item.notes).trim() : '',
          unit: item.unit ? String(item.unit) : 'g',
          created_at: now,
          updated_at: now,
        };
        try {
          await env.DB.prepare('INSERT INTO oil_records (id, date, oil_name, type, quantity, amount, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .bind(record.id, record.date, record.oil_name, record.type, record.quantity, record.amount, record.notes, record.created_at, record.updated_at).run();
        } catch {
          await saveOne(env.DB, 'oil_records', record);
        }
        return json({ success: true, record });
      }
      if (path.startsWith('/api/oil-records/') && method === 'DELETE') {
        const id = decodeURIComponent(path.slice('/api/oil-records/'.length));
        try {
          await env.DB.prepare('DELETE FROM oil_records WHERE id = ?').bind(id).run();
        } catch {
          await env.DB.prepare("DELETE FROM app_records WHERE collection='oil_records' AND id=?").bind(id).run();
        }
        return json({ success: true, id });
      }

      if (path === '/api/gemini/parse-pdf-text' && method === 'POST') {
        const b = await body(request); if (typeof b.rawText !== 'string' || !b.rawText.trim()) return error('rawText string is required');
        const prompt = `Extract perfume entries from this PDF text. Return only a JSON array. Each object should have code, name, notes, fragrance, category, description. Do not invent entries.\n\n${b.rawText.slice(0, 50000)}`;
        const parsed = JSON.parse(await gemini(env, prompt)); return json({ perfumes: Array.isArray(parsed) ? parsed : [], count: Array.isArray(parsed) ? parsed.length : 0 });
      }
      if (path === '/api/similar-perfume/research' && method === 'POST') {
        const b = await body(request); if (typeof b.perfumeName !== 'string' || !b.perfumeName.trim()) return error('perfumeName string is required');
        const query = b.perfumeName.trim();
        const match = findInEncyclopedia(query);
        if (match) return json({ profile: { query, name: match.name, brand: match.brand, concentration: match.concentration, fragranceFamily: match.fragranceFamily, topNotes: match.topNotes, heartNotes: match.heartNotes, baseNotes: match.baseNotes, accords: match.accords, genderTarget: match.genderTarget, description: match.description, confidence: 'high', sources: match.sources || [], verified: true, potentialAlternatives: match.potentialAlternatives || [] }, source: 'verified-encyclopedia' });
        try { const webProfile = await searchAndExtractWebPerfume(query); if (webProfile) return json({ profile: { ...webProfile, query }, source: 'live-web-search' }); } catch (e) { console.warn('Web fragrance search failed', e); }
        if (env.GEMINI_API_KEY) {
          const prompt = `Return a JSON object describing the perfume ${query}. Include name, brand, concentration, fragranceFamily, topNotes, heartNotes, baseNotes, accords, genderTarget, description, confidence, sources (array of {title,uri}), potentialAlternatives. If uncertain, say so; do not invent precise note claims.`;
          try { return json({ profile: JSON.parse(await gemini(env, prompt)), source: 'gemini' }); } catch (e) { console.warn('Gemini research fallback failed', e); }
        }
        return error(`Perfume not confidently identified: ${query}. Try adding the brand name.`, 404);
      }
      return error('API route not found', 404);
    } catch (e: any) { console.error('Worker API error', e); return error(e?.message || 'Internal server error', 500); }
  }
};
