#!/usr/bin/env python3
"""Chu kỳ 30 — Phân tích kiểm chứng 3D / 3D Pro (đọc vé đã ghi bởi cycle30_3d_reverify.py).

  A. Tái lập   chấm vé dataset "old" bằng evaluator legacy → so từng số với cycle22_backtest_3d.json
               và picks trong cycle22_rankings.json.
  B. Protocol cũ trên dữ liệu đầy đủ → cycle30_backtest_3d_newdata.json + cycle30_rankings_3d_newdata.json
               (KHÔNG ghi đè file đóng băng mà UI đang import).
  C. Kiểm định đúng: evaluator theo quy chế + baseline Random chính xác + phương sai đúng.
     H0 = nhãn số hoán đổi được (không số nào "đặc biệt"): với vé chọn từ quá khứ, P(trúng | kỳ i)
     = d_i/1000 (d_i = số số khác nhau của kỳ). 5 run gộp theo kỳ (vé trùng nhau → trọng số) nên
     không còn đếm trùng mẫu. Holm cho 16 strategy.
  D. Out-of-sample thật: các kỳ sau mốc đóng băng (Max 3D id ≥ 1070, 3D Pro id ≥ 716).
  E. EV chính xác của từng loại vé (kể cả C6 A=B) dưới các cách đọc quy chế.
  F. Hiệu chuẩn quy trình chọn pick (cycle22_ranking) dưới H0 bằng hoán vị nhãn từng kỳ.

Chạy:  .venv/bin/python website/research/optimization/cycle30_3d_analysis.py
"""

from __future__ import annotations

import json
import math
import os
import pickle
import sys
import time
from collections import Counter
from pathlib import Path

import numpy as np
from scipy import stats

THIS_DIR = Path(__file__).resolve().parent
REPO = THIS_DIR.parents[2]
sys.path.insert(0, str(THIS_DIR))
sys.path.insert(0, str(THIS_DIR.parent / "3d"))
sys.path.insert(0, str(THIS_DIR.parent))
sys.path.insert(0, str(REPO / "src"))

import cycle22_ranking as ranking  # noqa: E402
from _significance import build_significance  # noqa: E402
from advanced_backtest import PRODUCTS_3D, TIER_ORDER, evaluate_prediction  # noqa: E402
from cycle30_3d_reverify import (  # noqa: E402
    CACHE_FILE,
    MIN_HISTORY,
    N_PREDICTIONS,
    N_RUNS,
    NO_PRED,
    OLD_DATASET,
    STRATEGY_ORDER,
    get_draws,
    walk_bounds,
)
from p3d_pro_evaluator import resolve_3d_pro_ticket  # noqa: E402

from vietlott.check_rate.evaluators import p3d as canon_p3d  # noqa: E402
from vietlott.check_rate.evaluators import p3d_pro as canon_p3d_pro  # noqa: E402

PRODUCTS = ("max_3d", "max_3d_pro")
SEGMENTS = ("full", "half1", "half2", "forward")
BASELINE = "Random"
TICKET = 10_000
FROZEN_BACKTEST = THIS_DIR / "cycle22_backtest_3d.json"
FROZEN_RANKINGS = THIS_DIR / "cycle22_rankings.json"
OUT_LEGACY_NEW = THIS_DIR / "cycle30_backtest_3d_newdata.json"
OUT_RANKINGS_NEW = THIS_DIR / "cycle30_rankings_3d_newdata.json"
OUT_REPORT = THIS_DIR / "cycle30_3d_reverify.json"
N_CALIBRATION = int(os.environ.get("CYCLE30_N_CAL", "1000"))
RNG_SEED = 20261109
SHIPPED_MAX3D_PICKS = ["D3: PairExploiter_T0.5", "B1: CoverageOpt", "FreqWholeHot"]  # cycle22_rankings.json

# Max 3D (quy chế): nhóm 2/4/6/8 số, 1.000.000/350.000/210.000/100.000; trúng nhiều giải → lĩnh tổng.
MAX3D_AMOUNT = np.array([1_000_000, 350_000, 210_000, 100_000], dtype=np.int64)  # theo TIER_ORDER
KK_LAST2 = 100_000  # "KK 2 số cuối" chỉ có trong check_rate/p3d.py, quy chế không có giải này

# Max 3D Pro (quy chế vietlott.vn): ĐB, phụ ĐB, Nhất, Nhì, Ba, Tư, Năm, Sáu
PRO_TIERS = [
    "Giải Đặc biệt",
    "Giải Phụ Đặc biệt",
    "Giải Nhất",
    "Giải Nhì",
    "Giải Ba",
    "Giải Tư",
    "Giải Năm",
    "Giải Sáu",
]
PRO_AMOUNT = np.array([2_000_000_000, 400_000_000, 30_000_000, 10_000_000, 4_000_000, 1_000_000, 100_000, 40_000])
PRO_DB_COMBINED = 2_400_000_000  # vé (X,X) trúng ĐB = tổng ĐB + phụ ĐB


