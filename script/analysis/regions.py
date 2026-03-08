"""
analysis/regions.py
-------------------
Task 4 — Regional Analysis.
Customers, orders, total revenue, and avg revenue per customer by region.
"""

import pathlib

import pandas as pd

from cleaning.utils import save_csv


def regional_analysis(full_data: pd.DataFrame, out_dir: pathlib.Path) -> pd.DataFrame:
    """
    Group by region to produce:
      - num_customers (unique)
      - num_orders
      - total_revenue
      - avg_revenue_per_customer
    Saves result to regional_analysis.csv.
    """
    # Unique customers per region
    customer_region = (
        full_data[["customer_id", "region"]]
        .drop_duplicates(subset=["customer_id"])
        .groupby("region", as_index=False)["customer_id"]
        .nunique()
        .rename(columns={"customer_id": "num_customers"})
    )

    # Order counts and revenue per region
    order_stats = (
        full_data
        .dropna(subset=["region"])
        .groupby("region", as_index=False)
        .agg(
            num_orders=("order_id", "count"),
            total_revenue=("amount", "sum"),
        )
    )

    region = pd.merge(customer_region, order_stats, on="region", how="left")
    region["avg_revenue_per_customer"] = (
        region["total_revenue"] / region["num_customers"]
    ).round(2)
    region["total_revenue"] = region["total_revenue"].round(2)
    region = region.sort_values("total_revenue", ascending=False).reset_index(drop=True)

    save_csv(region, out_dir / "regional_analysis.csv")
    return region