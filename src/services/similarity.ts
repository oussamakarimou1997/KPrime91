import { Perfume, SearchedPerfumeProfile, SimilarMatchResult } from '../types';

// Common olfactory note synonyms & clusters for intelligent matching
const NOTE_SYNONYMS: Record<string, string[]> = {
  bergamot: ['citrus', 'calabrian bergamot', 'bergamote'],
  lemon: ['citrus', 'amalfi lemon', 'sicilian lemon', 'citron'],
  orange: ['mandarin', 'tangerine', 'blood orange', 'bitter orange', 'citrus'],
  grapefruit: ['citrus', 'pamplemousse'],
  cedar: ['cedarwood', 'virginian cedar', 'atlas cedar', 'wood', 'woods'],
  sandalwood: ['sandal', 'mysore sandalwood', 'wood', 'woods'],
  gaiac: ['guaiac', 'guaiac wood', 'gaiac wood', 'wood'],
  vetiver: ['haitian vetiver', 'bourbon vetiver', 'earthy'],
  patchouli: ['indonesian patchouli', 'patchouly', 'earthy'],
  lavender: ['french lavender', 'lavandin', 'aromatic'],
  pepper: ['black pepper', 'pink pepper', 'sichuan pepper', 'white pepper', 'peppery'],
  cardamom: ['guatemalan cardamom', 'green cardamom', 'spicy'],
  cinnamon: ['ceylon cinnamon', 'cassia', 'spicy'],
  vanilla: ['madagascar vanilla', 'bourbon vanilla', 'vanille', 'sweet'],
  tonka: ['tonka bean', 'coumarin', 'sweet'],
  amber: ['ambergris', 'ambroxan', 'cetalox', 'resinous', 'warm amber'],
  musk: ['white musk', 'animalic musk', 'cashmeran'],
  iris: ['orris', 'orris root', 'powdery iris'],
  rose: ['damask rose', 'bulgarian rose', 'may rose', 'turkish rose'],
  jasmine: ['sambac jasmine', 'grandiflorum jasmine'],
  oud: ['agarwood', 'oudh', 'cambodian oud', 'aquilaria'],
  leather: ['suede', 'leathery', 'birch tar', 'cuir'],
  aquatic: ['marine', 'sea notes', 'sea salt', 'calone', 'watery notes', 'ocean'],
  mint: ['peppermint', 'spearmint', 'fresh mint'],
};

// Olfactory accord mapping
const ACCORD_FAMILIES: Record<string, string[]> = {
  woody: ['woody', 'woods', 'cedar', 'sandalwood', 'vetiver', 'oud', 'gaiac', 'patchouli'],
  citrus: ['citrus', 'bergamot', 'lemon', 'orange', 'grapefruit', 'lime', 'mandarin'],
  aromatic: ['aromatic', 'lavender', 'sage', 'rosemary', 'basil', 'mint', 'thyme'],
  fresh: ['fresh', 'fresh spicy', 'clean', 'crisp', 'bright', 'ozonic', 'aquatic'],
  spicy: ['warm spicy', 'fresh spicy', 'spicy', 'pepper', 'cardamom', 'cinnamon', 'ginger'],
  floral: ['floral', 'white floral', 'rose', 'jasmine', 'iris', 'violet', 'neroli'],
  sweet: ['sweet', 'gourmand', 'vanilla', 'tonka', 'caramel', 'chocolate', 'honey'],
  amber: ['amber', 'ambery', 'resinous', 'balsamic', 'benzoin', 'labdanum'],
  earthy: ['earthy', 'mossy', 'oakmoss', 'patchouli', 'vetiver', 'soil'],
  aquatic: ['aquatic', 'marine', 'ozonic', 'salty', 'watery'],
  leather: ['leather', 'smoky', 'suede', 'tobacco', 'animalic'],
};