# ═════════════════════════════ per-draw tables ═════════════════════════════


def draw_tables(draws: list[dict]) -> dict:
    n = len(draws)
    cnt = np.zeros((4, n, 1000), dtype=np.int8)  # số lần số x xuất hiện ở nhóm k của kỳ i
    s0 = np.zeros(n, dtype=np.int64)
    s1 = np.zeros(n, dtype=np.int64)
    for i, d in enumerate(draws):
        for k, tier in enumerate(TIER_ORDER):
            for num in d["result"][tier]:
                cnt[k, i, int(num)] += 1
        s0[i], s1[i] = (int(x) for x in d["result"]["Giải Đặc biệt"])
    legacy_tier = np.full((n, 1000), -1, dtype=np.int64)
    for k in reversed(range(4)):  # legacy: nhóm đầu tiên theo TIER_ORDER chứa số → `break`
        legacy_tier[cnt[k] > 0] = k
    xs = np.arange(1000)
    kk = sum(
        ((xs[None, :] % 100 == (s % 100)[:, None]) & (xs[None, :] != s[:, None])).astype(np.int64) for s in (s0, s1)
    )
    prize_rule = (cnt.astype(np.int64) * MAX3D_AMOUNT[:, None, None]).sum(0)  # cộng dồn mọi lần trùng
    member = cnt.sum(0) > 0
    return {
        "n": n,
        "cnt": cnt,
        "s0": s0,
        "s1": s1,
        "member": member,
        "d": member.sum(1),
        "legacy_tier": legacy_tier,
        "legacy_prize": np.where(legacy_tier >= 0, MAX3D_AMOUNT[np.clip(legacy_tier, 0, 3)], 0),
        "prize_rule": prize_rule,
        "prize_canonical": prize_rule + kk * KK_LAST2,
    }


def resolve_pro(A, B, di, T, semantics: str, ab_low_tiers: bool = True):
    """Vectorized Max 3D Pro. Trả (tier_idx | -1, amount).

    semantics="set":      như check_rate/p3d_pro.py hiện tại — vé (X,X) chỉ cần X có mặt 1 lần
                          trong nhóm là tính "trùng 2 trong N", rồi nhân đôi.
    semantics="multiset": theo chữ quy chế — vé phải khớp 2 SỐ QUAY THƯỞNG; (X,X) cần X ra ≥ 2 lần.
                          X ra đúng 1 lần → "trùng 1 bộ ba số" (Năm/Sáu), nhân đôi.
    ab_low_tiers=False:   biến thể bảo thủ — (X,X) không có Năm/Sáu (như code hiện tại).
    A≠B: hai cách đọc trùng nhau.
    """
    cnt = T["cnt"]
    ca, cb = cnt[:, di, A].astype(np.int64), cnt[:, di, B].astype(np.int64)
    S0, S1 = T["s0"][di], T["s1"][di]
    same = A == B
    ina, inb = ca.sum(0) > 0, cb.sum(0) > 0
    tier = np.full(np.shape(A), -1, dtype=np.int64)

    def assign(mask, k):
        nonlocal tier
        tier = np.where(mask & (tier < 0), k, tier)

    neq = ~same
    assign(neq & (A == S0) & (B == S1), 0)
    assign(neq & (A == S1) & (B == S0), 1)
    for k in (1, 2, 3):
        assign(neq & (ca[k] > 0) & (cb[k] > 0), k + 1)
    assign(neq & ina & inb, 5)
    one = neq & (ina ^ inb)
    assign(one & np.where(ina, ca[0] > 0, cb[0] > 0), 6)
    assign(one, 7)

    need = 2 if semantics == "multiset" else 1
    tot = ca.sum(0)
    assign(same & (S0 == A) & (S1 == A), 0)
    for k in (1, 2, 3):
        assign(same & (ca[k] >= need), k + 1)
    assign(same & (tot >= need), 5)
    if semantics == "multiset" and ab_low_tiers:
        assign(same & (tot == 1) & (ca[0] == 1), 6)
        assign(same & (tot == 1), 7)

    amount = np.where(tier >= 0, PRO_AMOUNT[np.clip(tier, 0, 7)], 0)
    amount = np.where(same & (tier >= 2), amount * 2, amount)
    amount = np.where(same & (tier == 0), PRO_DB_COMBINED, amount)
    return tier, amount


# ═════════════════════════════ self-checks vs original evaluators ═════════════════════════════


