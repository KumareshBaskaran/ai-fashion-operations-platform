from app.routers.dashboard import router as dashboard_router
from app.routers.inventory import router as inventory_router
from app.routers.product import router as products_router
from app.routers.purchase_order import router as purchase_orders_router
from app.routers.suppliers import router as suppliers_router
from app.routers.sales_orders import router as sales_orders_router
from app.routers.reports import router as reports_router

__all__ = [
    "dashboard_router",
    "inventory_router",
    "products_router",
    "purchase_orders_router",
    "suppliers_router",
    "sales_orders_router",
    "reports_router",
]