function normalizeString(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseNoteTokens(text: string): string[] {
  if (!text) return [];
  // Split on commas, bullets, slashes, plus, "and", "with"
  const rawParts = text
    .split(/[,;\n\r\t/•·+|]|\band\b|\bwith\b/gi)
    .map((p) => normalizeString(p))
    .filter((p) => p.length >= 2);

  const tokens = new Set<string>();
  for (const part of rawParts) {
    tokens.add(part);
    // Also include clean individual words if multi-word note (e.g., "Atlas Cedar" -> "cedar", "Pink Pepper" -> "pepper")
    const words = part.split(' ').filter((w) => w.length >= 3);
    for (const w of words) {
      if (!['and', 'the', 'for', 'with', 'leaf', 'oil', 'tree', 'root', 'black', 'white', 'red', 'wild', 'pure', 'royal', 'french'].includes(w)) {
        tokens.add(w);
      }
    }
  }
  return Array.from(tokens);
}

function noteMatches(targetNote: string, dbNote: string): boolean {
  const normTarget = normalizeString(targetNote);
  const normDb = normalizeString(dbNote);

  if (normTarget === normDb) return true;
  if (normTarget.length >= 4 && normDb.length >= 4) {
    if (normTarget.includes(normDb) || normDb.includes(normTarget)) return true;
  }

  // Check synonym dictionary
  for (const [key, synonyms] of Object.entries(NOTE_SYNONYMS)) {
    const isTargetMatch = normTarget === key || synonyms.some((s) => normTarget === s || normTarget.includes(s));
    const isDbMatch = normDb === key || synonyms.some((s) => normDb === s || normDb.includes(s));
    if (isTargetMatch && isDbMatch) return true;
  }

  return false;
}

/**
 * Calculates olfactory similarity between external searched perfume and a Kprime database perfume.
 * Dynamic weighting:
 * - Notes similarity: 50%
 * - Fragrance family: 20%
 * - Main accords: 20%
 * - Olfactory profile & category: 10%
 */
export function calculatePerfumeSimilarity(
  target: SearchedPerfumeProfile,
  dbPerfume: Perfume
): {
  score: number;
  breakdown: {
    familyScore: number;
    notesScore: number;
    accordsScore: number;
    categoryBonus: number;
  };
  overlappingNotes: string[];
  overlappingAccords: string[];
  similarityReason: string;
} {
  // 1. Target Notes
  const targetAllNotes = [
    ...(target.topNotes || []),
    ...(target.heartNotes || []),
    ...(target.baseNotes || []),
  ];

  // 2. Prepare DB Perfume Notes
  const dbRawNoteParts = (dbPerfume.notes || '')
    .split(/[,;\n\r\t/•·+|]|\band\b/gi)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);
  
  const dbDescNoteParts = (dbPerfume.description || '')
    .split(/[,;.]/gi)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3);

  const dbAllCandidates = [...dbRawNoteParts, ...dbDescNoteParts];

  // 3. Compute Note Overlap
  const matchedNotesMap = new Map<string, string>(); // norm -> clean display

  for (const tNote of targetAllNotes) {
    const cleanT = tNote.trim();
    if (!cleanT || cleanT.length < 2) continue;

    for (const dbCandidate of dbAllCandidates) {
      if (noteMatches(cleanT, dbCandidate)) {
        const norm = normalizeString(cleanT);
        if (!matchedNotesMap.has(norm)) {
          matchedNotesMap.set(norm, cleanT);
        }
      }
    }
  }

  const matchedNotes = Array.from(matchedNotesMap.values());

  // Notes score (0 to 100) - 50% weight
  const totalTargetNotes = Math.max(targetAllNotes.length, 3);
  const matchedCount = matchedNotes.length;
  // Calculate proportional note similarity with bonus for high absolute overlap
  let noteRatio = matchedCount / totalTargetNotes;
  if (matchedCount >= 5) noteRatio = Math.min(1, noteRatio * 1.3);
  else if (matchedCount >= 3) noteRatio = Math.min(1, noteRatio * 1.15);
  const notesScore = Math.min(100, Math.round(noteRatio * 100));

  // 4. Compute Accord Overlap (20% weight)
  const targetAccords = (target.accords || []).map((a) => a.trim()).filter(Boolean);
  const dbAccordsList = (dbPerfume.accords || '')
    .split(/[,;/|]/gi)
    .map((s) => s.trim())
    .filter(Boolean);

  const matchedAccordsSet = new Set<string>();
  for (const tAccord of targetAccords) {
    const normT = normalizeString(tAccord);
    for (const dbAccord of dbAccordsList) {
      const normD = normalizeString(dbAccord);
      if (normT === normD || normT.includes(normD) || normD.includes(normT)) {
        matchedAccordsSet.add(tAccord);
      } else {
        // Check accord family cluster
        for (const [, cluster] of Object.entries(ACCORD_FAMILIES)) {
          if (cluster.some((c) => normT.includes(c)) && cluster.some((c) => normD.includes(c))) {
            matchedAccordsSet.add(tAccord);
          }
        }
      }
    }
  }

  const matchedAccords = Array.from(matchedAccordsSet);
  const totalAccords = Math.max(targetAccords.length, 2);
  const accordsScore = targetAccords.length > 0
    ? Math.min(100, Math.round((matchedAccords.length / totalAccords) * 100))
    : (matchedNotes.length > 0 ? 50 : 20);

  // 5. Fragrance Family Match (0 to 100) - 20% weight
  const normTargetFamily = normalizeString(target.fragranceFamily || '');
  const normDbFragrance = normalizeString(dbPerfume.fragrance || '');
  const normDbScentGroup = normalizeString(dbPerfume.scentGroup || '');

  let familyScore = 25;
  const familyKeywords = [
    'woody', 'aromatic', 'citrus', 'aquatic', 'fresh', 'spicy', 'floral',
    'amber', 'oriental', 'gourmand', 'fougere', 'chypre', 'leather', 'fruity'
  ];

  let sharedKeywords = 0;
  for (const kw of familyKeywords) {
    const inTarget = normTargetFamily.includes(kw);
    const inDb = normDbFragrance.includes(kw) || normDbScentGroup.includes(kw);
    if (inTarget && inDb) {
      sharedKeywords++;
    }
  }

  if (normTargetFamily && normDbFragrance && normTargetFamily === normDbFragrance) {
    familyScore = 100;
  } else if (sharedKeywords >= 2) {
    familyScore = 90;
  } else if (sharedKeywords === 1) {
    familyScore = 70;
  } else {
    familyScore = 30;
  }

  // 6. Category / Gender & Profile Alignment (0 to 100) - 10% weight
  let categoryBonus = 70;
  const targetGender = normalizeString(target.genderTarget || 'unisex');
  const dbGender = normalizeString(dbPerfume.category || 'unisex');

  if (targetGender === dbGender) {
    categoryBonus = 100;
  } else if (targetGender.includes('unisex') || dbGender.includes('unisex')) {
    categoryBonus = 85;
  } else {
    categoryBonus = 50;
  }

  // 7. Dynamic Composite Score (Strictly Weighted)
  // Notes: 50%, Family: 20%, Accords: 20%, Profile: 10%
  const compositeScore = Math.round(
    notesScore * 0.50 +
    familyScore * 0.20 +
    accordsScore * 0.20 +
    categoryBonus * 0.10
  );

  // Cap at 98% for near identical and floor at 15%
  const finalScore = Math.min(98, Math.max(15, compositeScore));

  // 8. Dynamic Human-Readable Reason
  let similarityReason = '';
  const accordStr = matchedAccords.slice(0, 3).map((a) => a.toLowerCase()).join(', ');
  const notesStr = matchedNotes.slice(0, 3).join(', ');

  if (accordStr && notesStr) {
    similarityReason = `Shares prominent ${accordStr} accords, with common notes of ${notesStr}.`;
  } else if (notesStr) {
    similarityReason = `Features matching signature olfactory notes including ${notesStr} within a complementary profile.`;
  } else if (accordStr) {
    similarityReason = `Aligns in the ${accordStr} scent spectrum within the ${dbPerfume.fragrance || 'same'} family.`;
  } else {
    similarityReason = `Harmonious match in the ${dbPerfume.fragrance || 'fragrance'} family with complementary aromatic facets.`;
  }

  return {
    score: finalScore,
    breakdown: {
      familyScore,
      notesScore,
      accordsScore,
      categoryBonus,
    },
    overlappingNotes: matchedNotes,
    overlappingAccords: matchedAccords,
    similarityReason,
  };
}