def self_check(product: str, draws: list[dict], T: dict) -> dict:
    """Bảng tra vectorized phải khớp từng vé với evaluator gốc (legacy, check_rate, research port)."""
    rng = np.random.default_rng(7)
    prizes = PRODUCTS_3D[product]["prizes"]
    n_checked = 0
    for i in rng.choice(T["n"], size=min(150, T["n"]), replace=False):
        d = draws[i]
        drawn = sorted({int(x) for t in TIER_ORDER for x in d["result"][t]})
        sample = list(rng.choice(1000, 40, replace=False)) + drawn
        tiers_vn = {t: list(d["result"][t]) for t in TIER_ORDER}
        for x in sample:
            s = f"{x:03d}"
            ev = evaluate_prediction([s], d, prizes)
            assert ev["total_prize"] == T["legacy_prize"][i, x], ("legacy", i, s)
            canon = sum(a for _, a in canon_p3d._evaluate_play(s, tiers_vn))
            assert canon == T["prize_canonical"][i, x], ("canonical p3d", i, s)
            n_checked += 1
        if product == "max_3d_pro":
            r = d["result"]
            args = (r["Giải Đặc biệt"], r["Giải Nhất"], r["Giải Nhì"], r["Giải ba"])
            pool = sample[:12] + drawn
            A = np.array([a for a in pool for _ in pool])
            B = np.array([b for _ in pool for b in pool])
            _, amt = resolve_pro(A, B, np.full(A.shape, i), T, "set")
            for a, b, m in zip(A, B, amt):
                _, port = resolve_3d_pro_ticket(f"{a:03d}", f"{b:03d}", *args)
                rule = canon_p3d_pro.resolve_3d_pro(f"{a:03d}", f"{b:03d}", *args)
                assert port == m == (rule.amount if rule else 0), ("3d pro set", i, a, b, port, m)
                n_checked += 1
    return {"pairs_or_tickets_checked": n_checked, "status": "ok"}


# ═════════════════════════════ A/B. legacy protocol (cycle22) ═════════════════════════════


def stack_walk(tickets: dict, product: str, dataset: str, walk: str) -> np.ndarray:
    """(S, R, L, 2) int64."""
    return np.stack(
        [np.stack([tickets[(product, dataset, s, r, walk)] for r in range(N_RUNS)]) for s in STRATEGY_ORDER]
    ).astype(np.int64)


