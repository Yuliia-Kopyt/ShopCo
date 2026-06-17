from pydantic import BaseModel
from typing import List
from datetime import datetime

# Окремий товар з кошика
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    size: str
    color: str
    price: float

# Вхідні дані для створення замовлення
class OrderCreate(BaseModel):
    total_price: float
    items: List[OrderItemCreate]

# Відповідь: Товар всередині замовлення
class OrderItemResponse(BaseModel):
    product_id: int
    quantity: int
    size: str
    color: str
    price: float

    class Config:
        from_attributes = True

# Відповідь: Повне замовлення
class OrderResponse(BaseModel):
    id: int
    total_price: float
    status: str
    created_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True