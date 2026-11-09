#!/usr/bin/env python3
"""Chu kỳ 30 — Kiểm chứng thuật toán + backtest lại Max 3D / Max 3D Pro (2026-11-09).

Bối cảnh: dữ liệu đã crawl bù đầy đủ (Max 3D kỳ 1→1155, 3D Pro kỳ 1→802, không hổng).
Strategy + picks được đóng băng ở Chu kỳ 22 (dataset tới kỳ 1069 / 715) → mọi kỳ sau đó là
out-of-sample thật, chưa từng tham gia chọn thuật toán.

  record   Walk-forward đúng protocol cycle22_rebacktest_3d.py (17 strategy × 5 run, seed=42+run
           đặt lại + strategy mới cho mỗi walk). Walks: full=[50,n), half2=[mid,n), forward=[n-100,n).
           half1=[50,mid) = lát đầu của walk full (strategy không giữ state giữa các lần predict →
           cùng seed, cùng chuỗi lời gọi). Ghi lại vé để chấm lại bằng nhiều evaluator.
           Dataset "old" = tái tạo đúng dataset của cycle22_backtest_3d.json; "new" = dữ liệu đầy đủ.
  analyze  Xem cycle30_3d_analysis.py.

Chạy:  .venv/bin/python website/research/optimization/cycle30_3d_reverify.py
"""

from __future__ import annotations

import os
import pickle
import random
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

import numpy as np

THIS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(THIS_DIR))
sys.path.insert(0, str(THIS_DIR.parent / "3d"))
sys.path.insert(0, str(THIS_DIR.parent))

from advanced_backtest import PRODUCTS_3D, load_data  # noqa: E402
from cycle22_rebacktest_3d import (  # noqa: E402  (same 17 specs + constants as the shipped backtest)
    FORWARD_WINDOW,
    MIN_HISTORY,
    N_PREDICTIONS,
    N_RUNS,
    SEED,
    STRATEGY_FACTORY,
    STRATEGY_ORDER,
)

CACHE_FILE = THIS_DIR / ".cache" / "cycle30_3d_tickets.pkl"

# Dataset của cycle22_backtest_3d.json (2026-04-22): n_draws 1065 / 711 = các kỳ ≤ max_id,
# trừ 4 kỳ tháng 9/2025 mà file data lúc đó bị hổng (đã crawl bù hôm nay).
OLD_DATASET = {
    "max_3d": {"max_id": 1069, "missing": set(range(978, 982))},
    "max_3d_pro": {"max_id": 715, "missing": set(range(624, 628))},
}
NO_PRED = -1  # strategy trả rỗng / raise → legacy bỏ qua kỳ đó (không tính phí)
BAD_NUM = -2  # chuỗi không phải 3 chữ số → legacy không bao giờ khớp

_draws_cache: dict = {}


def get_draws(product: str, dataset: str) -> list[dict]:
    key = (product, dataset)
    if key not in _draws_cache:
        draws = load_data(PRODUCTS_3D[product]["file"])
        if dataset == "old":
            spec = OLD_DATASET[product]
            draws = [d for d in draws if int(d["id"]) <= spec["max_id"] and int(d["id"]) not in spec["missing"]]
        _draws_cache[key] = draws
    return _draws_cache[key]


def walk_bounds(n: int) -> dict[str, tuple[int, int]]:
    return {"full": (MIN_HISTORY, n), "half2": (n // 2, n), "forward": (n - FORWARD_WINDOW, n)}


def run_walk(task: tuple) -> tuple:
    product, dataset, strat_name, run, walk = task
    draws = get_draws(product, dataset)
    start, end = walk_bounds(len(draws))[walk]
    random.seed(SEED + run)
    np.random.seed(SEED + run)
    strat = STRATEGY_FACTORY[strat_name]()
    out = np.full((end - start, N_PREDICTIONS), NO_PRED, dtype=np.int16)
    anomalies = 0
    for i in range(start, end):
        train = draws[:i]
        if len(train) < 20:
            continue
        try:
            predicted = strat.predict(train, N_PREDICTIONS)
            if not predicted:
                continue
        except Exception:
            continue
        if len(predicted) != N_PREDICTIONS:
            anomalies += 1
        for k, p in enumerate(predicted[:N_PREDICTIONS]):
            ok = isinstance(p, str) and len(p) == 3 and p.isdigit()
            out[i - start, k] = int(p) if ok else BAD_NUM
            anomalies += 0 if ok else 1
    return task, out, anomalies


def record() -> None:
    tasks = [
        (product, dataset, s, run, walk)
        for walk in ("full", "half2", "forward")  # long walks first → better load balance
        for product in ("max_3d", "max_3d_pro")
        for dataset in ("new", "old")
        for s in STRATEGY_ORDER
        for run in range(N_RUNS)
    ]
    t0 = time.time()
    tickets: dict = {}
    anomalies: dict = {}
    workers = max(1, (os.cpu_count() or 2) - 1)
    print(f"{len(tasks)} walks on {workers} workers", flush=True)
    with ProcessPoolExecutor(max_workers=workers) as pool:
        futures = [pool.submit(run_walk, t) for t in tasks]
        for done, fut in enumerate(as_completed(futures), 1):
            task, out, bad = fut.result()
            tickets[task] = out
            if bad:
                anomalies[task] = bad
            if done % 100 == 0 or done == len(tasks):
                print(f"  {done}/{len(tasks)}  {time.time() - t0:.0f}s", flush=True)
    meta = {
        "created": time.strftime("%Y-%m-%d %H:%M:%S"),
        "n_draws": {(p, d): len(get_draws(p, d)) for p in ("max_3d", "max_3d_pro") for d in ("new", "old")},
        "anomalies": anomalies,
        "elapsed_s": round(time.time() - t0, 1),
    }
    CACHE_FILE.parent.mkdir(exist_ok=True)
    with CACHE_FILE.open("wb") as f:
        pickle.dump({"meta": meta, "tickets": tickets}, f)
    print(f"✓ {CACHE_FILE}  anomalies={len(anomalies)}  {meta['elapsed_s']}s")


if __name__ == "__main__":
    record()
