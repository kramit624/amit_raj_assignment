"""
routers/regions.py
------------------
GET /api/regions — regional KPI summary.
"""
from fastapi import APIRouter
from backend.config import CSV_FILES
from backend.utils import load_csv_or_404

router = APIRouter()

@router.get("/api/regions")
def get_regions():
    """Return customer count, orders, revenue, and avg revenue per region."""
    return load_csv_or_404(CSV_FILES["regions"])