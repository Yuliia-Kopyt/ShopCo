import json
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.product import (
    Product,
    ProductTranslation,
    Category
)

from app.models.translations import (
    CategoryTranslation,
    StyleTranslation,
    ColorTranslation,
    SizeTranslation
)

def load_json():
    with open("/app/frontend/assets/data/product.json", encoding="utf-8") as f:
        products = json.load(f)

    with open("/app/frontend/assets/data/producttranslation.json", encoding="utf-8") as f:
        translations = json.load(f)

    return products, translations


def get_category_id(db: Session, category_name: str):

    category = db.query(Category).filter(
        Category.name == category_name
    ).first()

    if category:
        return category.id

    new_category = Category(
        name=category_name
    )

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return new_category.id

def seed_translations(db, translations_data):

    for lang in ["en", "uk"]:

        # categories
        for key, value in translations_data[lang]["categories"].items():
            db.add(
                CategoryTranslation(
                    category_key=key,
                    language=lang,
                    value=value
                )
            )

        # styles
        for key, value in translations_data[lang]["styles"].items():
            db.add(
                StyleTranslation(
                    style_key=key,
                    language=lang,
                    value=value
                )
            )

        # colors
        for key, value in translations_data[lang]["colors"].items():
            db.add(
                ColorTranslation(
                    color_key=key,
                    language=lang,
                    value=value
                )
            )

        # sizes
        for key, value in translations_data[lang]["sizes"].items():
            db.add(
                SizeTranslation(
                    size_key=key,
                    language=lang,
                    value=value
                )
            )

def run_seed():
    db = SessionLocal()

    products_data, translations_data = load_json()

    for p in products_data:

        category_id = get_category_id(db, p["category"])

        if not category_id:
            print(f"⚠️ Category not found: {p['category']}")
            continue

        # create product
        product = Product(
            id=p["id"],
            price=p["price"],
            old_price=p.get("oldPrice"),
            category_id=category_id,
            image=p["image"],
            rating=p["rating"],
            colors=p["colors"],
            sizes=p["sizes"],
            style=p["style"],
            in_stock=p["inStock"],
            discount=p.get("discount")
        )

        db.add(product)
        db.flush()

        # translations
        en = translations_data["en"]["products"][str(p["id"])]
        uk = translations_data["uk"]["products"][str(p["id"])]

        db.add(ProductTranslation(
            product_id=product.id,
            language="en",
            title=en["title"],
            description=en["description"],
            details=en["details"]
        ))

        db.add(ProductTranslation(
            product_id=product.id,
            language="uk",
            title=uk["title"],
            description=uk["description"],
            details=uk["details"]
        ))

    seed_translations(
    db,
    translations_data
    )
    db.commit()
    db.close()

    print("✅ Seed completed successfully!")


if __name__ == "__main__":
    run_seed()