def segment_views(tickets: dict, product: str, dataset: str, n: int) -> dict:
    """seg → (first draw index, (S,R,L,2) tickets). half1 = đầu walk full (strategy không giữ state)."""
    b = walk_bounds(n)
    full = stack_walk(tickets, product, dataset, "full")
    return {
        "full": (b["full"][0], full),
        "half1": (MIN_HISTORY, full[:, :, : n // 2 - MIN_HISTORY]),
        "half2": (b["half2"][0], stack_walk(tickets, product, dataset, "half2")),
        "forward": (b["forward"][0], stack_walk(tickets, product, dataset, "forward")),
    }


def legacy_segment(start: int, arr: np.ndarray, T: dict, perm: np.ndarray | None = None, tier_hits: bool = False):
    """Metrics y hệt walk_forward_segment() của cycle22_rebacktest_3d.py, cho cả 17 strategy một lúc."""
    L = arr.shape[2]
    idx = (start + np.arange(L))[None, None, :, None]
    ok = arr >= 0
    tk = np.where(ok, arr, 0)
    if perm is not None:
        tk = perm[idx, tk]
    tier = np.where(ok, T["legacy_tier"][idx, tk], -1)
    prize = np.where(tier >= 0, T["legacy_prize"][idx, tk], 0)
    valid = arr[..., 0] != NO_PRED  # (S,R,L) — kỳ strategy có dự đoán
    hits_ev = (tier >= 0).sum(-1)
    prize_ev = prize.sum(-1)
    out = {}
    for s_i, name in enumerate(STRATEGY_ORDER):
        v = valid[s_i]
        n_pred = int(v.sum())
        if n_pred == 0:
            out[name] = {"error": "No predictions"}
            continue
        revs = (prize_ev[s_i][v] - TICKET * N_PREDICTIONS).astype(float)
        exact_total = int(hits_ev[s_i][v].sum())
        total_cost = n_pred * TICKET * N_PREDICTIONS
        total_revenue = int(prize_ev[s_i][v].sum())
        std = float(np.std(revs, ddof=1)) if len(revs) > 1 else 0.0
        sharpe = (float(np.mean(revs)) / std) * np.sqrt(52) if std > 0 else 0.0
        r = {
            "start_idx": start,
            "end_idx": start + L,
            "total_predictions": n_pred,
            "n_runs": N_RUNS,
            "n_predictions_per_draw": N_PREDICTIONS,
            "total_trials": n_pred * N_PREDICTIONS,
            "exact_match_rate": round(exact_total / (n_pred * N_PREDICTIONS) * 100, 4),
            "exact_matches_total": exact_total,
            "total_cost": int(total_cost),
            "total_revenue": total_revenue,
            "net_profit": int(total_revenue - total_cost),
            "roi_pct": round((total_revenue - total_cost) / total_cost * 100, 2),
            "sharpe_ratio": round(float(sharpe), 4),
            "avg_profit_per_draw": round(float(np.mean(revs)), 2),
        }
        if tier_hits:
            t = tier[s_i][v]
            r["tier_hits"] = {TIER_ORDER[k]: int(c) for k, c in zip(*np.unique(t[t >= 0], return_counts=True))}
        out[name] = r
    sig = out.get(BASELINE)
    for name, r in out.items():
        if name == BASELINE or "error" in r or not sig or "error" in sig:
            continue
        r[f"sig_vs_{BASELINE}"] = build_significance(
            hits_strat=r["exact_matches_total"],
            n_strat=r["total_trials"],
            hits_baseline=sig["exact_matches_total"],
            n_baseline=sig["total_trials"],
            n_strategies_compared=len(STRATEGY_ORDER) - 1,
            baseline_name=BASELINE,
            metric_name="exact_match_rate",
        )
    return out


def legacy_product(views: dict, T: dict, n: int, perm=None, tier_hits=False) -> dict:
    return {
        "n_draws": n,
        "midpoint": n // 2,
        "forward_window": 100,
        "segments_def": {k: list(v) for k, v in walk_bounds(n).items()} | {"half1": [MIN_HISTORY, n // 2]},
        "segments": {seg: legacy_segment(*views[seg], T, perm, tier_hits) for seg in SEGMENTS},
    }


REPLICATED_FIELDS = (
    "total_predictions",
    "total_trials",
    "exact_match_rate",
    "exact_matches_total",
    "total_cost",
    "total_revenue",
    "net_profit",
    "roi_pct",
    "sharpe_ratio",
    "avg_profit_per_draw",
    "tier_hits",
)


def compare_with_frozen(product: str, mine: dict, frozen: dict) -> dict:
    mism, compared = [], 0
    for seg in SEGMENTS:
        for name in STRATEGY_ORDER:
            a, b = mine["segments"][seg][name], frozen["segments"][seg][name]
            for f in REPLICATED_FIELDS:
                compared += 1
                if a.get(f) != b.get(f):
                    mism.append({"segment": seg, "strategy": name, "field": f, "mine": a.get(f), "frozen": b.get(f)})
            pa = a.get("sig_vs_Random", {}).get("p_value_raw")
            pb = b.get("sig_vs_Random", {}).get("p_value_raw")
            compared += 1
            if pa != pb:
                mism.append({"segment": seg, "strategy": name, "field": "p_value_raw", "mine": pa, "frozen": pb})
    return {"values_compared": compared, "mismatches": len(mism), "examples": mism[:10]}


def pick_summary(processed: dict) -> dict:
    return {
        p: (
            {
                "strategy": v["strategy"],
                "split_half": v["split_half"]["reason"],
                "attempt": v["attempt"],
                "raw_p": v["raw"]["p_value_raw"],
                "delta_win_pp": v["raw"]["delta_win_pp"],
                "raw_roi_pct": v["raw"]["raw_roi_pct"],
            }
            if v
            else None
        )
        for p, v in processed["picks"].items()
    }


# ═════════════════════════════ C/D. exact-null tests (quy chế đúng) ═════════════════════════════


def finite_pop_var(sigma2: float, w: np.ndarray, N: int = 1000) -> float:
    """Var(Σ w_j V_j) khi m số khác nhau được gán m nhãn rút KHÔNG hoàn lại từ N nhãn."""
    sw2 = float((w**2).sum())
    W = float(w.sum())
    return sigma2 * (sw2 - (W * W - sw2) / (N - 1))


def q_none(d: int, s: int) -> float:
    """P(không số nào trong s số cụ thể khác nhau nằm trong d số của kỳ) dưới H0."""
    out = 1.0
    for k in range(s):
        out *= (1000 - d - k) / (1000 - k)
    return out


def pro_null_tables(T: dict, semantics: str, ab_low_tiers: bool = True) -> dict:
    """Kỳ vọng chính xác theo từng kỳ cho vé ngẫu nhiên (liệt kê theo lớp: số đã ra / số ngoài)."""
    n = T["n"]
    e_neq = np.zeros((n, 8))
    e_eq = np.zeros((n, 8))
    p_neq = np.zeros(n)
    p_eq = np.zeros(n)
    for i in range(n):
        drawn = np.flatnonzero(T["member"][i])
        d = len(drawn)
        outside = int(np.flatnonzero(~T["member"][i])[0])
        reps = np.append(drawn, outside)
        w = np.append(np.ones(d), 1000 - d)
        ai, bi = np.meshgrid(np.arange(d + 1), np.arange(d + 1), indexing="ij")
        ai, bi = ai.ravel(), bi.ravel()
        keep = ai != bi  # cùng lớp "số đã ra" = vé A=B; outside-outside cho 0 giải
        A, B = reps[ai[keep]], reps[bi[keep]]
        wt = (w[ai[keep]] * w[bi[keep]]) / (1000 * 999)
        tier, amt = resolve_pro(A, B, np.full(A.shape, i), T, semantics, ab_low_tiers)
        for k in range(8):
            e_neq[i, k] = wt[tier == k].sum()
        p_neq[i] = (wt * amt).sum()
        tier, amt = resolve_pro(reps, reps, np.full(reps.shape, i), T, semantics, ab_low_tiers)
        for k in range(8):
            e_eq[i, k] = (w[tier == k] / 1000).sum()
        p_eq[i] = (w * amt / 1000).sum()
        assert abs(e_neq[i].sum() - (1 - q_none(d, 2))) < 1e-9
    return {"tier_neq": e_neq, "tier_eq": e_eq, "prize_neq": p_neq, "prize_eq": p_eq}


def z_block(obs: float, exp: float, var: float, n_tickets: int, scale: float) -> dict:
    se = math.sqrt(var) if var > 0 else float("nan")
    z = (obs - exp) / se if se > 0 else 0.0
    return {
        "observed": round(obs, 4),
        "expected_H0": round(exp, 4),
        "delta": round((obs - exp) / n_tickets * scale, 4),
        "ci95": [
            round((obs - exp - 1.96 * se) / n_tickets * scale, 4),
            round((obs - exp + 1.96 * se) / n_tickets * scale, 4),
        ],
        "z": round(z, 3),
        "mde_80pct_power": round(2.80 * se / n_tickets * scale, 4),  # z_.975 + z_.80
        "p_two_sided": float(f"{2 * stats.norm.sf(abs(z)):.3g}"),
        "p_one_sided_gt": float(f"{stats.norm.sf(z):.3g}"),
    }


def exact_tests(product: str, T: dict, full: np.ndarray, start: int, window: tuple[int, int], pro_null: dict | None):
    """Mỗi strategy: gộp 5 run theo kỳ, so với H0 chính xác. full = (S,R,L,2) vé walk full."""
    lo, hi = window
    res = {}
    for s_i, name in enumerate(STRATEGY_ORDER):
        hit_o = hit_e = hit_v = 0.0
        pz_o = pz_e = pz_v = 0.0
        tk_o = tk_e = tk_v = 0.0
        n_tickets = n_draws = n_ab = 0
        tier_obs = np.zeros(8)
        tier_exp = np.zeros(8)
        for i in range(max(lo, start), hi):
            rows = full[s_i, :, i - start, :]  # (R, 2)
            rows = rows[rows[:, 0] >= 0]
            if len(rows) == 0:
                continue
            n_draws += 1
            d = int(T["d"][i])
            nums = rows.ravel()
            u, w = np.unique(nums, return_counts=True)
            w = w.astype(float)
            # (1) số trúng, tính theo từng số dự đoán
            p = d / 1000
            hit_o += float((w * T["member"][i, u]).sum())
            hit_e += float(w.sum()) * p
            hit_v += finite_pop_var(p * (1 - p), w)
            if product == "max_3d":
                n_tickets += len(nums)
                v = T["prize_rule"][i].astype(float)
                mu, s2 = v.sum() / 1000, (v**2).sum() / 1000 - (v.sum() / 1000) ** 2
                pz_o += float((w * T["prize_rule"][i, u]).sum())
                pz_e += float(w.sum()) * mu
                pz_v += finite_pop_var(s2, w)
            else:
                A, B = rows[:, 0], rows[:, 1]
                n_tickets += len(rows)
                same = A == B
                n_ab += int(same.sum())
                tier, amt = resolve_pro(A, B, np.full(A.shape, i), T, "multiset")
                pz_o += float(amt.sum())
                pz_e += float(np.where(same, pro_null["prize_eq"][i], pro_null["prize_neq"][i]).sum())
                for k in range(8):
                    tier_obs[k] += int((tier == k).sum())
                tier_exp += np.where(
                    same[:, None], pro_null["tier_eq"][i][None, :], pro_null["tier_neq"][i][None, :]
                ).sum(0)
                # (2) vé trúng bất kỳ giải nào: 1[A∈D ∨ B∈D]; hiệp phương sai giữa các vé trong cùng kỳ
                sets = [frozenset((int(a), int(b))) for a, b in rows]
                tk_o += float(sum(T["member"][i, a] or T["member"][i, b] for a, b in rows))
                qs = [q_none(d, len(s)) for s in sets]
                tk_e += sum(1 - q for q in qs)
                tk_v += sum(
                    q_none(d, len(sets[r] | sets[t])) - qs[r] * qs[t]
                    for r in range(len(sets))
                    for t in range(len(sets))
                )
        n_numbers = n_tickets * (1 if product == "max_3d" else 2)
        r = {
            "n_draws": n_draws,
            "n_tickets": n_tickets,
            "number_hit_rate_pp": z_block(hit_o, hit_e, hit_v, n_numbers, 100),
        }
        if product == "max_3d":
            r["roi_pct"] = {
                "observed": round((pz_o / (n_tickets * TICKET) - 1) * 100, 2),
                "expected_H0": round((pz_e / (n_tickets * TICKET) - 1) * 100, 2),
                **{
                    k: v
                    for k, v in z_block(pz_o, pz_e, pz_v, n_tickets * TICKET, 100).items()
                    if k in ("delta", "ci95", "z", "p_two_sided")
                },
            }
        else:
            r["ticket_win_rate_pp"] = z_block(tk_o, tk_e, tk_v, n_tickets, 100)
            r["roi_pct"] = {
                "observed": round((pz_o / (n_tickets * TICKET) - 1) * 100, 2),
                "expected_H0": round((pz_e / (n_tickets * TICKET) - 1) * 100, 2),
                "note": "ROI 3D Pro bị chi phối bởi giải hiếm (ĐB 2 tỷ, Nhất 30tr) — không kiểm định được ở cỡ mẫu này",
            }
            r["tier_counts"] = {
                PRO_TIERS[k]: {"observed": int(tier_obs[k]), "expected_H0": round(float(tier_exp[k]), 3)}
                for k in range(8)
                if tier_obs[k] or tier_exp[k] > 0.005
            }
            r["n_ab_tickets"] = n_ab
        res[name] = r
    holm(res, "number_hit_rate_pp")
    return res


def holm(res: dict, key: str) -> None:
    names = [n for n in res if n != BASELINE]
    ps = sorted((res[n][key]["p_two_sided"], n) for n in names)
    m, running = len(ps), 0.0
    for rank, (p, n) in enumerate(ps):
        running = max(running, min(1.0, (m - rank) * p))
        res[n][key]["p_holm"] = float(f"{running:.3g}")


# ═════════════════════════════ E. EV per ticket type ═════════════════════════════


def ev_tables(product: str, T: dict) -> dict:
    if product == "max_3d":
        out = {}
        for label, key in (
            ("legacy (advanced_backtest.evaluate_prediction — 1 giải/số)", "legacy_prize"),
            ("check_rate/p3d.py (cộng dồn + 'KK 2 số cuối')", "prize_canonical"),
            ("quy chế (cộng dồn, không có KK)", "prize_rule"),
        ):
            ev = float(T[key].sum(1).mean() / 1000)
            out[label] = {
                "ev_vnd": round(ev, 1),
                "payout_pct": round(ev / TICKET * 100, 2),
                "roi_pct": round((ev / TICKET - 1) * 100, 2),
            }
        return out
    out = {}
    for label, sem, low in (
        ("code hiện tại (set: X ra 1 lần là đủ)", "set", True),
        ("quy chế (multiset: (X,X) cần X ra 2 lần; Năm/Sáu ×2)", "multiset", True),
        ("quy chế, biến thể bảo thủ (multiset, (X,X) không có Năm/Sáu)", "multiset", False),
    ):
        tb = pro_null_tables(T, sem, low)
        ev_neq, ev_eq = float(tb["prize_neq"].mean()), float(tb["prize_eq"].mean())
        out[label] = {
            "A!=B": {"ev_vnd": round(ev_neq, 1), "roi_pct": round((ev_neq / TICKET - 1) * 100, 2)},
            "A=B (C6)": {
                "ev_vnd": round(ev_eq, 1),
                "roi_pct": round((ev_eq / TICKET - 1) * 100, 2),
                "p_win_any_pct": round(float(tb["tier_eq"].sum(1).mean() * 100), 3),
                "ev_by_tier_vnd": {
                    PRO_TIERS[k]: round(
                        float((tb["tier_eq"][:, k] * (PRO_DB_COMBINED if k == 0 else PRO_AMOUNT[k] * 2)).mean()), 1
                    )
                    for k in range(8)
                    if tb["tier_eq"][:, k].sum() > 0
                },
            },
        }
    return out


def theoretical_ev_3dpro() -> dict:
    """EV chính xác dưới mô hình lý thuyết: 20 vị trí độc lập, đều trên 000–999 (không dùng dữ liệu).

    Cần vì 802 kỳ thực tế chưa có kỳ nào ĐB=(X,X) (kỳ vọng 0,8 kỳ) nên EV thực nghiệm của vé A=B
    thiếu phần ĐB gộp 2,4 tỷ × 1e-6 = 2.400đ.
    """
    p = 1 / 1000

    def b(n, k, q):
        return math.comb(n, k) * q**k * (1 - q) ** (n - k)

    def amount(k, same):
        if same:
            return PRO_DB_COMBINED if k == 0 else int(PRO_AMOUNT[k]) * 2
        return int(PRO_AMOUNT[k])

    def ab_tier(c, sem, low):  # c = (c_db, c1, c2, c3)
        need = 2 if sem == "multiset" else 1
        tot = sum(c)
        if c[0] == 2:
            return 0
        for k in (1, 2, 3):
            if c[k] >= need:
                return k + 1
        if tot >= need:
            return 5
        if sem == "multiset" and low and tot == 1:
            return 6 if c[0] == 1 else 7
        return -1

    out: dict = {}
    for label, sem, low in (
        ("set (code)", "set", True),
        ("multiset (quy chế)", "multiset", True),
        ("multiset, không Năm/Sáu", "multiset", False),
    ):
        ev = 0.0
        for c0 in range(3):
            for c1 in range(5):
                for c2 in range(7):
                    for c3 in range(9):
                        pr = b(2, c0, p) * b(4, c1, p) * b(6, c2, p) * b(8, c3, p)
                        k = ab_tier((c0, c1, c2, c3), sem, low)
                        ev += pr * amount(k, True) if k >= 0 else 0.0
        out[f"A=B {label}"] = {"ev_vnd": round(ev, 1), "roi_pct": round((ev / TICKET - 1) * 100, 2)}

    # A≠B: mỗi vị trí ra A / B / số khác với xác suất p / p / 1-2p; 2 vị trí ĐB có thứ tự
    def tri(n):
        for a in range(n + 1):
            for bb in range(n + 1 - a):
                yield (
                    a,
                    bb,
                    math.factorial(n)
                    / (math.factorial(a) * math.factorial(bb) * math.factorial(n - a - bb))
                    * p ** (a + bb)
                    * (1 - 2 * p) ** (n - a - bb),
                )

    slot_p = {"A": p, "B": p, "O": 1 - 2 * p}
    ev = 0.0
    for s0 in "ABO":
        for s1 in "ABO":
            pdb = slot_p[s0] * slot_p[s1]
            for a1, b1, p1 in tri(4):
                for a2, b2, p2 in tri(6):
                    for a3, b3, p3 in tri(8):
                        pr = pdb * p1 * p2 * p3
                        a_db, b_db = (s0 == "A") + (s1 == "A"), (s0 == "B") + (s1 == "B")
                        a_in, b_in = a_db + a1 + a2 + a3 > 0, b_db + b1 + b2 + b3 > 0
                        if (s0, s1) == ("A", "B"):
                            k = 0
                        elif (s0, s1) == ("B", "A"):
                            k = 1
                        elif a1 and b1:
                            k = 2
                        elif a2 and b2:
                            k = 3
                        elif a3 and b3:
                            k = 4
                        elif a_in and b_in:
                            k = 5
                        elif a_in or b_in:
                            k = 6 if (a_db if a_in else b_db) else 7
                        else:
                            continue
                        ev += pr * int(PRO_AMOUNT[k])
    out["A!=B"] = {"ev_vnd": round(ev, 1), "roi_pct": round((ev / TICKET - 1) * 100, 2)}
    return out


# ═════════════════════════════ F. calibration of the pick pipeline under H0 ═════════════════════════════


def calibrate(product: str, views: dict, T: dict, n: int, n_sims: int) -> dict:
    rng = np.random.default_rng(RNG_SEED)
    base = np.tile(np.arange(1000, dtype=np.int64), (n, 1))
    non_null = Counter()
    pick_names = {p: Counter() for p in ranking.PROFILES}
    p_full = {name: [] for name in STRATEGY_ORDER if name != BASELINE}
    suggestive_any = 0
    t0 = time.time()
    for _ in range(n_sims):
        perm = rng.permuted(base, axis=1)
        prod = legacy_product(views, T, n, perm=perm)
        processed = ranking.process_product(product, prod, "exact_match_rate", "3d")
        for p, v in processed["picks"].items():
            if v:
                non_null[p] += 1
                pick_names[p][v["strategy"]] += 1
        any_sugg = False
        for name, r in prod["segments"]["full"].items():
            sig = r.get("sig_vs_Random")
            if sig:
                p_full[name].append(sig["p_value_raw"])
                any_sugg |= sig["decision"] in ("Suggestive", "Accept")
        suggestive_any += any_sugg
    fpr = {name: round(float(np.mean(np.array(ps) < 0.05)), 3) for name, ps in p_full.items()}
    return {
        "n_sims": n_sims,
        "elapsed_s": round(time.time() - t0, 1),
        "P_pick_non_null": {p: round(non_null[p] / n_sims, 3) for p in ranking.PROFILES},
        "most_common_null_picks": {p: pick_names[p].most_common(3) for p in ranking.PROFILES},
        "P_any_strategy_Suggestive_or_Accept_full": round(suggestive_any / n_sims, 3),
        "false_positive_rate_p_lt_0.05_full_segment": fpr,
        "nominal_rate": 0.05,
    }


# ═════════════════════════════ main ═════════════════════════════


def main() -> None:
    t_start = time.time()
    with CACHE_FILE.open("rb") as f:
        cache = pickle.load(f)
    tickets, meta = cache["tickets"], cache["meta"]
    assert not meta["anomalies"], meta["anomalies"]
    frozen_bt = json.loads(FROZEN_BACKTEST.read_text())
    frozen_rk = json.loads(FROZEN_RANKINGS.read_text())

    report: dict = {
        "cycle": 30,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "tickets_cache": {"created": meta["created"], "record_elapsed_s": meta["elapsed_s"]},
        "products": {},
    }
    legacy_new_out = {
        "cycle": 30,
        "scope": "3d",
        "mode": "Re-run of cycle22 protocol on complete data (legacy evaluator, unchanged)",
        "timestamp": report["timestamp"],
        "strategies": STRATEGY_ORDER,
        "products": {},
    }
    rankings_new_out = {"cycle": 30, "timestamp": report["timestamp"], "products": {}}

    for product in PRODUCTS:
        print(f"\n=== {product} ===", flush=True)
        pr: dict = {}
        old_draws, new_draws = get_draws(product, "old"), get_draws(product, "new")
        T_old, T_new = draw_tables(old_draws), draw_tables(new_draws)
        pr["self_check_vs_original_evaluators"] = self_check(product, new_draws, T_new)
        print("  self-check ok", flush=True)

        # A. replication on the reconstructed cycle22 dataset
        v_old = segment_views(tickets, product, "old", len(old_draws))
        legacy_old = legacy_product(v_old, T_old, len(old_draws), tier_hits=True)
        rep = compare_with_frozen(product, legacy_old, frozen_bt["products"][product])
        picks_old = pick_summary(ranking.process_product(product, legacy_old, "exact_match_rate", "3d"))
        frozen_picks = {p: (v["strategy"] if v else None) for p, v in frozen_rk["products"][product]["picks"].items()}
        rep["picks_reproduced"] = {p: (v["strategy"] if v else None) for p, v in picks_old.items()} == frozen_picks
        rep["frozen_picks"] = frozen_picks
        pr["A_replication"] = rep
        print(
            f"  replication: {rep['mismatches']} mismatches / {rep['values_compared']};"
            f" picks reproduced={rep['picks_reproduced']}",
            flush=True,
        )

        # B. same protocol on complete data
        n_new = len(new_draws)
        v_new = segment_views(tickets, product, "new", n_new)
        legacy_new = legacy_product(v_new, T_new, n_new, tier_hits=True)
        legacy_new_out["products"][product] = legacy_new
        processed_new = ranking.process_product(product, legacy_new, "exact_match_rate", "3d")
        rankings_new_out["products"][product] = processed_new
        pr["B_legacy_protocol_new_data"] = {
            "n_draws": n_new,
            "picks": pick_summary(processed_new),
            "full_segment": {
                name: {
                    "exact_match_rate": r["exact_match_rate"],
                    "roi_pct": r["roi_pct"],
                    "p_value_raw": r.get("sig_vs_Random", {}).get("p_value_raw"),
                    "decision": r.get("sig_vs_Random", {}).get("decision"),
                }
                for name, r in legacy_new["segments"]["full"].items()
            },
        }
        print(f"  legacy picks on new data: {pick_summary(processed_new)}", flush=True)

        # C/D. exact-null tests with rule-correct evaluator
        start_full, full_arr = v_new["full"]
        first_oos = next(i for i, d in enumerate(new_draws) if int(d["id"]) > OLD_DATASET[product]["max_id"])
        pro_null = pro_null_tables(T_new, "multiset") if product == "max_3d_pro" else None
        pr["C_exact_tests_full"] = exact_tests(product, T_new, full_arr, start_full, (start_full, n_new), pro_null)
        pr["D_out_of_sample"] = {
            "first_oos_draw": {"id": new_draws[first_oos]["id"], "date": new_draws[first_oos]["date"]},
            "n_oos_draws": n_new - first_oos,
            "tests": exact_tests(product, T_new, full_arr, start_full, (first_oos, n_new), pro_null),
        }
        print("  exact tests done", flush=True)

        # E. EV
        pr["E_expected_value_per_10k_ticket"] = ev_tables(product, T_new)
        if product == "max_3d_pro":
            pr["E_expected_value_theoretical_iid"] = theoretical_ev_3dpro()
        print("  EV done", flush=True)

        # F. calibration
        pr["F_pipeline_calibration_H0"] = calibrate(product, v_new, T_new, n_new, N_CALIBRATION)
        print(f"  calibration: {pr['F_pipeline_calibration_H0']['P_pick_non_null']}", flush=True)

        report["products"][product] = pr

    report["total_elapsed_s"] = round(time.time() - t_start, 1)
    OUT_LEGACY_NEW.write_text(json.dumps(legacy_new_out, indent=2, ensure_ascii=False))
    OUT_RANKINGS_NEW.write_text(json.dumps(rankings_new_out, indent=2, ensure_ascii=False))
    OUT_REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False, default=str))
    print(f"\n✓ {OUT_REPORT.name}, {OUT_LEGACY_NEW.name}, {OUT_RANKINGS_NEW.name}  ({report['total_elapsed_s']}s)")


if __name__ == "__main__":
    main()
