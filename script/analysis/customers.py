"""
analysis/customers.py
---------------------
Task 2 — Top 10 Customers by total spend + churn indicator.
"""

import pathlib

import pandas as pd

from cleaning.utils import save_csv


def top_customers(full_data: pd.DataFrame, out_dir: pathlib.Path) -> pd.DataFrame:
    """
    Identify top 10 customers by total completed-order spend.
    Adds churned = True for customers with no completed order in the last 90 days.
    Saves result to top_customers.csv.
    """
    completed = full_data[full_data["status"] == "completed"].copy()
    completed["order_date"] = pd.to_datetime(completed["order_date"], errors="coerce")

    # ── Aggregate spend + last order per customer ─────────────────────────────
    spend = (
        completed
        .groupby("customer_id", as_index=False)
        .agg(
            total_spend=("amount", "sum"),
            last_order_date=("order_date", "max"),
        )
    )

    # ── Attach name and region ────────────────────────────────────────────────
    customer_info = (
        full_data[["customer_id", "name", "region"]]
        .drop_duplicates(subset=["customer_id"])
    )
    top = (
        pd.merge(spend, customer_info, on="customer_id", how="left")
        .nlargest(10, "total_spend")
        .reset_index(drop=True)
    )

    # ── Churn flag: no completed order in last 90 days ────────────────────────
    latest_date = completed["order_date"].max()
    cutoff      = latest_date - pd.Timedelta(days=90)
    top["churned"] = top["last_order_date"] < cutoff

    top["total_spend"] = top["total_spend"].round(2)
    top = top[["customer_id", "name", "region", "total_spend", "last_order_date", "churned"]]

    save_csv(top, out_dir / "top_customers.csv")
    return top