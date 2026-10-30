import * as pdfjsLib from 'pdfjs-dist';
import { Perfume, ExtractedPerfume } from '../types';

// Set up PDF.js worker using CDN
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

export type ExtractedPerfumeDraft = ExtractedPerfume;

export interface PdfParseResult {
  rawText: string;
  perfumes: ExtractedPerfumeDraft[];
  pageCount: number;
  warnings?: string[];
  success: boolean;
  error?: string;
}

/**
 * Extract raw text from uploaded PDF file using pdfjs-dist
 */
export async function extractTextFromPdf(file: File): Promise<{ text: string; pageCount: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;
  let fullText = '';

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Group text items by line (using approximate Y coordinates)
    const items = textContent.items as Array<{ str: string; transform: number[]; hasEOL?: boolean }>;
    
    let lastY: number | null = null;
    let pageLines: string[] = [];
    let currentLine = '';

    for (const item of items) {
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 5) {
        if (currentLine.trim()) {
          pageLines.push(currentLine.trim());
        }
        currentLine = item.str;
      } else {
        currentLine += (currentLine ? ' ' : '') + item.str;
      }
      lastY = y;
    }
    if (currentLine.trim()) {
      pageLines.push(currentLine.trim());
    }

    fullText += pageLines.join('\n') + '\n\n';
  }

  return { text: fullText, pageCount };
}

/**
 * Intelligent deterministic parser for structured perfume text/tables
 */
export function parsePerfumeTextDeterministic(rawText: string): ExtractedPerfumeDraft[] {
  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const results: ExtractedPerfumeDraft[] = [];

  // Strategy 1: Delimited lines (Tab, Pipe |, Semicolon ;, or CSV comma)
  const delimitedLines = lines.filter(
    l => l.includes('\t') || l.includes('|') || l.includes(';') || (l.split(',').length >= 3 && !l.toLowerCase().includes('page'))
  );
  
  if (delimitedLines.length >= 2) {
    for (const line of delimitedLines) {
      let parts: string[] = [];
      if (line.includes('\t')) {
        parts = line.split('\t').map(p => p.trim());
      } else if (line.includes('|')) {
        parts = line.split('|').map(p => p.trim()).filter(Boolean);
      } else if (line.includes(';')) {
        parts = line.split(';').map(p => p.trim());
      } else {
        parts = line.split(',').map(p => p.trim());
      }

      if (parts.length >= 2) {
        // Skip header lines
        const firstPart = parts[0].toLowerCase();
        if (
          firstPart.includes('code') ||
          firstPart.includes('perfume') ||
          firstPart.includes('id') ||
          firstPart.includes('number') ||
          firstPart.includes('ref')
        ) {
          continue;
        }

        const draft = mapPartsToPerfumeDraft(parts, line);
        if (draft.name && draft.name.length > 1) {
          results.push(draft);
        }
      }
    }
  }

  // If Strategy 1 yielded results, return them
  if (results.length > 0) {
    return results;
  }

  // Strategy 2: Label-based blocks (e.g. Code: PERF-01 / Name: Sauvage / Notes: ...)
  let currentDraft: Partial<ExtractedPerfumeDraft> = {};
  for (const line of lines) {
    const lower = line.toLowerCase();
    
    if (lower.startsWith('code:') || lower.startsWith('ref:') || lower.startsWith('item:') || lower.startsWith('no:')) {
      if (currentDraft.name || currentDraft.code) {
        results.push(finalizeDraft(currentDraft));
        currentDraft = {};
      }
      currentDraft.code = line.split(':')[1]?.trim() || '';
    } else if (lower.startsWith('name:') || lower.startsWith('perfume:') || lower.startsWith('fragrance name:')) {
      currentDraft.name = line.split(':')[1]?.trim() || '';
    } else if (lower.startsWith('notes:') || lower.startsWith('scent notes:') || lower.startsWith('olfactory:')) {
      currentDraft.notes = line.split(':')[1]?.trim() || '';
    } else if (lower.startsWith('fragrance:') || lower.startsWith('family:') || lower.startsWith('olfactory family:')) {
      currentDraft.fragrance = line.split(':')[1]?.trim() || '';
    } else if (lower.startsWith('category:') || lower.startsWith('gender:') || lower.startsWith('type:')) {
      currentDraft.category = line.split(':')[1]?.trim() || '';
    } else if (lower.startsWith('brand:') || lower.startsWith('house:')) {
      currentDraft.brand = line.split(':')[1]?.trim() || '';
    } else if (lower.startsWith('description:') || lower.startsWith('details:')) {
      currentDraft.description = line.split(':')[1]?.trim() || '';
    }
  }

  if (currentDraft.name || currentDraft.code) {
    results.push(finalizeDraft(currentDraft));
  }

  if (results.length > 0) {
    return results;
  }

  // Strategy 3: Numbered or sequential items
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(\d+|[A-Z0-9_-]{2,10})[\.\)\-:\s]+([^\-\|\,]+)[\-\|\,]?(.*)$/i);
    if (match && match[2] && match[2].trim().length > 2) {
      const code = match[1].trim();
      const name = match[2].trim();
      const remaining = match[3]?.trim() || '';
      
      results.push({
        code: isNaN(Number(code)) ? code : `PERF-${code.padStart(3, '0')}`,
        name: name,
        notes: remaining,
        fragrance: 'General Fragrance',
        category: 'Unisex',
        originalText: line,
      });
    }
  }

  return results;
}

