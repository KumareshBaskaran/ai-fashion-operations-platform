from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ProductBase(BaseModel):
    sku: str
    name: str
    category: str | None = None
    cost_price: Decimal
    selling_price: Decimal
    stock_quantity: int = 0
    reorder_level: int = 5
    supplier_id: int | None = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    sku: str | None = None
    name: str | None = None
    category: str | None = None
    cost_price: Decimal | None = None
    selling_price: Decimal | None = None
    reorder_level: int | None = None
    supplier_id: int | None = None


class ProductResponse(ProductBase):
    id: int

    model_config = ConfigDict(from_attributes=True)