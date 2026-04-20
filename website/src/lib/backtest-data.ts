// ============================================================
// Shared backtest results — used by /algorithms and /suggest
// Values refreshed 2026-04-20 (Chu kỳ 6) from matrix/backtest_results.json
// + matrix/power535_wheeling_backtest_results.json
// Significance fields: z-test vs Random baseline, Wilson CI, Bonferroni K=14.
// ============================================================

export type Decision = "Accept" | "Suggestive" | "Inconclusive" | "Reject" | "baseline";

export interface MatrixStrategy {
  name: string;
  avg: number;
  delta: number;
  winPct: number;
  roi: number;
  best: number;
  type: "new" | "old" | "base";
  pValue?: number;       // z-test vs Random on win_rate_ge3 (null for baseline)
  decision?: Decision;   // Accept / Suggestive / Inconclusive / Reject / baseline
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
  pValue?: number;
  decision?: Decision;
}

export interface ThreeDBacktest {
  label: string;
  totalDraws: number;
  baseline: { exactPct: number };
  strategies: ThreeDStrategy[];
}

// ── Matrix products (refreshed 2026-04-20) ──
//
// Decision thresholds (EVALUATION §6):
//   Accept      = p<0.05 AND passes_bonferroni AND ci_lo>0
//   Suggestive  = p<0.05 AND ci_lo>0 (không pass Bonferroni K=14, α=0.00357)
//   Reject      = p≥0.05 hoặc CI chứa 0 hoặc Δ≤0
//
// Sau Chu kỳ 6: KHÔNG strategy matrix nào Accept. 6/45 ExpDecay_Cold là Suggestive mạnh nhất.

export const BACKTEST_MATRIX: Record<string, MatrixBacktest> = {
  "power-655": {
    label: "Power 6/55",
    baseline: { E: 0.6545, winPct: 1.333 },
    totalDraws: 1334,
    strategies: [
      { name: "★ Bayesian AI", avg: 0.6853, delta: +0.0308, winPct: 1.648, roi: -91.4, best: 4, type: "new", pValue: 0.511, decision: "Reject" },
      { name: "Tần suất cao", avg: 0.6780, delta: +0.0235, winPct: 1.513, roi: -93.3, best: 4, type: "old", pValue: 0.848, decision: "Reject" },
      { name: "Random", avg: 0.6764, delta: +0.0219, winPct: 1.459, roi: -94.2, best: 4, type: "base", decision: "baseline" },
      { name: "★ Mẫu cấu trúc", avg: 0.6575, delta: +0.0030, winPct: 1.594, roi: -93.0, best: 4, type: "new", pValue: 0.636, decision: "Reject" },
      { name: "★ Phủ sóng tối đa", avg: 0.6613, delta: +0.0068, winPct: 1.540, roi: -94.7, best: 4, type: "new", pValue: 0.774, decision: "Reject" },
      { name: "★ Tự động tối ưu", avg: 0.6405, delta: -0.0140, winPct: 1.270, roi: -94.7, best: 4, type: "new", pValue: 0.483, decision: "Reject" },
      { name: "Số vắng lâu", avg: 0.6394, delta: -0.0151, winPct: 1.243, roi: -94.1, best: 4, type: "old", pValue: 0.421, decision: "Reject" },
    ],
  },
  "power-645": {
    label: "Mega 6/45",
    baseline: { E: 0.8, winPct: 2.383 },
    totalDraws: 1302,
    strategies: [
      { name: "Suy giảm hàm mũ (Cold)", avg: 0.8089, delta: +0.0089, winPct: 2.912, roi: -56.9, best: 5, type: "old", pValue: 0.0044, decision: "Suggestive" },
      { name: "★ Phủ sóng tối đa", avg: 0.8103, delta: +0.0103, winPct: 2.440, roi: -57.5, best: 5, type: "new", pValue: 0.105, decision: "Reject" },
      { name: "★ Kết hợp (Ensemble)", avg: 0.8073, delta: +0.0073, winPct: 2.579, roi: -63.9, best: 5, type: "new", pValue: 0.046, decision: "Suggestive" },
      { name: "★ Bayesian AI", avg: 0.8070, delta: +0.0070, winPct: 2.579, roi: -88.5, best: 4, type: "new", pValue: 0.046, decision: "Suggestive" },
      { name: "★ Mẫu cấu trúc", avg: 0.7995, delta: -0.0005, winPct: 2.413, roi: -87.5, best: 4, type: "new", pValue: 0.123, decision: "Reject" },
      { name: "★ Bayesian AI (Sharp)", avg: 0.7992, delta: -0.0008, winPct: 2.357, roi: -89.2, best: 4, type: "new", pValue: 0.165, decision: "Reject" },
      { name: "Tần suất cao", avg: 0.7978, delta: -0.0022, winPct: 1.969, roi: -89.6, best: 4, type: "old", pValue: 0.797, decision: "Reject" },
      { name: "Random", avg: 0.7976, delta: -0.0024, winPct: 1.886, roi: -92.1, best: 4, type: "base", decision: "baseline" },
    ],
  },
  "power-535": {
    label: "Lotto 5/35",
    baseline: { E: 0.7143, winPct: 1.386 },
    totalDraws: 539,
    strategies: [
      { name: "★ Tự động tối ưu", avg: 0.7525, delta: +0.0382, winPct: 1.898, roi: -87.1, best: 4, type: "new", pValue: 0.157, decision: "Reject" },
      { name: "Tần suất cặp", avg: 0.7472, delta: +0.0329, winPct: 1.367, roi: -93.2, best: 3, type: "old", pValue: 0.730, decision: "Reject" },
      { name: "★ Khoảng cách tối đa", avg: 0.7229, delta: +0.0086, winPct: 1.671, roi: -91.7, best: 3, type: "new", pValue: 0.327, decision: "Reject" },
      { name: "★ Phủ sóng tối đa", avg: 0.7183, delta: +0.0040, winPct: 1.746, roi: -84.4, best: 4, type: "new", pValue: 0.259, decision: "Reject" },
      { name: "Random", avg: 0.7175, delta: +0.0032, winPct: 1.215, roi: -90.5, best: 4, type: "base", decision: "baseline" },
      { name: "★ Bayesian AI", avg: 0.7046, delta: -0.0097, winPct: 1.746, roi: -84.4, best: 4, type: "new", pValue: 0.259, decision: "Reject" },
      { name: "★ Mẫu cấu trúc", avg: 0.6970, delta: -0.0173, winPct: 1.367, roi: -93.2, best: 3, type: "new", pValue: 0.730, decision: "Reject" },
      // Multi-ticket wheeling — metric khác (P(any≥3) per N vé, không so trực tiếp per-ticket)
      { name: "🔬 HybridParityDiv (N=20)", avg: 0.7075, delta: -0.0068, winPct: 25.89, roi: -91.4, best: 4, type: "new", pValue: 0.301, decision: "Reject" },
    ],
  },
};

