"""
backend/config.py
-----------------
Central config — all paths and constants live here.
No hardcoded paths anywhere else in the backend.
"""

import pathlib

# Root of the project (two levels up from this file)
BASE_DIR = pathlib.Path(__file__).resolve().parent.parent

# Processed CSVs written by analyze.py
DATA_DIR = BASE_DIR / "data" / "processed"

# Map each route key to its CSV file
CSV_FILES = {
    "revenue":    DATA_DIR / "monthly_revenue.csv",
    "customers":  DATA_DIR / "top_customers.csv",
    "categories": DATA_DIR / "category_performance.csv",
    "regions":    DATA_DIR / "regional_analysis.csv",
}