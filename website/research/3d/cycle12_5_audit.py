#!/usr/bin/env python3
"""Chu Kỳ 12.5 — Audit GBM Max 3D Pro "Technical Accept"

Purpose: diagnose WHY GBM showed implausible +3pp full-sample on 3D, to establish
whether it's (a) subtle data leak, (b) pure overfitting, or (c) something else.
No new edge hypothesis. Pure diagnostic.

5 tests (pre-declared before running):
  1. Permutation test — shuffle labels, refit, measure Δ. Expected ≈ 0 if honest.
  2. Feature importance — which feature drives the apparent edge?
  3. Prediction diversity — does GBM collapse to same few picks?
  4. Single-feature ablation — train with 1 feature at a time, measure Δ.
  5. Split-forward — divide last 200 draws into 4×50 windows, check Δ consistency.

Output: cycle12_5_audit_results.json + console report
"""
from __future__ import annotations

import json
import random
import sys
import time
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier

THIS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(THIS_DIR))
sys.path.insert(0, str(THIS_DIR.parent))

from advanced_backtest import (  # noqa: E402
    PRODUCTS_3D,
    RandomStrategy,
    evaluate_prediction,
    load_data,
)
from gbm_strategy import (  # noqa: E402
    ALL_NUMBERS,
    N_FEATURES,
    GBMDigitClassifier,
    _build_history_stats,
    _draw_to_int_set,
    _features_for_all_numbers,
)
from _significance import build_significance  # noqa: E402

OUTPUT_FILE = THIS_DIR / "cycle12_5_audit_results.json"

FEATURE_NAMES = [
    "freq_30", "freq_100", "freq_300",
    "time_since_last_seen",
    "marg_p0", "marg_p1", "marg_p2",
    "pair_01", "pair_02", "pair_12",
    "sum", "sum_parity", "n_distinct",
]

SEED = 42
MIN_HISTORY = 50
N_PREDICTIONS = 2


def _walk_forward(draws, strategy, product_cfg, start, end, n_runs=3):
    """Minimal walk-forward returning (hits_total, n_trials)."""
    prizes = product_cfg["prizes"]
    hits, trials = 0, 0
    for _ in range(n_runs):
        for i in range(start, end):
            train = draws[:i]
            if len(train) < 20:
                continue
            try:
                preds = strategy.predict(train, N_PREDICTIONS)
            except Exception:
                continue
            ev = evaluate_prediction(preds, draws[i], prizes)
            hits += ev["exact_count"]
            trials += N_PREDICTIONS
    return hits, trials


# ══════════════════════════════════════════════════════════════════
# TEST 1 — Permutation test
# ══════════════════════════════════════════════════════════════════

class GBMPermutedLabelsStrategy(GBMDigitClassifier):
    """GBM but labels are shuffled PER TRAINING TIMESTEP (breaks feature-label link).

    If GBM still shows large Δ with shuffled labels → there's leakage.
    If Δ ≈ 0 → pure overfitting (honest but useless).
    """
    name = "GBMPermutedLabels"

    def _build_training_set(self, train_draws):
        """Override: build X as usual, but shuffle y within each timestep."""
        n = len(train_draws)
        if n <= self.min_t_start + 1:
            return np.zeros((0, N_FEATURES)), np.zeros(0, dtype=int)

        if self._next_t_to_build < 0:
            self._next_t_to_build = self.min_t_start

        for t in range(self._next_t_to_build, n):
            stats = _build_history_stats(train_draws, t)
            X_t = _features_for_all_numbers(stats)
            # CRITICAL: shuffle y_t to break label-feature link
            in_draw = _draw_to_int_set(train_draws[t])
            y_t = np.zeros(1000, dtype=int)
            for num in in_draw:
                y_t[num] = 1
            # Shuffle y_t independently per timestep (same # positives, random positions)
            self._rng.shuffle(y_t)
            self._X_cache.append(X_t)
            self._y_cache.append(y_t)
        self._next_t_to_build = n

        X = np.vstack(self._X_cache)
        y = np.concatenate(self._y_cache)
        pos_idx = np.where(y == 1)[0]
        neg_idx = np.where(y == 0)[0]
        target_neg_n = int(len(pos_idx) * self.downsample_neg_ratio)
        if target_neg_n < len(neg_idx):
            neg_sample = self._rng.choice(neg_idx, size=target_neg_n, replace=False)
            keep = np.concatenate([pos_idx, neg_sample])
            X = X[keep]
            y = y[keep]
        return X, y


