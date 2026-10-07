from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)

    sku: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )

    category: Mapped[str | None] = mapped_column(
        String(100)
    )

    cost_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    selling_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    stock_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    reorder_level: Mapped[int] = mapped_column(
        Integer,
        default=5,
        nullable=False
    )

    supplier_id: Mapped[int | None] = mapped_column(
        ForeignKey("suppliers.id")
    )

    supplier = relationship(
        "Supplier",
        back_populates="products"
    )

    inventory_transactions = relationship(
    "InventoryTransaction",
    back_populates="product",
    cascade="all, delete-orphan",
)