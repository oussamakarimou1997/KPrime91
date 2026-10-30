export type PriceCategory = 'A' | 'B' | 'C' | 'D';

export type BottleOptionId =
  | '9_8ml'
  | '15ml_frosted'
  | '36ml_standard'
  | '36ml_frosted'
  | '59ml_polish'
  | '55ml_unpolish'
  | '86ml_polish'
  | '105ml_unpolish';

export interface BottleOption {
  id: BottleOptionId;
  label: string;
  shortLabel: string;
  volumeMl: number;
  finish: 'Standard' | 'Frosted' | 'Polish' | 'Unpolish';
}

export const BOTTLE_OPTIONS: BottleOption[] = [
  { id: '9_8ml', label: '9.8ml Standard', shortLabel: '9.8ml', volumeMl: 9.8, finish: 'Standard' },
  { id: '15ml_frosted', label: '15ml Frosted', shortLabel: '15ml Frosted', volumeMl: 15, finish: 'Frosted' },
  { id: '36ml_standard', label: '36ml Standard', shortLabel: '36ml', volumeMl: 36, finish: 'Standard' },
  { id: '36ml_frosted', label: '36ml Frosted', shortLabel: '36ml Frosted', volumeMl: 36, finish: 'Frosted' },
  { id: '59ml_polish', label: '59ml Polish', shortLabel: '59ml Polish', volumeMl: 59, finish: 'Polish' },
  { id: '55ml_unpolish', label: '55ml Unpolish', shortLabel: '55ml Unpolish', volumeMl: 55, finish: 'Unpolish' },
  { id: '86ml_polish', label: '86ml Polish', shortLabel: '86ml Polish', volumeMl: 86, finish: 'Polish' },
  { id: '105ml_unpolish', label: '105ml Unpolish', shortLabel: '105ml Unpolish', volumeMl: 105, finish: 'Unpolish' },
];

export const CONCENTRATION_TIERS = [15, 20, 25, 30, 35, 40, 45, 50] as const;

/**
 * K-PIME STAFF QUICK PRICE CHART
 * Selling price matrix by Bottle Option -> Category -> Concentration %
 */
