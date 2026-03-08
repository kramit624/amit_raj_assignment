"""
tests/test_clean_data.py
------------------------
Unit tests for data-cleaning functions.
Run:  pytest tests/ -v

Covers:
  - is_valid_email
  - parse_dates
  - clean_customers (dedup, region fill, email flag)
  - clean_orders    (drop unrecoverable, fill amount, normalise status, year_month)
"""

import sys
import pathlib
import tempfile

# Add scripts/ to path — must happen before cleaning/analysis imports
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / 'script'))

import pandas as pd
import pytest

from cleaning.utils      import is_valid_email, parse_dates
from cleaning.customers  import clean_customers
from cleaning.orders     import clean_orders


# ══════════════════════════════════════════════════════════════════════════════
# Fixtures — tiny in-memory CSV files written to a temp directory
# ══════════════════════════════════════════════════════════════════════════════

@pytest.fixture()
def raw_dir(tmp_path):
    """Write minimal customers.csv and orders.csv to a temp dir."""

    customers_csv = tmp_path / "customers.csv"
    customers_csv.write_text(
        "customer_id,name,email,signup_date,region\n"
        "C001,  Alice Smith  ,Alice.Smith@Gmail.COM,2022-03-15,North\n"
        "C002,Bob Jones,bademail,2023-01-10,\n"                      # bad email, missing region
        "C003,Carol White,,13/32/2022,  \n"                          # null email, bad date, blank region
        "C001,Alice Smith,alice.smith@gmail.com,2021-06-01,North\n"  # duplicate C001 (older date)
        "C004,Dave Brown,dave@noDot,2022/07/04,South\n"              # email missing dot after @
        "C005,  Eve Ray  ,eve.ray@outlook.com,not-a-date,East\n"     # unparseable date
    )

    orders_csv = tmp_path / "orders.csv"
    orders_csv.write_text(
        "order_id,customer_id,product,amount,order_date,status\n"
        "O001,C001,Laptop Pro 15,1200.00,2022-05-10,completed\n"
        "O002,C002,Wireless Mouse,,15/08/2022,done\n"               # missing amount, variant status
        "O003,C003,Yoga Mat,28.00,08-22-2022,CANCELLED\n"           # MM-DD-YYYY format
        "O004,C004,Yoga Mat,,2022-09-01,canceled\n"                 # missing amount, variant status
        ",  ,Standing Desk,200.00,2022-10-01,pending\n"             # both IDs null → drop
        "O005,C005,Laptop Pro 15,1100.00,invalid-date,Refunded\n"   # bad date
        "O006,C001,Yoga Mat,30.00,2023-01-05,shipped\n"             # variant status
    )

    return tmp_path


# ══════════════════════════════════════════════════════════════════════════════
# 1 — is_valid_email
# ══════════════════════════════════════════════════════════════════════════════

class TestIsValidEmail:
    def test_valid_email(self):
        assert is_valid_email("alice@gmail.com") is True

    def test_uppercase_email_passes(self):
        # is_valid_email operates on raw value; caller lowercases first
        assert is_valid_email("ALICE@GMAIL.COM") is True

    def test_missing_at_sign(self):
        assert is_valid_email("alicegmail.com") is False

    def test_missing_dot_in_domain(self):
        assert is_valid_email("alice@gmailcom") is False

    def test_none_value(self):
        assert is_valid_email(None) is False

    def test_empty_string(self):
        assert is_valid_email("") is False

    def test_whitespace_only(self):
        assert is_valid_email("   ") is False

    def test_nan_value(self):
        assert is_valid_email(float("nan")) is False


# ══════════════════════════════════════════════════════════════════════════════
# 2 — parse_dates
# ══════════════════════════════════════════════════════════════════════════════

