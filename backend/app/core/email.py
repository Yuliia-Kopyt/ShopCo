import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "yuliia.kopyt-pi2201@kep.nung.edu.ua"
SENDER_PASSWORD = "euew kuux eknl zluu"

def send_html_email(target_email: str, subject: str, html_body: str):
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = target_email
        msg['Subject'] = subject

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

def send_newsletter_welcome(target_email: str):
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
                
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                
                <h2 style="color: #000000; text-align: center; margin-bottom: 20px;">Дякуємо за підписку! 👋</h2>
                <p>Вітаємо у спільноті <b>ShopCo</b>! Тепер ви першими дізнаватиметеся про найсвіжіші тренди, закриті розпродажі та ексклюзивні знижки.</p>
                
                <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; margin: 25px 0;">
                    <p style="margin: 0; font-size: 14px; color: #555;">Ваш вітальний промокод на знижку 10%:</p>
                    <p style="margin: 5px 0 0 0; font-size: 22px; font-weight: bold; color: #000; letter-spacing: 2px;">WELCOME10</p>
                </div>
                
                <p>Приємних покупок і до зв'язку!</p>
                
            </div>
        </body>
    </html>
    """
    return send_html_email(target_email, "Welcome to ShopCo! / Дякуємо за підписку! 🎉", html_body)

def send_registration_welcome(target_email: str, name: str = "Користувач"):
    # Для англійського блоку підставимо User, якщо ім'я залишилось дефолтним українським
    display_name_en = "User" if name == "Користувач" else name
    
    html_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; padding: 30px; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px;">
                
                <h2 style="color: #000000; text-align: center; margin-bottom: 20px;">Successful Registration at ShopCo! 🚀</h2>
                <p>Welcome, <b>{display_name_en}</b>! Your personal account has been successfully created.</p>
                <p>Now you can track your orders, save your favorite products, and shop much faster.</p>
                
                <p style="text-align: center; margin: 20px 0;">
                    <a href="http://localhost:5500/profile.html" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Profile</a>
                </p>
                
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                
                <h2 style="color: #000000; text-align: center; margin-bottom: 20px;">Успішна реєстрація в ShopCo! 🚀</h2>
                <p>Вітаємо, <b>{name}</b>! Ваш особистий кабінет успішно створено.</p>
                <p>Тепер ви можете відстежувати свої замовлення, зберігати улюблені товари та купувати значно швидше.</p>
                
                <p style="text-align: center; margin: 20px 0;">
                    <a href="http://localhost:5500/profile.html" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Перейти в профіль</a>
                </p>
                
            </div>
        </body>
    </html>
    """
    return send_html_email(target_email, "Welcome to ShopCo! / Успішна реєстрація 🎉", html_body)