export const PRICE_MATRIX: Record<BottleOptionId, Record<PriceCategory, Record<number, number>>> = {
  '9_8ml': {
    A: { 15: 12, 20: 13, 25: 14, 30: 15, 35: 16, 40: 17, 45: 18, 50: 19 },
    B: { 15: 16, 20: 17, 25: 18, 30: 19, 35: 20, 40: 21, 45: 22, 50: 23 },
    C: { 15: 18, 20: 19, 25: 21, 30: 22, 35: 24, 40: 26, 45: 28, 50: 30 },
    D: { 15: 24, 20: 26, 25: 28, 30: 30, 35: 32, 40: 34, 45: 36, 50: 38 },
  },
  '15ml_frosted': {
    A: { 15: 30, 20: 32, 25: 34, 30: 36, 35: 38, 40: 40, 45: 42, 50: 44 },
    B: { 15: 34, 20: 36, 25: 38, 30: 40, 35: 42, 40: 44, 45: 46, 50: 48 },
    C: { 15: 38, 20: 40, 25: 42, 30: 44, 35: 46, 40: 48, 45: 50, 50: 52 },
    D: { 15: 42, 20: 44, 25: 46, 30: 48, 35: 50, 40: 52, 45: 54, 50: 56 },
  },
  '36ml_standard': {
    A: { 15: 35, 20: 39, 25: 45, 30: 49, 35: 55, 40: 59, 45: 65, 50: 69 },
    B: { 15: 49, 20: 55, 25: 59, 30: 65, 35: 69, 40: 75, 45: 79, 50: 85 },
    C: { 15: 59, 20: 65, 25: 69, 30: 75, 35: 79, 40: 85, 45: 89, 50: 95 },
    D: { 15: 65, 20: 75, 25: 85, 30: 95, 35: 105, 40: 115, 45: 125, 50: 135 },
  },
  '36ml_frosted': {
    A: { 15: 39, 20: 45, 25: 49, 30: 55, 35: 59, 40: 65, 45: 69, 50: 75 },
    B: { 15: 55, 20: 59, 25: 65, 30: 69, 35: 75, 40: 79, 45: 85, 50: 89 },
    C: { 15: 65, 20: 69, 25: 75, 30: 79, 35: 85, 40: 89, 45: 95, 50: 99 },
    D: { 15: 75, 20: 85, 25: 95, 30: 105, 35: 115, 40: 125, 45: 135, 50: 145 },
  },
  '59ml_polish': {
    A: { 15: 55, 20: 59, 25: 65, 30: 69, 35: 75, 40: 79, 45: 85, 50: 89 },
    B: { 15: 69, 20: 75, 25: 79, 30: 85, 35: 89, 40: 95, 45: 99, 50: 105 },
    C: { 15: 89, 20: 99, 25: 109, 30: 119, 35: 129, 40: 139, 45: 149, 50: 159 },
    D: { 15: 90, 20: 105, 25: 119, 30: 135, 35: 149, 40: 165, 45: 179, 50: 195 },
  },
  '55ml_unpolish': {
    A: { 15: 45, 20: 49, 25: 55, 30: 59, 35: 65, 40: 69, 45: 75, 50: 79 },
    B: { 15: 59, 20: 65, 25: 69, 30: 75, 35: 79, 40: 85, 45: 89, 50: 95 },
    C: { 15: 79, 20: 89, 25: 99, 30: 109, 35: 119, 40: 129, 45: 139, 50: 149 },
    D: { 15: 85, 20: 99, 25: 115, 30: 129, 35: 145, 40: 159, 45: 175, 50: 189 },
  },
  '86ml_polish': {
    A: { 15: 59, 20: 69, 25: 79, 30: 89, 35: 99, 40: 109, 45: 119, 50: 129 },
    B: { 15: 89, 20: 99, 25: 109, 30: 119, 35: 129, 40: 139, 45: 149, 50: 159 },
    C: { 15: 139, 20: 149, 25: 159, 30: 169, 35: 179, 40: 189, 45: 199, 50: 209 },
    D: { 15: 149, 20: 159, 25: 169, 30: 179, 35: 199, 40: 229, 45: 249, 50: 269 },
  },
  '105ml_unpolish': {
    A: { 15: 59, 20: 69, 25: 79, 30: 89, 35: 99, 40: 109, 45: 119, 50: 129 },
    B: { 15: 89, 20: 99, 25: 109, 30: 119, 35: 129, 40: 149, 45: 159, 50: 169 },
    C: { 15: 139, 20: 149, 25: 159, 30: 169, 35: 179, 40: 199, 45: 209, 50: 219 },
    D: { 15: 149, 20: 169, 25: 189, 30: 219, 35: 229, 40: 259, 45: 279, 50: 299 },
  },
};

/**
 * Detect category A, B, C, D from perfume code.
 * e.g. "A006" -> "A", "B013" -> "B", "C104" -> "C", "D-05" -> "D"
 */
export function detectCategoryFromCode(code?: string): PriceCategory {
  if (!code) return 'A';
  const clean = code.trim().toUpperCase();
  
  // Look at the first letter
  const firstChar = clean.charAt(0);
  if (firstChar === 'A' || firstChar === 'B' || firstChar === 'C' || firstChar === 'D') {
    return firstChar as PriceCategory;
  }

  // If prefixed like "PERF-A01" or "CAT_B"
  const match = clean.match(/(?:^|[-_\s])([ABCD])\d+/);
  if (match && match[1]) {
    return match[1] as PriceCategory;
  }

  return 'A'; // Default fallback
}

/**
 * Find the closest matching bottle option from volume (ml) and optional finish
 */
export function findBottleOption(volumeMl: number, preferredOptionId?: BottleOptionId): BottleOption {
  if (preferredOptionId) {
    const direct = BOTTLE_OPTIONS.find((b) => b.id === preferredOptionId);
    if (direct) return direct;
  }

  // Map by exact or closest volume (9.8, 15, 36, 55, 59, 86, 105)
  const num = Number(volumeMl);
  if (num <= 12) return BOTTLE_OPTIONS[0]; // 9.8ml Standard
  if (num <= 25) return BOTTLE_OPTIONS[1]; // 15ml Frosted
  if (num <= 45) return BOTTLE_OPTIONS[2]; // 36ml Standard
  if (num <= 57) return BOTTLE_OPTIONS[5]; // 55ml Unpolish
  if (num <= 72) return BOTTLE_OPTIONS[4]; // 59ml Polish
  if (num <= 95) return BOTTLE_OPTIONS[6]; // 86ml Polish
  return BOTTLE_OPTIONS[7]; // 105ml Unpolish
}

