import json

from app.database.database import SessionLocal

from app.models.translations import (
    CategoryTranslation,
    StyleTranslation,
    ColorTranslation,
    SizeTranslation
)


def load_translations():

    with open(
        "/app/frontend/assets/data/producttranslation.json",
        encoding="utf-8"
    ) as f:
        return json.load(f)


def seed_category_translations(db, data):

    for language in ["en", "uk"]:

        categories = data[language]["categories"]

        for key, value in categories.items():

            db.add(
                CategoryTranslation(
                    category_key=key,
                    language=language,
                    value=value
                )
            )


def seed_style_translations(db, data):

    for language in ["en", "uk"]:

        styles = data[language]["styles"]

        for key, value in styles.items():

            db.add(
                StyleTranslation(
                    style_key=key,
                    language=language,
                    value=value
                )
            )


def seed_color_translations(db, data):

    for language in ["en", "uk"]:

        colors = data[language]["colors"]

        for key, value in colors.items():

            db.add(
                ColorTranslation(
                    color_key=key,
                    language=language,
                    value=value
                )
            )


def seed_size_translations(db, data):

    for language in ["en", "uk"]:

        sizes = data[language]["sizes"]

        for key, value in sizes.items():

            db.add(
                SizeTranslation(
                    size_key=key,
                    language=language,
                    value=value
                )
            )

def clear_translation_tables(db):

    db.query(CategoryTranslation).delete()
    db.query(StyleTranslation).delete()
    db.query(ColorTranslation).delete()
    db.query(SizeTranslation).delete()

def run():

    db = SessionLocal()

    try:

        clear_translation_tables(db)

        data = load_translations()

        seed_category_translations(db, data)
        seed_style_translations(db, data)
        seed_color_translations(db, data)
        seed_size_translations(db, data)

        db.commit()

        print("✅ Translations imported successfully")

    except Exception as e:

        db.rollback()

        print(f"❌ Error: {e}")

    finally:

        db.close()


if __name__ == "__main__":
    run()