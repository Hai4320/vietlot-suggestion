// Nguồn duy nhất chứa thông tin hiển thị của các thuật toán (biểu tượng, tên, mô tả).
// Dùng chung bởi SuggestionPanel (trang sản phẩm) và QuickGenerate (/check-rate)
// để đảm bảo tên thuật toán đồng nhất khắp giao diện.

import type { SuggestionStrategy } from "./types";

export type StrategyGroup = "matrix" | "3d" | "both";

export interface StrategyMeta {
  key: SuggestionStrategy;
  emoji: string;
  label: string;
  description: string;
  /** Áp dụng cho nhóm sản phẩm nào. */
  appliesTo: StrategyGroup;
  /** Giới hạn cho 1 sản phẩm cụ thể (vd "power_535" với cách Hybrid Parity). */
  productLimit?: string;
}

export const STRATEGIES: StrategyMeta[] = [
  {
    key: "mindistance",
    emoji: "📐",
    label: "Bộ số khác biệt nhau",
    description: "Sinh các bộ số sao cho khác biệt nhau nhất có thể, tránh trùng lặp giữa các vé.",
    appliesTo: "matrix",
  },
  {
    key: "pairexploiter",
    emoji: "🔗",
    label: "Khai thác liên hệ giữa các vị trí",
    description: "Riêng cho 3D — tận dụng quan sát rằng các vị trí chữ số không hoàn toàn độc lập với nhau.",
    appliesTo: "3d",
  },
  {
    key: "coverageopt",
    emoji: "🎪",
    label: "Phủ đều không gian (3D)",
    description: "Riêng cho 3D — kết hợp tần suất xuất hiện với độ khác biệt giữa các chữ số.",
    appliesTo: "3d",
  },
  {
    key: "pattern",
    emoji: "🔮",
    label: "Theo mẫu cấu trúc",
    description: "Phân tích khoảng cách giữa các số và phân bố theo vùng (thấp / giữa / cao).",
    appliesTo: "both",
  },
  {
    key: "maxentropy",
    emoji: "🎯",
    label: "Trải đều tối đa",
    description: "Ma trận: chia phạm vi thành các vùng và phủ đều. 3D: lọc theo tổng các chữ số.",
    appliesTo: "both",
  },
  {
    key: "frequency",
    emoji: "📊",
    label: "Số ra nhiều (số nóng)",
    description: "Ưu tiên các số xuất hiện nhiều nhất trong lịch sử quay.",
    appliesTo: "both",
  },
  {
    key: "absence",
    emoji: "⏳",
    label: "Số vắng lâu (số gan)",
    description: "Ưu tiên các số lâu chưa xuất hiện trở lại.",
    appliesTo: "both",
  },
  {
    key: "bayesian",
    emoji: "🧠",
    label: "Dự đoán thông minh",
    description: "Cập nhật xác suất từng số theo dữ liệu gần đây và tự điều chỉnh theo lượng dữ liệu sẵn có.",
    appliesTo: "both",
  },
  {
    key: "adaptive",
    emoji: "⚡",
    label: "Tự động chọn cửa sổ",
    description: "Tự dò cửa sổ thời gian phù hợp nhất từ dữ liệu gần đây.",
    appliesTo: "both",
  },
  {
    key: "jointbias",
    emoji: "🧬",
    label: "Liên hệ 3 chữ số (3D)",
    description: "Riêng cho 3D — xét phân bố đồng thời cả 3 vị trí chữ số.",
    appliesTo: "3d",
  },
  {
    key: "mixed",
    emoji: "🎲",
    label: "Kết hợp số nóng và số lạnh",
    description: "Ma trận: trộn 50/50 số nóng và số lạnh. 3D: cân theo trọng số từng vị trí.",
    appliesTo: "both",
  },
  {
    key: "evmax",
    emoji: "💰",
    label: "Ưu tiên giải lớn (3D)",
    description: "Riêng cho 3D — ưu tiên các số có khả năng trúng giải cao nhất.",
    appliesTo: "3d",
  },
  {
    key: "hybridparity",
    emoji: "🎰",
    label: "Cân bằng chẵn-lẻ (5/35)",
    description: "Riêng cho Power 5/35 — sinh nhiều vé cân chẵn-lẻ và đảm bảo các vé khác biệt nhau.",
    appliesTo: "matrix",
    productLimit: "power_535",
  },
  {
    key: "ab_exploit",
    emoji: "🏆",
    label: "Vé A=B (Max 3D Pro)",
    description: "Riêng cho Max 3D Pro — vé có 2 ô A và B trùng cùng 1 số. Khi trúng các giải đầu sẽ được nhân đôi tiền theo quy chế.",
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