def test_1_permutation(draws, product_cfg, product_key):
    """Train GBM on shuffled labels, measure forward Δ."""
    print(f"\n{'─' * 80}")
    print(f"  TEST 1 — Permutation test on {product_key}")
    print(f"{'─' * 80}")
    n = len(draws)
    start = n - 100

    # Random baseline
    random.seed(SEED); np.random.seed(SEED)
    rand_hits, rand_n = _walk_forward(draws, RandomStrategy(), product_cfg, start, n, n_runs=3)

    # Normal GBM (sanity: confirm we reproduce original result)
    random.seed(SEED); np.random.seed(SEED)
    gbm = GBMDigitClassifier(refit_interval=100, min_t_start=50, random_state=SEED)
    gbm_hits, gbm_n = _walk_forward(draws, gbm, product_cfg, start, n, n_runs=3)

    # Permuted labels GBM
    random.seed(SEED); np.random.seed(SEED)
    perm = GBMPermutedLabelsStrategy(refit_interval=100, min_t_start=50, random_state=SEED)
    perm_hits, perm_n = _walk_forward(draws, perm, product_cfg, start, n, n_runs=3)

    rand_rate = rand_hits / rand_n * 100 if rand_n else 0
    gbm_rate = gbm_hits / gbm_n * 100 if gbm_n else 0
    perm_rate = perm_hits / perm_n * 100 if perm_n else 0

    print(f"  Random:        {rand_rate:.3f}% ({rand_hits}/{rand_n})")
    print(f"  GBM normal:    {gbm_rate:.3f}% (Δ={gbm_rate-rand_rate:+.3f}pp vs Random)")
    print(f"  GBM permuted:  {perm_rate:.3f}% (Δ={perm_rate-rand_rate:+.3f}pp vs Random)")
    print(
        f"  → INTERPRETATION: if permuted Δ ≈ 0 → pure overfit (no leak). "
        f"If permuted Δ ≫ 0 → FEATURE LEAKS label info."
    )

    return {
        "product": product_key,
        "window": [start, n],
        "random": {"rate_pct": round(rand_rate, 4), "hits": rand_hits, "n": rand_n},
        "gbm_normal": {"rate_pct": round(gbm_rate, 4), "hits": gbm_hits, "n": gbm_n,
                       "delta_pp": round(gbm_rate - rand_rate, 4)},
        "gbm_permuted": {"rate_pct": round(perm_rate, 4), "hits": perm_hits, "n": perm_n,
                         "delta_pp": round(perm_rate - rand_rate, 4)},
    }


# ══════════════════════════════════════════════════════════════════
# TEST 2 — Feature importance
# ══════════════════════════════════════════════════════════════════

def test_2_feature_importance(draws, product_key):
    """Fit GBM on full training data, extract feature importances."""
    print(f"\n{'─' * 80}")
    print(f"  TEST 2 — Feature importance on {product_key}")
    print(f"{'─' * 80}")

    n = len(draws)
    train_end = n - 100  # exclude forward window
    np.random.seed(SEED); random.seed(SEED)

    gbm = GBMDigitClassifier(refit_interval=100_000, min_t_start=50, random_state=SEED)
    # Build full training set
    gbm._maybe_refit(draws[:train_end])
    if gbm._model is None:
        print("  ERROR: model failed to fit")
        return {"error": "fit_failed"}

    # Use permutation importance on FULL training set (ensures both labels present)
    from sklearn.inspection import permutation_importance
    X, y = gbm._build_training_set(draws[:train_end])
    # Shuffle X, y together then use stratified subsample for speed
    rs = np.random.default_rng(SEED)
    perm = rs.permutation(len(y))
    sub_n = min(20_000, len(y))
    sub_idx = perm[:sub_n]
    X_sub = X[sub_idx]; y_sub = y[sub_idx]
    if y_sub.sum() < 5 or y_sub.sum() == len(y_sub):
        print(f"  WARN: holdout has {y_sub.sum()} positives, skipping permutation importance")
        imps = np.zeros(N_FEATURES)
    else:
        r = permutation_importance(
            gbm._model, X_sub, y_sub,
            n_repeats=3, random_state=SEED, scoring="neg_log_loss",
        )
        imps = r.importances_mean
    order = np.argsort(imps)[::-1]
    print(f"  {'Rank':<6} {'Feature':<25} {'Importance':>12}")
    print(f"  {'─' * 45}")
    for rank, i in enumerate(order, 1):
        print(f"  {rank:<6} {FEATURE_NAMES[i]:<25} {imps[i]:>12.6f}")

    return {
        "product": product_key,
        "method": "permutation_importance_holdout",
        "features_ranked": [
            {"name": FEATURE_NAMES[i], "importance": float(imps[i])}
            for i in order
        ],
    }


