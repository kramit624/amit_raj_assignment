"""
analysis/merge.py
-----------------
Merges cleaned customers, orders, and raw products into one full_data DataFrame.
"""

import logging
import pathlib

import pandas as pd

from cleaning.utils import load_csv

logger = logging.getLogger(__name__)


def merge_datasets(processed_dir: pathlib.Path, raw_dir: pathlib.Path) -> pd.DataFrame:
    """
    Left-join orders → customers → products.
    Reports unmatched rows after each join.
    Returns the final full_data DataFrame.
    """
    df_customers = load_csv(processed_dir / "customers_clean.csv")
    df_orders    = load_csv(processed_dir / "orders_clean.csv")
    df_products  = load_csv(raw_dir / "products.csv")

    # ── Join 1: orders + customers ────────────────────────────────────────────
    orders_with_customers = pd.merge(
        left=df_orders,
        right=df_customers,
        on="customer_id",
        how="left",
        suffixes=("_order", "_customer"),
    )
    no_customer = int(orders_with_customers["name"].isna().sum())
    logger.info("  Orders with no matching customer : %d", no_customer)

    # ── Join 2: + products ────────────────────────────────────────────────────
    full_data = pd.merge(
        left=orders_with_customers,
        right=df_products,
        left_on="product",
        right_on="product_name",
        how="left",
        suffixes=("", "_prod"),
    )
    no_product = int(full_data["category"].isna().sum())
    logger.info("  Orders with no matching product  : %d", no_product)

    sep = "─" * 60
    print(f"\n{sep}")
    print("  MERGE SUMMARY")
    print(sep)
    print(f"  {'orders_clean rows':<30} {len(df_orders)}")
    print(f"  {'customers_clean rows':<30} {len(df_customers)}")
    print(f"  {'products rows':<30} {len(df_products)}")
    print(f"  {'full_data rows':<30} {len(full_data)}")
    print(f"  {'No matching customer':<30} {no_customer}")
    print(f"  {'No matching product':<30} {no_product}")
    print(sep + "\n")

    return full_data