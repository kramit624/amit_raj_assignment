"""
routers/categories.py
---------------------
GET /api/categories — product category performance breakdown.
"""
from fastapi import APIRouter
from backend.config import CSV_FILES
from backend.utils import load_csv_or_404

router = APIRouter()

@router.get("/api/categories")
def get_categories():
    """Return revenue, avg order value, and order count per product category."""
    return load_csv_or_404(CSV_FILES["categories"])