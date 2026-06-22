import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pydantic import BaseModel, EmailStr
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.database.base import Base
from app.database.database import engine

from app.api.auth import router as auth_router
from app.api.products import router as products_router
from app.api.translations import router as translations_router
from app.api.orders import router as orders_router 

# Імпортуємо функцію розсилки з нашого нового окремого модуля утиліт
from app.core.email import send_newsletter_welcome  # ⬅️ Додай цей рядок!

import app.models 

# Створення таблиць в БД
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ShopCo API",
    version="1.0.0"
)

# --- ЛОГІКА ДЛЯ ПІДПИСКИ ---

class SubscribeRequest(BaseModel):
    email: EmailStr

@app.post("/subscribe")
async def subscribe(data: SubscribeRequest):
    # Тепер функція викличеться без помилок, бо ми імпортували її зверху
    success = send_newsletter_welcome(data.email)
    if not success:
        raise HTTPException(status_code=500, detail="Не вдалося відправити лист розсилки")
    return {"status": "success", "message": "Лист розсилки успішно відправлено!"}


# --- ВКЛЮЧЕННЯ РОУТЕРІВ ---

app.include_router(auth_router)
app.include_router(products_router)
app.include_router(translations_router)
app.include_router(orders_router) 

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "ShopCo API is running"
    }