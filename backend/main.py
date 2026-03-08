"""
backend/main.py
---------------
FastAPI application entry point.
Registers all routers and CORS middleware — no business logic here.

Run:
    uvicorn backend.main:app --reload
    uvicorn backend.main:app --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import (
    revenue_router,
    customers_router,
    categories_router,
    regions_router,
)

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Sales Dashboard API",
    description="Serves processed CSV data to the frontend dashboard.",
    version="1.0.0",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
# Allow the React dev server (port 5173) and any localhost port to call the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost", "https://amit-raj-assignment.vercel.app"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# ─── Health check ─────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    """Quick liveness check — returns 200 when the server is up."""
    return {"status": "ok"}


# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(revenue_router)
app.include_router(customers_router)
app.include_router(categories_router)
app.include_router(regions_router)
