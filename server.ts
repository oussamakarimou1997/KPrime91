import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { findInEncyclopedia } from './src/data/fragranceEncyclopedia.ts';
import { searchAndExtractWebPerfume } from './src/services/webFragranceSearch.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Persistent Data Storage Directory & Helpers
const DATA_DIR = path.join(process.cwd(), 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const PERFUMES_FILE = path.join(DATA_DIR, 'perfumes.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const SALESMEN_FILE = path.join(DATA_DIR, 'salesmen.json');
const SIMILAR_HISTORY_FILE = path.join(DATA_DIR, 'similar_history.json');
const CHAT_MESSAGES_FILE = path.join(DATA_DIR, 'chat_messages.json');
const CHAT_READ_FILE = path.join(DATA_DIR, 'chat_read.json');
const TEAM_USERS_FILE = path.join(DATA_DIR, 'team_users.json');
const OIL_RECORDS_FILE = path.join(DATA_DIR, 'oil_records.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJsonFileSync<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf-8');
      return fallback;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!raw.trim()) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
}

function writeJsonFileSync<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'Kprime',
    geminiAvailable: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// 1. Persistent Mixing History Endpoints
// ==========================================
app.get('/api/history', (req, res) => {
  const history = readJsonFileSync<any[]>(HISTORY_FILE, []);
  res.json({ history, count: history.length });
});

app.post('/api/history', (req, res) => {
  try {
    const newFormula = req.body;
    if (!newFormula || typeof newFormula !== 'object') {
      return res.status(400).json({ error: 'Valid formula object required.' });
    }

    const history = readJsonFileSync<any[]>(HISTORY_FILE, []);
    const formulaWithId = {
      ...newFormula,
      id: newFormula.id || `form_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: newFormula.createdAt || new Date().toISOString(),
    };

    // Prepend to persistent history (most recent first)
    const updated = [formulaWithId, ...history.filter((h: any) => h.id !== formulaWithId.id)];
    writeJsonFileSync(HISTORY_FILE, updated);

    res.json({ success: true, formula: formulaWithId, count: updated.length });
  } catch (err: any) {
    console.error('Failed to save formula to history:', err);
    res.status(500).json({ error: err?.message || 'Failed to save formula' });
  }
});

app.post('/api/history/sync', (req, res) => {
  try {
    const { history } = req.body;
    if (!Array.isArray(history)) {
      return res.status(400).json({ error: 'history array is required' });
    }
    const current = readJsonFileSync<any[]>(HISTORY_FILE, []);
    
    // Merge without duplicates (by id)
    const map = new Map<string, any>();
    // First existing
    current.forEach((item) => {
      if (item && item.id) map.set(item.id, item);
    });
    // Overlay incoming
    history.forEach((item) => {
      if (item && item.id) map.set(item.id, item);
    });

    const merged = Array.from(map.values()).sort((a, b) => {
      const tA = new Date(a.createdAt || 0).getTime();
      const tB = new Date(b.createdAt || 0).getTime();
      return tB - tA;
    });

    writeJsonFileSync(HISTORY_FILE, merged);
    res.json({ success: true, count: merged.length, history: merged });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to sync history' });
  }
});

app.delete('/api/history/:id', (req, res) => {
  try {
    const { id } = req.params;
    const history = readJsonFileSync<any[]>(HISTORY_FILE, []);
    const filtered = history.filter((h: any) => h.id !== id);
    writeJsonFileSync(HISTORY_FILE, filtered);
    res.json({ success: true, count: filtered.length });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete formula' });
  }
});

app.delete('/api/history', (req, res) => {
  try {
    writeJsonFileSync(HISTORY_FILE, []);
    res.json({ success: true, count: 0 });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to clear history' });
  }
});

// ==========================================
// 2. Persistent Perfumes Database Endpoints
// ==========================================
app.get('/api/perfumes', (req, res) => {
  const perfumes = readJsonFileSync<any[]>(PERFUMES_FILE, []);
  res.json({ perfumes, count: perfumes.length });
});

app.post('/api/perfumes/sync', (req, res) => {
  try {
    const { perfumes } = req.body;
    if (!Array.isArray(perfumes)) {
      return res.status(400).json({ error: 'perfumes array required' });
    }
    writeJsonFileSync(PERFUMES_FILE, perfumes);
    res.json({ success: true, count: perfumes.length });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to save perfumes' });
  }
});

// ==========================================
// 3. Persistent App Settings Endpoints
// ==========================================
app.get('/api/settings', (req, res) => {
  const settings = readJsonFileSync<any>(SETTINGS_FILE, null);
  res.json({ settings });
});

app.post('/api/settings', (req, res) => {
  try {
    const { settings } = req.body;
    if (settings) {
      writeJsonFileSync(SETTINGS_FILE, settings);
    }
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to save settings' });
  }
});

// ==========================================
// 4. Persistent Sales Team Endpoints
// ==========================================
app.get('/api/salesmen', (req, res) => {
  const salesmen = readJsonFileSync<any[]>(SALESMEN_FILE, []);
  res.json({ salesmen, count: salesmen.length });
});

app.post('/api/salesmen', (req, res) => {
  try {
    const newSalesman = req.body;
    if (!newSalesman || !newSalesman.name) {
      return res.status(400).json({ error: 'Salesman name is required.' });
    }
    const current = readJsonFileSync<any[]>(SALESMEN_FILE, []);
    const created = {
      id: newSalesman.id || `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newSalesman.name.trim(),
      status: newSalesman.status || 'active',
      createdAt: newSalesman.createdAt || new Date().toISOString(),
      phone: newSalesman.phone || '',
      notes: newSalesman.notes || '',
    };
    const updated = [created, ...current.filter((s: any) => s.id !== created.id)];
    writeJsonFileSync(SALESMEN_FILE, updated);
    res.json({ success: true, salesman: created, count: updated.length });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to add salesman' });
  }
});

