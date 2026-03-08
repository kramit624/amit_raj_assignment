"""
routers/customers.py
--------------------
GET /api/top-customers — top 10 customers by spend + churn flag.
"""
from fastapi import APIRouter
from backend.config import CSV_FILES
from backend.utils import load_csv_or_404

router = APIRouter()

@router.get("/api/top-customers")
def get_top_customers():
    """Return the top 10 customers by total completed-order spend."""
    return load_csv_or_404(CSV_FILES["customers"])