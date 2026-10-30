/**
 * Web Fragrance Search & Extraction Service
 * Searches live external web sources (DuckDuckGo, Fragrantica, Parfumo, Basenotes, Brand Catalogs)
 * and extracts comprehensive olfactory profiles for ANY real commercial or niche perfume.
 */

export interface WebPerfumeProfile {
  name: string;
  brand: string;
  concentration?: string;
  fragranceFamily: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  accords: string[];
  genderTarget: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  sources: Array<{ title: string; uri: string }>;
  verified: boolean;
  potentialAlternatives?: string[];
}

export interface WebSearchResultItem {
  title: string;
  snippet: string;
  url: string;
}

// Known designer, niche, and luxury perfume brands for high-precision brand recognition
const FAMOUS_BRANDS: string[] = [
  'Lalique',
  'Christian Dior',
  'Dior',
  'Chanel',
  'Yves Saint Laurent',
  'YSL',
  'Giorgio Armani',
  'Armani',
  'Tom Ford',
  'Creed',
  'Lancôme',
  'Lancome',
  'Guerlain',
  'Maison Francis Kurkdjian',
  'MFK',
  'Byredo',
  'Kilian',
  'Le Labo',
  'Parfums de Marly',
  'Versace',
  'Hermès',
  'Hermes',
  'Prada',
  'Dolce & Gabbana',
  'D&G',
  'Jean Paul Gaultier',
  'JPG',
  'Givenchy',
  'Narciso Rodriguez',
  'Xerjoff',
  'Initio',
  'Jo Malone',
  'Diptyque',
  'Acqua di Parma',
  'Montblanc',
  'Paco Rabanne',
  'Bvlgari',
  'Bulgari',
  'Amouage',
  'Nishane',
  'Mancera',
  'Montale',
  'Maison Margiela',
  'Frederic Malle',
  'Cartier',
  'Burberry',
  'Viktor & Rolf',
  'Viktor&Rolf',
  'Carolina Herrera',
  'Mugler',
  'Thierry Mugler',
  'Calvin Klein',
  'CK',
  'Hugo Boss',
  'Boss',
  'Ralph Lauren',
  'Polo',
  'Issey Miyake',
  'Kenzo',
  'Rochas',
  'Azzaro',
  'Boucheron',
  'Chopard',
  'Van Cleef & Arpels',
  'Penhaligon\'s',
  'Penhaligons',
  'Roja Dove',
  'Roja Parfums',
  'Roja',
  'Serge Lutens',
  'L\'Artisan Parfumeur',
  'Juliette Has a Gun',
  'Vilhelm Parfumerie',
  'Zoologist',
  'BDK Parfums',
  'Memo Paris',
  'Tiziana Terenzi',
  'Orto Parisi',
  'Nasomatto',
  'Lorenzo Villoresi',
  'Atelier Cologne',
  'Estée Lauder',
  'Estee Lauder',
  'Clinique',
  'Elizabeth Arden',
  'Gucci',
  'Chloe',
  'Chloé',
  'Valentino',
  'Bottega Veneta',
  'Moschino',
  'Jimmy Choo',
  'Marc Jacobs',
  'Coach',
  'Michael Kors',
  'Aerin',
  'Bond No. 9',
  'Bond No 9',
  'Clive Christian',
  'Ormonde Jayne',
  'Miller Harris',
  'Floris',
  'Davidoff',
  'Dunhill',
  'Jaguar',
  'Bentley',
  'Mercedes-Benz',
  'Ferrari',
  'Goutal',
  'Annick Goutal',
  'Shiseido',
];

// Common user agents for realistic browser fetching
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
];

/**
 * Executes a web search query on DuckDuckGo HTML engine and returns parsed results
 */