/**
 * Finds the Top 5 most similar perfumes from the Kprime database for a given external profile.
 * STRICT RULE: Only existing Kprime database perfumes are returned!
 */
export function findTopSimilarPerfumes(
  target: SearchedPerfumeProfile,
  databasePerfumes: Perfume[]
): SimilarMatchResult[] {
  if (!databasePerfumes || databasePerfumes.length === 0) {
    return [];
  }

  const scoredList: SimilarMatchResult[] = [];

  for (const p of databasePerfumes) {
    const similarity = calculatePerfumeSimilarity(target, p);
    scoredList.push({
      rank: 0,
      perfume: p,
      similarityPercentage: similarity.score,
      breakdown: similarity.breakdown,
      overlappingNotes: similarity.overlappingNotes,
      overlappingAccords: similarity.overlappingAccords,
      similarityReason: similarity.similarityReason,
    });
  }

  // Sort strictly by highest similarity percentage first
  scoredList.sort((a, b) => b.similarityPercentage - a.similarityPercentage);

  // Return Top 5 exactly
  const top5 = scoredList.slice(0, 5).map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));

  return top5;
}

/**
 * Checks if the queried perfume already exists in the Kprime database.
 */
export function checkIfExistsInKprime(
  perfumeNameQuery: string,
  databasePerfumes: Perfume[]
): { exists: boolean; matchedPerfume?: Perfume } {
  if (!perfumeNameQuery || !databasePerfumes || databasePerfumes.length === 0) {
    return { exists: false };
  }

  const queryNorm = normalizeString(perfumeNameQuery);
  if (queryNorm.length < 3) return { exists: false };

  for (const p of databasePerfumes) {
    const nameNorm = normalizeString(p.name);
    const refNorm = normalizeString(p.reference || '');
    const labelNorm = normalizeString(p.oilLabel || '');

    if (nameNorm === queryNorm || refNorm === queryNorm || labelNorm === queryNorm) {
      return { exists: true, matchedPerfume: p };
    }

    // Substring containment if sufficiently long
    if (queryNorm.length >= 5 && (nameNorm.includes(queryNorm) || queryNorm.includes(nameNorm))) {
      return { exists: true, matchedPerfume: p };
    }
  }

  return { exists: false };
}
