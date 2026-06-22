const form = document.getElementById("registerForm");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(
            "http://localhost:8000/auth/register",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    password
                })
            }
        );

        const data = await response.json();

       if (!response.ok) {
            throw new Error(data.detail);
        }

        // Беремо переклад успішної реєстрації з JSON
        const successMessage = window.languageManager.t('toast.register_success');
        showToast(successMessage, 'success');

        // Даємо користувачу 1 секунду подивитися на гарний тост перед редиректом
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1000);

    } catch (error) {
        // Беремо заголовок помилки з JSON і додаємо текст помилки від сервера
        const errorLabel = window.languageManager.t('toast.register_error');
        showToast(`${errorLabel}: ${error.message}`, 'warning');
    }
});