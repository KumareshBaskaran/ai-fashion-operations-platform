from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class SalesOrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: Decimal | None = None


class SalesOrderCreate(BaseModel):
    customer_name: str
    customer_email: str | None = None
    customer_phone: str | None = None
    reference: str | None = None
    items: list[SalesOrderItemCreate]


class SalesOrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal

    model_config = ConfigDict(from_attributes=True)


class SalesOrderResponse(BaseModel):
    id: int
    customer_name: str
    customer_email: str | None
    customer_phone: str | None
    status: str
    reference: str | None
    created_at: datetime
    fulfilled_at: datetime | None
    items: list[SalesOrderItemResponse]

    model_config = ConfigDict(from_attributes=True)