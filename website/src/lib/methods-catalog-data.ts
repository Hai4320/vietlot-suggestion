// 73-method betting catalog — auto-synced from research/BETTING_METHODS_CATALOG.md
//
// Hand-coded metadata (names, descriptions, categories) + metrics imported from
// research cycle JSONs (C25-29). Status field reflects post-Chu kỳ 29 state.
//
// Single source of truth for /methods page. Per user decision (methods_page.md §9):
// hand-code entries, auto-sync metrics via JSON import pattern (C22/C24 idiom).

import c25 from "../../research/optimization/cycle25_results.json";
import c26 from "../../research/optimization/cycle26_results.json";
import c27 from "../../research/optimization/cycle27_results.json";
import c28 from "../../research/optimization/cycle28_results.json";
import c29 from "../../research/optimization/cycle29_results.json";

// ─────────────────────────── Types ───────────────────────────

export type MethodCategory = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J";

export type MethodStatus =
  | "accept"          // 🏆 confirmed edge (Accept claim)
  | "suggestive"      // 🚨 positive-EV pending validation
  | "tested_no_edge"  // ✓ tested, no statistical edge
  | "tested_variant"  // ✓ tested as variant of baseline
  | "family_eliminated" // ❌ Principle #17 eliminated
  | "subsumed"        // — subsumed by other method
  | "deferred"        // ⏳ needs adapter work
  | "skipped"         // ⚪ low value / N/A
  | "na";             // not applicable

export type ProductKey = "power_655" | "power_645" | "power_535" | "max_3d" | "max_3d_pro";

export interface MethodMetrics {
  roi_full_pct: number;
  p_any_hit: number;
  product: ProductKey;
  cycle: number;
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
}

// ─────────────────────────── JSON metric extraction helper ───────────────────────────

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

// ─────────────────────────── 73-method catalog ───────────────────────────

