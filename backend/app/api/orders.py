from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.database import get_db
from app.models.order import Order, OrderItem
from app.schemas.order import OrderCreate, OrderResponse
from app.api.auth import get_current_user # Переконайся, що get_current_user дійсно експортується звідси
from app.models.user import User

router = APIRouter(prefix="/orders", tags=["Orders"])

# 1. Створення замовлення з кошика (POST /orders/)
@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_data: OrderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not order_data.items:
        raise HTTPException(status_code=400, detail="Кошик порожній")

    # Створюємо головний запис замовлення
    db_order = Order(
        user_id=current_user.id,
        total_price=order_data.total_price,
        status="В обробці"
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    # Додаємо всі товари до цього замовлення
    for item in order_data.items:
        db_item = OrderItem(
            order_id=db_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            size=item.size,
            color=item.color,
            price=item.price
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_order)
    return db_order

# 2. Отримання замовлень саме цього користувача (GET /orders/me)
@router.get("/me", response_model=List[OrderResponse])
def get_my_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    orders = db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).all()
    return orders