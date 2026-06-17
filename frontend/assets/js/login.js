document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {
            // Перетворюємо дані у формат x-www-form-urlencoded, який вимагає FastAPI OAuth2
            const formData = new URLSearchParams();
            formData.append("username", email); // FastAPI чекає саме "username"
            formData.append("password", password);

            const response = await fetch("http://localhost:8000/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                // Якщо FastAPI повернув масив помилок (валідація), витягуємо першу зрозумілу
                if (data.detail && Array.isArray(data.detail)) {
                    const errorMessages = data.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join("\n");
                    throw new Error(errorMessages);
                }
                throw new Error(data.detail || "Невірний email або пароль");
            }

            // Якщо вхід успішний, FastAPI повертає токен
            if (data.access_token) {
                localStorage.setItem("token", data.access_token);
                alert("Вхід успішний!");
                
                // Перенаправляємо на головну сторінку магазину
                window.location.href = "index.html"; 
            } else {
                throw new Error("Токен не знайдено у відповіді сервера.");
            }

        } catch (error) {
            console.error("Помилка входу:", error);
            alert(`Помилка входу:\n${error.message}`);
        }
    });
});