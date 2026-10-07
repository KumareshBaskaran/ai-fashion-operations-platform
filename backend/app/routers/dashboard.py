from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    InventoryTransaction,
    Product,
    SalesOrder,
    SalesOrderItem,
    Supplier,
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/overview")
def get_dashboard_overview(
    db: Session = Depends(get_db),
):
    # -------------------------
    # Inventory KPIs
    # -------------------------

    total_products = db.scalar(
        select(func.count(Product.id))
    ) or 0

    total_suppliers = db.scalar(
        select(func.count(Supplier.id))
    ) or 0

    total_stock_units = db.scalar(
        select(
            func.coalesce(
                func.sum(Product.stock_quantity),
                0,
            )
        )
    ) or 0

    low_stock_products = db.scalar(
        select(func.count(Product.id))
        .where(
            Product.stock_quantity <= Product.reorder_level
        )
    ) or 0

    out_of_stock_products = db.scalar(
        select(func.count(Product.id))
        .where(Product.stock_quantity == 0)
    ) or 0

    inventory_value = db.scalar(
        select(
            func.coalesce(
                func.sum(
                    Product.stock_quantity
                    * Product.cost_price
                ),
                0,
            )
        )
    ) or 0

    # -------------------------
    # Sales KPIs
    # -------------------------

    fulfilled_orders = db.scalar(
        select(func.count(SalesOrder.id))
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
        .where(
            SalesOrder.status == "fulfilled"
        )
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
        .where(
            SalesOrder.status == "fulfilled"
        )
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
        .where(
            SalesOrder.status == "fulfilled"
        )
    ) or 0

    estimated_gross_profit = (
        total_revenue - estimated_cost
    )

    # -------------------------
    # Recent inventory activity
    # -------------------------

    recent_inventory_result = db.execute(
        select(
            InventoryTransaction,
            Product,
        )
        .join(
            Product,
            InventoryTransaction.product_id == Product.id,
        )
        .order_by(
            InventoryTransaction.created_at.desc()
        )
        .limit(10)
    )

    recent_inventory_transactions = []

    for transaction, product in recent_inventory_result.all():
        recent_inventory_transactions.append(
            {
                "id": transaction.id,
                "product_id": product.id,
                "sku": product.sku,
                "product_name": product.name,
                "transaction_type": transaction.transaction_type,
                "quantity": transaction.quantity,
                "reference": transaction.reference,
                "created_at": transaction.created_at,
            }
        )

    # -------------------------
    # Recent fulfilled sales
    # -------------------------

    recent_sales_result = db.execute(
        select(SalesOrder)
        .where(
            SalesOrder.status == "fulfilled"
        )
        .order_by(
            SalesOrder.fulfilled_at.desc()
        )
        .limit(5)
    )

    recent_sales_orders = []

    for order in recent_sales_result.scalars().all():

        order_revenue = db.scalar(
            select(
                func.coalesce(
                    func.sum(
                        SalesOrderItem.quantity
                        * SalesOrderItem.unit_price
                    ),
                    0,
                )
            )
            .where(
                SalesOrderItem.sales_order_id == order.id
            )
        ) or 0

        recent_sales_orders.append(
            {
                "id": order.id,
                "reference": order.reference,
                "customer_name": order.customer_name,
                "fulfilled_at": order.fulfilled_at,
                "revenue": float(order_revenue),
            }
        )

    return {
        "inventory": {
            "total_products": total_products,
            "total_suppliers": total_suppliers,
            "total_stock_units": total_stock_units,
            "low_stock_products": low_stock_products,
            "out_of_stock_products": out_of_stock_products,
            "inventory_value": float(inventory_value),
        },
        "sales": {
            "fulfilled_orders": fulfilled_orders,
            "total_items_sold": total_items_sold,
            "total_revenue": float(total_revenue),
            "estimated_cost": float(estimated_cost),
            "estimated_gross_profit": float(
                estimated_gross_profit
            ),
        },
        "recent_inventory_transactions":
            recent_inventory_transactions,
        "recent_sales_orders":
            recent_sales_orders,
    }