from pydantic import BaseModel, ConfigDict


class SupplierBase(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None


class SupplierResponse(SupplierBase):
    id: int

    model_config = ConfigDict(from_attributes=True)