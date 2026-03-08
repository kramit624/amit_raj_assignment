"""
backend/utils.py
----------------
Shared helper used by every router.
Loads a CSV and raises the correct HTTP error if something goes wrong.
"""

import pathlib

import pandas as pd
from fastapi import HTTPException


def load_csv_or_404(path: pathlib.Path) -> list[dict]:
    """
    Read a CSV file and return it as a list of dicts (JSON-serialisable).
    Raises HTTP 404 if the file is missing or empty.
    """
    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Data file not found: {path.name}. "
                   "Run analyze.py first to generate it.",
        )
    try:
        df = pd.read_csv(path)
    except pd.errors.EmptyDataError:
        raise HTTPException(
            status_code=404,
            detail=f"Data file is empty: {path.name}.",
        )
    if df.empty:
        raise HTTPException(
            status_code=404,
            detail=f"No records found in: {path.name}.",
        )

    # Convert NaN → None so FastAPI serialises to JSON null cleanly
    df = df.where(pd.notna(df), other=None)
    return df.to_dict(orient="records")