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

import app.models 

# Створення таблиць в БД
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ShopCo API",
    version="1.0.0"
)

# --- ЛОГІКА ДЛЯ ПІДПИСКИ ТА ВІДПРАВКИ ЛИСТІВ ---

class SubscribeRequest(BaseModel):
    email: EmailStr

# Твої налаштування нової Google пошти
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "yuliia.kopyt-pi2201@kep.nung.edu.ua"       # ⬅️ Впиши сюди свій Gmail
SENDER_PASSWORD = "euew kuux eknl zluu"     # ⬅️ Впиши 16-значний пароль додатка ShopCo без пробілів

def send_welcome_email(target_email: str):
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = target_email
        msg['Subject'] = "Ласкаво просимо до ShopCo! 🎉"

        html_body = """
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; padding: 30px; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px;">
                    
                    <h2 style="color: #000000; text-align: center; margin-bottom: 20px;">Thank you for subscribing! 👋</h2>
                    <p>Welcome to the <b>ShopCo</b> community! Now you'll be the first to know about the latest trends, private sales, and exclusive discounts.</p>
                    
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; margin: 25px 0;">
                        <p style="margin: 0; font-size: 14px; color: #555;">Your welcome 10% discount promo code:</p>
                        <p style="margin: 5px 0 0 0; font-size: 22px; font-weight: bold; color: #000; letter-spacing: 2px;">WELCOME10</p>
                    </div>
                    
                    <p>Happy shopping and keep in touch!</p>
                    <p style="font-size: 11px; color: #999; margin: 0;">You received this email because you left your email on the ShopCo website.</p>
                    
                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                    
                    <h2 style="color: #000000; text-align: center; margin-bottom: 20px;">Дякуємо за підписку! 👋</h2>
                    <p>Вітаємо у спільноті <b>ShopCo</b>! Тепер ви першими дізнаватиметеся про найсвіжіші тренди, закриті розпродажі та ексклюзивні знижки.</p>
                    
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; margin: 25px 0;">
                        <p style="margin: 0; font-size: 14px; color: #555;">Ваш вітальний промокод на знижку 10%:</p>
                        <p style="margin: 5px 0 0 0; font-size: 22px; font-weight: bold; color: #000; letter-spacing: 2px;">WELCOME10</p>
                    </div>
                    
                    <p>Приємних покупок і до зв'язку!</p>
                    <p style="font-size: 11px; color: #999; margin: 0;">Ви отримали цей лист, тому що залишили свій email на сайті ShopCo.</p>
                    
                </div>
            </body>
        </html>
        """
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.sendmail(SENDER_EMAIL, target_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"❌ Помилка під час відправки листа: {e}")
        return False

@app.post("/subscribe")
async def subscribe(data: SubscribeRequest):
    success = send_welcome_email(data.email)
    if not success:
        raise HTTPException(status_code=500, detail="Не вдалося відправити лист")
    return {"status": "success", "message": "Лист успішно відправлено!"}

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