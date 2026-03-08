"""
cleaning/customers.py
---------------------
All cleaning logic specific to customers.csv.
"""

import logging
import pathlib

import pandas as pd

from cleaning.utils import (
    load_csv,
    parse_dates,
    is_valid_email,
    snapshot,
    print_cleaning_report,
)

logger = logging.getLogger(__name__)


def clean_customers(raw_dir: pathlib.Path) -> pd.DataFrame:
    """
    Clean customers.csv and return the cleaned DataFrame.

    Steps:
        1. Strip whitespace from name and region
        2. Lowercase emails + flag invalid/missing
        3. Parse signup_date with multi-format parser
        4. Fill missing region with 'Unknown'
        5. Remove duplicates — keep most recent signup_date
    """
    df = load_csv(raw_dir / "customers.csv")
    before = snapshot(df)

    # ── 1. Strip whitespace ───────────────────────────────────────────────────
    df["name"]   = df["name"].astype(str).str.strip()
    df["region"] = df["region"].astype(str).str.strip()

    # ── 2. Standardise email + validity flag ──────────────────────────────────
    df["email"] = df["email"].apply(
        lambda x: str(x).strip().lower() if pd.notna(x) else x
    )
    df["is_valid_email"] = df["email"].apply(is_valid_email)
    logger.info("  Emails flagged as invalid/missing: %d", (~df["is_valid_email"]).sum())

    # ── 3. Parse signup_date ──────────────────────────────────────────────────
    df["signup_date"] = parse_dates(df["signup_date"])
    nat_count = df["signup_date"].isna().sum()
    if nat_count:
        logger.warning("  %d unparseable signup_date(s) set to NaT", nat_count)

    # ── 4. Fill missing / blank region ───────────────────────────────────────
    df["region"] = (
        df["region"]
        .replace({"": "Unknown", "nan": "Unknown", "None": "Unknown"})
        .fillna("Unknown")
    )

    # ── 5. Deduplicate — keep row with most recent signup_date ────────────────
    rows_before = len(df)
    df = (
        df.sort_values("signup_date", ascending=False, na_position="last")
          .drop_duplicates(subset=["customer_id"], keep="first")
          .sort_index()
          .reset_index(drop=True)
    )
    dupes_removed = rows_before - len(df)
    logger.info("  Duplicate customer rows removed: %d", dupes_removed)

    after = snapshot(df)
    print_cleaning_report("customers.csv", before, after, dupes_removed)
    return df