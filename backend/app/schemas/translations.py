from pydantic import BaseModel


class TranslationItem(BaseModel):
    key: str
    value: str


class TranslationResponse(BaseModel):
    categories: list[TranslationItem]
    styles: list[TranslationItem]
    colors: list[TranslationItem]
    sizes: list[TranslationItem]