app.put('/api/salesmen/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const current = readJsonFileSync<any[]>(SALESMEN_FILE, []);
    const idx = current.findIndex((s: any) => s.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Salesman not found.' });
    }
    current[idx] = { ...current[idx], ...updates, id };
    writeJsonFileSync(SALESMEN_FILE, current);
    res.json({ success: true, salesman: current[idx] });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update salesman' });
  }
});

app.post('/api/salesmen/sync', (req, res) => {
  try {
    const { salesmen } = req.body;
    if (!Array.isArray(salesmen)) {
      return res.status(400).json({ error: 'salesmen array required' });
    }
    writeJsonFileSync(SALESMEN_FILE, salesmen);
    res.json({ success: true, count: salesmen.length });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to sync salesmen' });
  }
});

// ==========================================
// 5. Essential Oil Inventory & Balance Endpoints (oil_records)
// ==========================================
const DEFAULT_OIL_RECORDS = [
  {
    id: 'oil_rec_1',
    date: '2026-10-30',
    oil_name: 'Bergamot Reggio Calabria',
    type: 'consumption',
    quantity: 120,
    amount: 84.0,
    notes: 'Formulation batch B-204 Sauvage Extrait',
    created_at: '2026-10-30T09:15:00.000Z',
    updated_at: '2026-10-30T09:15:00.000Z',
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
    updated_at: '2026-10-30T11:45:00.000Z',
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
    updated_at: '2026-10-29T14:20:00.000Z',
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
    updated_at: '2026-10-29T16:00:00.000Z',
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
    updated_at: '2026-10-28T10:30:00.000Z',
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
    updated_at: '2026-10-25T13:10:00.000Z',
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
    updated_at: '2026-10-22T15:40:00.000Z',
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
    updated_at: '2026-10-15T11:00:00.000Z',
  },
];

app.get('/api/oil-records', (req, res) => {
  try {
    const records = readJsonFileSync<any[]>(OIL_RECORDS_FILE, DEFAULT_OIL_RECORDS);
    // Sort by date descending
    const sorted = [...records].sort((a, b) => {
      const dateA = new Date(a.date || a.created_at || 0).getTime();
      const dateB = new Date(b.date || b.created_at || 0).getTime();
      return dateB - dateA;
    });
    res.json({ records: sorted, count: sorted.length });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch oil records' });
  }
});

