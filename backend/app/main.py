from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import products_router, suppliers_router, inventory_router, dashboard_router, purchase_orders_router, sales_orders_router, reports_router
from app.core.config import settings

app = FastAPI(
    title="Fashion AI Operations Platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        settings.frontend_url,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(suppliers_router)
app.include_router(products_router)
app.include_router(inventory_router)
app.include_router(dashboard_router)
app.include_router(purchase_orders_router)
app.include_router(sales_orders_router)
app.include_router(reports_router)

@app.get("/")
def root():
    return {
        "status": "ok",
        "application": "Fashion AI Operations Platform",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }