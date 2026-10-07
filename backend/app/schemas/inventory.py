from datetime import datetime

from pydantic import BaseModel, ConfigDict


class InventoryTransactionCreate(BaseModel):
    product_id: int
    transaction_type: str
    quantity: int
    reference: str | None = None
    notes: str | None = None


class InventoryTransactionResponse(BaseModel):
    id: int
    product_id: int
    transaction_type: str
    quantity: int
    reference: str | None
    notes: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)