"""
cleaning/utils.py
-----------------
Shared helpers used by both customers.py and orders.py.
"""

import logging
import pathlib

import pandas as pd

logger = logging.getLogger(__name__)


# ─── File I/O ─────────────────────────────────────────────────────────────────

def load_csv(path: pathlib.Path) -> pd.DataFrame:
    """Load a CSV with clear error handling."""
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    try:
        df = pd.read_csv(path)
    except pd.errors.EmptyDataError as exc:
        raise pd.errors.EmptyDataError(f"File is empty: {path}") from exc
    if df.empty:
        raise pd.errors.EmptyDataError(f"No rows found in: {path}")
    logger.info("Loaded '%s'  →  %d rows, %d columns", path.name, len(df), len(df.columns))
    return df


def save_csv(df: pd.DataFrame, path: pathlib.Path):
    """Save a DataFrame to CSV and log the result."""
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, index=False)
    logger.info("Saved  → %s  (%d rows)", path, len(df))


# ─── Date Parsing ─────────────────────────────────────────────────────────────

_DATE_FORMATS = (
    "%Y-%m-%d",
    "%d-%m-%Y",
    "%Y/%m/%d",
    "%d/%m/%Y",
    "%m-%d-%Y",
    "%m/%d/%Y",
)


def _parse_single_date(val) -> pd.Timestamp:
    """Try each date format in order; return pd.NaT and warn on failure."""
    if pd.isna(val):
        return pd.NaT
    val_str = str(val).strip()
    for fmt in _DATE_FORMATS:
        try:
            return pd.to_datetime(val_str, format=fmt)
        except (ValueError, TypeError):
            continue
    logger.warning("Unparseable date value: '%s' — replaced with NaT", val_str)
    return pd.NaT


def parse_dates(series: pd.Series) -> pd.Series:
    """Apply multi-format date parser element-wise to a Series."""
    return series.apply(_parse_single_date)


# ─── Email Validation ─────────────────────────────────────────────────────────

def is_valid_email(email) -> bool:
    """Return True only when email has '@' and a '.' after the '@'."""
    if pd.isna(email) or str(email).strip() == "":
        return False
    email = str(email).strip()
    if "@" not in email:
        return False
    _, _, domain = email.partition("@")
    return "." in domain


# ─── Cleaning Report ──────────────────────────────────────────────────────────

def snapshot(df: pd.DataFrame) -> dict:
    """Capture row count + per-column null counts for comparison."""
    return {
        "rows": len(df),
        "nulls": df.isnull().sum().to_dict(),
    }


def print_cleaning_report(filename: str, before: dict, after: dict, dupes: int):
    """Print a structured before/after cleaning report to stdout."""
    sep = "─" * 60
    print(f"\n{sep}")
    print(f"  CLEANING REPORT — {filename}")
    print(sep)
    print(f"  {'Metric':<35} {'Before':>8}  {'After':>8}")
    print(f"  {'─' * 35} {'─' * 8}  {'─' * 8}")
    print(f"  {'Total rows':<35} {before['rows']:>8}  {after['rows']:>8}")
    print(f"  {'Rows removed (dupes/invalid)':<35} {dupes:>8}  {'—':>8}")
    all_cols = sorted(set(before["nulls"]) | set(after["nulls"]))
    for col in all_cols:
        b = before["nulls"].get(col, 0)
        a = after["nulls"].get(col, 0)
        print(f"  {f'NULLs in {col!r}':<35} {b:>8}  {a:>8}")
    print(sep + "\n")