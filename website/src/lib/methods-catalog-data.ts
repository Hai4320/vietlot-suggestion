// Danh mục 73 cách chơi Vietlott — đồng bộ tự động từ research/BETTING_METHODS_CATALOG.md
//
// Số liệu thống kê (lãi/lỗ kỳ vọng, tỉ lệ trúng) được nạp từ JSON kết quả các đợt nghiên cứu C25-C29
// nhưng KHÔNG hiển thị thẳng trên trang /methods (đã ẩn theo yêu cầu — quá kỹ thuật cho người dùng).
// Trạng thái phản ánh kết luận sau Đợt nghiên cứu 29.

import c25 from "../../research/optimization/cycle25_results.json";
import c26 from "../../research/optimization/cycle26_results.json";
import c27 from "../../research/optimization/cycle27_results.json";
import c28 from "../../research/optimization/cycle28_results.json";
import c29 from "../../research/optimization/cycle29_results.json";

// ─────────────────────────── Types ───────────────────────────

export type MethodCategory = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J";

export type MethodStatus =
  | "accept"            // Đã xác nhận có lợi thế thật
  | "suggestive"        // Có dấu hiệu tốt — chờ kiểm chứng thêm
  | "tested_no_edge"    // Đã thử nhưng không có lợi thế
  | "tested_variant"    // Đã thử như biến thể chuẩn (so sánh)
  | "family_eliminated" // Cả nhóm cách chơi đã bị loại
  | "subsumed"          // Trùng / được đại diện bởi cách khác
  | "deferred"          // Tạm hoãn — cần thêm công cụ
  | "skipped"           // Chưa thử — giá trị thấp
  | "na";               // Không áp dụng

export type ProductKey = "power_655" | "power_645" | "power_535" | "max_3d" | "max_3d_pro";

export interface MethodMetrics {
  roi_full_pct: number;
  p_any_hit: number;
  product: ProductKey;
  cycle: number;
}

/**
 * Hướng dẫn mua vé thực tế cho người dùng.
 */
export interface HowToBuy {
  /** Các bước người chơi làm theo. */
  steps: string[];
  /** Vé mẫu (ví dụ cách điền). */
  sample_ticket?: string;
  /** Chi phí ước lượng cho 1 kỳ (VND, hoặc mô tả nếu là khoảng). */
  cost_per_draw_vnd?: number | string;
  /** Mua ở đâu. */
  where_to_buy?: string;
  /** Lịch / tần suất gợi ý. */
  play_schedule?: string;
  /** Cảnh báo riêng cho cách này. */
  warnings?: string[];
}

export interface CatalogMethod {
  id: string;
  category: MethodCategory;
  name_vi: string;
  description_vi: string;
  mechanism_vi?: string;
  applicable_products: ProductKey[] | "all";
  status: MethodStatus;
  verdict_note?: string;
  cycles_tested: number[];
  metrics?: MethodMetrics[];
  user_action?: { label: string; href: string };
  history_link?: string;
  how_to_buy?: HowToBuy;
}

// ─────────────────────────── Trích xuất số liệu từ JSON kết quả ───────────────────────────

type CycleResult = { methods: Array<{ method_id: string; products: Record<string, { full?: { roi_pct?: number; p_any_hit_per_draw?: number } }> }> };

function pullMetrics(results: CycleResult, method_id: string, cycle: number): MethodMetrics[] {
  const entry = results.methods.find((m) => m.method_id === method_id);
  if (!entry) return [];
  const out: MethodMetrics[] = [];
  for (const [prodKey, prodData] of Object.entries(entry.products || {})) {
    const full = (prodData as { full?: { roi_pct?: number; p_any_hit_per_draw?: number } }).full;
    if (full && typeof full.roi_pct === "number") {
      out.push({
        roi_full_pct: full.roi_pct,
        p_any_hit: full.p_any_hit_per_draw ?? 0,
        product: prodKey as ProductKey,
        cycle,
      });
    }
  }
  return out;
}

const C25 = c25 as unknown as CycleResult;
const C26 = c26 as unknown as CycleResult;
const C27 = c27 as unknown as CycleResult;
const C28 = c28 as unknown as CycleResult;
const C29 = c29 as unknown as CycleResult;

// ─────────────────────────── Danh mục 73 cách chơi ───────────────────────────