app.post('/api/oil-records', (req, res) => {
  try {
    const data = req.body;
    if (!data || !data.oil_name) {
      return res.status(400).json({ error: 'oil_name is required' });
    }

    const current = readJsonFileSync<any[]>(OIL_RECORDS_FILE, DEFAULT_OIL_RECORDS);
    const now = new Date().toISOString();
    const newRecord = {
      id: data.id || `oil_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: data.date || now.split('T')[0],
      oil_name: String(data.oil_name).trim(),
      type: data.type === 'consumption' ? 'consumption' : 'income',
      quantity: Math.max(0, parseFloat(data.quantity) || 0),
      amount: Math.max(0, parseFloat(data.amount) || 0),
      notes: data.notes ? String(data.notes).trim() : '',
      created_at: data.created_at || now,
      updated_at: now,
    };

    const updated = [newRecord, ...current.filter((r: any) => r.id !== newRecord.id)];
    writeJsonFileSync(OIL_RECORDS_FILE, updated);

    res.json({ success: true, record: newRecord, count: updated.length });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to add oil record' });
  }
});

app.delete('/api/oil-records/:id', (req, res) => {
  try {
    const { id } = req.params;
    const current = readJsonFileSync<any[]>(OIL_RECORDS_FILE, DEFAULT_OIL_RECORDS);
    const filtered = current.filter((r: any) => r.id !== id);
    writeJsonFileSync(OIL_RECORDS_FILE, filtered);
    res.json({ success: true, count: filtered.length });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete oil record' });
  }
});

// Intelligent PDF text parsing with Gemini AI fallback
app.post('/api/gemini/parse-pdf-text', async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return res.status(400).json({ error: 'rawText string is required in request body.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server. Using client-side deterministic parsing.',
      });
    }

    const prompt = `You are a specialized perfume database importer.
Extract and parse all perfume entries from the following raw text extracted from a PDF document.
For each perfume, extract:
- code: Perfume code or reference ID (e.g., "PERF-001", "DS-102", "TF-05", etc. If missing, generate a clean sequential code like "P-001")
- name: The perfume name exactly as stated in the text
- notes: Olfactory notes (e.g. "Bergamot, Ambroxan, Pepper, Lavender, Cedar")
- fragrance: Fragrance family or scent type (e.g., "Aromatic Fougere", "Woody Floral", "Oriental Spicy", "Fresh Citrus")
- category: Category or audience (e.g., "Men", "Women", "Unisex", "Niche", "Designer")
- description: Any extra description or accords found in the text

Raw Text extracted from PDF:
"""
${rawText.slice(0, 50000)}
"""

Return a clean JSON array of perfume objects. Do NOT hallucinate entries that are not present.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              code: { type: Type.STRING, description: 'Perfume code/ID' },
              name: { type: Type.STRING, description: 'Perfume name' },
              notes: { type: Type.STRING, description: 'Perfume fragrance notes' },
              fragrance: { type: Type.STRING, description: 'Fragrance family / scent profile' },
              category: { type: Type.STRING, description: 'Category (Men, Women, Unisex, etc.)' },
              description: { type: Type.STRING, description: 'Description or notes' },
            },
            required: ['code', 'name'],
          },
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '[]');
    res.json({ perfumes: parsedJson, count: parsedJson.length });
  } catch (error: any) {
    console.error('Gemini parsing error:', error);
    res.status(500).json({ error: error?.message || 'Failed to parse text with AI' });
  }
});

// ==========================================
// 6. Similar Perfume Search & History Endpoints
// ==========================================

