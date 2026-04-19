#!/usr/bin/env python3
"""
Convert JSONL data files from the crawler into compact JSON
for the Next.js website frontend.

Usage:
    python scripts/build_data.py

Reads from:  ../data/*.jsonl
Writes to:   public/data/*.json
"""

import json
from pathlib import Path

# Resolve paths relative to this script
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent  # website/
DATA_DIR = PROJECT_ROOT.parent / "data"  # ../data/
OUTPUT_DIR = PROJECT_ROOT / "public" / "data"

# ── Matrix products (result is a list of numbers) ────────────────────────

MATRIX_PRODUCTS = {
    "power_655": {
        "input": "power655.jsonl",
        "output": "power655.json",
        "main_count": 6,
        "has_special": True,
    },
    "power_645": {
        "input": "power645.jsonl",
        "output": "power645.json",
        "main_count": 6,
        "has_special": False,
    },
    "power_535": {
        "input": "power535.jsonl",
        "output": "power535.json",
        "main_count": 5,
        "has_special": True,
    },
}

# ── 3D products (result is a dict of prize tiers) ───────────────────────

THREE_D_PRODUCTS = {
    "3d": {
        "input": "3d.jsonl",
        "output": "max3d.json",
    },
    "3d_pro": {
        "input": "3d_pro.jsonl",
        "output": "max3d_pro.json",
    },
}

# Map Vietnamese tier keys to English keys
TIER_MAP = {
    "Giải Đặc biệt": "special",
    "Giải Nhất": "first",
    "Giải Nhì": "second",
    "Giải ba": "third",
}


def load_jsonl(path: Path) -> list[dict]:
    """Load a JSONL file into a list of dicts."""
    records = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return records


def normalize_date(date_val) -> str:
    """Normalize date to YYYY-MM-DD string."""
    if isinstance(date_val, str):
        return date_val[:10]  # Trim any time component
    if isinstance(date_val, (int, float)):
        import datetime
        if date_val > 1_000_000_000_000:
            date_val = date_val / 1000
        dt = datetime.datetime.fromtimestamp(date_val, tz=datetime.timezone.utc)
        return dt.strftime("%Y-%m-%d")
    return str(date_val)


def build_matrix_product(key: str, config: dict) -> None:
    """Process a matrix product JSONL and write optimized JSON."""
    input_path = DATA_DIR / config["input"]
    output_path = OUTPUT_DIR / config["output"]

    if not input_path.exists():
        print(f"  ⚠ {input_path} not found, skipping")
        return

    records = load_jsonl(input_path)
    main_count = config["main_count"]
    has_special = config["has_special"]

    draws = []
    for rec in records:
        date = normalize_date(rec["date"])
        draw_id = rec["id"]
        result = rec["result"]

        if isinstance(result, list):
            main_numbers = [int(n) for n in result[:main_count]]
            special = int(result[main_count]) if has_special and len(result) > main_count else None
        else:
            main_numbers = result
            special = None

        draw = {"date": date, "id": str(draw_id), "result": main_numbers}
        if special is not None:
            draw["special"] = special
        draws.append(draw)

    # Sort by date descending
    draws.sort(key=lambda d: d["date"], reverse=True)

    meta = {
        "product": key,
        "totalDraws": len(draws),
        "startDate": draws[-1]["date"] if draws else "",
        "endDate": draws[0]["date"] if draws else "",
    }

    output = {"meta": meta, "draws": draws}
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, separators=(",", ":"))

    size_kb = output_path.stat().st_size / 1024
    print(f"  ✓ {key}: {len(draws)} draws → {output_path.name} ({size_kb:.1f} KB)")


def build_3d_product(key: str, config: dict) -> None:
    """Process a 3D product JSONL and write optimized JSON."""
    input_path = DATA_DIR / config["input"]
    output_path = OUTPUT_DIR / config["output"]

    if not input_path.exists():
        print(f"  ⚠ {input_path} not found, skipping")
        return

    records = load_jsonl(input_path)

    draws = []
    for rec in records:
        date = normalize_date(rec["date"])
        draw_id = rec["id"]
        raw_result = rec["result"]

        # Map Vietnamese keys to English
        result = {}
        for vi_key, en_key in TIER_MAP.items():
            if vi_key in raw_result:
                result[en_key] = raw_result[vi_key]

        draws.append({"date": date, "id": str(draw_id), "result": result})

    # Sort by date descending
    draws.sort(key=lambda d: d["date"], reverse=True)

    meta = {
        "product": key,
        "totalDraws": len(draws),
        "startDate": draws[-1]["date"] if draws else "",
        "endDate": draws[0]["date"] if draws else "",
    }

    output = {"meta": meta, "draws": draws}
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, separators=(",", ":"))

    size_kb = output_path.stat().st_size / 1024
    print(f"  ✓ {key}: {len(draws)} draws → {output_path.name} ({size_kb:.1f} KB)")


def main():
    print("🔄 Building website data...")
    print(f"   Source:  {DATA_DIR}")
    print(f"   Output:  {OUTPUT_DIR}")
    print()

    print("── Matrix Products ──")
    for key, config in MATRIX_PRODUCTS.items():
        build_matrix_product(key, config)

    print()
    print("── 3D Products ──")
    for key, config in THREE_D_PRODUCTS.items():
        build_3d_product(key, config)

    print()
    print("✅ Done!")


if __name__ == "__main__":
    main()
