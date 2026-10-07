from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import (
    InventoryTransaction,
    Product,
    PurchaseOrder,
    PurchaseOrderItem,
    Supplier,
)
from app.schemas import (
    PurchaseOrderCreate,
    PurchaseOrderResponse,
)


router = APIRouter(
    prefix="/purchase-orders",
    tags=["Purchase Orders"],
)


@router.post(
    "",
    response_model=PurchaseOrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_purchase_order(
    data: PurchaseOrderCreate,
    db: Session = Depends(get_db),
):
    supplier = db.get(Supplier, data.supplier_id)

    if supplier is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found",
        )

    if not data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Purchase order must contain at least one item",
        )

    if data.reference:
        existing = db.execute(
            select(PurchaseOrder).where(
                PurchaseOrder.reference == data.reference
            )
        ).scalar_one_or_none()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Purchase order reference already exists",
            )

    purchase_order = PurchaseOrder(
        supplier_id=data.supplier_id,
        reference=data.reference,
        status="draft",
    )

    db.add(purchase_order)
    db.flush()

    for item_data in data.items:
        if item_data.quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Item quantity must be greater than zero",
            )

        if item_data.unit_cost < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unit cost cannot be negative",
            )

        product = db.get(Product, item_data.product_id)

        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item_data.product_id} not found",
            )

        item = PurchaseOrderItem(
            purchase_order_id=purchase_order.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity,
            unit_cost=item_data.unit_cost,
        )

        db.add(item)

    db.commit()

    result = db.execute(
        select(PurchaseOrder)
        .options(selectinload(PurchaseOrder.items))
        .where(PurchaseOrder.id == purchase_order.id)
    )

    return result.scalar_one()


@router.get(
    "",
    response_model=list[PurchaseOrderResponse],
)
def list_purchase_orders(
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(PurchaseOrder)
        .options(selectinload(PurchaseOrder.items))
        .order_by(PurchaseOrder.created_at.desc())
    )

    return result.scalars().all()


@router.get(
    "/{purchase_order_id}",
    response_model=PurchaseOrderResponse,
)
def get_purchase_order(
    purchase_order_id: int,
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(PurchaseOrder)
        .options(selectinload(PurchaseOrder.items))
        .where(PurchaseOrder.id == purchase_order_id)
    )

    purchase_order = result.scalar_one_or_none()

    if purchase_order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase order not found",
        )

    return purchase_order


@router.post(
    "/{purchase_order_id}/receive",
    response_model=PurchaseOrderResponse,
)
def receive_purchase_order(
    purchase_order_id: int,
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(PurchaseOrder)
        .options(selectinload(PurchaseOrder.items))
        .where(PurchaseOrder.id == purchase_order_id)
    )

    purchase_order = result.scalar_one_or_none()

    if purchase_order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase order not found",
        )

    if purchase_order.status == "received":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Purchase order already received",
        )

    for item in purchase_order.items:
        product = db.get(Product, item.product_id)

        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item.product_id} not found",
            )

        product.stock_quantity += item.quantity

        transaction = InventoryTransaction(
            product_id=product.id,
            transaction_type="purchase",
            quantity=item.quantity,
            reference=purchase_order.reference
            or f"PO-{purchase_order.id}",
            notes=f"Received from purchase order {purchase_order.id}",
        )

        db.add(transaction)

    purchase_order.status = "received"
    purchase_order.received_at = datetime.utcnow()

    db.commit()

    result = db.execute(
        select(PurchaseOrder)
        .options(selectinload(PurchaseOrder.items))
        .where(PurchaseOrder.id == purchase_order.id)
    )

    return result.scalar_one()