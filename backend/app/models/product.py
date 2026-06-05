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

    translations: Mapped[list["ProductTranslation"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan"
    )


class ProductTranslation(Base):
    __tablename__ = "product_translations"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id")
    )

    language: Mapped[str] = mapped_column(
        String(10),
        nullable=False
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    details: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    product: Mapped["Product"] = relationship(
        back_populates="translations"
    )