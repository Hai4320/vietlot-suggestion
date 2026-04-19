#!/usr/bin/env python3
"""Run only the 3 new research-based strategies on 3D products."""
import sys, random, time
import numpy as np

sys.path.insert(0, "website/research")
import importlib.util
spec = importlib.util.spec_from_file_location("bt", "website/research/3d_backtest.py")
bt = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bt)

random.seed(42)
np.random.seed(42)

new_strategies = [
    bt.MarkovDigitTransitionStrategy(200, 1.2),
    bt.SumRangeFilterStrategy(200),
    bt.CompositeScoreStrategy(200, 20),
]
new_names = ["Markov_Digit", "SumRange_Filter", "Composite_Score"]

for product_key, cfg in bt.PRODUCTS_3D.items():
    draws = bt.load_3d_data(product_key)
    print(f"\n{'='*60}")
    print(f"  {product_key} ({len(draws)} draws)")
    print(f"{'='*60}")
    for strategy, name in zip(new_strategies, new_names):
        print(f"  > {name:24s}", end=" ", flush=True)
        r = bt.walk_forward_backtest_3d(draws, strategy, cfg, min_history=50, n_runs=3, n_predictions=2)
        if "error" not in r:
            tiers = r.get("tier_hits", {})
            tier_str = " | ".join(f"{k.split()[-1]}:{v}" for k, v in sorted(tiers.items()))
            print(f"exact={r['exact_match_rate']:.3f}% "
                  f"digit={r['avg_digit_accuracy']:.2f}% "
                  f"roi={r['roi_pct']:.1f}% "
                  f"hits={r['exact_matches_total']} "
                  f"T={r['elapsed_seconds']:.1f}s")
            print(f"    Tiers: {tier_str}")
        else:
            print(f"ERROR: {r['error']}")

print("\nDone!")