export const METHODS_CATALOG: CatalogMethod[] = [
  // ═══════════════════ A. Universal selection ═══════════════════
  {
    id: "A1",
    category: "A",
    name_vi: "Cố định 1 bộ số qua N kỳ",
    description_vi: "Chọn 1 bộ số (algorithm-picked) từ đầu, dùng lại suốt N kỳ liên tục",
    applicable_products: "all",
    status: "tested_no_edge",
    cycles_tested: [25],
    metrics: [...pullMetrics(C25, "A1_fixed_ticket", 25), ...pullMetrics(C25, "A1b_fixed_ticket_3d", 25)],
  },
  {
    id: "A2",
    category: "A",
    name_vi: "Algorithm chạy lại mỗi kỳ",
    description_vi: "Re-run algorithm mỗi kỳ để pick bộ số mới (standard backtest mode)",
    applicable_products: "all",
    status: "tested_variant",
    verdict_note: "Tested as default mode trong Chu kỳ 1-21 với 21+ strategies. 0 Accept tìm được.",
    cycles_tested: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
  },
  {
    id: "A3",
    category: "A",
    name_vi: "Random hoàn toàn mỗi kỳ",
    description_vi: "Uniform random pick — baseline cho mọi comparisons",
    applicable_products: "all",
    status: "tested_variant",
    verdict_note: "Baseline. ROI typically −48% (Max 3D) đến −90% (matrix products)",
    cycles_tested: [25],
    metrics: pullMetrics(C25, "A3_random_baseline", 25),
  },
  {
    id: "A4",
    category: "A",
    name_vi: "Luân phiên algorithms qua kỳ",
    description_vi: "Rotate qua list algorithms (e.g., Freq_Hot → MinDistance → Pattern → repeat)",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "tested_no_edge",
    cycles_tested: [25],
    metrics: pullMetrics(C25, "A4_rotate_algorithms", 25),
  },
  {
    id: "A5",
    category: "A",
    name_vi: "Ensemble voting",
    description_vi: "K algorithms vote, pick top N theo consensus",
    applicable_products: "all",
    status: "tested_no_edge",
    verdict_note: "Tested Chu kỳ 19e (single+multi ensemble) — Reject. Chu kỳ 22 composite profiles derivative.",
    cycles_tested: [19, 22],
  },
  {
    id: "A6",
    category: "A",
    name_vi: "Copy số vừa trúng kỳ trước",
    description_vi: "Bắt chước bộ số vừa trúng ở kỳ trước (follow-past)",
    applicable_products: "all",
    status: "skipped",
    verdict_note: "Chưa test trực tiếp; lottery là IID nên expected no edge",
    cycles_tested: [],
  },
  {
    id: "A7",
    category: "A",
    name_vi: "Tránh số vừa trúng",
    description_vi: "Mirror của A6 — tránh số vừa ra kỳ trước",
    applicable_products: "all",
    status: "subsumed",
    verdict_note: "Gần NotRepeatStrategy đã test Chu kỳ 1. No edge.",
    cycles_tested: [1],
  },
  {
    id: "A8",
    category: "A",
    name_vi: "Follow near-miss",
    description_vi: "Copy bộ có 4/6 match kỳ trước (almost-hit persistence)",
    applicable_products: "all",
    status: "skipped",
    verdict_note: "Low priority — variance-based heuristic",
    cycles_tested: [],
  },
  {
    id: "A9",
    category: "A",
    name_vi: "User lucky numbers (fixed)",
    description_vi: "User-picked (ngày sinh, số đẹp) không đổi",
    applicable_products: "all",
    status: "skipped",
    verdict_note: "Cultural, không có statistical edge. See I category.",
    cycles_tested: [],
  },
  {
    id: "A10",
    category: "A",
    name_vi: "Mirror number 999-X (3D)",
    description_vi: "Tạo bộ 'complement' — 3D: 123 → 876",
    applicable_products: ["max_3d"],
    status: "tested_no_edge",
    verdict_note: "Tested as C8 mirror_paired Chu kỳ 26 — within variance",
    cycles_tested: [26],
  },

  // ═══════════════════ B. Matrix-specific ═══════════════════
  {
    id: "B1",
    category: "B",
    name_vi: "Full wheel K numbers",
    description_vi: "Chọn K > main_count, mua tất cả C(K, main_count) tổ hợp. P(hit) ↑ 1.6-5× nhưng ROI tied Random.",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "tested_no_edge",
    verdict_note: "Wheels = more chances, same house edge. Confirms lottery math.",
    cycles_tested: [26],
    metrics: [
      ...pullMetrics(C26, "B1_wheel_K7_Freq_Hot", 26),
      ...pullMetrics(C26, "B1_wheel_K7_MinDistance", 26),
      ...pullMetrics(C26, "B1_wheel_K6_Freq_Hot_535", 26),
    ],
  },
  {
    id: "B2",
    category: "B",
    name_vi: "Reduced/Partial wheel",
    description_vi: "Subset of full wheel guarantee N-match if K-match in wheel. Cần math optimization.",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "deferred",
    verdict_note: "Needs combinatorial optimization library. Deferred post Chu kỳ 29.",
    cycles_tested: [],
  },
  {
    id: "B3",
    category: "B",
    name_vi: "Key-number wheel",
    description_vi: "1-2 số fixed + rotate pool 7 số. Cost 35 vé/kỳ (6/55 + 6/45).",
    applicable_products: ["power_655", "power_645"],
    status: "tested_no_edge",
    cycles_tested: [26],
    metrics: pullMetrics(C26, "B3_key_wheel_K2_R7", 26),
  },
  {
    id: "B4",
    category: "B",
    name_vi: "Position-weighted selection",
    description_vi: "Weight theo historical low/mid/high range",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "subsumed",
    verdict_note: "Subsumed by PatternStrategy (Chu kỳ 1-3)",
    cycles_tested: [1, 2, 3],
  },
  {
    id: "B5",
    category: "B",
    name_vi: "Sum-range filter",
    description_vi: "Random ticket filtered to digit-sum ∈ hot range",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "tested_no_edge",
    verdict_note: "Filter = statistical noise. No edge.",
    cycles_tested: [26],
    metrics: pullMetrics(C26, "B5_sum_range_filter", 26),
  },
  {
    id: "B6",
    category: "B",
    name_vi: "Parity-balanced",
    description_vi: "Random ticket filtered odd/even balance (≥2 odd, ≤4 odd)",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "tested_no_edge",
    cycles_tested: [26],
    metrics: pullMetrics(C26, "B6_parity_balanced", 26),
  },
  {
    id: "B7",
    category: "B",
    name_vi: "Birthday-universe",
    description_vi: "Chỉ từ 1-31 (ngày) hoặc 1-12 (tháng)",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "skipped",
    verdict_note: "Trivial restriction — reduces universe but no edge",
    cycles_tested: [],
  },
  {
    id: "B8",
    category: "B",
    name_vi: "5/35 special sub-strategies",
    description_vi: "Pick special 1-12 độc lập (fixed/hot/cold/freq-match)",
    applicable_products: ["power_535"],
    status: "deferred",
    verdict_note: "Cần 5/35-specific adapter work (separate special generation)",
    cycles_tested: [],
  },
  {
    id: "B9",
    category: "B",
    name_vi: "6/55 bonus-ball targeting",
    description_vi: "Optimize cho tier 2 (match 5 + bonus) vs jackpot",
    applicable_products: ["power_655"],
    status: "deferred",
    verdict_note: "Cần 6/55 bonus-aware scoring adapter",
    cycles_tested: [],
  },
  {
    id: "B10",
    category: "B",
    name_vi: "Tránh số liền kề",
    description_vi: "Filter out tickets có consecutive numbers (e.g., 4-5-6)",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "tested_no_edge",
    cycles_tested: [26],
    metrics: pullMetrics(C26, "B10_no_consecutive", 26),
  },
  {
    id: "B11",
    category: "B",
    name_vi: "Ưu tiên số liền kề",
    description_vi: "Mirror của B10 — require ≥1 consecutive pair",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "tested_no_edge",
    cycles_tested: [26],
    metrics: pullMetrics(C26, "B11_has_consecutive", 26),
  },

  // ═══════════════════ C. 3D-specific ═══════════════════
  {
    id: "C1",
    category: "C",
    name_vi: "Bao lô 6 hoán vị",
    description_vi: "Pick 1 số 3-digit, emit all distinct permutations (6 nếu 3 digit khác nhau)",
    applicable_products: ["max_3d"],
    status: "tested_no_edge",
    verdict_note: "P(hit) 5× Random nhưng ROI tied. Cultural value cho ngắn cold-streak.",
    cycles_tested: [26],
    metrics: [
      ...pullMetrics(C26, "C1_bao_lo_6_perms", 26),
      ...pullMetrics(C26, "C1_bao_lo_random", 26),
    ],
  },
  {
    id: "C2",
    category: "C",
    name_vi: "Bao bộ ba (3 hoán vị)",
    description_vi: "Bộ có 2 digit giống (e.g., 122) → 3 perms",
    applicable_products: ["max_3d"],
    status: "subsumed",
    verdict_note: "Subsumed by C1 permutation_all framework",
    cycles_tested: [26],
  },
  {
    id: "C3",
    category: "C",
    name_vi: "Bao xỉu chủ",
    description_vi: "Mua cả xỉu (3 số) + chủ (2 số cuối)",
    applicable_products: ["max_3d"],
    status: "na",
    verdict_note: "N/A — Vietlott 3D không có tier cấu trúc này",
    cycles_tested: [],
  },
  {
    id: "C4",
    category: "C",
    name_vi: "KK 2 số cuối focused",
    description_vi: "Pick số có 2 digit cuối matching historical frequent KK values",
    applicable_products: ["max_3d"],
    status: "deferred",
    verdict_note: "Cần tier-aware selection adapter",
    cycles_tested: [],
  },
  {
    id: "C5",
    category: "C",
    name_vi: "Forward+Reverse hedge (3D Pro)",
    description_vi: "Mua cả (A,B) và (B,A) để hit cả ĐB + Phụ ĐB",
    applicable_products: ["max_3d_pro"],
    status: "tested_no_edge",
    verdict_note: "Chu kỳ 26 full +34.5pp apparent lift nhưng forward-gate FAIL (Principle #13 caught variance trap). Chu kỳ 28 retest confirmed null.",
    cycles_tested: [26, 28],
    metrics: [
      ...pullMetrics(C26, "C5_forward_reverse_hedge_3dpro", 26),
      ...pullMetrics(C28, "C5_fw_rv_retest_N100", 28),
    ],
  },
  {
    id: "C6",
    category: "C",
    name_vi: "A=B Exploit (Max 3D Pro)",
    description_vi: "Vé [X, X] khai thác quy chế doubling rule — theoretical EV +4180% per 10K vé",
    mechanism_vi:
      "Vietlott Max 3D Pro quy chế: ticket (A, B). Khi A=B=X và X thuộc 20-number universe (ĐB 2 + Nhất 4 + Nhì 6 + Ba 8), giải Nhất/Nhì/Ba/Tư được trả gấp 2. Theoretical EV = 0.02 × (0.2×60M + 0.3×20M + 0.4×8M + 0.1×2M) ≈ 428K/vé. Cost 10K → ROI +4180%. Backtest N=200 validated +3864%. User external validation 2026-04-24 → ACCEPT.",
    applicable_products: ["max_3d_pro"],
    status: "accept",
    verdict_note: "🏆 FIRST ACCEPT in 28-cycle project history. Shipped to /max-3d-pro với disclosure banner.",
    cycles_tested: [27, 28, 29],
    metrics: [
      ...pullMetrics(C27, "C6_ab_tierweighted", 27),
      ...pullMetrics(C27, "C6_ab_random", 27),
      ...pullMetrics(C28, "C6_ab_random_N200", 28),
    ],
    user_action: { label: "🏆 Mua tại /max-3d-pro", href: "/max-3d-pro" },
    history_link: "/research/history#cycle28",
  },
  {
    id: "C7",
    category: "C",
    name_vi: "Digit-sum targeting",
    description_vi: "Pick số có digit-sum ∈ hot range",
    applicable_products: ["max_3d", "power_655", "power_645"],
    status: "tested_no_edge",
    verdict_note: "Filter variants Chu kỳ 26 (B5 matrix) + Chu kỳ 29 (C7 matrix) all null",
    cycles_tested: [26, 29],
    metrics: pullMetrics(C29, "C7_digit_sum_filter_matrix", 29),
  },
  {
    id: "C8",
    category: "C",
    name_vi: "Mirror-paired (số đối)",
    description_vi: "Mua X + (999-X) cùng lúc",
    applicable_products: ["max_3d"],
    status: "tested_no_edge",
    cycles_tested: [26],
    metrics: pullMetrics(C26, "C8_mirror_paired", 26),
  },
  {
    id: "C9",
    category: "C",
    name_vi: "Digit-position Bayesian",
    description_vi: "Per-position independent posterior",
    applicable_products: ["max_3d", "max_3d_pro"],
    status: "family_eliminated",
    verdict_note: "Bayesian family eliminated Chu kỳ 21 (Principle #17 binding)",
    cycles_tested: [4, 11, 14, 21],
  },
  {
    id: "C10",
    category: "C",
    name_vi: "Joint-digit bias exploit",
    description_vi: "Non-independence giữa digit positions",
    applicable_products: ["max_3d"],
    status: "tested_no_edge",
    verdict_note: "Chu kỳ 4 JointDigitBias Reject. Inconclusive-UP post Chu kỳ 20 (needs N≥2000).",
    cycles_tested: [4, 11, 12, 13],
  },
  {
    id: "C11",
    category: "C",
    name_vi: "Same last digit (trivial filter)",
    description_vi: "Numbers ending in same digit (e.g., 100, 210, 340)",
    applicable_products: ["max_3d"],
    status: "skipped",
    verdict_note: "Trivial cultural heuristic, low research value",
    cycles_tested: [],
  },

  // ═══════════════════ D. Bet size ═══════════════════
  {
    id: "D1",
    category: "D",
    name_vi: "1 vé/kỳ",
    description_vi: "Single ticket per draw — baseline",
    applicable_products: "all",
    status: "tested_variant",
    verdict_note: "Default mode. Tested trong mọi cycle.",
    cycles_tested: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 25, 27, 29],
  },
  {
    id: "D2",
    category: "D",
    name_vi: "N vé/kỳ cùng strategy",
    description_vi: "Repeat strategy N lần per draw",
    applicable_products: "all",
    status: "tested_variant",
    verdict_note: "Chu kỳ 24 Pure portfolio @ N=10",
    cycles_tested: [24],
  },
  {
    id: "D3",
    category: "D",
    name_vi: "N vé/kỳ mixed strategies",
    description_vi: "K1 tickets algo A + K2 tickets algo B",
    applicable_products: "all",
    status: "tested_variant",
    verdict_note: "Chu kỳ 24 Mixed mode, multiple ratios tested",
    cycles_tested: [24],
  },
  {
    id: "D4",
    category: "D",
    name_vi: "N vé hedged với Random",
    description_vi: "K algo + (N-K) Random",
    applicable_products: "all",
    status: "tested_variant",
    verdict_note: "Chu kỳ 24 Hedged mode",
    cycles_tested: [24],
  },
  {
    id: "D5",
    category: "D",
    name_vi: "Wheel expansion",
    description_vi: "Generate 10-100 vé theo wheel structure",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "tested_variant",
    verdict_note: "Tested via B1 full_wheel Chu kỳ 26",
    cycles_tested: [26],
  },
  {
    id: "D6",
    category: "D",
    name_vi: "Budget-locked",
    description_vi: "User inputs B, system computes N = B/price",
    applicable_products: "all",
    status: "tested_variant",
    verdict_note: "Chu kỳ 24 @ B=100K fixed ladder",
    cycles_tested: [24],
  },

  // ═══════════════════ E. Time frequency ═══════════════════
  {
    id: "E1",
    category: "E",
    name_vi: "Every draw",
    description_vi: "Fire on every scheduled draw",
    applicable_products: "all",
    status: "tested_variant",
    verdict_note: "Default. Tested mọi cycle.",
    cycles_tested: [25, 26, 27, 29],
  },
  {
    id: "E2",
    category: "E",
    name_vi: "Alternate (every 2nd)",
    description_vi: "Skip mỗi 2nd draw để stretch budget",
    applicable_products: "all",
    status: "tested_no_edge",
    verdict_note: "No EV edge. Same per-ticket EV.",
    cycles_tested: [27],
    metrics: pullMetrics(C27, "E2_alternate", 27),
  },
  {
    id: "E3",
    category: "E",
    name_vi: "Weekly calendar",
    description_vi: "Chỉ T2+T4+T6 hoặc T7+CN",
    applicable_products: "all",
    status: "tested_no_edge",
    verdict_note: "Variant tested (every K=3, K=7) in Chu kỳ 27",
    cycles_tested: [27],
    metrics: [
      ...pullMetrics(C27, "E_every_K3", 27),
      ...pullMetrics(C27, "E_every_K7_weekly", 27),
    ],
  },
  {
    id: "E4",
    category: "E",
    name_vi: "Jackpot-triggered",
    description_vi: "Play chỉ khi jackpot rollover ≥ X tỷ",
    applicable_products: ["power_655", "power_645"],
    status: "tested_variant",
    verdict_note: "Chu kỳ 25 MVP proxy (no jackpot flag data). Real test pending crawler extension.",
    cycles_tested: [25],
  },
  {
    id: "E5",
    category: "E",
    name_vi: "Dry-spell triggered",
    description_vi: "Play sau K kỳ liên tiếp không jackpot hit",
    applicable_products: ["power_655", "power_645"],
    status: "subsumed",
    verdict_note: "Overlaps E4",
    cycles_tested: [],
  },
  {
    id: "E6",
    category: "E",
    name_vi: "User sporadic",
    description_vi: "Random/sporadic dựa trên mood user",
    applicable_products: "all",
    status: "na",
    verdict_note: "Non-reproducible, không test được",
    cycles_tested: [],
  },

  // ═══════════════════ F. Duration / Stop condition ═══════════════════
  {
    id: "F1",
    category: "F",
    name_vi: "Số gan (cold persistence)",
    description_vi: "Mua cold numbers đến khi trúng — gambler's fallacy test",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "tested_no_edge",
    verdict_note: "🚨 REFALSIFIED — worse than Random 5-8pp matrix. Consistent với LongAbsence Reject Chu kỳ 1-13 + drift falsified Chu kỳ 8.",
    cycles_tested: [25],
    metrics: pullMetrics(C25, "F1_so_gan_cold_persistence", 25),
  },
  {
    id: "F2",
    category: "F",
    name_vi: "Hot persistence",
    description_vi: "Mirror của F1 — mua hot numbers persist",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "tested_no_edge",
    verdict_note: "Also worse than Random. Symmetric failure với F1.",
    cycles_tested: [25],
    metrics: pullMetrics(C25, "F2_hot_persistence", 25),
  },
  {
    id: "F3",
    category: "F",
    name_vi: "Algorithm-chosen persistence",
    description_vi: "Pick via algo 1 lần, persist đến hit",
    applicable_products: ["power_655", "power_645", "power_535", "max_3d", "max_3d_pro"],
    status: "tested_no_edge",
    cycles_tested: [25],
    metrics: [
      ...pullMetrics(C25, "F3_algo_persistence", 25),
      ...pullMetrics(C25, "F3b_algo_persistence_3d", 25),
    ],
  },
  {
    id: "F4",
    category: "F",
    name_vi: "Stop at first ANY tier",
    description_vi: "Stop sau hit bất kỳ tier",
    applicable_products: "all",
    status: "tested_variant",
    verdict_note: "Default stop cho F1-F3",
    cycles_tested: [25],
  },
  {
    id: "F5",
    category: "F",
    name_vi: "Stop at jackpot only",
    description_vi: "Chỉ dừng khi trúng top-tier (ĐB/match_N)",
    applicable_products: "all",
    status: "tested_no_edge",
    verdict_note: "F5b × 3D Pro A=B reproduces C6 finding (sanity check)",
    cycles_tested: [29],
    metrics: [
      ...pullMetrics(C29, "F5_jackpot_only_stop", 29),
      ...pullMetrics(C29, "F5b_jackpot_only_3dpro_ab", 29),
    ],
  },
  {
    id: "F6",
    category: "F",
    name_vi: "Budget-capped persistence",
    description_vi: "Stop khi cumulative cost > B escape valve",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "tested_no_edge",
    cycles_tested: [25],
    metrics: pullMetrics(C25, "F6_budget_capped_1M", 25),
  },
  {
    id: "F7",
    category: "F",
    name_vi: "K-draws escape",
    description_vi: "Stop sau K kỳ không hit",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "tested_no_edge",
    verdict_note: "Chu kỳ 25 +10.8pp Inconclusive. Chu kỳ 28 retest N=100 confirmed variance (demoted null).",
    cycles_tested: [25, 28],
    metrics: [
      ...pullMetrics(C25, "F7_k50_escape", 25),
      ...pullMetrics(C28, "F7_K50_retest_N100", 28),
    ],
  },
  {
    id: "F8",
    category: "F",
    name_vi: "Reset after cold streak",
    description_vi: "Change selection sau K kỳ không hit",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "tested_no_edge",
    verdict_note: "Modest +6.6pp vs plain persistence but still near-Random",
    cycles_tested: [29],
    metrics: pullMetrics(C29, "F8_persistent_reset30", 29),
  },
  {
    id: "F9",
    category: "F",
    name_vi: "N-hit stop",
    description_vi: "Stop sau K total hits (satisfaction-based)",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "tested_no_edge",
    cycles_tested: [29],
    metrics: pullMetrics(C29, "F9_n3_hits_stop", 29),
  },

  // ═══════════════════ G. Compounding ═══════════════════
  {
    id: "G1",
    category: "G",
    name_vi: "Flat betting",
    description_vi: "Bet size cố định mọi kỳ",
    applicable_products: "all",
    status: "tested_variant",
    verdict_note: "Default. Baseline cho compounding comparisons.",
    cycles_tested: [25, 26, 27, 29],
  },
  {
    id: "G2",
    category: "G",
    name_vi: "Martingale",
    description_vi: "Double bet sau mỗi loss, reset sau win",
    applicable_products: "all",
    status: "tested_no_edge",
    verdict_note: "CAUTIONARY — 100% bankruptcy at B=1M. Forward-gate confirms no edge.",
    cycles_tested: [27],
    metrics: [
      ...pullMetrics(C27, "G2_martingale_cap32", 27),
      ...pullMetrics(C27, "G2_martingale_cap8", 27),
    ],
  },
  {
    id: "G3",
    category: "G",
    name_vi: "Anti-Martingale (Paroli)",
    description_vi: "Double bet sau mỗi win, reset sau loss",
    applicable_products: ["power_655", "max_3d"],
    status: "tested_no_edge",
    cycles_tested: [27],
    metrics: pullMetrics(C27, "G3_anti_martingale_cap16", 27),
  },
  {
    id: "G4",
    category: "G",
    name_vi: "1-3-2-6 progression",
    description_vi: "Fixed sequence multipliers theo streak",
    applicable_products: ["power_655", "max_3d"],
    status: "tested_no_edge",
    verdict_note: "Confirmed null — compounding không giúp EV âm game",
    cycles_tested: [29],
    metrics: pullMetrics(C29, "G4_progression_1326", 29),
  },
  {
    id: "G5",
    category: "G",
    name_vi: "Near-miss escalation",
    description_vi: "Tăng bet sau kỳ almost-hit (4/6 match)",
    applicable_products: ["power_655", "power_645"],
    status: "tested_no_edge",
    cycles_tested: [27],
    metrics: pullMetrics(C27, "G5_near_miss_escalation", 27),
  },
  {
    id: "G6",
    category: "G",
    name_vi: "Win-reset",
    description_vi: "Reset về base sau win",
    applicable_products: "all",
    status: "subsumed",
    verdict_note: "Trivial variant, subsumed by G2/G3",
    cycles_tested: [],
  },
  {
    id: "G7",
    category: "G",
    name_vi: "Kelly criterion",
    description_vi: "Optimal log-utility sizing",
    applicable_products: "all",
    status: "family_eliminated",
    verdict_note: "ELIMINATED Chu kỳ 16 (Principle #17). Set-coverage lottery ⊥ Kelly concentration. Δ=-28pp.",
    cycles_tested: [16],
  },

  // ═══════════════════ H. Cross-time / Hybrid ═══════════════════
  {
    id: "H1",
    category: "H",
    name_vi: "C6 A=B portfolio N=10",
    description_vi: "10 A=B tickets (10 different Xs) per draw",
    applicable_products: ["max_3d_pro"],
    status: "suggestive",
    verdict_note: "Linear scaling C6 ACCEPT. Ideal for Chu kỳ 24 budget 100K.",
    cycles_tested: [28],
    metrics: pullMetrics(C28, "H1_C6_ab_portfolio_N10", 28),
  },
  {
    id: "H2",
    category: "H",
    name_vi: "Rolling top-1 algorithm",
    description_vi: "Rank algos mỗi tháng, chọn top-1 cho tháng kế",
    applicable_products: "all",
    status: "subsumed",
    verdict_note: "Concept tested as AdaptiveWindowStrategy (family eliminated Chu kỳ 14)",
    cycles_tested: [1, 14],
  },
  {
    id: "H3",
    category: "H",
    name_vi: "Committee voting ensemble",
    description_vi: "K algorithms vote per ticket",
    applicable_products: "all",
    status: "subsumed",
    verdict_note: "Tested Chu kỳ 19e single+multi ensemble (Reject)",
    cycles_tested: [19],
  },
  {
    id: "H4",
    category: "H",
    name_vi: "Meta-level Bayesian",
    description_vi: "Update algorithm preference dựa trên past performance",
    applicable_products: "all",
    status: "family_eliminated",
    verdict_note: "Adaptive family eliminated Chu kỳ 14",
    cycles_tested: [14],
  },
  {
    id: "H5",
    category: "H",
    name_vi: "C6 A=B portfolio N=5",
    description_vi: "5 A=B tickets (mid-scale variant of H1)",
    applicable_products: ["max_3d_pro"],
    status: "suggestive",
    verdict_note: "P(hit) 9.7% ≈ theoretical 9.6%, ROI +4326%",
    cycles_tested: [28],
    metrics: pullMetrics(C28, "H5_C6_ab_portfolio_N5", 28),
  },

  // ═══════════════════ I. Cultural / pattern-based ═══════════════════
  {
    id: "I1",
    category: "I",
    name_vi: "Ngày sinh",
    description_vi: "Ngày/tháng/năm user + gia đình",
    applicable_products: "all",
    status: "skipped",
    verdict_note: "Cultural, no statistical edge. Document-only per user decision.",
    cycles_tested: [],
  },
  {
    id: "I2",
    category: "I",
    name_vi: "Số đẹp (6, 8, 9, 68, 86, 99)",
    description_vi: "Cultural preference",
    applicable_products: "all",
    status: "skipped",
    verdict_note: "Document-only",
    cycles_tested: [],
  },
  {
    id: "I3",
    category: "I",
    name_vi: "Avoid số xấu (4, 7, 13)",
    description_vi: "Cultural avoidance — anti-crowd argument có thể có payout-splitting edge nếu Vietlott expose bet volume",
    applicable_products: "all",
    status: "na",
    verdict_note: "Infeasible — Vietlott không expose per-number bet volume",
    cycles_tested: [],
  },
  {
    id: "I4",
    category: "I",
    name_vi: "Giải mộng",
    description_vi: "Từ giấc mơ + sách giải mộng",
    applicable_products: "all",
    status: "skipped",
    verdict_note: "Document-only",
    cycles_tested: [],
  },
  {
    id: "I5",
    category: "I",
    name_vi: "Feng shui / ngũ hành",
    description_vi: "Theo năm mệnh user",
    applicable_products: "all",
    status: "skipped",
    verdict_note: "Document-only",
    cycles_tested: [],
  },

  // ═══════════════════ J. Institutional ═══════════════════
  {
    id: "J1",
    category: "J",
    name_vi: "Vietlott subscription",
    description_vi: "Auto-buy same ticket cho N kỳ",
    applicable_products: "all",
    status: "na",
    verdict_note: "Chưa check Vietlott có offer subscription không",
    cycles_tested: [],
  },
  {
    id: "J2",
    category: "J",
    name_vi: "Syndicate pool",
    description_vi: "Nhiều người pool money, chia prize",
    applicable_products: "all",
    status: "na",
    verdict_note: "Không thay đổi per-ticket math",
    cycles_tested: [],
  },
  {
    id: "J3",
    category: "J",
    name_vi: "Group wheel (câu lạc bộ)",
    description_vi: "Club members mua wheel collectively",
    applicable_products: ["power_655", "power_645", "power_535"],
    status: "subsumed",
    verdict_note: "Math tương đương B1/B2 wheeling",
    cycles_tested: [],
  },
];