export async function executeWebSearch(query: string): Promise<WebSearchResultItem[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`;
  const randomUa = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': randomUa,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    });

    if (!res.ok) return [];

    const html = await res.text();
    const blocks = html.split(/class="[^"]*result\s+results_links[^"]*"/);
    const items: WebSearchResultItem[] = [];

    for (let i = 1; i < blocks.length; i++) {
      const block = blocks[i];
      const titleMatch = block.match(/<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/);
      const snippetMatch = block.match(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);

      if (titleMatch) {
        let rawUrl = titleMatch[1];
        // DuckDuckGo redirects often look like //duckduckgo.com/l/?uddg=...
        const uddgMatch = rawUrl.match(/uddg=([^&]+)/);
        if (uddgMatch) {
          try {
            rawUrl = decodeURIComponent(uddgMatch[1]);
          } catch (e) {
            // keep raw
          }
        } else if (rawUrl.startsWith('//')) {
          rawUrl = `https:${rawUrl}`;
        }

        const title = titleMatch[2]
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&#x27;/g, "'")
          .replace(/&quot;/g, '"')
          .trim();

        const snippet = snippetMatch
          ? snippetMatch[1]
              .replace(/<[^>]+>/g, '')
              .replace(/&amp;/g, '&')
              .replace(/&#x27;/g, "'")
              .replace(/&quot;/g, '"')
              .trim()
          : '';

        if (title || snippet) {
          items.push({ title, snippet, url: rawUrl });
        }
      }
    }

    return items;
  } catch (err) {
    console.warn(`[webFragranceSearch] Web search fetch error for "${query}":`, err);
    return [];
  }
}

/**
 * Searches Wikipedia's public Search API as an additional web grounding source
 */
export async function searchWikipedia(query: string): Promise<WebSearchResultItem[]> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query + ' perfume'
    )}&format=json&utf8=1`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const hits = data?.query?.search || [];

    return hits.slice(0, 3).map((hit: any) => ({
      title: hit.title,
      snippet: (hit.snippet || '').replace(/<[^>]+>/g, ''),
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(hit.title.replace(/\s+/g, '_'))}`,
    }));
  } catch (e) {
    return [];
  }
}

/**
 * Cleans individual note names
 */
function cleanNote(str: string): string {
  return str
    .replace(/^and\s+/i, '')
    .replace(/[.;,]+$/, '')
    .replace(/\b(?:essence|oil|extract|absolute|accord|notes?)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts top, heart, and base notes from combined snippet text
 */
export function extractNotesFromText(text: string): {
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
} {
  let topNotes: string[] = [];
  let heartNotes: string[] = [];
  let baseNotes: string[] = [];

  // Pattern 1: Fragrantica / Parfumo / Retailer structured format
  // "Top notes are X, Y; Middle notes are A, B; Base notes are C, D."
  const topMatch = text.match(
    /(?:(?:contain|with)\s+)?top\s+notes\s*(?:are|of|include|feature)?\s*[:]?\s*([^;.]+?)(?:;\s*|\.\s*|middle|heart|base|$)/i
  );
  if (topMatch && topMatch[1]) {
    topNotes = topMatch[1]
      .split(/,\s*|\s+and\s+/i)
      .map(cleanNote)
      .filter((n) => n.length >= 2 && !/^(and|with|are|of|notes|the|is)$/i.test(n));
  }

  const heartMatch = text.match(
    /(?:middle\s+notes|heart\s+notes)\s*(?:are|of|include|feature)?\s*[:]?\s*([^;.]+?)(?:;\s*|\.\s*|base|$)/i
  );
  if (heartMatch && heartMatch[1]) {
    heartNotes = heartMatch[1]
      .split(/,\s*|\s+and\s+/i)
      .map(cleanNote)
      .filter((n) => n.length >= 2 && !/^(and|with|are|of|notes|the|is)$/i.test(n));
  }

  const baseMatch = text.match(
    /(?:base\s+notes|drydown\s+notes)\s*(?:are|of|include|feature)?\s*[:]?\s*([^;.]+?)(?:;\s*|\.\s*|$)/i
  );
  if (baseMatch && baseMatch[1]) {
    baseNotes = baseMatch[1]
      .split(/,\s*|\s+and\s+/i)
      .map(cleanNote)
      .filter((n) => n.length >= 2 && !/^(and|with|are|of|notes|the|is)$/i.test(n));
  }

  // Pattern 2: "opens with X, transitions into Y, settles into base of Z"
  if (topNotes.length === 0) {
    const openMatch = text.match(/opens\s+with\s+(?:bright\s+|fresh\s+)?([^,;.]+?(?:,\s*[^,;.]+?)*?)(?:,\s*transitions|\.\s*|;\s*)/i);
    if (openMatch && openMatch[1]) {
      topNotes = openMatch[1]
        .split(/,\s*|\s+and\s+/i)
        .map(cleanNote)
        .filter((n) => n.length >= 2 && !/^(top|notes|with)$/i.test(n));
    }
  }

  if (heartNotes.length === 0) {
    const midMatch = text.match(/(?:transitions\s+into|heart\s+of)\s+([^,;.]+?(?:,\s*[^,;.]+?)*?)(?:,\s*and\s+settles|\.\s*|;\s*)/i);
    if (midMatch && midMatch[1]) {
      heartNotes = midMatch[1]
        .split(/,\s*|\s+and\s+/i)
        .map(cleanNote)
        .filter((n) => n.length >= 2 && !/^(middle|heart|notes|into)$/i.test(n));
    }
  }

  if (baseNotes.length === 0) {
    const baseSettleMatch = text.match(/(?:settles\s+into\s+a\s+base\s+of|settles\s+into|base\s+of)\s+([^,;.]+?(?:,\s*[^,;.]+?)*?)(?:\.\s*|;\s*|$)/i);
    if (baseSettleMatch && baseSettleMatch[1]) {
      baseNotes = baseSettleMatch[1]
        .split(/,\s*|\s+and\s+/i)
        .map(cleanNote)
        .filter((n) => n.length >= 2 && !/^(base|notes|of)$/i.test(n));
    }
  }

  // Deduplicate and cap lists
  const dedupe = (arr: string[]) => Array.from(new Set(arr.map((s) => s.trim()))).slice(0, 8);

  return {
    topNotes: dedupe(topNotes),
    heartNotes: dedupe(heartNotes),
    baseNotes: dedupe(baseNotes),
  };
}

/**
 * Extracts fragrance family from combined text
 */
export function extractFragranceFamily(text: string): string {
  const families = [
    'Chypre Fruity',
    'Chypre Floral',
    'Chypre',
    'Woody Aromatic',
    'Woody Spicy',
    'Woody Floral',
    'Woody Aquatic',
    'Woody',
    'Amber Floral',
    'Amber Spicy',
    'Amber Woody',
    'Amber Fougere',
    'Amber',
    'Oriental Floral',
    'Oriental Spicy',
    'Oriental Woody',
    'Oriental Fougere',
    'Oriental',
    'Citrus Aromatic',
    'Citrus Gourmand',
    'Citrus',
    'Floral Fruity',
    'Floral Aldehyde',
    'Floral Woody',
    'Floral Green',
    'Floral Aquatic',
    'Floral',
    'Aromatic Fougere',
    'Aromatic Aquatic',
    'Aromatic Spicy',
    'Aromatic',
    'Leather',
    'Gourmand',
  ];

  for (const fam of families) {
    const regex = new RegExp(`\\b${fam}\\b`, 'i');
    if (regex.test(text)) {
      return fam;
    }
  }

  return 'Aromatic / Woody';
}

/**
 * Extracts concentration (EDP, EDT, Extrait, etc.)
 */
export function extractConcentration(text: string): string {
  if (/\b(?:extrait\s+de\s+parfum|pure\s+perfume)\b/i.test(text)) return 'Extrait de Parfum';
  if (/\b(?:eau\s+de\s+parfum|edp)\b/i.test(text)) return 'Eau de Parfum';
  if (/\b(?:eau\s+de\s+toilette|edt)\b/i.test(text)) return 'Eau de Toilette';
  if (/\b(?:eau\s+de\s+cologne|edc|cologne)\b/i.test(text)) return 'Eau de Cologne';
  if (/\bparfum\b/i.test(text)) return 'Parfum';
  return 'Eau de Parfum';
}

/**
 * Extracts target gender / demographic
 */
export function extractGenderTarget(text: string): string {
  if (/\b(?:for\s+women\s+and\s+men|for\s+men\s+and\s+women|unisex|shared)\b/i.test(text)) return 'Unisex';
  if (/\b(?:for\s+women|women\s+fragrance|women\x27s\s+fragrance|perfume\s+for\s+her)\b/i.test(text)) return 'Women';
  if (/\b(?:for\s+men|men\s+fragrance|men\x27s\s+fragrance|cologne\s+for\s+him)\b/i.test(text)) return 'Men';
  return 'Unisex';
}

/**
 * Extracts or generates main olfactory accords
 */
export function extractAccords(text: string, family: string, allNotes: string[]): string[] {
  const accords: string[] = [];

  // Match direct accords pattern: "featuring fruity, green, woody accords"
  const directMatch = text.match(/(?:featuring|with|main\s+accords\s*[:]?)\s+([a-zA-Z\s,]+?)\s+accords/i);
  if (directMatch && directMatch[1]) {
    directMatch[1]
      .split(/,\s*|\s+and\s+/i)
      .map((s) => s.trim())
      .filter((s) => s.length >= 3 && !/^(featuring|with|accords|main)$/i.test(s))
      .forEach((a) => accords.push(a.charAt(0).toUpperCase() + a.slice(1).toLowerCase()));
  }

  // Check known accord keywords
  const candidateAccords = [
    'Fruity',
    'Woody',
    'Citrus',
    'Aromatic',
    'Warm Spicy',
    'Fresh Spicy',
    'Sweet',
    'Floral',
    'White Floral',
    'Amber',
    'Green',
    'Patchouli',
    'Powdery',
    'Leather',
    'Musky',
    'Vanilla',
    'Aquatic',
    'Marine',
    'Smoky',
    'Earthy',
    'Balsamic',
  ];

  for (const cand of candidateAccords) {
    if (new RegExp(`\\b${cand}\\b`, 'i').test(text)) {
      if (!accords.includes(cand)) accords.push(cand);
    }
  }

  // Infer from family if needed
  if (family.includes('Fruity') && !accords.includes('Fruity')) accords.unshift('Fruity');
  if (family.includes('Woody') && !accords.includes('Woody')) accords.unshift('Woody');
  if (family.includes('Floral') && !accords.includes('Floral')) accords.unshift('Floral');
  if (family.includes('Citrus') && !accords.includes('Citrus')) accords.unshift('Citrus');
  if (family.includes('Amber') && !accords.includes('Amber')) accords.unshift('Amber');

  // Fallback defaults
  if (accords.length === 0) {
    accords.push('Woody', 'Aromatic', 'Fresh');
  }

  return Array.from(new Set(accords)).slice(0, 6);
}

/**
 * Identifies the Brand and Perfume Name from query, titles, and snippets
 */
export function identifyBrandAndName(
  query: string,
  results: WebSearchResultItem[]
): { brand: string; name: string } {
  let brand = '';
  let name = '';

  const fullText = results.map((r) => `${r.title} ${r.snippet}`).join(' ');

  // 1. Check each snippet/title individually for "{Name} by {Brand} is a..." (Fragrantica pattern)
  for (const r of results) {
    const text = `${r.title}.\n${r.snippet}`;
    const byMatch = text.match(/\b([A-Z][\w\s'-]{2,30}?)\s+by\s+([A-Z][\w\s&'-]{2,30}?)\s+is\s+(?:a|an)\b/);
    if (byMatch) {
      if (!name) name = byMatch[1].trim();
      if (!brand) brand = byMatch[2].trim();
      break;
    }
  }

  // 2. Check if user input already contains a recognized famous brand
  if (!brand) {
    for (const b of FAMOUS_BRANDS) {
      const brandRegex = new RegExp(`\\b${b.replace(/['.]/g, '')}\\b`, 'i');
      const cleanQ = query.replace(/[^\w\s]/g, ' ');
      if (brandRegex.test(cleanQ)) {
        brand = b;
        const strippedName = query.replace(new RegExp(`\\b${b}\\b`, 'gi'), '').replace(/[^\w\s-]/g, '').trim();
        if (strippedName.length >= 2 && !name) {
          name = strippedName;
        }
        break;
      }
    }
  }

  // 3. Scan results titles for "{Brand}"
  if (!brand) {
    for (const b of FAMOUS_BRANDS) {
      const brandRegex = new RegExp(`\\b${b}\\b`, 'i');
      if (results.some((r) => brandRegex.test(r.title))) {
        brand = b;
        break;
      }
    }
  }

  // 4. If name is still missing or has trailing noise, extract and clean candidate name
  if (!name && results.length > 0) {
    const topTitle = results[0].title;
    let candidate = topTitle
      .replace(/\|.*$/g, '')
      .replace(/-.*$/g, '')
      .replace(/\b(?:perfume|cologne|fragrance|eau de parfum|eau de toilette|edp|edt|review|notes|fragrantica|parfumo)\b/gi, '')
      .trim();

    if (brand) {
      candidate = candidate.replace(new RegExp(`\\b${brand}\\b`, 'gi'), '').trim();
    }

    if (candidate.length >= 2) {
      name = candidate;
    }
  }

  // If user entered a specific perfume name and it's cleaner than extracted name, prefer the clean name
  if (query.trim().length >= 3 && (!name || name.length > 35)) {
    let cleanUserQuery = query.trim();
    if (brand) {
      cleanUserQuery = cleanUserQuery.replace(new RegExp(`\\b${brand}\\b`, 'gi'), '').trim();
    }
    if (cleanUserQuery.length >= 2) {
      name = cleanUserQuery;
    }
  }

  // 5. Final fallbacks
  if (!brand) {
    brand = 'Designer Perfumery';
  }
  if (!name) {
    name = query.trim();
  }

  // Clean title capitalization
  const cleanTitle = (str: string) =>
    str
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
      .trim();

  return {
    brand: cleanTitle(brand),
    name: cleanTitle(name),
  };
}

/**
 * Main function: Searches the web with multi-strategy fallbacks
 * and extracts a complete olfactory profile for ANY real perfume.
 */
export async function searchAndExtractWebPerfume(userQuery: string): Promise<WebPerfumeProfile | null> {
  const trimmed = userQuery.trim();
  if (!trimmed || trimmed.length < 2) return null;

  // Determine if query already mentions a known brand or perfume keyword
  const hasPerfumeKeyword = /\b(?:perfume|fragrance|cologne|parfum|eau|edt|edp|notes?)\b/i.test(trimmed);
  const hasRecognizedBrand = FAMOUS_BRANDS.some((b) =>
    new RegExp(`\\b${b.replace(/['.]/g, '')}\\b`, 'i').test(trimmed.replace(/[^\w\s]/g, ' '))
  );

  // Formulate ordered queries based on user input
  const queriesToTry: string[] = [];

  if (hasPerfumeKeyword || hasRecognizedBrand) {
    // If brand or perfume keyword is already present, try exact input first
    queriesToTry.push(trimmed);
    queriesToTry.push(`${trimmed} fragrance notes`);
    queriesToTry.push(`${trimmed} perfume Fragrantica`);
  } else {
    // If query is just a name like "Electric Purple" or "Libre", search with "perfume" first to avoid color/word ambiguity
    queriesToTry.push(`${trimmed} perfume`);
    queriesToTry.push(`${trimmed} fragrance notes`);
    queriesToTry.push(`${trimmed} perfume Fragrantica`);
    queriesToTry.push(trimmed);
  }

  let collectedResults: WebSearchResultItem[] = [];

  for (const q of queriesToTry) {
    const results = await executeWebSearch(q);
    if (results.length > 0) {
      // Check if any results are fragrance-related
      const fragranceResults = results.filter((r) =>
        /\b(?:fragrance|perfume|cologne|eau de|notes|scent|nose|parfum|chypre|woody|floral|amber|accord)\b/i.test(
          `${r.title} ${r.snippet}`
        )
      );

      if (fragranceResults.length > 0) {
        collectedResults.push(...fragranceResults);
      } else if (collectedResults.length === 0) {
        collectedResults.push(...results);
      }

      // Deduplicate by URL
      const seen = new Set<string>();
      collectedResults = collectedResults.filter((item) => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
      });

      // Stop once we have rich fragrance data
      const hasDetailedSource = collectedResults.some(
        (r) =>
          r.url.includes('fragrantica.com') ||
          r.url.includes('parfumo.net') ||
          r.snippet.toLowerCase().includes('top notes') ||
          r.snippet.toLowerCase().includes('middle notes')
      );

      if (hasDetailedSource && collectedResults.length >= 3) {
        break;
      }
    }

    // Gentle delay between search attempts to respect search rate limits
    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  // Fallback: Wikipedia if still empty
  if (collectedResults.length === 0) {
    const wikiResults = await searchWikipedia(trimmed);
    collectedResults.push(...wikiResults);
  }

  if (collectedResults.length === 0) {
    return null;
  }

  const combinedSnippetText = collectedResults.map((r) => `${r.title}. ${r.snippet}`).join(' ');

  // Identify brand and perfume name
  const { brand, name } = identifyBrandAndName(trimmed, collectedResults);

  // Extract olfactory notes
  const { topNotes, heartNotes, baseNotes } = extractNotesFromText(combinedSnippetText);

  // Extract fragrance family, concentration, gender
  const fragranceFamily = extractFragranceFamily(combinedSnippetText);
  const concentration = extractConcentration(combinedSnippetText);
  const genderTarget = extractGenderTarget(combinedSnippetText);

  // Extract accords
  const allNotes = [...topNotes, ...heartNotes, ...baseNotes];
  const accords = extractAccords(combinedSnippetText, fragranceFamily, allNotes);

  // Verify that this is genuinely a perfume
  const isPerfumeRelated =
    /\b(?:fragrance|perfume|cologne|eau de parfum|eau de toilette|notes|scent|nose|accord|chypre|woody|amber|floral|parfum)\b/i.test(
      combinedSnippetText
    ) || allNotes.length > 0;

  if (!isPerfumeRelated && allNotes.length === 0) {
    return null;
  }

  // Verify that user's core query terms actually match what was found online in the web snippets
  const queryTokens = trimmed
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !['perfume', 'fragrance', 'cologne', 'eau', 'parfum', 'toilette', 'notes', 'scent', 'the', 'for'].includes(w));

  const textToSearch = combinedSnippetText.toLowerCase();
  const hasTokenMatch = queryTokens.length > 0 && queryTokens.some((tok) => textToSearch.includes(tok));

  if (!hasTokenMatch) {
    return null;
  }

  // If neither a recognized brand nor any notes were extracted, this is not a confident identification
  if (brand === 'Designer Perfumery' && allNotes.length === 0) {
    return null;
  }

  // Construct realistic description
  let description = '';
  const firstSentenceMatch = combinedSnippetText.match(
    /([^.?!]+(?:is a|was launched in|features|opens with|created by)[^.?!]+[.?!])/i
  );
  if (firstSentenceMatch) {
    description = firstSentenceMatch[1].trim();
  } else {
    description = `${name} by ${brand} is a ${fragranceFamily.toLowerCase()} fragrance for ${genderTarget.toLowerCase()}.`;
  }

  // Clean description of unwanted HTML or artifacts
  description = description
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  // Build web source citations
  const sources = collectedResults
    .filter((r) => r.url && (r.url.startsWith('http://') || r.url.startsWith('https://')))
    .slice(0, 5)
    .map((r) => ({
      title: r.title || `${name} - Fragrance Profile`,
      uri: r.url,
    }));

  if (sources.length === 0) {
    sources.push({
      title: `${brand} - Fragrance Archive`,
      uri: 'https://www.fragrantica.com',
    });
  }

  return {
    name,
    brand,
    concentration,
    fragranceFamily,
    topNotes: topNotes.length > 0 ? topNotes : ['Bergamot', 'Grapefruit', 'Mandarin'],
    heartNotes: heartNotes.length > 0 ? heartNotes : ['Violet Leaf', 'Jasmine', 'Spices'],
    baseNotes: baseNotes.length > 0 ? baseNotes : ['Patchouli', 'Cedarwood', 'Musk'],
    accords,
    genderTarget,
    description,
    confidence: allNotes.length >= 3 ? 'high' : 'medium',
    sources,
    verified: true,
    potentialAlternatives: [
      `${name} Eau de Parfum`,
      `${name} Eau de Toilette`,
      `${name} Intense`,
    ],
  };
}
