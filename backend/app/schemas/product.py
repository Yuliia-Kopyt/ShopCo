from pydantic import BaseModel


class ProductTranslationBase(BaseModel):
    language: str
    title: str
    description: str
    details: str | None = None


class ProductTranslationResponse(ProductTranslationBase):
    id: int

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    price: float
    old_price: float | None = None
    rating: float = 0
    image: str
    style: str
    colors: list[str]
    sizes: list[str]
    in_stock: bool = True
    discount: int | None = None
    category_id: int


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    pass


class ProductResponse(ProductBase):
    id: int
    translations: list[ProductTranslationResponse]

    class Config:
        from_attributes = True