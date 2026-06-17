document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch("http://localhost:8000/auth/me", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error("Unauthorized");

        const user = await response.json();
        console.log("Дані користувача:", user);

        // Магія: дістаємо ім'я та прізвище з email, якщо бекенд їх не прислав
        let firstName = "Не вказано";
        let lastName = "Не вказано";

        if (user.email) {
            // Rozbyvayemo email po tochtsi ta defisu (napryklad, yuliia.kopyt-pi2201...)
            const emailParts = user.email.split('@')[0].split(/[\.-]/);
            
            if (emailParts.length >= 1) {
                firstName = emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
            }
            if (emailParts.length >= 2) {
                lastName = emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1);
            }
        }

        // Заповнюємо HTML дані профілю
        document.getElementById("profFirstName").textContent = user.first_name || user.name || firstName;
        document.getElementById("profLastName").textContent = user.last_name || lastName;
        document.getElementById("profEmail").textContent = user.email || "Не вказано";

        // 🌟 ОСЬ ЦЕЙ РЯДОК МИ ДОДАЛИ!
        // Запускаємо завантаження замовлень, передаючи туди наш токен авторизації
        await loadUserOrders(token);

    } catch (error) {
        console.error("Помилка завантаження профілю:", error);
        localStorage.removeItem("token");
        window.location.href = "login.html";
    }

    // Обробник для кнопки виходу
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("token");
            alert("Ви успішно вийшли з акаунту.");
            window.location.href = "index.html";
        });
    }
});

async function loadUserOrders(token) {
    console.log("=== Функція loadUserOrders запустилася! ==="); 
    const ordersContainer = document.getElementById("ordersContainer");
    
    if (!ordersContainer) return;

    const lm = window.languageManager;
    
    // 1. 🌟 ЧЕКАЄМО ПОВНУ ІНІЦІАЛІЗАЦІЮ МЕНЕДЖЕРА МОВ
    if (lm && typeof lm.waitForInitialization === 'function') {
        await lm.waitForInitialization();
    }

    const currentLang = lm ? lm.currentLang : (localStorage.getItem('preferredLanguage') || 'en');
    const isUk = (currentLang === 'uk' || currentLang === 'ua');

    // Функція-захисник: якщо lm.t() повертає сирий ключ (містить крапку), беремо дефолтне слово
    const safeT = (key, fallback) => {
        if (!lm) return fallback;
        const res = lm.t(key);
        return (res === key || res.includes('profile.orders_v2')) ? fallback : res;
    };

    try {
        const response = await fetch("http://localhost:8000/orders/me", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Не вдалося отримати замовлення з сервера");

        const orders = await response.json();

        if (orders.length === 0) {
            ordersContainer.innerHTML = `<p class="orders-empty-message">${isUk ? 'У вас ще немає замовлень.' : 'No orders yet.'}</p>`;
            return;
        }

        let ordersHtml = [];

        for (const order of orders) {
            // Форматування дати відповідно до мови сайту
            const dateLocale = isUk ? 'uk-UA' : 'en-US';
            const orderDate = new Date(order.created_at).toLocaleDateString(dateLocale, {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            const orderCode = `SHP-${1000 + order.id}`;
            let itemsHtml = [];

            for (const item of order.items) {
                let productName = isUk ? `Товар #${item.product_id}` : `Product #${item.product_id}`;
                let productImg = "assets/images/placeholder.png";

                try {
                    const prodRes = await fetch(`http://localhost:8000/products/${item.product_id}`);
                    if (prodRes.ok) {
                        const productData = await prodRes.json();
                        
                        if (productData.translations && productData.translations.length > 0) {
                            const targetTranslation = productData.translations.find(trans => {
                                const langCode = (trans.language || "").toLowerCase();
                                return langCode === currentLang;
                            });

                            if (targetTranslation && targetTranslation.title) {
                                productName = targetTranslation.title;
                            } else {
                                productName = productData.translations[0].title || productName;
                            }
                        }
                        if (productData.image) productImg = productData.image;
                    }
                } catch (e) {
                    console.warn(`Помилка продукту ID ${item.product_id}`, e);
                }

                // Переклад кольору та розміру через твої методи
                const translatedColor = lm ? lm.getColorTranslation(item.color) : item.color;
                const translatedSize = lm ? lm.getSizeTranslation(item.size) : item.size;

                // Отримуємо переклади міток із захистом
                const txtSize = safeT('profile.orders_v2.size', isUk ? 'Розмір' : 'Size');
                const txtColor = safeT('profile.orders_v2.color', isUk ? 'Колір' : 'Color');
                const txtPcs = safeT('profile.orders_v2.pcs', isUk ? 'шт.' : 'pcs.');

                itemsHtml.push(`
                    <div class="order-item">
                        <div class="item-main-info">
                            <img src="${productImg}" alt="${productName}" class="order-item-img" onerror="this.src='assets/images/placeholder.png'">
                            <div class="item-details">
                                <span class="item-name">${productName}</span>
                                <span class="item-meta">(${txtSize}: ${translatedSize.toUpperCase()}, ${txtColor}: ${translatedColor})</span>
                            </div>
                        </div>
                        <div class="item-price-info">${item.quantity} ${txtPcs} × $${item.price}</div>
                    </div>
                `);
            }

            // Динамічний переклад статусів із захистом
            let displayStatus = order.status;
            if (order.status === 'Доставлено' || order.status === 'Delivered') {
                displayStatus = safeT('profile.orders_v2.delivered', isUk ? 'Доставлено' : 'Delivered');
            } else if (order.status === 'Скасовано' || order.status === 'Cancelled') {
                displayStatus = safeT('profile.orders_v2.cancelled', isUk ? 'Скасовано' : 'Cancelled');
            } else {
                displayStatus = safeT('profile.orders_v2.processing', isUk ? 'В обробці' : 'Processing');
            }

            const txtOrder = safeT('profile.orders_v2.order', isUk ? 'Замовлення' : 'Order');
            const txtTotal = safeT('profile.orders_v2.total', isUk ? 'Загальна сума' : 'Total amount');

            ordersHtml.push(`
                <div class="order-card">
                    <div class="order-header">
                        <div class="order-info">
                            <span class="order-number">${txtOrder} №${orderCode}</span>
                            <div class="order-date">${orderDate}</div>
                        </div>
                        <span class="order-status">${displayStatus}</span>
                    </div>
                    <div class="order-items">
                        ${itemsHtml.join('')}
                    </div>
                    <div class="order-footer">
                        ${txtTotal}: <span class="order-total-price">$${order.total_price.toFixed(2)}</span>
                    </div>
                </div>
            `);
        }

        ordersContainer.innerHTML = ordersHtml.join('');

    } catch (error) {
        console.error("❌ Помилка всередині loadUserOrders:", error);
    }
}

// Слухаємо перемикання мови
window.addEventListener('languageChanged', (e) => {
    const token = localStorage.getItem("token");
    if (token) loadUserOrders(token);
});