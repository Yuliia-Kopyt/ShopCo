import json

from sqlalchemy import select

from app.database.database import SessionLocal
from app.models.product import Product, Category


def import_products():

    db = SessionLocal()

    with open(
        "/app/frontend/assets/data/product.json",
        "r",
        encoding="utf-8"
    ) as f:
        products = json.load(f)

    for item in products:

        category_name = item["category"]

        category = db.scalar(
            select(Category).where(
                Category.name == category_name
            )
        )

        if not category:
            category = Category(
                name=category_name
            )

            db.add(category)
            db.commit()
            db.refresh(category)

        existing = db.scalar(
            select(Product).where(
                Product.id == item["id"]
            )
        )

        if existing:
            continue

        product = Product(
            id=item["id"],
            title=item["title"],
            description=item["description"],
            price=item["price"],
            old_price=item["oldPrice"],
            rating=item["rating"],
            image=item["image"],
            style=item["style"],
            colors=item["colors"],
            sizes=item["sizes"],
            in_stock=item["inStock"],
            discount=item["discount"],
            category_id=category.id
        )

        db.add(product)

    db.commit()
    db.close()

    print("Products imported successfully")