export interface PriceCalculationResult {
  price: number;
  category: PriceCategory;
  bottleOption: BottleOption;
  matchedConcentration: number;
  isInterpolated: boolean;
  lowerTier?: { concentration: number; price: number };
  upperTier?: { concentration: number; price: number };
}

/**
 * Calculate price based on bottleOption, category, and concentration
 */
export function calculateSellingPrice(
  bottleOptionId: BottleOptionId,
  category: PriceCategory,
  concentration: number
): PriceCalculationResult {
  const bottleOption = BOTTLE_OPTIONS.find((b) => b.id === bottleOptionId) || BOTTLE_OPTIONS[0];
  const catMatrix = PRICE_MATRIX[bottleOption.id]?.[category] || PRICE_MATRIX['9_8ml'].A;

  const tiers = [15, 20, 25, 30, 35, 40, 45, 50];
  const clampedConc = Math.min(50, Math.max(15, concentration));

  // Check exact tier
  if (catMatrix[concentration] !== undefined) {
    return {
      price: catMatrix[concentration],
      category,
      bottleOption,
      matchedConcentration: concentration,
      isInterpolated: false,
    };
  }

  // Find lower and upper brackets
  let lowerTier = tiers[0];
  let upperTier = tiers[tiers.length - 1];

  for (let i = 0; i < tiers.length - 1; i++) {
    if (clampedConc >= tiers[i] && clampedConc <= tiers[i + 1]) {
      lowerTier = tiers[i];
      upperTier = tiers[i + 1];
      break;
    }
  }

  const pLower = catMatrix[lowerTier];
  const pUpper = catMatrix[upperTier];

  if (lowerTier === upperTier || pLower === undefined || pUpper === undefined) {
    const closestTier = tiers.reduce((prev, curr) =>
      Math.abs(curr - concentration) < Math.abs(prev - concentration) ? curr : prev
    );
    return {
      price: catMatrix[closestTier] ?? 0,
      category,
      bottleOption,
      matchedConcentration: closestTier,
      isInterpolated: false,
    };
  }

  // Linear interpolation
  const ratio = (clampedConc - lowerTier) / (upperTier - lowerTier);
  const interpolatedPrice = Math.round((pLower + ratio * (pUpper - pLower)) * 10) / 10;

  return {
    price: interpolatedPrice,
    category,
    bottleOption,
    matchedConcentration: clampedConc,
    isInterpolated: true,
    lowerTier: { concentration: lowerTier, price: pLower },
    upperTier: { concentration: upperTier, price: pUpper },
  };
}

/**
 * Category Ranking Hierarchy: A < B < C < D
 * Higher category implies higher raw oil tier / luxury pricing.
 */
export const CATEGORY_RANK: Record<PriceCategory, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
};

/**
 * Identify the highest category between two oil categories.
 * Example: A + D -> D, B + C -> C, A + B -> B, C + D -> D
 */
export function getHighestCategory(cat1: PriceCategory, cat2: PriceCategory): PriceCategory {
  const rank1 = CATEGORY_RANK[cat1] || 1;
  const rank2 = CATEGORY_RANK[cat2] || 1;
  return rank1 >= rank2 ? cat1 : cat2;
}

/**
 * Identify the highest category dynamically among any number of oil categories (1, 2, 3, or 4 oils).
 * Priority: A < B < C < D
 * Examples:
 * A + B + C -> C
 * A + D + B -> D
 * B + C + D -> D
 * A + A + B + C -> C
 * B + B + A + C -> C
 */
export function getHighestCategoryOfAll(
  categories: (PriceCategory | undefined | null | string)[]
): PriceCategory {
  let highest: PriceCategory = 'A';
  let highestRank = 1;

  for (const cat of categories) {
    if (!cat) continue;
    const cleanCat = (cat.toString().trim().toUpperCase()) as PriceCategory;
    const rank = CATEGORY_RANK[cleanCat] || 1;
    if (rank > highestRank) {
      highestRank = rank;
      highest = cleanCat;
    }
  }

  return highest;
}