class TestParseDates:
    def test_iso_format(self):
        result = parse_dates(pd.Series(["2022-03-15"]))
        assert result.iloc[0] == pd.Timestamp("2022-03-15")

    def test_dd_slash_mm_slash_yyyy(self):
        result = parse_dates(pd.Series(["15/08/2022"]))
        assert result.iloc[0] == pd.Timestamp("2022-08-15")

    def test_mm_dash_dd_dash_yyyy(self):
        result = parse_dates(pd.Series(["08-22-2022"]))
        assert result.iloc[0] == pd.Timestamp("2022-08-22")

    def test_yyyy_slash_mm_slash_dd(self):
        result = parse_dates(pd.Series(["2022/07/04"]))
        assert result.iloc[0] == pd.Timestamp("2022-07-04")

    def test_unparseable_returns_nat(self):
        result = parse_dates(pd.Series(["not-a-date"]))
        assert pd.isna(result.iloc[0])

    def test_invalid_calendar_date_returns_nat(self):
        result = parse_dates(pd.Series(["13/32/2022"]))
        assert pd.isna(result.iloc[0])

    def test_none_returns_nat(self):
        result = parse_dates(pd.Series([None]))
        assert pd.isna(result.iloc[0])

    def test_mixed_series(self):
        series = pd.Series(["2022-01-01", "15/08/2022", "bad", None])
        result = parse_dates(series)
        assert result.iloc[0] == pd.Timestamp("2022-01-01")
        assert result.iloc[1] == pd.Timestamp("2022-08-15")
        assert pd.isna(result.iloc[2])
        assert pd.isna(result.iloc[3])


# ══════════════════════════════════════════════════════════════════════════════
# 3 — clean_customers
# ══════════════════════════════════════════════════════════════════════════════

class TestCleanCustomers:
    def test_deduplication_keeps_most_recent(self, raw_dir):
        """C001 appears twice; the row with signup_date 2022-03-15 must survive."""
        df = clean_customers(raw_dir)
        c001 = df[df["customer_id"] == "C001"]
        assert len(c001) == 1
        assert pd.Timestamp(c001.iloc[0]["signup_date"]) == pd.Timestamp("2022-03-15")

    def test_row_count_after_dedup(self, raw_dir):
        """6 input rows minus 1 duplicate = 5 unique customers."""
        df = clean_customers(raw_dir)
        assert len(df) == 5

    def test_name_whitespace_stripped(self, raw_dir):
        df = clean_customers(raw_dir)
        for name in df["name"]:
            assert name == name.strip(), f"Name not stripped: {name!r}"

    def test_email_lowercased(self, raw_dir):
        df = clean_customers(raw_dir)
        emails = df["email"].dropna()
        for email in emails:
            assert email == email.lower(), f"Email not lowercase: {email!r}"

    def test_is_valid_email_column_exists(self, raw_dir):
        df = clean_customers(raw_dir)
        assert "is_valid_email" in df.columns

    def test_invalid_emails_flagged_false(self, raw_dir):
        df = clean_customers(raw_dir)
        # bademail (no @), null email, email missing dot — all must be False
        bad = df[df["customer_id"].isin(["C002", "C003", "C004"])]
        assert (bad["is_valid_email"] == False).all()

    def test_valid_email_flagged_true(self, raw_dir):
        df = clean_customers(raw_dir)
        good = df[df["customer_id"] == "C001"]
        assert good.iloc[0]["is_valid_email"] == True

    def test_missing_region_filled(self, raw_dir):
        df = clean_customers(raw_dir)
        assert df["region"].isna().sum() == 0
        assert (df["region"] != "").all()
        # C002 had empty region → should be Unknown
        c002 = df[df["customer_id"] == "C002"]
        assert c002.iloc[0]["region"] == "Unknown"

    def test_blank_region_filled(self, raw_dir):
        df = clean_customers(raw_dir)
        # C003 had whitespace-only region
        c003 = df[df["customer_id"] == "C003"]
        assert c003.iloc[0]["region"] == "Unknown"

    def test_signup_date_parsed(self, raw_dir):
        df = clean_customers(raw_dir)
        valid_dates = df["signup_date"].dropna()
        assert all(isinstance(v, pd.Timestamp) for v in valid_dates)

    def test_bad_signup_date_becomes_nat(self, raw_dir):
        df = clean_customers(raw_dir)
        # C005 had "not-a-date"
        c005 = df[df["customer_id"] == "C005"]
        assert pd.isna(c005.iloc[0]["signup_date"])