export const METHODS_CATALOG: CatalogMethod[] = [
  // ═══════════════════ A. Cách chọn số chung (mọi sản phẩm) ═══════════════════
  {
    id: "A1",
    category: "A",
    name_vi: "Cố định một bộ số dùng nhiều kỳ",
    description_vi: "Chọn ra một bộ số ngay từ đầu và mua đi mua lại cùng bộ đó qua nhiều kỳ liên tiếp.",
    applicable_products: "all",
    status: "tested_no_edge",
    verdict_note: "Đã thử, không có lợi thế. Trên thực tế hơi kém hơn việc chọn ngẫu nhiên thuần.",
    cycles_tested: [25],
    metrics: [...pullMetrics(C25, "A1_fixed_ticket", 25), ...pullMetrics(C25, "A1b_fixed_ticket_3d", 25)],
    how_to_buy: {
      steps: [
        "Vào trang /suggest, chọn sản phẩm (ví dụ Power 6/55), bấm nút sinh số để có 1 bộ số.",
        "Ghi lại bộ số đó (ví dụ: 7 12 23 31 42 55).",
        "Mỗi kỳ tiếp theo, mua lại đúng bộ số đó — không thay đổi.",
        "Duy trì khoảng 20-50 kỳ để cảm nhận, sau đó có thể đổi bộ mới.",
      ],
      sample_ticket: "Power: 7 12 23 31 42 55  /  Max 3D: 007  /  Max 3D Pro: 007 042",
      cost_per_draw_vnd: 10000,
      where_to_buy: "vietlott.vn hoặc đại lý Vietlott",
      play_schedule: "Khoảng 20-50 kỳ liên tiếp (Power: ~4-12 tuần)",
      warnings: [
        "Không có lợi thế thống kê — kém hơn chọn ngẫu nhiên thuần một chút.",
        "Lý do nhiều người chọn cách này: tiện, ít suy nghĩ, có cảm giác gắn bó với bộ số.",
      ],
    },
  },
  {
    id: "A2",
    category: "A",
    name_vi: "Chọn số mới mỗi kỳ bằng thuật toán",
    description_vi: "Mỗi kỳ chạy lại thuật toán để sinh ra một bộ số mới (cách chuẩn dùng làm tham chiếu).",
    applicable_products: "all",
    status: "tested_variant",
    verdict_note: "Đây là cách chuẩn, đã được dùng làm tham chiếu trong rất nhiều đợt nghiên cứu trước đây. Hơn 20 thuật toán đã thử theo cách này, không tìm được lợi thế thật.",
    cycles_tested: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
  },
  {
    id: "A3",
    category: "A",
    name_vi: "Chọn ngẫu nhiên hoàn toàn mỗi kỳ",
    description_vi: "Mỗi kỳ pick một bộ số ngẫu nhiên — đây là chuẩn so sánh cho mọi cách khác.",
    applicable_products: "all",
    status: "tested_variant",
    verdict_note: "Đây là chuẩn so sánh (baseline). Lãi/lỗ trung bình lỗ rất nặng vì nhà cái luôn có lợi thế.",
    cycles_tested: [25],
    metrics: pullMetrics(C25, "A3_random_baseline", 25),
    how_to_buy: {
      steps: [
        "Trên vietlott.vn, chọn 'Chọn số ngẫu nhiên' khi mua vé.",
        "Hoặc tự tay pick các số ngẫu nhiên trong phạm vi sản phẩm.",
        "Mỗi kỳ pick lại bộ mới, không dùng lại bộ cũ.",
      ],
      sample_ticket: "Dùng nút 'Chọn số ngẫu nhiên' trên giao diện Vietlott",
      cost_per_draw_vnd: 10000,
      where_to_buy: "vietlott.vn (Quick Pick) hoặc đại lý",
      play_schedule: "Tùy người chơi — không có tần suất nào tốt hơn tần suất khác",
      warnings: [
        "Đây là baseline (chuẩn so sánh) — không phải lời khuyên nên chơi.",
        "Mọi cách chơi khác đều được đo so với cách này.",
      ],
    },
  },
  {
    id: "A4",
    category: "A",
    name_vi: "Luân phiên các thuật toán qua các kỳ",
    description_vi: "Xoay vòng nhiều thuật toán: kỳ này dùng thuật toán A, kỳ sau dùng B, sau nữa dùng C rồi lặp lại.",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "tested_no_edge",
    verdict_note: "Đã thử, không có lợi thế.",
    cycles_tested: [25],
    metrics: pullMetrics(C25, "A4_rotate_algorithms", 25),
  },
  {
    id: "A5",
    category: "A",
    name_vi: "Bỏ phiếu kết hợp nhiều thuật toán",
    description_vi: "Cho nhiều thuật toán cùng đề xuất, sau đó pick các số được nhiều thuật toán đồng thuận nhất.",
    applicable_products: "all",
    status: "tested_no_edge",
    verdict_note: "Đã thử cả phiên bản đơn và đa thuật toán — không có lợi thế.",
    cycles_tested: [19, 22],
  },
  {
    id: "A6",
    category: "A",
    name_vi: "Bắt chước bộ số vừa trúng kỳ trước",
    description_vi: "Lấy lại bộ số đã trúng kỳ trước để dùng cho kỳ này.",
    applicable_products: "all",
    status: "skipped",
    verdict_note: "Chưa thử trực tiếp; theo lý thuyết xổ số (mỗi kỳ độc lập) thì cách này không có lợi thế.",
    cycles_tested: [],
  },
  {
    id: "A7",
    category: "A",
    name_vi: "Tránh các số vừa trúng kỳ trước",
    description_vi: "Loại các số đã ra ở kỳ trước, chỉ chọn từ phần còn lại.",
    applicable_products: "all",
    status: "subsumed",
    verdict_note: "Tương tự cách 'không lặp lại số gần đây' đã thử ở Đợt 1 — không có lợi thế.",
    cycles_tested: [1],
  },
  {
    id: "A8",
    category: "A",
    name_vi: "Theo bộ vừa trượt sát",
    description_vi: "Lấy bộ đã trượt 4/6 ở kỳ trước (kiểu 'gần trúng' nên có thể trúng tiếp).",
    applicable_products: "all",
    status: "skipped",
    verdict_note: "Ưu tiên thấp — đây là cảm tính dựa vào may rủi, không có cơ sở thống kê.",
    cycles_tested: [],
  },
  {
    id: "A9",
    category: "A",
    name_vi: "Số may mắn cá nhân (cố định)",
    description_vi: "Người chơi tự pick các số ý nghĩa (ngày sinh, số đẹp...) và giữ nguyên.",
    applicable_products: "all",
    status: "skipped",
    verdict_note: "Đây là yếu tố văn hóa, không có lợi thế thống kê. Xem thêm nhóm I.",
    cycles_tested: [],
  },
  {
    id: "A10",
    category: "A",
    name_vi: "Số đối xứng 999 - X (Max 3D)",
    description_vi: "Tạo bộ 'đối' của số đã chọn — ví dụ 123 thì cặp với 876.",
    applicable_products: ["max_3d"],
    status: "tested_no_edge",
    verdict_note: "Đã thử (cùng nhóm với cách C8 'số đối'). Không có lợi thế.",
    cycles_tested: [26],
  },

  // ═══════════════════ B. Riêng các sản phẩm chọn số (Power 6/55, 6/45, 5/35) ═══════════════════
  {
    id: "B1",
    category: "B",
    name_vi: "Bao K số (đầy đủ)",
    description_vi: "Chọn nhiều hơn số cần khớp (ví dụ 7 số cho 6/55), sau đó mua tất cả các tổ hợp con. Tỉ lệ trúng tăng nhiều lần nhưng lãi/lỗ kỳ vọng vẫn như chọn ngẫu nhiên.",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "tested_no_edge",
    verdict_note: "Mua nhiều vé hơn = nhiều cơ hội trúng hơn, nhưng không thay đổi lợi thế của nhà cái.",
    cycles_tested: [26],
    metrics: [
      ...pullMetrics(C26, "B1_wheel_K7_Freq_Hot", 26),
      ...pullMetrics(C26, "B1_wheel_K7_MinDistance", 26),
      ...pullMetrics(C26, "B1_wheel_K6_Freq_Hot_535", 26),
    ],
    how_to_buy: {
      steps: [
        "Chọn ra K số (K phải lớn hơn số cần khớp; ví dụ K=7 cho Power 6/55).",
        "Liệt kê tất cả tổ hợp con (K=7 cho 6/55 = 7 vé, K=8 cho 6/55 = 28 vé).",
        "Mua mỗi tổ hợp như một vé riêng tại đại lý hoặc trên vietlott.vn.",
        "Nếu K số chứa đủ các số trúng, đảm bảo trúng ít nhất 1 vé.",
      ],
      sample_ticket: "K=7 với bộ {1, 7, 12, 23, 31, 42, 55} → 7 vé (mỗi vé bỏ ra 1 số khác nhau)",
      cost_per_draw_vnd: "70,000 VND (K=7) hoặc 280,000 VND (K=8)",
      where_to_buy: "Đại lý Vietlott — đại lý quen có thể nhập nhanh các tổ hợp",
      play_schedule: "Mỗi kỳ mua cùng bộ K số, hoặc đổi K số mới theo thuật toán",
      warnings: [
        "Chi phí cao: 7-28 lần một vé thường.",
        "Chỉ tăng tỉ lệ trúng, KHÔNG cải thiện lãi/lỗ kỳ vọng.",
        "Nếu chơi đều với ngân sách 1 triệu, gần như chắc chắn cháy túi sau ít kỳ không trúng giải lớn.",
      ],
    },
  },
  {
    id: "B2",
    category: "B",
    name_vi: "Bao rút gọn",
    description_vi: "Chỉ mua một phần của hệ bao đầy đủ, được đảm bảo trúng nhỏ nếu khớp đủ trong K số.",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "deferred",
    verdict_note: "Cần thư viện toán tổ hợp riêng — chưa có công cụ để thử kỹ.",
    cycles_tested: [],
  },
  {
    id: "B3",
    category: "B",
    name_vi: "Bao có số then chốt",
    description_vi: "Cố định 1-2 số coi là 'then chốt', còn lại xoay vòng trong nhóm 7 số. Chi phí ~35 vé/kỳ.",
    applicable_products: ["power_655", "power_645"],
    status: "tested_no_edge",
    verdict_note: "Đã thử, không có lợi thế.",
    cycles_tested: [26],
    metrics: pullMetrics(C26, "B3_key_wheel_K2_R7", 26),
  },
  {
    id: "B4",
    category: "B",
    name_vi: "Chọn theo vị trí (đầu / giữa / cuối)",
    description_vi: "Cân các vùng số — ví dụ một số ở vùng thấp 1-18, một số ở vùng giữa 19-37, một số ở vùng cao 38-55.",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "subsumed",
    verdict_note: "Trùng với cách chọn theo mẫu (PatternStrategy) đã thử ở các Đợt 1-3 — không có lợi thế.",
    cycles_tested: [1, 2, 3],
  },
  {
    id: "B5",
    category: "B",
    name_vi: "Lọc theo tổng các chữ số",
    description_vi: "Sinh vé ngẫu nhiên rồi chỉ giữ vé có tổng các chữ số nằm trong khoảng 'nóng' theo lịch sử.",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "tested_no_edge",
    verdict_note: "Bộ lọc kiểu này chỉ là nhiễu thống kê — không có lợi thế.",
    cycles_tested: [26],
    metrics: pullMetrics(C26, "B5_sum_range_filter", 26),
  },
  {
    id: "B6",
    category: "B",
    name_vi: "Cân bằng chẵn-lẻ",
    description_vi: "Chỉ chọn vé có ít nhất 2 số lẻ và không quá 4 số lẻ.",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "tested_no_edge",
    verdict_note: "Đã thử, không có lợi thế.",
    cycles_tested: [26],
    metrics: pullMetrics(C26, "B6_parity_balanced", 26),
  },
  {
    id: "B7",
    category: "B",
    name_vi: "Chỉ chọn từ 1-31 (theo ngày sinh)",
    description_vi: "Giới hạn lựa chọn trong dải 1-31 (ngày) hoặc 1-12 (tháng).",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "skipped",
    verdict_note: "Hạn chế thuần túy — chỉ thu nhỏ phạm vi chọn, không tạo lợi thế nào.",
    cycles_tested: [],
  },
  {
    id: "B8",
    category: "B",
    name_vi: "Chiến thuật riêng cho số đặc biệt (5/35)",
    description_vi: "Chọn riêng số đặc biệt 1-12 theo các kiểu khác nhau (cố định / nóng / lạnh / theo tần suất).",
    applicable_products: ["power_535"],
    status: "deferred",
    verdict_note: "Cần công cụ riêng cho 5/35 — chưa kịp xây.",
    cycles_tested: [],
  },
  {
    id: "B9",
    category: "B",
    name_vi: "Tối ưu cho giải phụ (6/55)",
    description_vi: "Chọn vé sao cho dễ trúng giải phụ (5 số chính + bóng phụ) thay vì giải đặc biệt.",
    applicable_products: ["power_655"],
    status: "deferred",
    verdict_note: "Cần công cụ tính riêng cho cấu trúc giải 6/55 — chưa kịp xây.",
    cycles_tested: [],
  },
  {
    id: "B10",
    category: "B",
    name_vi: "Tránh các số liền kề",
    description_vi: "Loại các vé có số liền nhau (ví dụ 4-5-6).",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "tested_no_edge",
    verdict_note: "Đã thử, không có lợi thế.",
    cycles_tested: [26],
    metrics: pullMetrics(C26, "B10_no_consecutive", 26),
  },
  {
    id: "B11",
    category: "B",
    name_vi: "Ưu tiên các số liền kề",
    description_vi: "Bắt buộc trong mỗi vé phải có ít nhất một cặp số liền nhau.",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "tested_no_edge",
    verdict_note: "Đã thử, không có lợi thế.",
    cycles_tested: [26],
    metrics: pullMetrics(C26, "B11_has_consecutive", 26),
  },

  // ═══════════════════ C. Riêng Max 3D & Max 3D Pro ═══════════════════
  {
    id: "C1",
    category: "C",
    name_vi: "Bao lô 6 hoán vị (Max 3D)",
    description_vi: "Chọn 1 bộ 3 chữ số khác nhau, mua cả 6 hoán vị của nó. Tỉ lệ trúng tăng 5 lần nhưng lãi/lỗ vẫn như chọn ngẫu nhiên.",
    applicable_products: ["max_3d"],
    status: "tested_no_edge",
    verdict_note: "Có giá trị tâm lý — giảm khả năng đứt chuỗi không trúng. Lãi/lỗ kỳ vọng vẫn như chọn ngẫu nhiên thuần.",
    cycles_tested: [26],
    metrics: [
      ...pullMetrics(C26, "C1_bao_lo_6_perms", 26),
      ...pullMetrics(C26, "C1_bao_lo_random", 26),
    ],
    how_to_buy: {
      steps: [
        "Chọn 1 bộ 3 chữ số khác nhau (ví dụ 123).",
        "Tạo 6 hoán vị: 123, 132, 213, 231, 312, 321.",
        "Mua 6 vé Max 3D, mỗi vé là một hoán vị.",
        "Nếu kết quả là 1 trong 6 hoán vị đó → trúng.",
      ],
      sample_ticket: "Bộ 1-2-3 → 6 vé: 123 / 132 / 213 / 231 / 312 / 321",
      cost_per_draw_vnd: 60000,
      where_to_buy: "Đại lý Vietlott Max 3D",
      play_schedule: "Mỗi kỳ pick 1 bộ mới, hoặc giữ cố định một bộ",
      warnings: [
        "Tỉ lệ trúng tăng khoảng 5 lần — hữu ích về tâm lý, giảm chuỗi đen.",
        "Lãi/lỗ kỳ vọng vẫn không đổi — không có lợi thế tài chính.",
        "Nếu bộ có 2 chữ số trùng (ví dụ 122) chỉ có 3 hoán vị → rẻ hơn (30K).",
      ],
    },
  },
  {
    id: "C2",
    category: "C",
    name_vi: "Bao bộ có 2 chữ số trùng (3 hoán vị)",
    description_vi: "Chọn bộ 3 chữ số có 2 chữ giống nhau (ví dụ 122) → chỉ có 3 hoán vị.",
    applicable_products: ["max_3d"],
    status: "subsumed",
    verdict_note: "Là một dạng của cách C1 — đã được gộp chung.",
    cycles_tested: [26],
  },
  {
    id: "C3",
    category: "C",
    name_vi: "Bao xỉu chủ",
    description_vi: "Mua cả xỉu (3 số) và chủ (2 số cuối) cùng lúc.",
    applicable_products: ["max_3d"],
    status: "na",
    verdict_note: "Không áp dụng — Vietlott Max 3D không có cấu trúc giải này.",
    cycles_tested: [],
  },
  {
    id: "C4",
    category: "C",
    name_vi: "Tập trung 2 chữ số cuối",
    description_vi: "Chọn các số có 2 chữ số cuối khớp với các giá trị thường ra trong lịch sử.",
    applicable_products: ["max_3d"],
    status: "deferred",
    verdict_note: "Cần công cụ chọn theo cấu trúc giải — chưa kịp xây.",
    cycles_tested: [],
  },
  {
    id: "C5",
    category: "C",
    name_vi: "Đặt cả thuận và đảo (Max 3D Pro)",
    description_vi: "Mua cả vé (A, B) và vé (B, A) để cùng lúc nắm cả giải đặc biệt và phụ giải đặc biệt.",
    applicable_products: ["max_3d_pro"],
    status: "tested_no_edge",
    verdict_note: "Lúc đầu mô phỏng cho thấy có vẻ tốt, nhưng kiểm tra lại kỹ hơn (200 lần) thì xác nhận không có lợi thế thật — chỉ là biến động ngẫu nhiên.",
    cycles_tested: [26, 28],
    metrics: [
      ...pullMetrics(C26, "C5_forward_reverse_hedge_3dpro", 26),
      ...pullMetrics(C28, "C5_fw_rv_retest_N100", 28),
    ],
    how_to_buy: {
      steps: [
        "Chọn 2 số 3 chữ số khác nhau, gọi là X và Y (ví dụ X=007, Y=042).",
        "Vé 1: A=007, B=042 (chiều thuận).",
        "Vé 2: A=042, B=007 (chiều đảo).",
        "Tổng chi phí: 2 vé × 10,000 = 20,000 VND/kỳ.",
      ],
      sample_ticket: "2 vé: [007, 042] và [042, 007]",
      cost_per_draw_vnd: 20000,
      where_to_buy: "vietlott.vn — Max 3D Pro, nhập số thủ công",
      play_schedule: "Mỗi kỳ chọn cặp X, Y mới",
      warnings: [
        "Mô phỏng ngắn cho kết quả có vẻ tốt nhưng kiểm chứng dài hơn cho thấy đó chỉ là may rủi.",
        "Pick X khác Y — nếu X = Y thì rơi sang cách C6 'A=B'.",
      ],
    },
  },
  {
    id: "C6",
    category: "C",
    name_vi: "Vé A=B (Max 3D Pro) — khai thác quy chế nhân đôi giải",
    description_vi: "Mua vé Max 3D Pro với A và B là cùng một số (ví dụ 007 007). Theo quy chế Vietlott, khi vé như vậy trúng 1 trong 4 giải đầu, tiền giải được nhân đôi.",
    mechanism_vi:
      "Quy chế Max 3D Pro: vé gồm cặp (A, B). Khi A = B = X và X trùng số ở 1 trong 20 vị trí thuộc các giải Nhất / Nhì / Ba / Tư, tiền giải được nhân đôi (Nhất 30 triệu thành 60 triệu...). Mô phỏng nhiều lần đều cho lợi nhuận kỳ vọng dương rõ rệt — đây là lợi thế thật. Người dùng đã trúng và xác nhận thực tế Vietlott trả thưởng đúng theo quy chế (24/04/2026).",
    applicable_products: ["max_3d_pro"],
    status: "accept",
    verdict_note: "ĐÃ XÁC NHẬN — đây là cách chơi đầu tiên có lợi thế thật sau hơn 28 đợt nghiên cứu của dự án. Đã được tích hợp vào trang /max-3d-pro với bảng cảnh báo rõ ràng.",
    cycles_tested: [27, 28, 29],
    metrics: [
      ...pullMetrics(C27, "C6_ab_tierweighted", 27),
      ...pullMetrics(C27, "C6_ab_random", 27),
      ...pullMetrics(C28, "C6_ab_random_N200", 28),
    ],
    user_action: { label: "Mua tại trang Max 3D Pro", href: "/max-3d-pro" },
    history_link: "/research/history#cycle28",
    how_to_buy: {
      steps: [
        "Vào vietlott.vn → chọn Max 3D Pro → mục 'Chọn số' (nhập tay).",
        "Pick 1 số 3 chữ số bất kỳ (ví dụ 007). Chọn ngẫu nhiên cũng được — không cần thuật toán.",
        "Nhập số đó vào CẢ hai ô A và B — bước quan trọng: A = B = X.",
        "Kiểm tra phiếu hiển thị 'A=007, B=007' hoặc '007 007'.",
        "Xác nhận và thanh toán: 10,000 VND/vé.",
        "Chờ kết quả kỳ quay. Nếu X trúng 1 trong 4 giải đầu → tiền giải nhân đôi.",
        "Tùy chọn: mua 5-10 vé với 5-10 số X khác nhau (mỗi vé đều A=B) để dàn trải.",
      ],
      sample_ticket: "1 vé: [007, 007] — 10K VND  /  Gói 5 vé: 5 số khác nhau, mỗi số A=B — 50K VND",
      cost_per_draw_vnd: "10,000 (1 vé) / 50,000 (5 vé) / 100,000 (10 vé)",
      where_to_buy: "vietlott.vn hoặc đại lý Max 3D Pro — BẮT BUỘC nhập tay (Quick Pick không tự sinh A=B)",
      play_schedule: "Mỗi kỳ mua đều được. Gói 10 vé/kỳ là phương án ngân sách 100K cân đối.",
      warnings: [
        "Đây là cách chơi đầu tiên có lợi thế thật trong dự án — đã được kiểm chứng qua trúng thưởng thực tế (24/04/2026).",
        "Phụ thuộc quy chế Vietlott — nếu Vietlott đổi quy chế A=B nhân đôi, lợi thế biến mất.",
        "CHỈ áp dụng Max 3D Pro — Max 3D không có quy chế này, các sản phẩm Power không có cấu trúc A=B.",
        "Tỉ lệ trúng mỗi vé khoảng 2 trong 100 — đa số kỳ sẽ không trúng. Lỗ ngắn hạn là bình thường.",
        "Người chơi PHẢI tự nhập A=B — Vietlott cho phép nhưng không tự gợi ý.",
      ],
    },
  },
  {
    id: "C7",
    category: "C",
    name_vi: "Chọn theo tổng các chữ số",
    description_vi: "Chọn các số có tổng chữ số nằm trong khoảng 'nóng' theo lịch sử.",
    applicable_products: ["max_3d", "power_655", "power_645"],
    status: "tested_no_edge",
    verdict_note: "Đã thử nhiều biến thể — đều không có lợi thế.",
    cycles_tested: [26, 29],
    metrics: pullMetrics(C29, "C7_digit_sum_filter_matrix", 29),
  },
  {
    id: "C8",
    category: "C",
    name_vi: "Số đối xứng (X và 999 - X)",
    description_vi: "Mua đồng thời số X và số đối của nó (999 - X). Ví dụ X=123 thì kèm 876.",
    applicable_products: ["max_3d"],
    status: "tested_no_edge",
    cycles_tested: [26],
    metrics: pullMetrics(C26, "C8_mirror_paired", 26),
    how_to_buy: {
      steps: [
        "Pick 1 số 3 chữ số X (ví dụ 123).",
        "Tính số đối: 999 - X (ví dụ 999 - 123 = 876).",
        "Mua 2 vé Max 3D: số 123 và số 876.",
        "Tổng chi phí: 2 vé × 10K = 20K VND/kỳ.",
      ],
      sample_ticket: "X=123 → 2 vé: 123 và 876",
      cost_per_draw_vnd: 20000,
      where_to_buy: "Đại lý Vietlott Max 3D hoặc vietlott.vn",
      play_schedule: "Mỗi kỳ pick 1 X mới",
      warnings: [
        "Đây là cảm tính dân gian 'số đối' — không có lợi thế thống kê.",
        "Tỉ lệ trúng tăng gấp 2 (do mua 2 vé) nhưng lãi/lỗ kỳ vọng không đổi.",
      ],
    },
  },
  {
    id: "C9",
    category: "C",
    name_vi: "Phân tích Bayes theo từng vị trí",
    description_vi: "Áp dụng xác suất hậu nghiệm (Bayes) độc lập cho từng vị trí chữ số.",
    applicable_products: ["max_3d", "max_3d_pro"],
    status: "family_eliminated",
    verdict_note: "Cả nhóm các cách dùng Bayes đã bị loại — đã thử nhiều biến thể, không có lợi thế.",
    cycles_tested: [4, 11, 14, 21],
  },
  {
    id: "C10",
    category: "C",
    name_vi: "Khai thác liên hệ giữa các vị trí",
    description_vi: "Lợi dụng việc các vị trí chữ số có vẻ không hoàn toàn độc lập với nhau.",
    applicable_products: ["max_3d"],
    status: "tested_no_edge",
    verdict_note: "Đã thử nhiều biến thể — chưa thấy lợi thế thật. Cần thử ở quy mô lớn hơn (≥ 2000 kỳ) mới kết luận chắc.",
    cycles_tested: [4, 11, 12, 13],
  },
  {
    id: "C11",
    category: "C",
    name_vi: "Cùng chữ số cuối",
    description_vi: "Chỉ chọn các số kết thúc bằng cùng một chữ số (ví dụ 100, 210, 340 — đều kết thúc bằng 0).",
    applicable_products: ["max_3d"],
    status: "skipped",
    verdict_note: "Cảm tính dân gian, giá trị nghiên cứu thấp — không thử.",
    cycles_tested: [],
  },

  // ═══════════════════ D. Số lượng vé mỗi kỳ ═══════════════════
  {
    id: "D1",
    category: "D",
    name_vi: "1 vé mỗi kỳ",
    description_vi: "Mua đúng 1 vé mỗi kỳ — đây là chuẩn so sánh cho mọi cách khác.",
    applicable_products: "all",
    status: "tested_variant",
    verdict_note: "Đây là cách chuẩn, đã thử ở mọi đợt nghiên cứu.",
    cycles_tested: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 25, 27, 29],
  },
  {
    id: "D2",
    category: "D",
    name_vi: "N vé mỗi kỳ, cùng cách chọn",
    description_vi: "Lặp lại cùng một thuật toán để sinh ra N vé khác nhau cho mỗi kỳ.",
    applicable_products: "all",
    status: "tested_variant",
    verdict_note: "Đã thử với gói 10 vé/kỳ ở Đợt 24.",
    cycles_tested: [24],
  },
  {
    id: "D3",
    category: "D",
    name_vi: "N vé mỗi kỳ, trộn nhiều cách chọn",
    description_vi: "Trộn nhiều thuật toán: K1 vé chọn theo cách A, K2 vé chọn theo cách B...",
    applicable_products: "all",
    status: "tested_variant",
    verdict_note: "Đã thử nhiều tỉ lệ trộn khác nhau ở Đợt 24.",
    cycles_tested: [24],
  },
  {
    id: "D4",
    category: "D",
    name_vi: "N vé pha thêm vé ngẫu nhiên",
    description_vi: "K vé chọn theo thuật toán + (N-K) vé ngẫu nhiên — giảm rủi ro thuật toán quá hẹp.",
    applicable_products: "all",
    status: "tested_variant",
    verdict_note: "Đã thử ở Đợt 24.",
    cycles_tested: [24],
  },
  {
    id: "D5",
    category: "D",
    name_vi: "Sinh nhiều vé theo hệ bao",
    description_vi: "Tạo 10-100 vé theo cấu trúc bao (xem nhóm B).",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "tested_variant",
    verdict_note: "Đã thử thông qua cách B1 'bao đầy đủ'.",
    cycles_tested: [26],
  },
  {
    id: "D6",
    category: "D",
    name_vi: "Cố định ngân sách (chia ngược ra số vé)",
    description_vi: "Người chơi nhập ngân sách B, hệ thống tự tính N = B/giá vé.",
    applicable_products: "all",
    status: "tested_variant",
    verdict_note: "Đã thử với ngân sách 100K cố định ở Đợt 24.",
    cycles_tested: [24],
  },

  // ═══════════════════ E. Tần suất chơi ═══════════════════
  {
    id: "E1",
    category: "E",
    name_vi: "Chơi mỗi kỳ",
    description_vi: "Mua mỗi kỳ Vietlott mở thưởng — cách chuẩn.",
    applicable_products: "all",
    status: "tested_variant",
    verdict_note: "Đây là cách chuẩn, đã thử ở mọi đợt nghiên cứu.",
    cycles_tested: [25, 26, 27, 29],
  },
  {
    id: "E2",
    category: "E",
    name_vi: "Chơi cách kỳ",
    description_vi: "Bỏ qua mỗi kỳ thứ 2 để kéo dài ngân sách.",
    applicable_products: "all",
    status: "tested_no_edge",
    verdict_note: "Không có lợi thế — chỉ giảm số lần chơi, không cải thiện lãi/lỗ kỳ vọng/vé.",
    cycles_tested: [27],
    metrics: pullMetrics(C27, "E2_alternate", 27),
  },
  {
    id: "E3",
    category: "E",
    name_vi: "Theo lịch tuần",
    description_vi: "Chỉ chơi vào những ngày cố định trong tuần (ví dụ T2, T4, T6 hoặc T7, CN).",
    applicable_products: "all",
    status: "tested_no_edge",
    verdict_note: "Đã thử với chu kỳ 3 ngày và 7 ngày — không có lợi thế.",
    cycles_tested: [27],
    metrics: [
      ...pullMetrics(C27, "E_every_K3", 27),
      ...pullMetrics(C27, "E_every_K7_weekly", 27),
    ],
  },
  {
    id: "E4",
    category: "E",
    name_vi: "Chỉ chơi khi giải đặc biệt cao",
    description_vi: "Chỉ chơi khi giải Jackpot tích lũy đã vượt một mức nào đó (ví dụ 50 tỷ).",
    applicable_products: ["power_655", "power_645"],
    status: "tested_variant",
    verdict_note: "Đã thử bản thử nghiệm. Cần dữ liệu Jackpot chính xác từ Vietlott để kiểm chứng đầy đủ.",
    cycles_tested: [25],
  },
  {
    id: "E5",
    category: "E",
    name_vi: "Chơi sau chuỗi kỳ không có người trúng giải",
    description_vi: "Chỉ chơi khi nhiều kỳ liên tiếp chưa có người trúng Jackpot.",
    applicable_products: ["power_655", "power_645"],
    status: "subsumed",
    verdict_note: "Trùng ý với cách E4 — đã được gộp.",
    cycles_tested: [],
  },
  {
    id: "E6",
    category: "E",
    name_vi: "Tùy hứng người chơi",
    description_vi: "Chơi khi nào cảm thấy thích — không có quy tắc cố định.",
    applicable_products: "all",
    status: "na",
    verdict_note: "Không kiểm chứng được vì không tái lập được.",
    cycles_tested: [],
  },

  // ═══════════════════ F. Khi nào dừng / đeo bám ═══════════════════
  {
    id: "F1",
    category: "F",
    name_vi: "Số gan — đeo bám đến khi trúng",
    description_vi: "Chọn các số 'gan' (chưa ra trong 60-90 kỳ gần đây), mua đi mua lại đến khi trúng.",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "tested_no_edge",
    verdict_note: "Không có lợi thế — thậm chí còn hơi kém hơn chọn ngẫu nhiên thuần. Đây là 'ngụy biện con bạc' kinh điển: quá khứ KHÔNG dự đoán được tương lai trong xổ số.",
    cycles_tested: [25],
    metrics: pullMetrics(C25, "F1_so_gan_cold_persistence", 25),
    how_to_buy: {
      steps: [
        "Xem lịch sử Vietlott → tìm các số chưa xuất hiện trong 60-90 kỳ gần đây (số 'gan').",
        "Chọn 1 bộ gồm các số gan đó (ví dụ 5-11-17-29-34).",
        "Mua CÙNG bộ số đó mỗi kỳ.",
        "Dừng khi BẤT KỲ số nào trong bộ đó trúng (mọi giải).",
        "Sau đó bắt đầu lại với bộ số gan mới.",
      ],
      sample_ticket: "5 11 17 29 34 — các số đã vắng mặt 60+ kỳ trước đây",
      cost_per_draw_vnd: 10000,
      where_to_buy: "Bất kỳ (vietlott.vn hoặc đại lý)",
      play_schedule: "Đeo bám đến khi trúng — trung bình 30-50 kỳ",
      warnings: [
        "Đã được kiểm chứng kỹ: cách này KHÔNG có lợi thế, thậm chí kém hơn chọn ngẫu nhiên thuần.",
        "Đây là 'ngụy biện con bạc' — số chưa ra lâu KHÔNG có nghĩa là sắp ra.",
        "Chỉ nên thử như một bài học, không nên chơi với tiền thật.",
      ],
    },
  },
  {
    id: "F2",
    category: "F",
    name_vi: "Số nóng — đeo bám đến khi trúng",
    description_vi: "Ngược lại với F1 — chọn các số đang ra nhiều và đeo bám.",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "tested_no_edge",
    verdict_note: "Cũng kém hơn chọn ngẫu nhiên — thất bại tương đương F1.",
    cycles_tested: [25],
    metrics: pullMetrics(C25, "F2_hot_persistence", 25),
  },
  {
    id: "F3",
    category: "F",
    name_vi: "Bộ số do thuật toán chọn — đeo bám đến khi trúng",
    description_vi: "Chạy thuật toán 1 lần để có 1 bộ, rồi đeo bám bộ đó đến khi trúng.",
    applicable_products: ["power_655", "power_645", "power_535", "max_3d", "max_3d_pro"],
    status: "tested_no_edge",
    verdict_note: "Đã thử, không có lợi thế.",
    cycles_tested: [25],
    metrics: [
      ...pullMetrics(C25, "F3_algo_persistence", 25),
      ...pullMetrics(C25, "F3b_algo_persistence_3d", 25),
    ],
  },
  {
    id: "F4",
    category: "F",
    name_vi: "Dừng khi trúng giải bất kỳ",
    description_vi: "Đeo bám đến khi trúng bất kỳ giải nào (kể cả nhỏ nhất) thì dừng.",
    applicable_products: "all",
    status: "tested_variant",
    verdict_note: "Đây là điều kiện dừng chuẩn cho các cách F1-F3.",
    cycles_tested: [25],
  },
  {
    id: "F5",
    category: "F",
    name_vi: "Dừng khi trúng giải đặc biệt",
    description_vi: "Chỉ dừng khi trúng giải cao nhất (Jackpot / khớp đủ N số).",
    applicable_products: "all",
    status: "tested_no_edge",
    verdict_note: "Đã thử kết hợp với cách C6 (vé A=B Max 3D Pro) — kết quả khẳng định lại lợi thế C6 (kiểm tra chéo).",
    cycles_tested: [29],
    metrics: [
      ...pullMetrics(C29, "F5_jackpot_only_stop", 29),
      ...pullMetrics(C29, "F5b_jackpot_only_3dpro_ab", 29),
    ],
  },
  {
    id: "F6",
    category: "F",
    name_vi: "Đeo bám có giới hạn ngân sách",
    description_vi: "Đeo bám đến khi tổng chi phí vượt ngân sách B thì dừng (van an toàn).",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "tested_no_edge",
    cycles_tested: [25],
    metrics: pullMetrics(C25, "F6_budget_capped_1M", 25),
  },
  {
    id: "F7",
    category: "F",
    name_vi: "Dừng sau K kỳ liên tiếp không trúng",
    description_vi: "Nếu đã chơi K kỳ mà chưa trúng gì thì dừng.",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "tested_no_edge",
    verdict_note: "Lúc đầu mô phỏng cho thấy có vẻ tốt, nhưng kiểm tra lại kỹ hơn (200 lần) thì xác nhận chỉ là biến động ngẫu nhiên.",
    cycles_tested: [25, 28],
    metrics: [
      ...pullMetrics(C25, "F7_k50_escape", 25),
      ...pullMetrics(C28, "F7_K50_retest_N100", 28),
    ],
  },
  {
    id: "F8",
    category: "F",
    name_vi: "Đổi bộ số sau chuỗi không trúng",
    description_vi: "Nếu sau K kỳ không trúng thì đổi sang bộ số mới (thay vì đeo bám tiếp).",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "tested_no_edge",
    verdict_note: "Tốt hơn cách 'đeo bám thuần' một chút nhưng vẫn không vượt qua chọn ngẫu nhiên.",
    cycles_tested: [29],
    metrics: pullMetrics(C29, "F8_persistent_reset30", 29),
  },
  {
    id: "F9",
    category: "F",
    name_vi: "Dừng khi đã trúng N lần",
    description_vi: "Chơi đến khi tích lũy đủ N lần trúng (mọi giải) thì dừng — kiểu 'thỏa mãn rồi nghỉ'.",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "tested_no_edge",
    cycles_tested: [29],
    metrics: pullMetrics(C29, "F9_n3_hits_stop", 29),
  },

  // ═══════════════════ G. Cược tăng-giảm theo thắng-thua ═══════════════════
  {
    id: "G1",
    category: "G",
    name_vi: "Cược đều mỗi kỳ",
    description_vi: "Số tiền cược cố định mỗi kỳ — không tăng cũng không giảm.",
    applicable_products: "all",
    status: "tested_variant",
    verdict_note: "Đây là chuẩn so sánh cho các cách cược tăng-giảm.",
    cycles_tested: [25, 26, 27, 29],
  },
  {
    id: "G2",
    category: "G",
    name_vi: "Martingale — gấp đôi sau mỗi lần thua",
    description_vi: "Thua thì kỳ sau gấp đôi cược; thắng thì reset về cược ban đầu.",
    applicable_products: "all",
    status: "tested_no_edge",
    verdict_note: "CẢNH BÁO — gần như chắc chắn cháy túi. Cách cược này KHÔNG thay đổi lợi thế của nhà cái, chỉ làm lỗ tăng nhanh hơn.",
    cycles_tested: [27],
    metrics: [
      ...pullMetrics(C27, "G2_martingale_cap32", 27),
      ...pullMetrics(C27, "G2_martingale_cap8", 27),
    ],
    how_to_buy: {
      steps: [
        "Kỳ 1: mua 1 vé ngẫu nhiên (10K).",
        "Nếu thua → Kỳ 2: mua 2 vé (20K).",
        "Tiếp tục thua → Kỳ 3: 4 vé (40K), Kỳ 4: 8 vé (80K), Kỳ 5: 16 vé (160K), Kỳ 6: 32 vé (320K).",
        "Khi trúng 1 vé bất kỳ → reset về 1 vé (10K) cho kỳ sau.",
        "Đặt giới hạn: không được gấp đôi quá 32 lần (vì lỗ tăng theo cấp số nhân).",
      ],
      sample_ticket: "Dãy số vé: 1 → 2 → 4 → 8 → 16 → 32 (giới hạn) mỗi kỳ",
      cost_per_draw_vnd: "10K (kỳ thắng) đến 320K (sau 6 kỳ liên tiếp thua)",
      where_to_buy: "vietlott.vn hoặc đại lý — tự theo dõi chuỗi thua",
      play_schedule: "Vô thời hạn — dừng khi tổng lỗ vượt ngân sách",
      warnings: [
        "Mô phỏng cho thấy với ngân sách 1 triệu, gần như chắc chắn cháy túi.",
        "Cộng dồn không thay đổi lợi thế nhà cái — chỉ làm lỗ tăng nhanh hơn.",
        "Đây là sai lầm phổ biến của người chơi cờ bạc — tài liệu này ghi lại để cảnh báo.",
        "KHÔNG khuyến nghị chơi thật. Liệt kê chỉ để giải thích vì sao cách này KHÔNG hoạt động.",
      ],
    },
  },
  {
    id: "G3",
    category: "G",
    name_vi: "Paroli — gấp đôi sau mỗi lần thắng",
    description_vi: "Thắng thì kỳ sau gấp đôi cược; thua thì reset về cược ban đầu.",
    applicable_products: ["power_655", "max_3d"],
    status: "tested_no_edge",
    verdict_note: "Đã thử, không có lợi thế.",
    cycles_tested: [27],
    metrics: pullMetrics(C27, "G3_anti_martingale_cap16", 27),
  },
  {
    id: "G4",
    category: "G",
    name_vi: "Theo dãy 1-3-2-6",
    description_vi: "Tăng cược theo dãy cố định (1 - 3 - 2 - 6) khi đang trên chuỗi thắng.",
    applicable_products: ["power_655", "max_3d"],
    status: "tested_no_edge",
    verdict_note: "Đã thử, không có lợi thế. Cộng dồn không cứu được trò chơi mà nhà cái có lợi thế.",
    cycles_tested: [29],
    metrics: pullMetrics(C29, "G4_progression_1326", 29),
  },
  {
    id: "G5",
    category: "G",
    name_vi: "Tăng cược sau kỳ trượt sát",
    description_vi: "Tăng cược kỳ sau nếu kỳ trước trúng gần đủ (ví dụ khớp 4/6).",
    applicable_products: ["power_655", "power_645"],
    status: "tested_no_edge",
    cycles_tested: [27],
    metrics: pullMetrics(C27, "G5_near_miss_escalation", 27),
  },
  {
    id: "G6",
    category: "G",
    name_vi: "Reset về mức đầu khi thắng",
    description_vi: "Chỉ một biến thể đơn giản của G2 / G3 — đã được gộp.",
    applicable_products: "all",
    status: "subsumed",
    verdict_note: "Trùng với G2 / G3.",
    cycles_tested: [],
  },
  {
    id: "G7",
    category: "G",
    name_vi: "Công thức Kelly",
    description_vi: "Công thức tối ưu hóa cược nổi tiếng trong cờ bạc.",
    applicable_products: "all",
    status: "family_eliminated",
    verdict_note: "Đã loại — Kelly thiết kế cho trò có 1 kết quả win/lose, không phù hợp với xổ số kiểu 'phải khớp đủ bộ số'.",
    cycles_tested: [16],
  },

  // ═══════════════════ H. Kết hợp nhiều cách ═══════════════════
  {
    id: "H1",
    category: "H",
    name_vi: "Mua 10 vé A=B mỗi kỳ (gói lớn của C6)",
    description_vi: "Mỗi kỳ mua 10 vé A=B với 10 số khác nhau — phiên bản nhân rộng của cách C6 đã được xác nhận.",
    applicable_products: ["max_3d_pro"],
    status: "suggestive",
    verdict_note: "Có dấu hiệu rất tốt — đây là phiên bản nhân rộng của C6 (đã xác nhận có lợi thế). Phù hợp ngân sách 100K/kỳ.",
    cycles_tested: [28],
    metrics: pullMetrics(C28, "H1_C6_ab_portfolio_N10", 28),
    how_to_buy: {
      steps: [
        "Pick 10 số 3 chữ số khác nhau (ví dụ: 007, 042, 153, 289, 376, 421, 558, 634, 781, 892).",
        "Vào vietlott.vn → Max 3D Pro → bấm 'Chọn số' 10 lần.",
        "Với MỖI số, nhập số đó vào CẢ ô A và ô B (A=B).",
        "Tổng: 10 vé × 10K = 100K VND/kỳ.",
        "Mỗi kỳ mua đủ 10 vé (mỗi vé một số X riêng, mỗi vé đều A=B).",
      ],
      sample_ticket: "10 vé: [007,007] [042,042] [153,153] [289,289] [376,376] [421,421] [558,558] [634,634] [781,781] [892,892]",
      cost_per_draw_vnd: 100000,
      where_to_buy: "vietlott.vn — nhập tay từng vé A=B",
      play_schedule: "Mỗi kỳ — đây là gói ngân sách 100K cân đối (chuẩn Đợt 24)",
      warnings: [
        "Tỉ lệ trúng cao hơn nhiều so với mua 1 vé C6 đơn lẻ.",
        "Lãi/lỗ kỳ vọng giữ nguyên — vì mỗi vé vẫn có cùng lợi thế.",
        "Chi phí 100K/kỳ — nếu chơi 10 kỳ liên tiếp không trúng có thể cháy túi 1 triệu.",
        "Áp dụng đầy đủ các cảnh báo của C6: phụ thuộc quy chế Vietlott, phải nhập tay, chỉ Max 3D Pro.",
      ],
    },
  },
  {
    id: "H2",
    category: "H",
    name_vi: "Mỗi tháng đổi sang thuật toán xếp hạng cao nhất",
    description_vi: "Hàng tháng xếp hạng các thuật toán theo kết quả gần đây, chọn thuật toán tốt nhất cho tháng kế.",
    applicable_products: "all",
    status: "subsumed",
    verdict_note: "Trùng nhóm các cách 'thích nghi theo cửa sổ' — đã bị loại ở Đợt 14.",
    cycles_tested: [1, 14],
  },
  {
    id: "H3",
    category: "H",
    name_vi: "Hội đồng nhiều thuật toán bỏ phiếu",
    description_vi: "Cho nhiều thuật toán cùng đề xuất, mỗi vé chọn theo đa số.",
    applicable_products: "all",
    status: "subsumed",
    verdict_note: "Đã thử cả phiên bản đơn và đa thuật toán — không có lợi thế.",
    cycles_tested: [19],
  },
  {
    id: "H4",
    category: "H",
    name_vi: "Học Bayes ở cấp meta",
    description_vi: "Cập nhật mức độ tin tưởng vào từng thuật toán dựa trên kết quả lịch sử của chúng.",
    applicable_products: "all",
    status: "family_eliminated",
    verdict_note: "Cả nhóm 'thích nghi' đã bị loại ở Đợt 14 — không có lợi thế.",
    cycles_tested: [14],
  },
  {
    id: "H5",
    category: "H",
    name_vi: "Mua 5 vé A=B mỗi kỳ (gói vừa của C6)",
    description_vi: "Phiên bản 5 vé/kỳ của cách C6 — gói vừa cho ngân sách thấp hơn.",
    applicable_products: ["max_3d_pro"],
    status: "suggestive",
    verdict_note: "Có dấu hiệu tốt — phiên bản trung bình của C6 đã xác nhận có lợi thế.",
    cycles_tested: [28],
    metrics: pullMetrics(C28, "H5_C6_ab_portfolio_N5", 28),
    how_to_buy: {
      steps: [
        "Pick 5 số 3 chữ số khác nhau (ví dụ: 007, 042, 153, 289, 376).",
        "Vào vietlott.vn → Max 3D Pro → mua 5 vé.",
        "Với mỗi số, nhập vào CẢ ô A và ô B (A=B).",
        "Tổng: 5 vé × 10K = 50K VND/kỳ.",
      ],
      sample_ticket: "5 vé: [007,007] [042,042] [153,153] [289,289] [376,376]",
      cost_per_draw_vnd: 50000,
      where_to_buy: "vietlott.vn — nhập tay từng vé A=B",
      play_schedule: "Mỗi kỳ — gói 50K phù hợp cho người chơi giải trí",
      warnings: [
        "Tỉ lệ trúng khoảng gấp đôi so với gói 5 vé thường (nhờ dàn trải).",
        "Lãi/lỗ kỳ vọng giữ nguyên — vẫn dương vì cùng cơ chế C6.",
        "Áp dụng đầy đủ các cảnh báo của C6.",
      ],
    },
  },

  // ═══════════════════ I. Số đẹp & văn hóa ═══════════════════
  {
    id: "I1",
    category: "I",
    name_vi: "Chọn theo ngày sinh",
    description_vi: "Lấy ngày, tháng, năm của bản thân và gia đình làm số.",
    applicable_products: "all",
    status: "skipped",
    verdict_note: "Là yếu tố văn hóa, không có lợi thế thống kê. Liệt kê để tham khảo.",
    cycles_tested: [],
  },
  {
    id: "I2",
    category: "I",
    name_vi: "Chọn 'số đẹp' theo văn hóa",
    description_vi: "Theo quan niệm dân gian: 6 (lộc), 8 (phát), 9 (vĩnh cửu), 68, 86, 99...",
    applicable_products: "all",
    status: "skipped",
    verdict_note: "Liệt kê để tham khảo, không có lợi thế thống kê.",
    cycles_tested: [],
  },
  {
    id: "I3",
    category: "I",
    name_vi: "Tránh 'số xấu' theo văn hóa",
    description_vi: "Tránh các số bị coi là xui (4, 7, 13...). Trên lý thuyết, nếu Vietlott có công bố lượng người mua từng số thì việc tránh số đông có thể cải thiện chia thưởng.",
    applicable_products: "all",
    status: "na",
    verdict_note: "Không thực hiện được — Vietlott không công bố số liệu lượng cược theo từng số.",
    cycles_tested: [],
  },
  {
    id: "I4",
    category: "I",
    name_vi: "Chọn theo giấc mơ / sách giải mộng",
    description_vi: "Tra số theo các sự kiện trong giấc mơ.",
    applicable_products: "all",
    status: "skipped",
    verdict_note: "Liệt kê để tham khảo, không có cơ sở thống kê.",
    cycles_tested: [],
  },
  {
    id: "I5",
    category: "I",
    name_vi: "Chọn theo phong thủy / ngũ hành",
    description_vi: "Theo năm mệnh / cung mệnh của người chơi.",
    applicable_products: "all",
    status: "skipped",
    verdict_note: "Liệt kê để tham khảo, không có cơ sở thống kê.",
    cycles_tested: [],
  },

  // ═══════════════════ J. Theo nhóm / hệ thống ═══════════════════
  {
    id: "J1",
    category: "J",
    name_vi: "Đăng ký mua tự động (Vietlott Subscription)",
    description_vi: "Đăng ký để Vietlott tự mua hộ cùng một bộ số trong N kỳ liên tục.",
    applicable_products: "all",
    status: "na",
    verdict_note: "Chưa rõ Vietlott có cung cấp dịch vụ này không — cần xác nhận thêm.",
    cycles_tested: [],
  },
  {
    id: "J2",
    category: "J",
    name_vi: "Hùn vốn nhiều người chia giải",
    description_vi: "Nhiều người gom tiền mua chung, nếu trúng thì chia.",
    applicable_products: "all",
    status: "na",
    verdict_note: "Không thay đổi lãi/lỗ kỳ vọng/vé — chỉ là cách chia chi phí và thưởng.",
    cycles_tested: [],
  },
  {
    id: "J3",
    category: "J",
    name_vi: "Câu lạc bộ chơi bao chung",
    description_vi: "Nhiều thành viên cùng góp mua hệ bao.",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "subsumed",
    verdict_note: "Cách tính giống các cách 'bao' ở nhóm B — đã được gộp.",
    cycles_tested: [],
  },
];