# ══════════════════════════════════════════════════════════════════
# TEST 3 — Prediction diversity
# ══════════════════════════════════════════════════════════════════

def test_3_prediction_diversity(draws, product_cfg, product_key):
    """Count unique top-2 picks across all forward predictions."""
    print(f"\n{'─' * 80}")
    print(f"  TEST 3 — Prediction diversity on {product_key}")
    print(f"{'─' * 80}")

    n = len(draws)
    start = n - 100
    np.random.seed(SEED); random.seed(SEED)

    gbm = GBMDigitClassifier(refit_interval=100, min_t_start=50, random_state=SEED)
    all_preds = []
    for _ in range(3):  # 3 runs
        for i in range(start, n):
            preds = gbm.predict(draws[:i], N_PREDICTIONS)
            all_preds.extend(preds)

    counter = Counter(all_preds)
    n_total = len(all_preds)
    n_unique = len(counter)
    top5 = counter.most_common(5)

    print(f"  Total predictions: {n_total} (2 per draw × 100 draws × 3 runs)")
    print(f"  Unique predictions: {n_unique} (out of 1000 possible)")
    print(f"  Concentration — top 5 picks: {top5}")
    top_share = sum(c for _, c in top5) / n_total * 100
    print(f"  Top-5 concentration: {top_share:.1f}% of all predictions")
    if n_unique < 50:
        print(f"  → HIGHLY CONCENTRATED — model collapses to few favorites (overfit signature)")
    elif n_unique < 200:
        print(f"  → MODERATELY CONCENTRATED — some overfitting likely")
    else:
        print(f"  → DIVERSE — predictions span many numbers (not collapsed)")

    return {
        "product": product_key,
        "n_total_predictions": n_total,
        "n_unique_predictions": n_unique,
        "top5_concentration_pct": round(top_share, 2),
        "top5_picks": [{"number": num, "count": count} for num, count in top5],
    }


# ══════════════════════════════════════════════════════════════════
# TEST 4 — Single-feature ablation
# ══════════════════════════════════════════════════════════════════

class GBMSingleFeature(GBMDigitClassifier):
    """GBM using only ONE of 13 features."""
    def __init__(self, feature_idx: int, **kwargs):
        super().__init__(**kwargs)
        self.feature_idx = feature_idx
        self.name = f"GBM_only_{FEATURE_NAMES[feature_idx]}"

    def _build_training_set(self, train_draws):
        X, y = super()._build_training_set(train_draws)
        if len(y):
            X = X[:, [self.feature_idx]]
        return X, y

    def predict(self, train_draws, n_predictions=2):
        self._maybe_refit(train_draws)
        if self._model is None:
            return super().predict(train_draws, n_predictions)
        n = len(train_draws)
        stats = _build_history_stats(train_draws, n)
        X_full = _features_for_all_numbers(stats)
        X = X_full[:, [self.feature_idx]]
        probs = self._model.predict_proba(X)[:, 1]
        top_idx = np.argsort(probs)[::-1][:n_predictions]
        return [f"{int(i):03d}" for i in top_idx]


def test_4_single_feature_ablation(draws, product_cfg, product_key):
    """Train GBM with 1 feature each, measure forward Δ."""
    print(f"\n{'─' * 80}")
    print(f"  TEST 4 — Single-feature ablation on {product_key}")
    print(f"{'─' * 80}")

    n = len(draws)
    start = n - 100
    random.seed(SEED); np.random.seed(SEED)
    rand_hits, rand_n = _walk_forward(draws, RandomStrategy(), product_cfg, start, n, n_runs=3)
    rand_rate = rand_hits / rand_n * 100 if rand_n else 0

    results = []
    for fi, fname in enumerate(FEATURE_NAMES):
        random.seed(SEED); np.random.seed(SEED)
        strat = GBMSingleFeature(feature_idx=fi, refit_interval=100, min_t_start=50, random_state=SEED)
        hits, trials = _walk_forward(draws, strat, product_cfg, start, n, n_runs=3)
        rate = hits / trials * 100 if trials else 0
        delta = rate - rand_rate
        results.append({"feature": fname, "rate_pct": round(rate, 4), "delta_pp": round(delta, 4)})
        print(f"  {fname:<25} rate={rate:>7.3f}%  Δ={delta:>+7.3f}pp")

    # Sort descending by delta
    results.sort(key=lambda r: -r["delta_pp"])
    print(f"\n  → Top feature by Δ: {results[0]['feature']} (Δ={results[0]['delta_pp']:+.3f}pp)")
    print(f"  → If one feature dominates and its Δ is implausible → feature is the source of overfit")

    return {
        "product": product_key,
        "random_rate_pct": round(rand_rate, 4),
        "per_feature": results,
    }


