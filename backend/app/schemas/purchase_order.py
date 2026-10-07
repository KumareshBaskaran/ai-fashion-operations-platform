from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class PurchaseOrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_cost: Decimal


class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    reference: str | None = None
    items: list[PurchaseOrderItemCreate]


class PurchaseOrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_cost: Decimal

    model_config = ConfigDict(from_attributes=True)


class PurchaseOrderResponse(BaseModel):
    id: int
    supplier_id: int
    status: str
    reference: str | None
    created_at: datetime
    received_at: datetime | None
    items: list[PurchaseOrderItemResponse]

    model_config = ConfigDict(from_attributes=True)