"""
clean_data.py — Part 1 Entry Point
------------------------------------
Orchestrates the full data cleaning pipeline.
Run:  python scripts/clean_data.py
      python scripts/clean_data.py --raw_dir data/raw --out_dir data/processed

Submodules:
    cleaning/utils.py      → shared helpers (load, save, parse_dates, email)
    cleaning/customers.py  → customer-specific cleaning steps
    cleaning/orders.py     → orders-specific cleaning steps
"""

import argparse
import logging
import pathlib
import sys

from cleaning.customers import clean_customers
from cleaning.orders import clean_orders
from cleaning.utils import save_csv


# Configure logging to output to console with a simple format
logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

BASE_DIR    = pathlib.Path(__file__).resolve().parent.parent
DEFAULT_RAW = BASE_DIR / "data" / "raw"
DEFAULT_OUT = BASE_DIR / "data" / "processed"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Clean raw CSV data files.")
    parser.add_argument("--raw_dir", type=pathlib.Path, default=DEFAULT_RAW)
    parser.add_argument("--out_dir", type=pathlib.Path, default=DEFAULT_OUT)
    return parser.parse_args()

# The main function orchestrates the cleaning process:
def main():
    args = parse_args()
    args.out_dir.mkdir(parents=True, exist_ok=True)

    logger.info("═" * 55)
    logger.info("  Data Cleaning Pipeline")
    logger.info("  raw_dir : %s", args.raw_dir)
    logger.info("  out_dir : %s", args.out_dir)
    logger.info("═" * 55)

    df_customers = clean_customers(args.raw_dir)
    save_csv(df_customers, args.out_dir / "customers_clean.csv")

    df_orders = clean_orders(args.raw_dir)
    save_csv(df_orders, args.out_dir / "orders_clean.csv")

    logger.info("═" * 55)
    logger.info("  Cleaning complete. Files written to: %s", args.out_dir)
    logger.info("═" * 55)


if __name__ == "__main__":
    main()