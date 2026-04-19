#!/usr/bin/env python3
"""
Phase 1: Comprehensive Backtest of ALL current strategies on ALL products.
Saves results to website/research/phase1_backtest_results.json
"""

import json
import sys
import time
from datetime import date, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
from loguru import logger

# Add src to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from machine_learning.strategies import (
    ColdNumbersStrategy,
    ExponentialDecayStrategy,
    FrequencyStrategy,
    HotNumbersStrategy,
    LongAbsenceStrategy,
    NotRepeatStrategy,
    PairFrequencyStrategy,
    PatternStrategy,
    RandomModel,
)
from machine_learning.strategies.base import PredictModel


# ─── Data Loading ──────────────────────────────────────────────

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

MATRIX_PRODUCTS = {
    "power_655": {
        "file": "power655.jsonl",
        "min_val": 1,
        "max_val": 55,
        "num_count": 6,
        "has_special": True,
        "prizes": {6: 30_000_000_000, 5: 10_000_000, 4: 300_000, 3: 30_000},
    },
    "power_645": {
        "file": "power645.jsonl",
        "min_val": 1,
        "max_val": 45,
        "num_count": 6,
        "has_special": False,
        "prizes": {6: 12_000_000_000, 5: 10_000_000, 4: 300_000, 3: 30_000},
    },
    "power_535": {
        "file": "power535.jsonl",
        "min_val": 1,
        "max_val": 35,
        "num_count": 5,
        "has_special": True,
        "special_max": 12,
        "prizes": {5: 6_000_000_000, 4: 500_000, 3: 50_000},
    },
}


def load_matrix_data(product_key: str) -> pd.DataFrame:
    """Load matrix product data into DataFrame."""
    cfg = MATRIX_PRODUCTS[product_key]
    path = DATA_DIR / cfg["file"]
    rows = []
    for line in path.read_text().strip().split("\n"):
        rec = json.loads(line)
        result = rec["result"]
        if isinstance(result, list):
            rows.append({"date": rec["date"], "id": rec["id"], "result": result[:cfg["num_count"]]})
    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"]).dt.date
    df = df.sort_values("date").reset_index(drop=True)
    return df


def load_3d_data(product_key: str) -> pd.DataFrame:
    """Load 3D product data — flatten all tiers into numbers per draw."""
    fname = "3d.jsonl" if product_key == "3d" else "3d_pro.jsonl"
    path = DATA_DIR / fname
    rows = []
    for line in path.read_text().strip().split("\n"):
        rec = json.loads(line)
        result = rec["result"]
        all_nums = []
        if isinstance(result, dict):
            for vals in result.values():
                all_nums.extend(vals)
        rows.append({"date": rec["date"], "id": rec["id"], "result": all_nums})
    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"]).dt.date
    df = df.sort_values("date").reset_index(drop=True)
    return df


# ─── Backtest Engine ───────────────────────────────────────────


def compute_matches(predicted: list, actual: list) -> int:
    """Count matching numbers."""
    return len(set(predicted) & set(actual))


