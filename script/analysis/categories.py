"""
analysis/categories.py
----------------------
Task 3 — Category Performance.
Total revenue, average order value, and number of orders per product category.
"""

import pathlib

import pandas as pd

from cleaning.utils import save_csv


def category_performance(full_data: pd.DataFrame, out_dir: pathlib.Path) -> pd.DataFrame:
    """
    Group completed orders by product category.
    Computes total_revenue, avg_order_value, num_orders.
    Saves result to category_performance.csv.
    """
    completed = (
        full_data[full_data["status"] == "completed"]
        .dropna(subset=["category"])
        .copy()
    )

    perf = (
        completed
        .groupby("category", as_index=False)
        .agg(
            total_revenue=("amount", "sum"),
            avg_order_value=("amount", "mean"),
            num_orders=("order_id", "count"),
        )
        .sort_values("total_revenue", ascending=False)
        .reset_index(drop=True)
    )
    perf["total_revenue"]   = perf["total_revenue"].round(2)
    perf["avg_order_value"] = perf["avg_order_value"].round(2)

    save_csv(perf, out_dir / "category_performance.csv")
    return perf