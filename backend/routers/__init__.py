"""routers — one module per API endpoint."""
from backend.routers.revenue    import router as revenue_router
from backend.routers.customers  import router as customers_router
from backend.routers.categories import router as categories_router
from backend.routers.regions    import router as regions_router

__all__ = [
    "revenue_router",
    "customers_router",
    "categories_router",
    "regions_router",
]