def walk_forward_backtest(
    df: pd.DataFrame,
    strategy_class: type,
    strategy_params: dict,
    product_cfg: dict,
    min_history: int = 100,
    num_predictions_per_draw: int = 1,
) -> dict:
    """
    Walk-forward backtest: for each draw t, train on [0..t-1], predict for t.
    Returns comprehensive metrics.
    """
    dates = df["date"].unique()
    n = len(dates)
    start_idx = min(min_history, n // 2)

    matches_list = []
    revenue_list = []
    predictions_detail = []
    ticket_price = 10_000

    prizes = product_cfg.get("prizes", {6: 30_000_000_000, 5: 10_000_000, 4: 300_000, 3: 30_000})

    t0 = time.time()

    for i in range(start_idx, n):
        target_date = dates[i]
        train_df = df[df["date"] < target_date].copy()

        if len(train_df) < 30:
            continue

        try:
            # Create strategy — pass df + product-specific min/max
            init_params = {
                "df": train_df,
                "min_val": product_cfg.get("min_val", 1),
                "max_val": product_cfg.get("max_val", 55),
            }
            # Merge strategy-specific params
            init_params.update(strategy_params)

            # Filter only params accepted by the class
            import inspect
            sig = inspect.signature(strategy_class.__init__)
            valid_params = {k: v for k, v in init_params.items() if k in sig.parameters}
            model = strategy_class(**valid_params)

            # Override number_predict for non-6 products
            model.number_predict = product_cfg.get("num_count", 6)

            # Predict
            pred = model.predict(target_date)
            if pred is None or len(pred) == 0:
                continue

            predicted = list(pred)
        except Exception as e:
            logger.debug(f"Strategy error at {target_date}: {e}")
            continue

        # Actual result
        actual_rows = df[df["date"] == target_date]
        if actual_rows.empty:
            continue
        actual = list(actual_rows.iloc[0]["result"])

        # Compute matches
        m = compute_matches(predicted, actual)
        rev = prizes.get(m, 0)

        matches_list.append(m)
        revenue_list.append(rev - ticket_price)
        predictions_detail.append({
            "date": str(target_date),
            "predicted": predicted[:6],
            "actual": actual[:6],
            "matches": m,
            "revenue": rev,
        })

    elapsed = time.time() - t0

    if not matches_list:
        return {"error": "No predictions generated"}

    total_cost = len(matches_list) * ticket_price
    total_revenue = sum(prizes.get(m, 0) for m in matches_list)
    net_profit = total_revenue - total_cost

    # Match distribution
    dist = {}
    for m in range(max(matches_list) + 1):
        dist[m] = matches_list.count(m)

    # Metrics
    avg_matches = np.mean(matches_list)
    win_rate = sum(1 for m in matches_list if m >= 3) / len(matches_list)

    # Sharpe
    profits = np.array(revenue_list)
    sharpe = 0.0
    if len(profits) > 1:
        std = np.std(profits, ddof=1)
        if std > 0:
            sharpe = (np.mean(profits) / std) * np.sqrt(52)

    # Max drawdown
    cum = np.cumsum(profits)
    running_max = np.maximum.accumulate(cum)
    dd = cum - running_max
    max_dd = abs(dd.min()) if len(dd) > 0 else 0

    return {
        "total_predictions": len(matches_list),
        "avg_matches": round(float(avg_matches), 4),
        "win_rate": round(float(win_rate), 6),
        "win_rate_pct": round(float(win_rate * 100), 4),
        "total_cost": int(total_cost),
        "total_revenue": int(total_revenue),
        "net_profit": int(net_profit),
        "roi_pct": round(float(net_profit / total_cost * 100), 2) if total_cost > 0 else 0,
        "sharpe_ratio": round(float(sharpe), 4),
        "max_drawdown": int(max_dd),
        "best_match": max(matches_list),
        "matches_distribution": {str(k): v for k, v in sorted(dist.items())},
        "elapsed_seconds": round(elapsed, 2),
    }


# ─── Strategy Configurations ──────────────────────────────────

STRATEGIES = [
    ("RandomModel", RandomModel, {}),
    ("Frequency_Hot", FrequencyStrategy, {"lookback_days": 365, "strategy_type": "hot", "selection_weight": 0.7}),
    ("Frequency_Cold", FrequencyStrategy, {"lookback_days": 365, "strategy_type": "cold", "selection_weight": 0.7}),
    ("Frequency_Balanced", FrequencyStrategy, {"lookback_days": 365, "strategy_type": "balanced", "selection_weight": 0.5}),
    ("HotNumbers", HotNumbersStrategy, {"lookback_days": 180}),
    ("ColdNumbers", ColdNumbersStrategy, {"lookback_days": 180}),
    ("LongAbsence", LongAbsenceStrategy, {"lookback_days": 365, "top_n": 10}),
    ("NotRepeat", NotRepeatStrategy, {"lookback_days": 30, "avoid_weight": 0.8}),
    ("Pattern", PatternStrategy, {"lookback_days": 180, "pattern_weight": 0.6}),
    ("ExponentialDecay_Hot", ExponentialDecayStrategy, {"half_life": 90, "hot": True, "selection_weight": 0.7}),
    ("ExponentialDecay_Cold", ExponentialDecayStrategy, {"half_life": 90, "hot": False, "selection_weight": 0.7}),
    ("PairFrequency", PairFrequencyStrategy, {"lookback_days": 365}),
]


# ─── Theoretical Random Baseline ──────────────────────────────

def compute_random_baseline(num_count: int, max_val: int, num_trials: int = 10000) -> dict:
    """Compute theoretical random baseline statistics via Monte Carlo."""
    rng = np.random.default_rng(42)
    matches = []
    for _ in range(num_trials):
        pred = set(rng.choice(range(1, max_val + 1), size=num_count, replace=False))
        actual = set(rng.choice(range(1, max_val + 1), size=num_count, replace=False))
        matches.append(len(pred & actual))

    arr = np.array(matches)
    dist = {}
    for m in range(num_count + 1):
        dist[str(m)] = int((arr == m).sum())

    return {
        "avg_matches": round(float(arr.mean()), 4),
        "std_matches": round(float(arr.std()), 4),
        "win_rate_pct": round(float((arr >= 3).mean() * 100), 4),
        "matches_distribution": dist,
    }


# ─── Main ─────────────────────────────────────────────────────

def main():
    output_dir = Path(__file__).resolve().parent.parent / "website" / "research"
    output_dir.mkdir(parents=True, exist_ok=True)

    results = {}

    # 1. Matrix products
    for product_key, cfg in MATRIX_PRODUCTS.items():
        logger.info(f"\n{'='*60}")
        logger.info(f"Product: {product_key}")
        logger.info(f"{'='*60}")

        df = load_matrix_data(product_key)
        logger.info(f"Loaded {len(df)} draws ({df['date'].min()} to {df['date'].max()})")

        # Random baseline
        baseline = compute_random_baseline(cfg["num_count"], cfg["max_val"])
        logger.info(f"Random baseline: avg_matches={baseline['avg_matches']}, win_rate={baseline['win_rate_pct']}%")

        product_results = {
            "data_info": {
                "total_draws": len(df),
                "date_range": f"{df['date'].min()} to {df['date'].max()}",
                "num_count": cfg["num_count"],
                "max_val": cfg["max_val"],
            },
            "random_baseline": baseline,
            "strategies": {},
        }

        for name, cls, params in STRATEGIES:
            logger.info(f"  Backtesting {name}...")
            try:
                result = walk_forward_backtest(df, cls, params, cfg, min_history=100)
                product_results["strategies"][name] = {
                    "params": {k: v for k, v in params.items() if k != "df"},
                    "result": result,
                }
                if "error" not in result:
                    logger.info(
                        f"    → avg_matches={result['avg_matches']}, "
                        f"win_rate={result['win_rate_pct']}%, "
                        f"roi={result['roi_pct']}%, "
                        f"predictions={result['total_predictions']}"
                    )
                else:
                    logger.warning(f"    → {result['error']}")
            except Exception as e:
                logger.error(f"    → FAILED: {e}")
                product_results["strategies"][name] = {"error": str(e)}

        results[product_key] = product_results

    # 2. Save results
    output_file = output_dir / "phase1_backtest_results.json"
    with open(output_file, "w") as f:
        json.dump(results, f, indent=2, default=str)

    logger.info(f"\n\nResults saved to {output_file}")

    # 3. Print summary table
    print("\n" + "=" * 100)
    print("PHASE 1 BACKTEST SUMMARY")
    print("=" * 100)

    for product_key, prod_res in results.items():
        baseline = prod_res["random_baseline"]
        print(f"\n{'─'*80}")
        print(f"Product: {product_key} ({prod_res['data_info']['total_draws']} draws)")
        print(f"Random Baseline: avg_matches={baseline['avg_matches']}, win_rate={baseline['win_rate_pct']}%")
        print(f"{'─'*80}")
        print(f"{'Strategy':<25} {'AvgMatch':>10} {'WinRate%':>10} {'ROI%':>10} {'Sharpe':>10} {'BestMatch':>10} {'N':>8}")
        print(f"{'─'*25} {'─'*10} {'─'*10} {'─'*10} {'─'*10} {'─'*10} {'─'*8}")

        strats = prod_res.get("strategies", {})
        rows = []
        for name, data in strats.items():
            if "error" in data and not isinstance(data.get("result"), dict):
                continue
            r = data.get("result", {})
            if "error" in r:
                continue
            rows.append((
                name,
                r.get("avg_matches", 0),
                r.get("win_rate_pct", 0),
                r.get("roi_pct", 0),
                r.get("sharpe_ratio", 0),
                r.get("best_match", 0),
                r.get("total_predictions", 0),
            ))

        # Sort by avg_matches descending
        rows.sort(key=lambda x: x[1], reverse=True)
        for name, am, wr, roi, sh, bm, n in rows:
            marker = " ✓" if am > baseline["avg_matches"] else ""
            print(f"{name:<25} {am:>10.4f} {wr:>10.4f} {roi:>10.2f} {sh:>10.4f} {bm:>10} {n:>8}{marker}")


if __name__ == "__main__":
    main()
