from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import (
    InventoryTransaction,
    Product,
    SalesOrder,
    SalesOrderItem,
)
from app.schemas import (
    SalesOrderCreate,
    SalesOrderResponse,
)


router = APIRouter(
    prefix="/sales-orders",
    tags=["Sales Orders"],
)


@router.post(
    "",
    response_model=SalesOrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_sales_order(
    data: SalesOrderCreate,
    db: Session = Depends(get_db),
):
    if not data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sales order must contain at least one item",
        )

    if data.reference:
        existing = db.execute(
            select(SalesOrder).where(
                SalesOrder.reference == data.reference
            )
        ).scalar_one_or_none()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Sales order reference already exists",
            )

    sales_order = SalesOrder(
        customer_name=data.customer_name,
        customer_email=data.customer_email,
        customer_phone=data.customer_phone,
        reference=data.reference,
        status="draft",
    )

    db.add(sales_order)
    db.flush()

    for item_data in data.items:
        if item_data.quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Item quantity must be greater than zero",
            )

        product = db.get(Product, item_data.product_id)

        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item_data.product_id} not found",
            )

        unit_price = (
            item_data.unit_price
            if item_data.unit_price is not None
            else product.selling_price
        )

        if unit_price < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unit price cannot be negative",
            )

        item = SalesOrderItem(
            sales_order_id=sales_order.id,
            product_id=product.id,
            quantity=item_data.quantity,
            unit_price=unit_price,
        )

        db.add(item)

    db.commit()

    result = db.execute(
        select(SalesOrder)
        .options(selectinload(SalesOrder.items))
        .where(SalesOrder.id == sales_order.id)
    )

    return result.scalar_one()


@router.get(
    "",
    response_model=list[SalesOrderResponse],
)
def list_sales_orders(
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(SalesOrder)
        .options(selectinload(SalesOrder.items))
        .order_by(SalesOrder.created_at.desc())
    )

    return result.scalars().all()


@router.get(
    "/{sales_order_id}",
    response_model=SalesOrderResponse,
)
def get_sales_order(
    sales_order_id: int,
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(SalesOrder)
        .options(selectinload(SalesOrder.items))
        .where(SalesOrder.id == sales_order_id)
    )

    sales_order = result.scalar_one_or_none()

    if sales_order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales order not found",
        )

    return sales_order
@router.post(
    "/{sales_order_id}/fulfill",
    response_model=SalesOrderResponse,
)
def fulfill_sales_order(
    sales_order_id: int,
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(SalesOrder)
        .options(selectinload(SalesOrder.items))
        .where(SalesOrder.id == sales_order_id)
    )

    sales_order = result.scalar_one_or_none()

    if sales_order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales order not found",
        )

    if sales_order.status == "fulfilled":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Sales order already fulfilled",
        )

    # Validate all stock first.
    for item in sales_order.items:
        product = db.get(Product, item.product_id)

        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item.product_id} not found",
            )

        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock for {product.sku}. "
                    f"Available: {product.stock_quantity}, "
                    f"required: {item.quantity}"
                ),
            )

    # Deduct stock only after every item passes validation.
    for item in sales_order.items:
        product = db.get(Product, item.product_id)

        product.stock_quantity -= item.quantity

        transaction = InventoryTransaction(
            product_id=product.id,
            transaction_type="sale",
            quantity=-item.quantity,
            reference=sales_order.reference
            or f"SO-{sales_order.id}",
            notes=f"Fulfilled from sales order {sales_order.id}",
        )

        db.add(transaction)

    sales_order.status = "fulfilled"
    sales_order.fulfilled_at = datetime.utcnow()

    db.commit()

    result = db.execute(
        select(SalesOrder)
        .options(selectinload(SalesOrder.items))
        .where(SalesOrder.id == sales_order.id)
    )

    return result.scalar_one()