// ─────────────────────────── Hàm hỗ trợ + thống kê ───────────────────────────

export function statusLabel(status: MethodStatus): { emoji: string; text: string; color: string } {
  switch (status) {
    case "accept":             return { emoji: "🏆", text: "Đã xác nhận có lợi thế", color: "green" };
    case "suggestive":         return { emoji: "⭐", text: "Có dấu hiệu tốt", color: "orange" };
    case "tested_no_edge":     return { emoji: "✓", text: "Đã thử — không có lợi thế", color: "muted" };
    case "tested_variant":     return { emoji: "✓", text: "Đã thử (dạng chuẩn)", color: "muted" };
    case "family_eliminated":  return { emoji: "✗", text: "Cả nhóm đã bị loại", color: "red" };
    case "subsumed":           return { emoji: "—", text: "Trùng cách khác", color: "muted" };
    case "deferred":           return { emoji: "⏳", text: "Tạm hoãn", color: "amber" };
    case "skipped":            return { emoji: "⚪", text: "Chưa thử", color: "muted" };
    case "na":                 return { emoji: "—", text: "Không áp dụng", color: "muted" };
  }
}

export function categoryLabel(cat: MethodCategory): string {
  return ({
    A: "A. Cách chọn số chung (mọi sản phẩm)",
    B: "B. Riêng các sản phẩm chọn số (Power 6/55, 6/45, 5/35)",
    C: "C. Riêng Max 3D & Max 3D Pro",
    D: "D. Số lượng vé mỗi kỳ",
    E: "E. Tần suất chơi (mỗi kỳ, cách kỳ...)",
    F: "F. Khi nào dừng / đeo bám",
    G: "G. Cược tăng-giảm theo thắng-thua",
    H: "H. Kết hợp nhiều cách",
    I: "I. Số đẹp & văn hóa",
    J: "J. Theo nhóm / hệ thống",
  }[cat]);
}

