from sqlalchemy import (
    String,
    ForeignKey
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column
)

from app.database.base import Base


class CategoryTranslation(Base):
    __tablename__ = "category_translations"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    category_key: Mapped[str] = mapped_column(
        String(100)
    )

    language: Mapped[str] = mapped_column(
        String(10)
    )

    value: Mapped[str] = mapped_column(
        String(100)
    )


class StyleTranslation(Base):
    __tablename__ = "style_translations"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    style_key: Mapped[str] = mapped_column(
        String(100)
    )

    language: Mapped[str] = mapped_column(
        String(10)
    )

    value: Mapped[str] = mapped_column(
        String(100)
    )


class ColorTranslation(Base):
    __tablename__ = "color_translations"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    color_key: Mapped[str] = mapped_column(
        String(100)
    )

    language: Mapped[str] = mapped_column(
        String(10)
    )

    value: Mapped[str] = mapped_column(
        String(100)
    )


class SizeTranslation(Base):
    __tablename__ = "size_translations"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    size_key: Mapped[str] = mapped_column(
        String(50)
    )

    language: Mapped[str] = mapped_column(
        String(10)
    )

    value: Mapped[str] = mapped_column(
        String(50)
    )