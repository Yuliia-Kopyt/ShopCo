document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm");

    if (!form) {
        console.error("❌ Форму #registerForm не знайдено на сторінці!");
        return;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        console.log("🚀 Форма відправляється, перехоплення працює!");

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
                throw new Error(data.detail || "Registration failed");
            }

            // Безпечний виклик тосту
            let successMessage = "Account created successfully!";
            if (window.languageManager && typeof window.languageManager.t === 'function') {
                successMessage = window.languageManager.t('toast.register_success');
            }
            
            if (typeof showToast === 'function') {
                showToast(successMessage, 'success');
            } else {
                alert(successMessage);
            }

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1000);

        } catch (error) {
            let errorLabel = "Error";
            if (window.languageManager && typeof window.languageManager.t === 'function') {
                errorLabel = window.languageManager.t('toast.register_error');
            }

            if (typeof showToast === 'function') {
                showToast(`${errorLabel}: ${error.message}`, 'warning');
            } else {
                alert(`${errorLabel}: ${error.message}`);
            }
        }
    });
});