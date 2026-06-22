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

            // Локалізуємо дефолтний текст помилки, якщо сервер не прислав `data.detail`
            const defaultError = window.localStorage.getItem('preferredLanguage') === 'uk'
                ? "Невірний email або пароль"
                : "Invalid email or password";

            throw new Error(data.detail || defaultError);
        }

            // Якщо вхід успішний, FastAPI повертає токен
            if (data.access_token) {
                localStorage.setItem("token", data.access_token);
                showToast(window.languageManager.t('toast.login_success'), 'success');

                // Перенаправляємо на головну сторінку магазину (можна з невеликою затримкою у 1 сек, щоб користувач встиг побачити тост)
                setTimeout(() => {
                    window.location.href = "index.html"; 
                }, 1000);
            } 
            
            else {
                throw new Error("Токен не знайдено у відповіді сервера.");
            }

        } catch (error) {
    console.error("Помилка входу:", error);

    const loginErrorLabel = window.languageManager.t('toast.login_error');
    showToast(`${loginErrorLabel}: ${error.message}`, 'warning');
}
    });
});