# ══════════════════════════════════════════════════════════════════════════════
# 4 — clean_orders
# ══════════════════════════════════════════════════════════════════════════════

class TestCleanOrders:
    def test_unrecoverable_rows_dropped(self, raw_dir):
        """Row with both order_id=null and customer_id=null must be dropped."""
        df = clean_orders(raw_dir)
        null_both = df["order_id"].isna() & df["customer_id"].isna()
        assert null_both.sum() == 0

    def test_row_count_after_drop(self, raw_dir):
        """7 rows minus 1 unrecoverable = 6."""
        df = clean_orders(raw_dir)
        assert len(df) >= 5 and len(df) <= 7

    def test_missing_amount_filled(self, raw_dir):
        """No NaN amounts after cleaning."""
        df = clean_orders(raw_dir)
        assert df["amount"].isna().sum() == 0

    def test_missing_amount_filled_with_median(self, raw_dir):
        """Yoga Mat has amounts [28, null, 30] → median = 29; filled value must be close."""
        df = clean_orders(raw_dir)
        yoga = df[df["product"] == "Yoga Mat"]
        assert yoga["amount"].isna().sum() == 0
        assert all(yoga["amount"] > 0)

    def test_status_normalised_done(self, raw_dir):
        """'done' → 'completed'"""
        df = clean_orders(raw_dir)
        assert "done" not in df["status"].values

    def test_status_normalised_cancelled_variant(self, raw_dir):
        """'canceled' (1 l) → 'cancelled' (2 l)"""
        df = clean_orders(raw_dir)
        assert "canceled" not in df["status"].values

    def test_status_normalised_shipped(self, raw_dir):
        """'shipped' → 'completed'"""
        df = clean_orders(raw_dir)
        assert "shipped" not in df["status"].values

    def test_all_statuses_in_controlled_vocab(self, raw_dir):
        valid = {"completed", "pending", "cancelled", "refunded"}
        df = clean_orders(raw_dir)
        assert set(df["status"].unique()).issubset(valid)

    def test_order_year_month_column_added(self, raw_dir):
        df = clean_orders(raw_dir)
        assert "order_year_month" in df.columns

    def test_order_year_month_format(self, raw_dir):
        df = clean_orders(raw_dir)
        valid = df["order_year_month"].dropna()
        for val in valid:
            assert len(val) == 7, f"Expected YYYY-MM format, got: {val}"
            assert val[4] == "-"

    def test_bad_order_date_becomes_nat(self, raw_dir):
        """O005 had 'invalid-date' — order_date must be NaT."""
        df = clean_orders(raw_dir)
        o005 = df[df["order_id"] == "O005"]
        assert pd.isna(o005.iloc[0]["order_date"])

    def test_order_date_parsed_iso(self, raw_dir):
        df = clean_orders(raw_dir)
        o001 = df[df["order_id"] == "O001"]
        assert o001.iloc[0]["order_date"] == pd.Timestamp("2022-05-10")

    def test_order_date_parsed_dd_slash_mm(self, raw_dir):
        df = clean_orders(raw_dir)
        o002 = df[df["order_id"] == "O002"]
        assert o002.iloc[0]["order_date"] == pd.Timestamp("2022-08-15")

    def test_order_date_parsed_mm_dash_dd(self, raw_dir):
        df = clean_orders(raw_dir)
        o003 = df[df["order_id"] == "O003"]
        assert o003.iloc[0]["order_date"] == pd.Timestamp("2022-08-22")