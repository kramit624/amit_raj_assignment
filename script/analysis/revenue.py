"""
analysis/revenue.py
-------------------
Task 1 — Monthly Revenue Trend.
Computes total completed-order revenue grouped by order_year_month.
"""

import pathlib

import pandas as pd

from cleaning.utils import save_csv


def monthly_revenue(full_data: pd.DataFrame, out_dir: pathlib.Path) -> pd.DataFrame:
    """
    Filter completed orders, group by order_year_month, sum revenue.
    Saves result to monthly_revenue.csv.
    """
    completed = full_data[full_data["status"] == "completed"].copy()

    revenue = (
        completed
        .dropna(subset=["order_year_month"])
        .groupby("order_year_month", as_index=False)["amount"]
        .sum()
        .rename(columns={"amount": "total_revenue"})
        .sort_values("order_year_month")
        .reset_index(drop=True)
    )
    revenue["total_revenue"] = revenue["total_revenue"].round(2)

    save_csv(revenue, out_dir / "monthly_revenue.csv")
    return revenue