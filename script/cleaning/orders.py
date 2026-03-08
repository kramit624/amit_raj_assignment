"""
cleaning/orders.py
------------------
All cleaning logic specific to orders.csv.
"""

import logging
import pathlib

import pandas as pd

from cleaning.utils import (
    load_csv,
    parse_dates,
    snapshot,
    print_cleaning_report,
)

logger = logging.getLogger(__name__)

# ─── Status normalisation ─────────────────────────────────────────────────────
_STATUS_MAP = {
    "done":       "completed",
    "complete":   "completed",
    "shipped":    "completed",
    "canceled":   "cancelled",
    "refund":     "refunded",
    "processing": "pending",
}
_VALID_STATUSES = {"completed", "pending", "cancelled", "refunded"}


def _normalise_status(val) -> str:
    """Map raw status strings to the controlled vocabulary."""
    if pd.isna(val):
        return "pending"
    val_lower = str(val).strip().lower()
    if val_lower in _VALID_STATUSES:
        return val_lower
    if val_lower in _STATUS_MAP:
        return _STATUS_MAP[val_lower]
    # partial match fallback
    for key, mapped in _STATUS_MAP.items():
        if key in val_lower:
            return mapped
    logger.warning("  Unknown status '%s' — defaulting to 'pending'", val)
    return "pending"


def clean_orders(raw_dir: pathlib.Path) -> pd.DataFrame:
    """
    Clean orders.csv and return the cleaned DataFrame.

    Steps:
        1. Drop rows where BOTH customer_id AND order_id are null
        2. Parse order_date with multi-format parser
        3. Fill missing amount with median grouped by product
        4. Normalise status to controlled vocabulary
        5. Add derived column order_year_month
    """
    df = load_csv(raw_dir / "orders.csv")
    before = snapshot(df)

    # ── 1. Drop fully unrecoverable rows ─────────────────────────────────────
    unrecoverable = df["customer_id"].isna() & df["order_id"].isna()
    dropped = int(unrecoverable.sum())
    df = df[~unrecoverable].reset_index(drop=True)
    logger.info("  Unrecoverable rows dropped (both IDs null): %d", dropped)

    # ── 2. Parse order_date ───────────────────────────────────────────────────
    df["order_date"] = parse_dates(df["order_date"])
    nat_count = df["order_date"].isna().sum()
    if nat_count:
        logger.warning("  %d unparseable order_date(s) set to NaT", nat_count)

    # ── 3. Fill missing amount with per-product median ────────────────────────
    null_amounts = int(df["amount"].isna().sum())
    df["amount"] = df.groupby("product")["amount"].transform(
        lambda g: g.fillna(g.median())
    )
    df["amount"] = df["amount"].fillna(df["amount"].median())   # global fallback
    logger.info("  Missing amount values filled: %d", null_amounts)

    # ── 4. Normalise status ───────────────────────────────────────────────────
    df["status"] = df["status"].apply(_normalise_status)

    # ── 5. Add order_year_month derived column ────────────────────────────────
    df["order_year_month"] = (
        df["order_date"]
        .dt.to_period("M")
        .astype(str)
        .replace("NaT", pd.NA)
    )

    after = snapshot(df)
    print_cleaning_report("orders.csv", before, after, dropped)
    return df