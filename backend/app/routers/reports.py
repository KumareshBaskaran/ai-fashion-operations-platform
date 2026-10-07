from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Product, SalesOrder, SalesOrderItem


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


@router.get("/sales-summary")
def get_sales_summary(
    db: Session = Depends(get_db),
):
    fulfilled_orders = db.scalar(
        select(func.count(SalesOrder.id))
        .where(SalesOrder.status == "fulfilled")
    ) or 0

    total_revenue = db.scalar(
        select(
            func.coalesce(
                func.sum(
                    SalesOrderItem.quantity
                    * SalesOrderItem.unit_price
                ),
                0,
            )
        )
        .join(
            SalesOrder,
            SalesOrderItem.sales_order_id == SalesOrder.id,
        )
        .where(SalesOrder.status == "fulfilled")
    ) or 0

    total_items_sold = db.scalar(
        select(
            func.coalesce(
                func.sum(SalesOrderItem.quantity),
                0,
            )
        )
        .join(
            SalesOrder,
            SalesOrderItem.sales_order_id == SalesOrder.id,
        )
        .where(SalesOrder.status == "fulfilled")
    ) or 0

    estimated_cost = db.scalar(
        select(
            func.coalesce(
                func.sum(
                    SalesOrderItem.quantity
                    * Product.cost_price
                ),
                0,
            )
        )
        .join(
            SalesOrder,
            SalesOrderItem.sales_order_id == SalesOrder.id,
        )
        .join(
            Product,
            SalesOrderItem.product_id == Product.id,
        )
        .where(SalesOrder.status == "fulfilled")
    ) or 0

    gross_profit = total_revenue - estimated_cost

    return {
        "fulfilled_orders": fulfilled_orders,
        "total_items_sold": total_items_sold,
        "total_revenue": float(total_revenue),
        "estimated_cost": float(estimated_cost),
        "estimated_gross_profit": float(gross_profit),
    }
@router.get("/top-products")
def get_top_products(
    limit: int = 10,
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(
            Product.id,
            Product.sku,
            Product.name,
            func.sum(SalesOrderItem.quantity).label(
                "units_sold"
            ),
            func.sum(
                SalesOrderItem.quantity
                * SalesOrderItem.unit_price
            ).label("revenue"),
        )
        .join(
            SalesOrderItem,
            SalesOrderItem.product_id == Product.id,
        )
        .join(
            SalesOrder,
            SalesOrderItem.sales_order_id == SalesOrder.id,
        )
        .where(SalesOrder.status == "fulfilled")
        .group_by(
            Product.id,
            Product.sku,
            Product.name,
        )
        .order_by(
            func.sum(SalesOrderItem.quantity).desc()
        )
        .limit(limit)
    )

    return [
        {
            "product_id": row.id,
            "sku": row.sku,
            "name": row.name,
            "units_sold": row.units_sold,
            "revenue": float(row.revenue),
        }
        for row in result.all()
    ]

@router.get("/daily-sales")
def get_daily_sales(
    db: Session = Depends(get_db),
):
    sales_date = func.date(
        SalesOrder.fulfilled_at
    )

    result = db.execute(
        select(
            sales_date.label("date"),
            func.count(
                func.distinct(SalesOrder.id)
            ).label("orders"),
            func.sum(
                SalesOrderItem.quantity
            ).label("items_sold"),
            func.sum(
                SalesOrderItem.quantity
                * SalesOrderItem.unit_price
            ).label("revenue"),
        )
        .join(
            SalesOrderItem,
            SalesOrderItem.sales_order_id == SalesOrder.id,
        )
        .where(
            SalesOrder.status == "fulfilled",
            SalesOrder.fulfilled_at.is_not(None),
        )
        .group_by(sales_date)
        .order_by(sales_date)
    )

    return [
        {
            "date": row.date,
            "orders": row.orders,
            "items_sold": row.items_sold,
            "revenue": float(row.revenue),
        }
        for row in result.all()
    ]