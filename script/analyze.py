"""
analyze.py — Part 2 Entry Point
---------------------------------
Merges cleaned data and runs all business analysis tasks.
Run:  python scripts/analyze.py
      python scripts/analyze.py --processed_dir data/processed --raw_dir data/raw

Submodules:
    analysis/merge.py       → joins customers + orders + products
    analysis/revenue.py     → Task 1: monthly revenue trend
    analysis/customers.py   → Task 2: top 10 customers + churn flag
    analysis/categories.py  → Task 3: category performance
    analysis/regions.py     → Task 4: regional analysis
"""

import argparse
import logging
import pathlib
import sys


from analysis.merge import merge_datasets
from analysis.revenue import monthly_revenue
from analysis.customers import top_customers
from analysis.categories import category_performance
from analysis.regions import regional_analysis

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

BASE_DIR           = pathlib.Path(__file__).resolve().parent.parent
DEFAULT_PROCESSED  = BASE_DIR / "data" / "processed"
DEFAULT_RAW        = BASE_DIR / "data" / "raw"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Merge and analyse cleaned data.")
    parser.add_argument("--processed_dir", type=pathlib.Path, default=DEFAULT_PROCESSED)
    parser.add_argument("--raw_dir",       type=pathlib.Path, default=DEFAULT_RAW)
    return parser.parse_args()


def main():
    args = parse_args()
    args.processed_dir.mkdir(parents=True, exist_ok=True)

    logger.info("═" * 55)
    logger.info("  Analysis Pipeline")
    logger.info("  processed_dir : %s", args.processed_dir)
    logger.info("═" * 55)

    full_data = merge_datasets(args.processed_dir, args.raw_dir)

    monthly_revenue(full_data,      args.processed_dir)
    top_customers(full_data,        args.processed_dir)
    category_performance(full_data, args.processed_dir)
    regional_analysis(full_data,    args.processed_dir)

    logger.info("═" * 55)
    logger.info("  Analysis complete. Output → %s", args.processed_dir)
    logger.info("═" * 55)


if __name__ == "__main__":
    main()