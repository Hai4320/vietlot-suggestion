// ============================================================
// Shared backtest results — used by /algorithms and /suggest
// ============================================================

export interface MatrixStrategy {
  name: string;
  avg: number;
  delta: number;
  winPct: number;
  roi: number;
  best: number;
  type: "new" | "old" | "base";
}

export interface MatrixBacktest {
  label: string;
  baseline: { E: number; winPct: number };
  totalDraws: number;
  strategies: MatrixStrategy[];
}

export interface ThreeDStrategy {
  name: string;
  exactPct: number;
  roi: number;
  type: "best" | "new" | "old" | "base" | "research";
}

export interface ThreeDBacktest {
  label: string;
  totalDraws: number;
  baseline: { exactPct: number };
  strategies: ThreeDStrategy[];
}

// ── Matrix products ──

export const BACKTEST_MATRIX: Record<string, MatrixBacktest> = {
  "power-655": {
    label: "Power 6/55",
    baseline: { E: 0.6545, winPct: 1.333 },
    totalDraws: 1334,
    strategies: [
      { name: "★ Bayesian AI", avg: 0.6853, delta: +0.0308, winPct: 1.648, roi: -91.4, best: 4, type: "new" },
      { name: "Tần suất cao", avg: 0.6780, delta: +0.0235, winPct: 1.513, roi: -93.3, best: 4, type: "old" },
      { name: "Random", avg: 0.6764, delta: +0.0219, winPct: 1.459, roi: -94.2, best: 4, type: "base" },
      { name: "★ Phủ sóng tối đa", avg: 0.6613, delta: +0.0068, winPct: 1.540, roi: -94.7, best: 4, type: "new" },
      { name: "★ Mẫu cấu trúc", avg: 0.6575, delta: +0.0030, winPct: 1.594, roi: -93.0, best: 4, type: "new" },
      { name: "Số vắng lâu", avg: 0.6394, delta: -0.0151, winPct: 1.243, roi: -94.1, best: 4, type: "old" },
      { name: "★ Tự động tối ưu", avg: 0.6405, delta: -0.0140, winPct: 1.270, roi: -94.7, best: 4, type: "new" },
    ],
  },
  "power-645": {
    label: "Mega 6/45",
    baseline: { E: 0.8, winPct: 2.383 },
    totalDraws: 1301,
    strategies: [
      { name: "★ Bayesian AI (Sharp)", avg: 0.8229, delta: +0.0229, winPct: 3.136, roi: -86.1, best: 4, type: "new" },
      { name: "★ Mẫu cấu trúc", avg: 0.8165, delta: +0.0165, winPct: 2.248, roi: -88.8, best: 4, type: "new" },
      { name: "Random", avg: 0.8066, delta: +0.0066, winPct: 1.915, roi: -92.0, best: 4, type: "base" },
      { name: "Tần suất cao", avg: 0.8060, delta: +0.0060, winPct: 2.776, roi: -89.4, best: 4, type: "old" },
      { name: "★ Phủ sóng tối đa", avg: 0.7893, delta: -0.0107, winPct: 2.193, roi: -62.0, best: 5, type: "new" },
      { name: "Số vắng lâu", avg: 0.7954, delta: -0.0046, winPct: 2.776, roi: -86.4, best: 4, type: "old" },
      { name: "★ Tự động tối ưu", avg: 0.7918, delta: -0.0082, winPct: 1.943, roi: -92.7, best: 4, type: "new" },
    ],
  },
  "power-535": {
    label: "Lotto 5/35",
    baseline: { E: 0.7143, winPct: 1.386 },
    totalDraws: 538,
    strategies: [
      { name: "🔬 Hybrid Parity (N=20 wheel)", avg: 0.7075, delta: -0.0068, winPct: 27.65, roi: -91.1, best: 4, type: "new" },
      { name: "★ Mẫu cấu trúc", avg: 0.7396, delta: +0.0253, winPct: 1.775, roi: -82.2, best: 4, type: "new" },
      { name: "★ Tự động tối ưu", avg: 0.7396, delta: +0.0253, winPct: 1.381, roi: -84.2, best: 4, type: "new" },
      { name: "Tần suất cao", avg: 0.7258, delta: +0.0115, winPct: 1.578, roi: -74.4, best: 4, type: "old" },
      { name: "Random", avg: 0.7101, delta: -0.0042, winPct: 2.564, roi: -78.3, best: 4, type: "base" },
      { name: "★ Bayesian AI", avg: 0.6864, delta: -0.0279, winPct: 0.789, roi: -87.2, best: 4, type: "new" },
      { name: "★ Phủ sóng tối đa", avg: 0.6884, delta: -0.0259, winPct: 1.381, roi: -93.1, best: 3, type: "new" },
      { name: "Số vắng lâu", avg: 0.7061, delta: -0.0082, winPct: 0.789, roi: -96.1, best: 3, type: "old" },
    ],
  },
};

// ── 3D products ──

export const BACKTEST_3D: Record<string, ThreeDBacktest> = {
  "max-3d": {
    label: "Max 3D",
    totalDraws: 1064,
    baseline: { exactPct: 2.0 },
    strategies: [
      { name: "Tần suất cao", exactPct: 2.347, roi: -32.8, type: "best" },
      { name: "🧬 Bias liên hợp", exactPct: 2.268, roi: -39.0, type: "research" },
      { name: "★ Bayesian AI", exactPct: 2.087, roi: -39.6, type: "new" },
      { name: "★★ Phủ sóng tối đa (SumRange)", exactPct: 2.055, roi: -40.0, type: "new" },
      { name: "★ Tự động tối ưu", exactPct: 1.940, roi: -46.2, type: "new" },
      { name: "Random", exactPct: 1.874, roi: -55.7, type: "base" },
      { name: "💰 EV tối đa", exactPct: 1.874, roi: -56.9, type: "research" },
    ],
  },
  "max-3d-pro": {
    label: "Max 3D Pro",
    totalDraws: 711,
    baseline: { exactPct: 2.0 },
    strategies: [
      { name: "💰 EV tối đa", exactPct: 2.496, roi: -26.5, type: "research" },
      { name: "🧬 Bias liên hợp", exactPct: 2.375, roi: -31.5, type: "research" },
      { name: "Tần suất cao", exactPct: 2.345, roi: -47.2, type: "best" },
      { name: "★★ Phủ sóng tối đa (SumRange)", exactPct: 2.295, roi: -35.1, type: "new" },
      { name: "★ Bayesian AI", exactPct: 2.068, roi: -43.6, type: "new" },
      { name: "★ Tự động tối ưu", exactPct: 2.068, roi: -47.7, type: "new" },
      { name: "Random", exactPct: 2.219, roi: -38.0, type: "base" },
    ],
  },
};