function mapPartsToPerfumeDraft(parts: string[], originalLine: string): ExtractedPerfumeDraft {
  let code = '';
  let name = '';
  let notes = '';
  let fragrance = 'General Fragrance';
  let category = 'Unisex';
  let description = '';

  if (parts.length >= 4) {
    code = parts[0];
    name = parts[1];
    notes = parts[2];
    fragrance = parts[3];
    category = parts[4] || 'Unisex';
    description = parts.slice(5).join(' - ');
  } else if (parts.length === 3) {
    code = parts[0];
    name = parts[1];
    notes = parts[2];
  } else if (parts.length === 2) {
    code = parts[0];
    name = parts[1];
  }

  if (!code || code.length > 20) {
    if (!name && code) {
      name = code;
      code = 'P-' + Math.floor(100 + Math.random() * 900);
    }
  }

  return {
    code: code.trim(),
    name: name.trim(),
    notes: notes.trim(),
    fragrance: fragrance.trim() || 'General',
    category: category.trim() || 'Unisex',
    description: description.trim(),
    originalText: originalLine,
  };
}

function finalizeDraft(draft: Partial<ExtractedPerfumeDraft>): ExtractedPerfumeDraft {
  return {
    code: draft.code?.trim() || `PERF-${Math.floor(100 + Math.random() * 900)}`,
    name: draft.name?.trim() || 'Untitled Perfume',
    notes: draft.notes?.trim() || '',
    fragrance: draft.fragrance?.trim() || 'General Fragrance',
    category: draft.category?.trim() || 'Unisex',
    brand: draft.brand?.trim(),
    description: draft.description?.trim(),
  };
}

/**
 * AI-assisted smart parser that calls the server-side Gemini endpoint
 */
export async function parsePerfumeWithGemini(rawText: string): Promise<ExtractedPerfumeDraft[]> {
  const response = await fetch('/api/gemini/parse-pdf-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawText }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with status ${response.status}`);
  }

  const data = await response.json();
  if (Array.isArray(data.perfumes)) {
    return data.perfumes.map((p: any, idx: number) => ({
      code: p.code || `PERF-${(idx + 1).toString().padStart(3, '0')}`,
      name: p.name || 'Unnamed Perfume',
      notes: p.notes || '',
      fragrance: p.fragrance || 'General Fragrance',
      category: p.category || 'Unisex',
      description: p.description || '',
      brand: p.brand || '',
    }));
  }

  return [];
}

/**
 * High-level orchestration function to parse any uploaded PDF file
 */
export async function parsePdfFile(file: File): Promise<PdfParseResult> {
  try {
    const { text, pageCount } = await extractTextFromPdf(file);

    if (!text || text.trim().length === 0) {
      return {
        rawText: '',
        perfumes: [],
        pageCount: 0,
        success: false,
        error: 'The PDF document does not contain readable text layers.',
      };
    }

    // Try Gemini server-side AI parsing first
    try {
      const aiResults = await parsePerfumeWithGemini(text);
      if (aiResults && aiResults.length > 0) {
        return {
          rawText: text,
          perfumes: aiResults,
          pageCount,
          success: true,
        };
      }
    } catch (aiErr) {
      console.warn('Gemini AI parsing fallback to deterministic parser:', aiErr);
    }

    // Fallback to local heuristic parser
    const deterministicResults = parsePerfumeTextDeterministic(text);
    if (deterministicResults.length > 0) {
      return {
        rawText: text,
        perfumes: deterministicResults,
        pageCount,
        success: true,
      };
    }

    return {
      rawText: text,
      perfumes: [],
      pageCount,
      success: false,
      error: 'Could not extract structured perfume rows. Please verify your PDF contains perfume codes and names.',
    };
  } catch (err: any) {
    return {
      rawText: '',
      perfumes: [],
      pageCount: 0,
      success: false,
      error: err.message || 'Failed to process PDF file.',
    };
  }
}
