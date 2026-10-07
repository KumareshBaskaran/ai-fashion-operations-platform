from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SalesOrder(Base):
    __tablename__ = "sales_orders"

    id: Mapped[int] = mapped_column(primary_key=True)

    customer_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    customer_email: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    customer_phone: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="draft",
        nullable=False,
    )

    reference: Mapped[str | None] = mapped_column(
        String(100),
        unique=True,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    fulfilled_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    items = relationship(
        "SalesOrderItem",
        back_populates="sales_order",
        cascade="all, delete-orphan",
    )


class SalesOrderItem(Base):
    __tablename__ = "sales_order_items"

    id: Mapped[int] = mapped_column(primary_key=True)

    sales_order_id: Mapped[int] = mapped_column(
        ForeignKey("sales_orders.id"),
        nullable=False,
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id"),
        nullable=False,
    )

    quantity: Mapped[int] = mapped_column(
        nullable=False,
    )

    unit_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    sales_order = relationship(
        "SalesOrder",
        back_populates="items",
    )

    product = relationship("Product")