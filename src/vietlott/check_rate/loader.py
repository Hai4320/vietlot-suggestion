"""Load historical draws for a product, normalized as a list of dicts ordered oldest → newest."""

from __future__ import annotations

import polars as pl

from vietlott.config.products import get_config


def load_draws(game: str) -> list[dict]:
    """Read `<game>.jsonl` and return list of records sorted ascending by date+id.

    Records are kept as-is (result is list for Power/Keno, dict for 3D tier-based).
    """
    cfg = get_config(game)
    df = pl.read_ndjson(cfg.raw_path)
    if "date" not in df.columns:
        raise ValueError(f"{cfg.raw_path} missing 'date' column")

    # Normalise date to string YYYY-MM-DD for consistent comparison across products
    if df["date"].dtype in (pl.Date, pl.Datetime):
        df = df.with_columns(pl.col("date").cast(pl.Date).cast(pl.Utf8))
    elif df["date"].dtype in (pl.Int64, pl.Int32, pl.Float64):
        mx = df["date"].max()
        if mx > 1_000_000_000_000:
            df = df.with_columns(
                (pl.col("date").cast(pl.Int64) / 1000).cast(pl.Datetime("ms")).cast(pl.Date).cast(pl.Utf8)
            )
        else:
            df = df.with_columns(pl.col("date").cast(pl.Int64).cast(pl.Datetime("s")).cast(pl.Date).cast(pl.Utf8))
    else:
        df = df.with_columns(pl.col("date").cast(pl.Utf8))

    df = df.sort(["date", "id"])
    return df.to_dicts()