// Research external perfume using authentic fragrance encyclopedia + Gemini AI
app.post('/api/similar-perfume/research', async (req, res) => {
  try {
    const { perfumeName } = req.body;
    if (!perfumeName || typeof perfumeName !== 'string' || !perfumeName.trim()) {
      return res.status(400).json({ error: 'perfumeName string is required.' });
    }

    const trimmedQuery = perfumeName.trim();

    // 1. Primary engine: Check verified high-precision olfactory encyclopedia
    const encyclopediaMatch = findInEncyclopedia(trimmedQuery);
    if (encyclopediaMatch) {
      return res.json({
        profile: {
          query: trimmedQuery,
          name: encyclopediaMatch.name,
          brand: encyclopediaMatch.brand,
          concentration: encyclopediaMatch.concentration,
          fragranceFamily: encyclopediaMatch.fragranceFamily,
          topNotes: encyclopediaMatch.topNotes,
          heartNotes: encyclopediaMatch.heartNotes,
          baseNotes: encyclopediaMatch.baseNotes,
          accords: encyclopediaMatch.accords,
          genderTarget: encyclopediaMatch.genderTarget,
          description: encyclopediaMatch.description,
          confidence: 'high',
          sources: encyclopediaMatch.sources || [
            { title: `${encyclopediaMatch.name} - Fragrance Directory`, uri: 'https://fragrantica.com' },
            { title: `${encyclopediaMatch.brand} Parfums Archive`, uri: 'https://parfumo.net' },
          ],
          verified: true,
          potentialAlternatives: encyclopediaMatch.potentialAlternatives || [],
        },
        source: 'verified-encyclopedia',
      });
    }

    // 2. Real Web Search Engine: Search external web sources (DuckDuckGo, Fragrantica, Parfumo, Basenotes)
    try {
      const webProfile = await searchAndExtractWebPerfume(trimmedQuery);
      if (webProfile) {
        return res.json({
          profile: {
            ...webProfile,
            query: trimmedQuery,
          },
          source: 'live-web-search',
        });
      }
    } catch (webErr) {
      console.warn('[server] Web search extraction error:', webErr);
    }

    // 3. Supplementary AI Grounding: If web parser was inconclusive and Gemini is configured
    const ai = getGeminiClient();
    if (ai) {
      try {
        const prompt = `You are a world-class master perfumer and olfactory chemist.
The user is researching the fragrance: "${trimmedQuery}".
Search the web (Fragrantica, Parfumo, Basenotes, official perfume houses) to verify its exact olfactory breakdown.

Extract:
1. Exact commercial perfume name
2. Brand / Perfume house
3. Concentration (e.g. Eau de Parfum, Eau de Toilette, Extrait de Parfum, Cologne)
4. Olfactory fragrance family (e.g. Woody Aromatic, Amber Spicy, Fresh Citrus Aquatic, Floral Fruity, Oriental Fougere)
5. Top notes (list of specific individual notes)
6. Heart / Middle notes (list of specific individual notes)
7. Base notes (list of specific individual notes)
8. Main accords (e.g. Woody, Citrus, Aromatic, Warm Spicy, Fresh Spicy, Powdery, Sweet, Floral, Amber)
9. Target gender / audience (Men, Women, or Unisex)
10. A concise 1-2 sentence description of the scent evolution
11. If ambiguous or if multiple editions exist (e.g., EDT vs EDP vs Parfum vs Elixir), list the identified version and up to 3 potential alternative editions in "potentialAlternatives".

Format your response strictly as a JSON block inside \`\`\`json \`\`\`:
{
  "name": "Full Perfume Name",
  "brand": "Brand Name",
  "concentration": "Eau de Parfum",
  "fragranceFamily": "Woody Aromatic",
  "topNotes": ["Bergamot", "Grapefruit", "Mint"],
  "heartNotes": ["Ginger", "Nutmeg", "Jasmine"],
  "baseNotes": ["Cedarwood", "Incense", "Amber", "Sandalwood"],
  "accords": ["Woody", "Citrus", "Aromatic", "Warm Spicy"],
  "genderTarget": "Men",
  "description": "Short olfactory summary",
  "confidence": "high",
  "potentialAlternatives": ["Alternative Edition 1", "Alternative Edition 2"]
}`;

        const geminiRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        const textOutput = geminiRes.text || '';
        
        // Extract web search grounding sources
        const chunks = (geminiRes.candidates?.[0]?.groundingMetadata as any)?.groundingChunks || [];
        const sources: Array<{ title: string; uri: string }> = [];
        for (const chunk of chunks) {
          if (chunk.web?.uri) {
            sources.push({
              title: chunk.web.title || chunk.web.uri,
              uri: chunk.web.uri,
            });
          }
        }

        // Parse JSON from textOutput
        let parsedProfile: any = null;
        const jsonMatch = textOutput.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            parsedProfile = JSON.parse(jsonMatch[1]);
          } catch (e) {
            console.warn('Failed to parse matched JSON block:', e);
          }
        } else {
          try {
            parsedProfile = JSON.parse(textOutput.trim());
          } catch (e) {
            // direct parse failed
          }
        }

        if (parsedProfile && parsedProfile.name && (parsedProfile.topNotes || parsedProfile.fragranceFamily)) {
          return res.json({
            profile: {
              query: trimmedQuery,
              name: parsedProfile.name || trimmedQuery,
              brand: parsedProfile.brand || 'Fragrance House',
              concentration: parsedProfile.concentration || 'Eau de Parfum',
              fragranceFamily: parsedProfile.fragranceFamily || 'Aromatic / Woody',
              topNotes: Array.isArray(parsedProfile.topNotes) ? parsedProfile.topNotes : [],
              heartNotes: Array.isArray(parsedProfile.heartNotes) ? parsedProfile.heartNotes : [],
              baseNotes: Array.isArray(parsedProfile.baseNotes) ? parsedProfile.baseNotes : [],
              accords: Array.isArray(parsedProfile.accords) ? parsedProfile.accords : ['Woody', 'Aromatic'],
              genderTarget: parsedProfile.genderTarget || 'Unisex',
              description: parsedProfile.description || `Olfactory profile for ${parsedProfile.name}.`,
              confidence: parsedProfile.confidence || 'high',
              sources: sources.length > 0 ? sources.slice(0, 5) : [{ title: 'Web Fragrance Research', uri: 'https://fragrantica.com' }],
              verified: true,
              potentialAlternatives: parsedProfile.potentialAlternatives || [],
            },
            source: 'gemini-web-grounding',
          });
        }
      } catch (geminiError) {
        console.warn('Gemini web search failed or rate-limited:', geminiError);
      }
    }

    // 4. Strict failure: Only after ALL search and fallback methods fail
    return res.status(404).json({
      error: `Perfume not confidently identified. Try adding the brand name (e.g. "${trimmedQuery} Lalique" or "Dior Sauvage").`,
    });
  } catch (error: any) {
    console.error('Similar perfume research error:', error);
    res.status(500).json({ error: error?.message || 'Failed to research perfume profile.' });
  }
});