export function catalogStats() {
  const total = METHODS_CATALOG.length;
  const byStatus: Record<string, number> = {};
  for (const m of METHODS_CATALOG) {
    byStatus[m.status] = (byStatus[m.status] || 0) + 1;
  }
  return {
    total,
    accept: byStatus["accept"] || 0,
    suggestive: byStatus["suggestive"] || 0,
    tested: (byStatus["tested_no_edge"] || 0) + (byStatus["tested_variant"] || 0) + (byStatus["accept"] || 0) + (byStatus["suggestive"] || 0),
    eliminated: byStatus["family_eliminated"] || 0,
    deferred: byStatus["deferred"] || 0,
    subsumed: byStatus["subsumed"] || 0,
    skipped: (byStatus["skipped"] || 0) + (byStatus["na"] || 0),
  };
}

// Nội dung điểm nhấn cho cách chơi C6 (đã xác nhận có lợi thế ở Đợt 28)
export const C6_SPOTLIGHT = {
  title: "C6 — Vé A=B (Max 3D Pro)",
  subtitle: "Cách chơi đầu tiên có lợi thế thật sau hơn 28 đợt nghiên cứu",
  cycles: [27, 28],
  // Tóm tắt định tính (KHÔNG hiển thị số % EV/ROI thô lên giao diện chính)
  highlights: [
    "Mua vé Max 3D Pro với A và B là cùng một số (ví dụ 007 007).",
    "Khi số đó trúng 1 trong 4 giải đầu, Vietlott trả tiền thưởng GẤP ĐÔI theo quy chế.",
    "Mô phỏng nhiều lần đều cho lợi nhuận kỳ vọng dương — đã được kiểm chứng qua trúng thưởng thực tế.",
  ],
  mechanism_short:
    "Vé Max 3D Pro gồm cặp (A, B). Khi A = B = X và X trùng số ở 1 trong 20 vị trí thuộc các giải Nhất / Nhì / Ba / Tư, tiền giải được nhân đôi (Nhất 30 triệu thành 60 triệu...).",
  mechanism_steps: [
    { label: "Cấu trúc vé", detail: "Cặp (A, B), giá 10.000 VND" },
    { label: "Người chơi cần làm", detail: "Nhập cùng 1 số vào cả 2 ô A và B (ví dụ 007 và 007)" },
    { label: "Quy chế Vietlott", detail: "Khi A = B = X và X trúng các giải Nhất / Nhì / Ba / Tư, tiền giải nhân đôi" },
    { label: "Cơ sở", detail: "Mô phỏng lại 200 lần đều cho lợi nhuận kỳ vọng dương rõ rệt" },
    { label: "Kiểm chứng thực tế", detail: "Người dùng đã trúng và xác nhận Vietlott trả thưởng đúng (24/04/2026)" },
  ],
  prize_table: [
    { tier: "Giải Đặc biệt", base: "2.000.000.000", a_eq_b: "2.000.000.000 (không nhân đôi — quy tắc vị trí)" },
    { tier: "Giải Nhất", base: "30.000.000", a_eq_b: "60.000.000 (gấp đôi)" },
    { tier: "Giải Nhì", base: "10.000.000", a_eq_b: "20.000.000 (gấp đôi)" },
    { tier: "Giải Ba", base: "4.000.000", a_eq_b: "8.000.000 (gấp đôi)" },
    { tier: "Giải Tư", base: "1.000.000", a_eq_b: "2.000.000 (gấp đôi)" },
  ],
  disclosures: [
    "Phụ thuộc quy chế Vietlott — nếu Vietlott đổi quy tắc nhân đôi, lợi thế biến mất.",
    "Người chơi PHẢI tự nhập cùng 1 số vào 2 ô — Vietlott không tự gợi ý.",
    "CHỈ áp dụng cho Max 3D Pro — Max 3D và các sản phẩm Power không có quy chế này.",
    "Đa số kỳ sẽ không trúng (giải cao hiếm) — lỗ ngắn hạn là bình thường.",
  ],
  play_href: "/max-3d-pro",
  history_href: "/research",
};
