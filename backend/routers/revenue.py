"""
routers/revenue.py
------------------
GET /api/revenue — monthly revenue trend data.
"""
from fastapi import APIRouter
from backend.config import CSV_FILES
from backend.utils import load_csv_or_404

router = APIRouter()

@router.get("/api/revenue")
def get_revenue():
    """Return monthly completed-order revenue grouped by year-month."""
    return load_csv_or_404(CSV_FILES["revenue"])