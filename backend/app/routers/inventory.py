from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import InventoryTransaction, Product
from app.schemas import (
    InventoryTransactionCreate,
    InventoryTransactionResponse,
)


router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"],
)


ALLOWED_TRANSACTION_TYPES = {
    "purchase",
    "sale",
    "return",
    "damage",
    "adjustment",
}


@router.post(
    "/transactions",
    response_model=InventoryTransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_inventory_transaction(
    transaction_data: InventoryTransactionCreate,
    db: Session = Depends(get_db),
):
    product = db.get(Product, transaction_data.product_id)

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    transaction_type = transaction_data.transaction_type.lower()

    if transaction_type not in ALLOWED_TRANSACTION_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid transaction type",
        )

    if transaction_data.quantity == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity cannot be zero",
        )

    quantity_change = transaction_data.quantity

    if transaction_type in {"sale", "damage"}:
        quantity_change = -abs(transaction_data.quantity)

    elif transaction_type in {"purchase", "return"}:
        quantity_change = abs(transaction_data.quantity)

    new_stock = product.stock_quantity + quantity_change

    if new_stock < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient stock",
        )

    transaction = InventoryTransaction(
        product_id=product.id,
        transaction_type=transaction_type,
        quantity=quantity_change,
        reference=transaction_data.reference,
        notes=transaction_data.notes,
    )

    product.stock_quantity = new_stock

    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return transaction


@router.get(
    "/transactions",
    response_model=list[InventoryTransactionResponse],
)
def list_inventory_transactions(
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(InventoryTransaction)
        .order_by(InventoryTransaction.created_at.desc())
    )

    return result.scalars().all()


@router.get(
    "/product/{product_id}",
    response_model=list[InventoryTransactionResponse],
)
def get_product_inventory_history(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = db.get(Product, product_id)

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    result = db.execute(
        select(InventoryTransaction)
        .where(InventoryTransaction.product_id == product_id)
        .order_by(InventoryTransaction.created_at.desc())
    )

    return result.scalars().all()

@router.get("/low-stock")
def get_low_stock_products(
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Product)
        .where(Product.stock_quantity <= Product.reorder_level)
        .order_by(Product.stock_quantity.asc())
    )

    products = result.scalars().all()

    return [
        {
            "id": product.id,
            "sku": product.sku,
            "name": product.name,
            "stock_quantity": product.stock_quantity,
            "reorder_level": product.reorder_level,
        }
        for product in products
    ]


@router.get("/out-of-stock")
def get_out_of_stock_products(
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Product)
        .where(Product.stock_quantity == 0)
        .order_by(Product.name)
    )

    products = result.scalars().all()

    return [
        {
            "id": product.id,
            "sku": product.sku,
            "name": product.name,
            "stock_quantity": product.stock_quantity,
        }
        for product in products
    ]


@router.get("/summary")
def get_inventory_summary(
    db: Session = Depends(get_db),
):
    total_products = db.scalar(
        select(func.count(Product.id))
    ) or 0

    total_stock_units = db.scalar(
        select(func.coalesce(func.sum(Product.stock_quantity), 0))
    ) or 0

    low_stock_products = db.scalar(
        select(func.count(Product.id))
        .where(Product.stock_quantity <= Product.reorder_level)
    ) or 0

    out_of_stock_products = db.scalar(
        select(func.count(Product.id))
        .where(Product.stock_quantity == 0)
    ) or 0

    inventory_value = db.scalar(
        select(
            func.coalesce(
                func.sum(Product.stock_quantity * Product.cost_price),
                0,
            )
        )
    ) or 0

    return {
        "total_products": total_products,
        "total_stock_units": total_stock_units,
        "low_stock_products": low_stock_products,
        "out_of_stock_products": out_of_stock_products,
        "inventory_value": float(inventory_value),
    }