// ─────────────────────────── Helpers + stats ───────────────────────────

export function statusLabel(status: MethodStatus): { emoji: string; text: string; color: string } {
  switch (status) {
    case "accept":             return { emoji: "🏆", text: "Accept", color: "green" };
    case "suggestive":         return { emoji: "🚨", text: "Suggestive", color: "orange" };
    case "tested_no_edge":     return { emoji: "✓", text: "Tested (no edge)", color: "muted" };
    case "tested_variant":     return { emoji: "✓", text: "Tested (variant)", color: "muted" };
    case "family_eliminated":  return { emoji: "❌", text: "Family eliminated", color: "red" };
    case "subsumed":           return { emoji: "—", text: "Subsumed", color: "muted" };
    case "deferred":           return { emoji: "⏳", text: "Deferred", color: "amber" };
    case "skipped":            return { emoji: "⚪", text: "Skipped", color: "muted" };
    case "na":                 return { emoji: "—", text: "N/A", color: "muted" };
  }
}

export function categoryLabel(cat: MethodCategory): string {
  return ({
    A: "A. Universal",
    B: "B. Matrix",
    C: "C. 3D",
    D: "D. Bet size",
    E: "E. Time frequency",
    F: "F. Duration/Stop",
    G: "G. Compounding",
    H: "H. Cross-time",
    I: "I. Cultural",
    J: "J. Institutional",
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

// C6 spotlight content (Chu kỳ 28 Accept)
export const C6_SPOTLIGHT = {
  title: "🏆 C6 A=B Exploit — Max 3D Pro",
  subtitle: "First Accept in 28-cycle research history",
  theoretical_ev_pct: 4180,
  backtest_ev_pct: 3864,
  n_runs: 200,
  p_hit: 0.0193,
  cycles: [27, 28],
  mechanism_short: "Vé Max 3D Pro (A, B) với A=B=X. Khi X trong 20-number universe + tier cao, quy chế Vietlott trả prize doubled (Nhất 30M → 60M).",
  mechanism_steps: [
    { label: "Ticket structure", detail: "(A, B) pair, cost 10K VND" },
    { label: "User action", detail: "Nhập cùng 1 số 2 lần trên vietlott.vn (e.g., 007 007)" },
    { label: "Quy chế rule", detail: "Nếu A=B=X và X trong tier Nhất/Nhì/Ba/Tư → prize doubled" },
    { label: "EV math", detail: "P(X in 20) = 2%, expected payout ≈ 428K, ROI = +4180%" },
    { label: "Backtest", detail: "N_RUNS=200 × 132,400 draws: ROI +3864% (forward +4372%)" },
    { label: "User validation", detail: "Real ticket payout verified 2026-04-24" },
  ],
  prize_table: [
    { tier: "Giải Đặc biệt", base: "2,000,000,000", a_eq_b: "2,000,000,000 (no double — position rule)" },
    { tier: "Giải Nhất", base: "30,000,000", a_eq_b: "60,000,000 (doubled)" },
    { tier: "Giải Nhì", base: "10,000,000", a_eq_b: "20,000,000" },
    { tier: "Giải Ba", base: "4,000,000", a_eq_b: "8,000,000" },
    { tier: "Giải Tư", base: "1,000,000", a_eq_b: "2,000,000" },
  ],
  disclosures: [
    "⚠ Phụ thuộc Vietlott quy chế — rule có thể thay đổi không báo trước",
    "⚠ User phải nhập cùng 1 số 2 lần trên vietlott.vn — không tự động",
    "⚠ Chỉ áp dụng Max 3D Pro, KHÔNG áp dụng Max 3D hoặc Power products",
    "⚠ Variance cao — high-tier hit rare (~2% per ticket), hầu hết kỳ không trúng",
    "⚠ EV tính theo giá vé hiện tại 10K VND/pair",
  ],
  play_href: "/max-3d-pro",
  history_href: "/research",
};
