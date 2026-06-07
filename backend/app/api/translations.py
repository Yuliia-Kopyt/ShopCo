from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.translations import (
    CategoryTranslation,
    StyleTranslation,
    ColorTranslation,
    SizeTranslation
)

from app.schemas.translations import (
    TranslationResponse,
    TranslationItem
)

router = APIRouter(
    prefix="/translations",
    tags=["Translations"]
)


@router.get(
    "/{language}",
    response_model=TranslationResponse
)
def get_translations(
    language: str,
    db: Session = Depends(get_db)
):

    categories = db.query(
        CategoryTranslation
    ).filter(
        CategoryTranslation.language == language
    ).all()

    styles = db.query(
        StyleTranslation
    ).filter(
        StyleTranslation.language == language
    ).all()

    colors = db.query(
        ColorTranslation
    ).filter(
        ColorTranslation.language == language
    ).all()

    sizes = db.query(
        SizeTranslation
    ).filter(
        SizeTranslation.language == language
    ).all()

    return {
        "categories": [
            {
                "key": item.category_key,
                "value": item.value
            }
            for item in categories
        ],

        "styles": [
            {
                "key": item.style_key,
                "value": item.value
            }
            for item in styles
        ],

        "colors": [
            {
                "key": item.color_key,
                "value": item.value
            }
            for item in colors
        ],

        "sizes": [
            {
                "key": item.size_key,
                "value": item.value
            }
            for item in sizes
        ]
    }