// ── 3D products (refreshed 2026-04-20 Chu kỳ 6) ──
// Baseline: Random. Bonferroni K=20 (α_strict = 0.0025).

export const BACKTEST_3D: Record<string, ThreeDBacktest> = {
  "max-3d": {
    label: "Max 3D",
    totalDraws: 1064,
    baseline: { exactPct: 2.0 },
    strategies: [
      { name: "Tần suất cao (FreqWholeHot)", exactPct: 2.347, roi: -32.8, type: "best", pValue: 0.066, decision: "Reject" },
      { name: "🧬 Bias liên hợp (JointBias)", exactPct: 2.268, roi: -39.0, type: "research", pValue: 0.144, decision: "Reject" },
      { name: "PairExploiter (T=0.5)", exactPct: 2.248, roi: -36.7, type: "research", pValue: 0.171, decision: "Reject" },
      { name: "★ Phủ sóng tối đa (CoverageOpt)", exactPct: 2.219, roi: -35.8, type: "new", pValue: 0.220, decision: "Reject" },
      { name: "ULTIMATE_v1", exactPct: 2.219, roi: -44.9, type: "research", pValue: 0.220, decision: "Reject" },
      { name: "Random", exactPct: 1.972, roi: -52.6, type: "base", decision: "baseline" },
      { name: "💰 EV tối đa (EVMaximizer)", exactPct: 1.874, roi: -56.9, type: "research", pValue: 0.609, decision: "Reject" },
    ],
  },
  "max-3d-pro": {
    label: "Max 3D Pro",
    totalDraws: 711,
    baseline: { exactPct: 2.0 },
    strategies: [
      { name: "💰 EV tối đa (EVMaximizer)", exactPct: 2.496, roi: -26.5, type: "research", pValue: 0.053, decision: "Reject" },
      { name: "ULTIMATE_v2_sharp", exactPct: 2.421, roi: -27.5, type: "research", pValue: 0.098, decision: "Reject" },
      { name: "🧬 Bias liên hợp (JointBias)", exactPct: 2.375, roi: -31.5, type: "research", pValue: 0.137, decision: "Reject" },
      { name: "TierWeighted", exactPct: 2.179, roi: -43.0, type: "research", pValue: 0.465, decision: "Reject" },
      { name: "BayesJoint (HL=150 Sharp)", exactPct: 2.163, roi: -45.0, type: "research", pValue: 0.503, decision: "Reject" },
      { name: "Random", exactPct: 1.997, roi: -45.4, type: "base", decision: "baseline" },
      { name: "Tần suất cao (FreqWholeHot)", exactPct: 1.937, roi: -38.5, type: "best", pValue: 0.802, decision: "Reject" },
    ],
  },
};
