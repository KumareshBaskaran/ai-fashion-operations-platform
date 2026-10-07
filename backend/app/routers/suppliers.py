from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Supplier
from app.schemas import SupplierCreate, SupplierResponse, SupplierUpdate


router = APIRouter(
    prefix="/suppliers",
    tags=["Suppliers"],
)


@router.post(
    "",
    response_model=SupplierResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_supplier(
    supplier_data: SupplierCreate,
    db: Session = Depends(get_db),
):
    supplier = Supplier(
        name=supplier_data.name,
        email=supplier_data.email,
        phone=supplier_data.phone,
    )

    db.add(supplier)
    db.commit()
    db.refresh(supplier)

    return supplier


@router.get(
    "",
    response_model=list[SupplierResponse],
)
def list_suppliers(
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Supplier).order_by(Supplier.id)
    )

    return result.scalars().all()


@router.get(
    "/{supplier_id}",
    response_model=SupplierResponse,
)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
):
    supplier = db.get(Supplier, supplier_id)

    if supplier is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found",
        )

    return supplier


@router.patch(
    "/{supplier_id}",
    response_model=SupplierResponse,
)
def update_supplier(
    supplier_id: int,
    supplier_data: SupplierUpdate,
    db: Session = Depends(get_db),
):
    supplier = db.get(Supplier, supplier_id)

    if supplier is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found",
        )

    update_data = supplier_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(supplier, field, value)

    db.commit()
    db.refresh(supplier)

    return supplier


@router.delete(
    "/{supplier_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
):
    supplier = db.get(Supplier, supplier_id)

    if supplier is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found",
        )

    db.delete(supplier)
    db.commit()