// History endpoints for Similar Perfume Searches
app.get('/api/similar-perfume/history', (req, res) => {
  const history = readJsonFileSync<any[]>(SIMILAR_HISTORY_FILE, []);
  res.json({ history, count: history.length });
});

app.post('/api/similar-perfume/history', (req, res) => {
  try {
    const item = req.body;
    if (!item || typeof item !== 'object' || !item.query) {
      return res.status(400).json({ error: 'Valid history item required.' });
    }

    const history = readJsonFileSync<any[]>(SIMILAR_HISTORY_FILE, []);
    const itemWithId = {
      ...item,
      id: item.id || `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: item.createdAt || new Date().toISOString(),
    };

    // Keep most recent 50 searches, avoid immediate duplicate queries
    const filtered = history.filter((h: any) => h.id !== itemWithId.id && h.query?.toLowerCase() !== itemWithId.query?.toLowerCase());
    const updated = [itemWithId, ...filtered].slice(0, 50);

    writeJsonFileSync(SIMILAR_HISTORY_FILE, updated);
    res.json({ success: true, item: itemWithId, count: updated.length });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to save search history' });
  }
});

app.delete('/api/similar-perfume/history/:id', (req, res) => {
  try {
    const { id } = req.params;
    const history = readJsonFileSync<any[]>(SIMILAR_HISTORY_FILE, []);
    const updated = history.filter((h: any) => h.id !== id);
    writeJsonFileSync(SIMILAR_HISTORY_FILE, updated);
    res.json({ success: true, count: updated.length });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete search item' });
  }
});

app.delete('/api/similar-perfume/history', (req, res) => {
  try {
    writeJsonFileSync(SIMILAR_HISTORY_FILE, []);
    res.json({ success: true, count: 0 });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to clear search history' });
  }
});

// ==========================================
// 7. Team Identity, Authorization & Team Chat
// ==========================================

interface TeamUser {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarColor: string;
  status: 'active' | 'inactive';
  code?: string;
  phone?: string;
}

const DEFAULT_TEAM_USERS: TeamUser[] = [
  {
    id: 'usr_ahmed',
    name: 'Ahmed El Mansouri',
    role: 'Master Formulator',
    email: 'ahmed@kprime.ma',
    avatarColor: '#059669', // Emerald
    status: 'active',
    code: 'AEM',
    phone: '+212 661-234567',
  },
  {
    id: 'usr_youssef',
    name: 'Youssef Alami',
    role: 'Senior Formulator',
    email: 'youssef@kprime.ma',
    avatarColor: '#0d9488', // Teal
    status: 'active',
    code: 'YSA',
    phone: '+212 662-345678',
  },
  {
    id: 'usr_omar',
    name: 'Omar Bennani',
    role: 'Perfume Specialist',
    email: 'omar@kprime.ma',
    avatarColor: '#d97706', // Amber
    status: 'active',
    code: 'OBN',
    phone: '+212 663-456789',
  },
  {
    id: 'usr_fatima',
    name: 'Fatima Zahra',
    role: 'Atelier Manager',
    email: 'fatima@kprime.ma',
    avatarColor: '#7c3aed', // Purple
    status: 'active',
    code: 'FZH',
    phone: '+212 664-567890',
  },
  {
    id: 'usr_karim',
    name: 'Karim Bennani',
    role: 'Laboratory Director',
    email: 'karim@kprime.ma',
    avatarColor: '#2563eb', // Blue
    status: 'active',
    code: 'KBN',
    phone: '+212 665-010203',
  },
];

const SHARED_GROUP_ID = 'kprime-team-group';
const SHARED_GROUP_NAME = 'Kprime Team Group Chat';

const DEFAULT_CHAT_MESSAGES = [
  {
    id: 'msg_init_1',
    conversationId: SHARED_GROUP_ID,
    conversationName: SHARED_GROUP_NAME,
    senderId: 'usr_fatima',
    senderName: 'Fatima Zahra',
    senderRole: 'Atelier Manager',
    senderAvatar: '#7c3aed',
    content: 'Welcome team to the Kprime Team Group Chat! All Sales Men and compounding formulators share this single live group conversation for formulation coordination, inventory updates, and atelier requests.',
    createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    updatedAt: null,
    isEdited: false,
    isDeleted: false,
  },
  {
    id: 'msg_init_2',
    conversationId: SHARED_GROUP_ID,
    conversationName: SHARED_GROUP_NAME,
    senderId: 'usr_ahmed',
    senderName: 'Ahmed El Mansouri',
    senderRole: 'Master Formulator',
    senderAvatar: '#059669',
    content: 'Good morning Fatima. The 36ml Sauvage batch with 30% concentration has been tested. Clean maturation and perfect sillage.',
    createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    updatedAt: null,
    isEdited: false,
    isDeleted: false,
  },
  {
    id: 'msg_init_3',
    conversationId: SHARED_GROUP_ID,
    conversationName: SHARED_GROUP_NAME,
    senderId: 'usr_youssef',
    senderName: 'Youssef Alami',
    senderRole: 'Senior Formulator',
    senderAvatar: '#0d9488',
    content: 'Excellent! Testing the 2-oils blend (Aventus 60% + Invictus 40%) for our VIP client. Compounding is looking top tier.',
    createdAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    updatedAt: null,
    isEdited: false,
    isDeleted: false,
  },
];

function getSharedGroupMessages(): any[] {
  const allMessages = readJsonFileSync<any[]>(CHAT_MESSAGES_FILE, DEFAULT_CHAT_MESSAGES);
  let changed = false;
  const migrated = allMessages.map((m) => {
    if (!m.conversationId || m.conversationId !== SHARED_GROUP_ID) {
      changed = true;
      return {
        ...m,
        conversationId: SHARED_GROUP_ID,
        conversationName: SHARED_GROUP_NAME,
      };
    }
    return m;
  });

  if (changed) {
    writeJsonFileSync(CHAT_MESSAGES_FILE, migrated);
  }
  return migrated;
}

function getTeamUsers(): TeamUser[] {
  const users = readJsonFileSync<TeamUser[]>(TEAM_USERS_FILE, DEFAULT_TEAM_USERS);
  // Also sync with salesmen in SALESMEN_FILE if any new ones were added
  const salesmen = readJsonFileSync<any[]>(SALESMEN_FILE, []);
  let changed = false;
  salesmen.forEach((sm) => {
    if (sm && sm.name) {
      const existing = users.find((u) => u.id === sm.id || u.name.toLowerCase() === sm.name.toLowerCase());
      if (!existing) {
        users.push({
          id: sm.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: sm.name,
          role: 'Formulator',
          email: sm.email || `${sm.name.toLowerCase().replace(/\s+/g, '.')}@kprime.ma`,
          avatarColor: '#059669',
          status: sm.status === 'inactive' ? 'inactive' : 'active',
          code: sm.code || sm.name.slice(0, 3).toUpperCase(),
          phone: sm.phone || '',
        });
        changed = true;
      }
    }
  });
  if (changed) {
    writeJsonFileSync(TEAM_USERS_FILE, users);
  }
  return users;
}

// SSE Real-Time Clients Registry
interface SSEClient {
  id: string;
  res: express.Response;
  userId: string;
}
const sseClients = new Map<string, SSEClient>();

function broadcastChatEvent(eventName: string, data: any) {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const [clientId, client] of Array.from(sseClients.entries())) {
    try {
      client.res.write(payload);
    } catch {
      sseClients.delete(clientId);
    }
  }
}

// Keep-alive heartbeat every 25 seconds
setInterval(() => {
  for (const [clientId, client] of Array.from(sseClients.entries())) {
    try {
      client.res.write(': keepalive\n\n');
    } catch {
      sseClients.delete(clientId);
    }
  }
}, 25000);

function createAuthToken(user: TeamUser): string {
  const payload = {
    id: user.id,
    name: user.name,
    role: user.role,
    issuedAt: Date.now(),
  };
  return `kp.${user.id}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}`;
}

function verifyAuthToken(rawHeaderOrToken: string | undefined): TeamUser | null {
  if (!rawHeaderOrToken) return null;
  const token = rawHeaderOrToken.replace(/^Bearer\s+/i, '').trim();
  if (!token.startsWith('kp.')) return null;
  const parts = token.split('.');
  if (parts.length < 3) return null;
  const userId = parts[1];
  const users = getTeamUsers();
  const user = users.find((u) => u.id === userId && u.status === 'active');
  return user || null;
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization || (req.query.token as string);
  const user = verifyAuthToken(authHeader);
  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized: Valid authenticated team session required.',
    });
  }
  (req as any).user = user;
  next();
}

// --- Auth Endpoints ---

// List all authorized users
app.get('/api/auth/users', (req, res) => {
  const users = getTeamUsers();
  res.json({ users });
});

// Authenticate / Login as an authorized user
app.post('/api/auth/login', (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required for team login' });
    }
    const users = getTeamUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'Team member account not found in Kprime registry' });
    }
    if (user.status === 'inactive') {
      return res.status(403).json({ error: 'This team account is currently deactivated.' });
    }

    const token = createAuthToken(user);
    res.json({ success: true, token, user });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Login failed' });
  }
});

// Validate current token
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: (req as any).user });
});

// --- Chat Real-Time SSE Stream Endpoint ---
app.get('/api/chat/stream', (req, res) => {
  const token = (req.query.token as string) || req.headers.authorization;
  const user = verifyAuthToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Access to real-time team stream denied.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  sseClients.set(clientId, { id: clientId, res, userId: user.id });

  // Initial connection handshake event
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, userId: user.id, time: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    sseClients.delete(clientId);
  });
});

// --- Chat Messages Endpoints ---

// Get message history (chronological, paginated for the single shared team group)
app.get('/api/chat/messages', requireAuth, (req, res) => {
  try {
    const allMessages = getSharedGroupMessages();
    const limit = Math.min(100, Math.max(10, parseInt((req.query.limit as string) || '50', 10)));
    const before = req.query.before as string | undefined;

    // Sort chronologically (oldest to newest)
    const sorted = [...allMessages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    let filtered = sorted;
    if (before) {
      const beforeTime = new Date(before).getTime();
      filtered = sorted.filter((m) => new Date(m.createdAt).getTime() < beforeTime);
    }

    // Return the latest `limit` messages from the slice
    const sliced = filtered.slice(-limit);
    const hasMore = filtered.length > sliced.length;

    res.json({
      conversationId: SHARED_GROUP_ID,
      conversationName: SHARED_GROUP_NAME,
      messages: sliced,
      totalCount: allMessages.length,
      hasMore,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch messages' });
  }
});

// Send a new message to the shared group conversation
app.post('/api/chat/messages', requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const { content } = req.body;
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }

    const allMessages = getSharedGroupMessages();
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      conversationId: SHARED_GROUP_ID,
      conversationName: SHARED_GROUP_NAME,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role || 'Team Member',
      senderAvatar: user.avatarColor || '#059669',
      content: content.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: null,
      isEdited: false,
      isDeleted: false,
    };

    allMessages.push(newMessage);
    writeJsonFileSync(CHAT_MESSAGES_FILE, allMessages);

    // Broadcast in real-time to all connected users
    broadcastChatEvent('new_message', newMessage);

    res.json({ success: true, message: newMessage });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to send message' });
  }
});

// Edit own message
app.put('/api/chat/messages/:id', requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Updated content cannot be empty' });
    }

    const allMessages = readJsonFileSync<any[]>(CHAT_MESSAGES_FILE, DEFAULT_CHAT_MESSAGES);
    const idx = allMessages.findIndex((m) => m.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const message = allMessages[idx];
    if (message.senderId !== user.id && user.role !== 'Laboratory Director') {
      return res.status(403).json({ error: 'Forbidden: You can only edit your own messages.' });
    }

    if (message.isDeleted) {
      return res.status(400).json({ error: 'Cannot edit a deleted message.' });
    }

    message.content = content.trim();
    message.isEdited = true;
    message.updatedAt = new Date().toISOString();

    allMessages[idx] = message;
    writeJsonFileSync(CHAT_MESSAGES_FILE, allMessages);

    broadcastChatEvent('message_updated', message);
    res.json({ success: true, message });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update message' });
  }
});

// Delete own message (preserves history with soft delete)
app.delete('/api/chat/messages/:id', requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const allMessages = readJsonFileSync<any[]>(CHAT_MESSAGES_FILE, DEFAULT_CHAT_MESSAGES);
    const idx = allMessages.findIndex((m) => m.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const message = allMessages[idx];
    if (message.senderId !== user.id && user.role !== 'Laboratory Director') {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own messages.' });
    }

    message.isDeleted = true;
    message.content = 'This message was deleted';
    message.updatedAt = new Date().toISOString();

    allMessages[idx] = message;
    writeJsonFileSync(CHAT_MESSAGES_FILE, allMessages);

    broadcastChatEvent('message_deleted', message);
    res.json({ success: true, message });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete message' });
  }
});

// Update user last read receipt
app.post('/api/chat/read', requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const reads = readJsonFileSync<Record<string, string>>(CHAT_READ_FILE, {});
    const now = new Date().toISOString();
    reads[user.id] = now;
    writeJsonFileSync(CHAT_READ_FILE, reads);
    res.json({ success: true, lastReadTimestamp: now });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update read status' });
  }
});

// Compute unread messages count for current user
app.get('/api/chat/unread-count', requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const reads = readJsonFileSync<Record<string, string>>(CHAT_READ_FILE, {});
    const lastRead = reads[user.id] || new Date(0).toISOString();
    const allMessages = getSharedGroupMessages();

    const unread = allMessages.filter(
      (m) => !m.isDeleted && m.senderId !== user.id && new Date(m.createdAt).getTime() > new Date(lastRead).getTime()
    );

    res.json({ unreadCount: unread.length, lastReadTimestamp: lastRead });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to compute unread count' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kprime Perfume Server running on http://0.0.0.0:${PORT}`);
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer();