# ══════════════════════════════════════════════════════════════════
# TEST 5 — Split-forward consistency
# ══════════════════════════════════════════════════════════════════

def test_5_split_forward(draws, product_cfg, product_key):
    """Divide last 200 draws into 4 windows of 50; measure Δ in each."""
    print(f"\n{'─' * 80}")
    print(f"  TEST 5 — Split-forward consistency on {product_key}")
    print(f"{'─' * 80}")

    n = len(draws)
    if n < 250:
        print(f"  Not enough draws ({n}) for 4×50 split; using 4×25 on last 100")
        window_size = 25
        total_forward = 100
    else:
        window_size = 50
        total_forward = 200
    forward_start = n - total_forward

    windows = []
    for w_idx in range(4):
        s = forward_start + w_idx * window_size
        e = s + window_size
        windows.append((w_idx, s, e))

    results = []
    for w_idx, s, e in windows:
        random.seed(SEED); np.random.seed(SEED)
        rand_hits, rand_n = _walk_forward(draws, RandomStrategy(), product_cfg, s, e, n_runs=3)
        rand_rate = rand_hits / rand_n * 100 if rand_n else 0
        random.seed(SEED); np.random.seed(SEED)
        gbm = GBMDigitClassifier(refit_interval=100, min_t_start=50, random_state=SEED)
        gbm_hits, gbm_n = _walk_forward(draws, gbm, product_cfg, s, e, n_runs=3)
        gbm_rate = gbm_hits / gbm_n * 100 if gbm_n else 0
        delta = gbm_rate - rand_rate
        results.append({
            "window": w_idx + 1, "range": [s, e],
            "random_rate_pct": round(rand_rate, 4),
            "gbm_rate_pct": round(gbm_rate, 4),
            "delta_pp": round(delta, 4),
            "n_trials": gbm_n,
        })
        print(f"  W{w_idx+1} [{s:4d},{e:4d})  Random={rand_rate:>6.3f}%  GBM={gbm_rate:>6.3f}%  Δ={delta:>+7.3f}pp")

    positive = [r for r in results if r["delta_pp"] > 0]
    n_pos = len(positive)
    print(f"\n  → {n_pos}/4 windows have Δ > 0. ", end="")
    if n_pos == 4:
        print("Consistent positive — edge may be stable")
    elif n_pos <= 2:
        print("Scattered — Δ sign is random (noise signature)")
    else:
        print("Mostly positive — weak signal")

    return {
        "product": product_key,
        "windows": results,
        "n_windows_positive": n_pos,
    }


# ══════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════

def main():
    print("=" * 90)
    print("  Chu Kỳ 12.5 — GBM Audit (Max 3D Pro focus, Max 3D for comparison)")
    print("=" * 90)

    results: dict = {"meta": {"cycle": "12.5", "purpose": "audit Max 3D Pro GBM 'Technical Accept'",
                               "seed": SEED}, "tests": {}}

    for product_key in ("max_3d_pro", "max_3d"):
        draws = load_data(PRODUCTS_3D[product_key]["file"])
        product_cfg = PRODUCTS_3D[product_key]
        print(f"\n\n{'═' * 90}")
        print(f"  PRODUCT: {product_key}  (N={len(draws)})")
        print(f"{'═' * 90}")

        pk_results = {}
        t0 = time.time()
        pk_results["test1_permutation"] = test_1_permutation(draws, product_cfg, product_key)
        pk_results["test2_feature_importance"] = test_2_feature_importance(draws, product_key)
        pk_results["test3_prediction_diversity"] = test_3_prediction_diversity(draws, product_cfg, product_key)
        pk_results["test4_single_feature_ablation"] = test_4_single_feature_ablation(draws, product_cfg, product_key)
        pk_results["test5_split_forward"] = test_5_split_forward(draws, product_cfg, product_key)
        pk_results["elapsed_seconds"] = round(time.time() - t0, 2)
        results["tests"][product_key] = pk_results

    OUTPUT_FILE.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    print(f"\n{'═' * 90}")
    print(f"  ✓ Audit results saved to {OUTPUT_FILE}")
    print(f"{'═' * 90}")


if __name__ == "__main__":
    main()
