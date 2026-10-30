export interface SalesMan {
  id: string;
  name: string;
  code?: string;
  status: 'active' | 'inactive';
  isActive?: boolean;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

export interface Perfume {
  id: string;
  code: string;
  name: string;
  notes: string;
  fragrance: string; // Scent Group / Fragrance Family
  category: string;  // Men, Women, Unisex
  scentGroup?: string; // e.g. "Fresh / Citrus / Aquatic", "Floral / Fruity", etc.
  oilLabel?: string;  // e.g. "212 MEN", "SAUVAGE ELIXIR", etc.
  reference?: string; // Commercial reference e.g. "212 Men - Carolina Herrera"
  isStarred?: boolean;
  description?: string;
  brand?: string;
  accords?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedPerfume {
  code?: string;
  name: string;
  notes?: string;
  fragrance?: string;
  category?: string;
  description?: string;
  brand?: string;
  accords?: string;
  originalText?: string;
}

export type MixingMode = 'single' | 'dual' | 'multi';

export interface FormulaOilItem {
  perfumeId: string;
  perfumeCode: string;
  perfumeName: string;
  category?: 'A' | 'B' | 'C' | 'D';
  allocationPercent: number; // % of total oil (e.g. 25%)
  oilMl: number;
  oilGrams: number;
}

// Alias for backward-compatibility
export type DualOilItem = FormulaOilItem;

export interface MixingFormula {
  id: string;
  mode?: MixingMode; // 'single', 'dual', or 'multi'
  numberOfOils?: number; // 1, 2, 3, or 4
  perfumeId: string;
  perfumeCode: string;
  perfumeName: string;
  bottleSize: number; // in ml (e.g. 9.8, 15, 36, 55, 59, 86, 105)
  concentration: number; // total oil percentage (0 - 100)
  oilMl: number;
  oilGrams: number;
  alcoholMl: number;
  alcoholGrams: number;
  oilDensity: number; // g/ml
  alcoholDensity: number; // g/ml
  totalVolume: number; // ml
  price?: number;
  priceCategory?: 'A' | 'B' | 'C' | 'D';
  bottleType?: string;
  customerName?: string;
  batchNumber?: string;
  notes?: string;
  createdAt: string;

  // Multi-Oil specific details (1 to 4 oils)
  oils?: FormulaOilItem[];
  oil1?: FormulaOilItem;
  oil2?: FormulaOilItem;
  oil3?: FormulaOilItem;
  oil4?: FormulaOilItem;
  highestCategory?: 'A' | 'B' | 'C' | 'D';

  // Sales Man Tracking (Required for new mixes)
  salesManId?: string;
  salesManName?: string;
}

export interface AppSettings {
  oilDensity: number; // default: 1.00 g/ml
  alcoholDensity: number; // default: 0.789 g/ml
  bottleSizes: number[]; // default: [9.8, 15, 36, 55, 59, 86, 105]
  defaultConcentration: number; // default: 30%
  roundingPrecision: number; // default: 2
  currencySymbol?: string; // default: 'DH' or '$'
  chatSoundEnabled?: boolean; // default: true
  chatToastsEnabled?: boolean; // default: true
}

export type PageId =
  | 'dashboard'
  | 'calculator'
  | 'similar-perfume'
  | 'chat'
  | 'history'
  | 'reports'
  | 'sales-team'
  | 'database'
  | 'add-perfume'
  | 'settings';

export interface ChatMessage {
  id: string;
  conversationId?: string; // Always 'kprime-team-group'
  conversationName?: string; // 'Kprime Team Group Chat'
  senderId: string;
  senderName: string;
  senderRole?: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt?: string | null;
  isEdited?: boolean;
  isDeleted?: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  role: string;
  email?: string;
  avatarColor?: string;
  status: 'active' | 'inactive';
  code?: string;
  phone?: string;
}

export interface CalculationResult {
  bottleSize: number;
  concentration: number;
  oilMl: number;
  oilGrams: number;
  alcoholMl: number;
  alcoholGrams: number;
  totalVolume: number;
  oilPercentage: number;
  alcoholPercentage: number;
  oilDensity: number;
  alcoholDensity: number;
}

export interface DualOilCalculationResult {
  bottleSize: number;
  totalConcentration: number;
  totalOilMl: number;
  totalOilGrams: number;
  alcoholMl: number;
  alcoholGrams: number;
  totalVolume: number;
  alcoholPercentage: number;
  oil1: {
    allocationPercent: number;
    oilMl: number;
    oilGrams: number;
  };
  oil2: {
    allocationPercent: number;
    oilMl: number;
    oilGrams: number;
  };
  oilDensity: number;
  alcoholDensity: number;
  isValidAllocation: boolean;
  allocationError?: string;
}

export interface MultiOilItemResult {
  index: number;
  perfumeId?: string;
  perfumeCode?: string;
  perfumeName?: string;
  category?: 'A' | 'B' | 'C' | 'D';
  allocationPercent: number;
  oilMl: number;
  oilGrams: number;
}

export interface MultiOilCalculationResult {
  bottleSize: number;
  totalConcentration: number;
  totalOilMl: number;
  totalOilGrams: number;
  alcoholMl: number;
  alcoholGrams: number;
  totalVolume: number;
  alcoholPercentage: number;
  numberOfOils: number;
  oils: MultiOilItemResult[];
  oilDensity: number;
  alcoholDensity: number;
  isValidAllocation: boolean;
  allocationSum: number;
  allocationError?: string;
}

// Similar Perfume Finder Interfaces
export interface SearchedPerfumeProfile {
  query: string;
  name: string;
  brand: string;
  concentration?: string; // e.g., 'Eau de Parfum', 'Eau de Toilette', 'Extrait'
  year?: string;
  fragranceFamily: string; // e.g., 'Woody Aromatic', 'Oriental Spicy'
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  accords: string[]; // e.g., ['Woody', 'Citrus', 'Aromatic', 'Fresh Spicy']
  genderTarget?: string; // 'Men' | 'Women' | 'Unisex'
  description?: string;
  confidence?: 'high' | 'medium' | 'low';
  sources?: Array<{ title?: string; uri?: string }>;
  verified: boolean;
  potentialAlternatives?: string[]; // e.g. ["Bleu de Chanel Eau de Parfum", "Bleu de Chanel Parfum"]
}

export interface SimilarMatchResult {
  rank: number;
  perfume: Perfume;
  similarityPercentage: number; // 0 to 100
  breakdown: {
    familyScore: number;  // 0-100
    notesScore: number;   // 0-100
    accordsScore: number; // 0-100
    categoryBonus: number;// 0-100
  };
  overlappingNotes: string[];
  overlappingAccords: string[];
  similarityReason: string; // e.g. "Both perfumes share woody, citrus and aromatic characteristics..."
}

export interface SimilarSearchHistoryItem {
  id: string;
  query: string;
  createdAt: string; // ISO string
  searchedPerfume: SearchedPerfumeProfile;
  matches: SimilarMatchResult[];
  existsInDatabase?: boolean;
  matchedDatabasePerfume?: {
    code: string;
    name: string;
    id: string;
  };
}

