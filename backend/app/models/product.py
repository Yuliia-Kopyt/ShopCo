from sqlalchemy import (
    String,
    Float,
    Integer,
    Boolean,
    ForeignKey,
    Text
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship
)

from app.database.base import Base


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False
    )

    products: Mapped[list["Product"]] = relationship(
        back_populates="category"
    )


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    price: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    old_price: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    rating: Mapped[float] = mapped_column(
        Float,
        default=0
    )

    image: Mapped[str] = mapped_column(
        String(500)
    )

    style: Mapped[str] = mapped_column(
        String(100)
    )

    colors: Mapped[list[str]] = mapped_column(
        ARRAY(String)
    )

    sizes: Mapped[list[str]] = mapped_column(
        ARRAY(String)
    )

    in_stock: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    discount: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id")
    )

    category: Mapped["Category"] = relationship(
        back_populates="products"
    )