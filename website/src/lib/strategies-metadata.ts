// Single source of truth for strategy display metadata (emoji, label, description).
// Consumed by both SuggestionPanel (product pages) and QuickGenerate (/check-rate)
// so that strategy names stay in sync across the UI.

import type { SuggestionStrategy } from "./types";

export type StrategyGroup = "matrix" | "3d" | "both";

export interface StrategyMeta {
  key: SuggestionStrategy;
  emoji: string;
  label: string;
  description: string;
  /** Which product group(s) this strategy applies to. */
  appliesTo: StrategyGroup;
  /** Restricted to a specific product key (e.g. "power_535" for hybridparity). */
  productLimit?: string;
}

export const STRATEGIES: StrategyMeta[] = [
  {
    key: "mindistance",
    emoji: "📐",
    label: "Khoảng cách đa dạng",
    description: "Ma trận: Dirichlet sample + Jaccard diversity — vé khác biệt tối đa",
    appliesTo: "matrix",
  },
  {
    key: "pairexploiter",
    emoji: "🔗",
    label: "Khai thác cặp chữ số",
    description: "3D: O/E synergy 3 cặp vị trí — khai thác non-independence",
    appliesTo: "3d",
  },
  {
    key: "coverageopt",
    emoji: "🎪",
    label: "Phủ không gian (3D)",
    description: "3D: frequency + digit-distance diversity",
    appliesTo: "3d",
  },
  {
    key: "pattern",
    emoji: "🔮",
    label: "Mẫu cấu trúc",
    description: "Phân tích spacing + phân bố vùng số",
    appliesTo: "both",
  },
  {
    key: "maxentropy",
    emoji: "🎯",
    label: "Phủ sóng tối đa",
    description: "Ma trận: chia vùng phủ đều. 3D: lọc digit-sum",
    appliesTo: "both",
  },
  {
    key: "frequency",
    emoji: "📊",
    label: "Tần suất cao",
    description: "Ưu tiên số xuất hiện nhiều nhất trong lịch sử",
    appliesTo: "both",
  },
  {
    key: "absence",
    emoji: "⏳",
    label: "Số vắng lâu",
    description: "Ưu tiên số lâu không xuất hiện",
    appliesTo: "both",
  },
  {
    key: "bayesian",
    emoji: "🧠",
    label: "Bayesian AI",
    description: "Dirichlet posterior sampling — auto tune theo pool",
    appliesTo: "both",
  },
  {
    key: "adaptive",
    emoji: "⚡",
    label: "Tự động tối ưu",
    description: "Tự tìm cửa sổ phân tích từ dữ liệu gần nhất",
    appliesTo: "both",
  },
  {
    key: "jointbias",
    emoji: "🧬",
    label: "Bias liên hợp",
    description: "3D: phân bố đồng thời 3 chữ số",
    appliesTo: "3d",
  },
  {
    key: "mixed",
    emoji: "🎲",
    label: "Kết hợp nóng–lạnh",
    description: "Ma trận: 50/50. 3D: digit-by-digit weighted",
    appliesTo: "both",
  },
  {
    key: "evmax",
    emoji: "💰",
    label: "EV tối đa",
    description: "3D: kỳ vọng giải thưởng × exponential decay",
    appliesTo: "3d",
  },
  {
    key: "hybridparity",
    emoji: "🎰",
    label: "Hybrid Parity (5/35)",
    description: "Power 5/35: wheeling đa vé parity + Hamming diversity",
    appliesTo: "matrix",
    productLimit: "power_535",
  },
  {
    key: "ab_exploit",
    emoji: "🏆",
    label: "A=B Exploit (Accept C28)",
    description: "3D Pro: vé [X, X] khai thác quy chế doubling rule — theoretical ROI +4180%",
    appliesTo: "3d",
    productLimit: "max_3d_pro",
  },
];

export function getStrategyMeta(key: SuggestionStrategy): StrategyMeta | undefined {
  return STRATEGIES.find((s) => s.key === key);
}

export function strategiesFor(group: "matrix" | "3d", productKey?: string): StrategyMeta[] {
  return STRATEGIES.filter((s) => {
    if (s.appliesTo !== group && s.appliesTo !== "both") return false;
    if (s.productLimit && productKey && s.productLimit !== productKey) return false;
    return true;
  });
}
