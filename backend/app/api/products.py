from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database.database import get_db

from app.models.product import (
    Product,
    ProductTranslation
)

from app.schemas.product import (
    ProductResponse,
    ProductCreate,
    ProductTranslationBase
)

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


@router.get(
    "/",
    response_model=list[ProductResponse]
)
def get_products(
    db: Session = Depends(get_db)
):
    products = db.scalars(
        select(Product)
    ).all()

    return products


@router.get(
    "/{product_id}",
    response_model=ProductResponse
)
def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = db.get(
        Product,
        product_id
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product

""" @router.post(
    "/",
    response_model=ProductResponse
)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    new_product = Product(
        title=product.title,
        description=product.description,
        price=product.price,
        old_price=product.old_price,
        rating=product.rating,
        image=product.image,
        style=product.style,
        colors=product.colors,
        sizes=product.sizes,
        in_stock=product.in_stock,
        discount=product.discount,
        category_id=product.category_id
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product
     """