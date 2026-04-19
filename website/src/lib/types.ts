// ============================================================
// Data types for Vietlott Analytics
// ============================================================

/** A single draw result for matrix products (Power 655/645, Lotto 535) */
export interface MatrixDraw {
  date: string;
  id: string;
  result: number[];
  special?: number;
}

/** 3D prize tier keys as stored in data */
export type ThreeDTier = "special" | "first" | "second" | "third";

/** A single draw result for 3D products (Max 3D, Max 3D Pro) */
export interface ThreeDDraw {
  date: string;
  id: string;
  result: Record<ThreeDTier, string[]>;
}

/** Metadata about a product's data set */
export interface ProductMeta {
  product: string;
  totalDraws: number;
  startDate: string;
  endDate: string;
}

/** Full data payload for matrix products */
export interface MatrixProductData {
  meta: ProductMeta;
  draws: MatrixDraw[];
}

/** Full data payload for 3D products */
export interface ThreeDProductData {
  meta: ProductMeta;
  draws: ThreeDDraw[];
}

// ============================================================
// Product configuration
// ============================================================

export type ProductGroup = "matrix" | "3d";

export interface ProductInfo {
  /** Internal key, e.g. "power_655" */
  key: string;
  /** Human-readable name */
  name: string;
  /** Vietnamese name */
  nameVi: string;
  /** Route slug, e.g. "power-655" */
  slug: string;
  /** Emoji icon */
  emoji: string;
  /** Short description (EN) */
  description: string;
  /** Short description (VI) */
  descriptionVi: string;
  /** Product group */
  group: ProductGroup;
  /** Min selectable number */
  minNumber: number;
  /** Max selectable number */
  maxNumber: number;
  /** How many main numbers drawn */
  mainCount: number;
  /** Whether there's a special/bonus number */
  hasSpecial: boolean;
  /** JSON data file path (relative to /data/) */
  dataFile: string;
  /** Tag color for UI */
  color: string;
}

// ============================================================
// Statistics types
// ============================================================

export interface NumberFrequency {
  number: number;
  count: number;
  percentage: number;
}

export interface HotColdNumber {
  number: number;
  count: number;
  daysSinceLast: number;
  lastDate: string;
}

export interface NumberPair {
  pair: [number, number];
  count: number;
  percentage: number;
}

export interface TrendDataPoint {
  date: string;
  /** Map of number → frequency count in the window */
  [key: string]: string | number;
}

export interface DigitFrequency {
  digit: number;
  count: number;
  percentage: number;
}

export interface ThreeDNumberFrequency {
  number: string;
  count: number;
  percentage: number;
  daysSinceLast: number;
}

// ============================================================
// Suggestion types
// ============================================================

export type SuggestionStrategy = "frequency" | "absence" | "mixed" | "bayesian" | "maxentropy" | "adaptive";

export interface SuggestionSet {
  numbers: number[];
  special?: number;
  strategy: SuggestionStrategy;
}

export interface ThreeDSuggestionSet {
  numbers: string[];
  strategy: SuggestionStrategy;
}

// ============================================================
// Time filter
// ============================================================

export type TimeFilter = "all" | "90d" | "60d" | "30d";
