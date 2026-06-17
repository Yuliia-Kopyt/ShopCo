// assets/js/cart.js
class Cart {
    constructor() {
        this.items = this.loadCart();
        this.init();
    }

    init() {
        this.updateCartCount();
        // Викликаємо renderCart тільки якщо ми на сторінці кошика
        if (document.getElementById('cartItems')) {
            this.renderCart();
            this.attachEventListeners();
        }
        
        // Додаємо слухач змін мови
        this.setupLanguageListener();
    }

    setupLanguageListener() {
        window.addEventListener('languageChanged', (e) => {
            this.updateCartTranslations(e.detail.language);
        });
    }

    loadCart() {
        const cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.items));
        this.updateCartCount();
    }

    addItem(product, size, color, quantity = 1) {
        const existingItem = this.items.find(item => 
            item.id === product.id && item.size === size && item.color === color
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                id: product.id,
                name: product.title || product.name,
                originalName: product.title || product.name, // Зберігаємо оригінальну назву для перекладів
                price: product.price,
                image: product.image || (product.images && product.images[0]),
                size: size,
                color: color,
                quantity: quantity
            });
        }

        this.saveCart();
        
        // Додаємо анімацію пульсації
        this.animateCartIcon();
        
        // Оновлюємо відображення кошика тільки якщо ми на сторінці кошика
        if (document.getElementById('cartItems')) {
            this.renderCart();
        }
    }

    // Нова функція для анімації іконки кошика
    animateCartIcon() {
        const cartCountElements = document.querySelectorAll('.cart-count');
        
        cartCountElements.forEach(element => {
            element.classList.add('pulse');
            setTimeout(() => {
                element.classList.remove('pulse');
            }, 600);
        });
    }

    removeItem(index) {
        this.items.splice(index, 1);
        this.saveCart();
        if (document.getElementById('cartItems')) {
            this.renderCart();
        }
    }

    updateQuantity(index, change) {
        const item = this.items[index];
        item.quantity += change;

        if (item.quantity <= 0) {
            this.removeItem(index);
        } else {
            this.saveCart();
            if (document.getElementById('cartItems')) {
                this.renderCart();
            }
        }
    }

    calculateTotals() {
        const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discount = subtotal * 0.2;
        const deliveryFee = 15;
        const total = subtotal - discount + deliveryFee;

        return {
            subtotal: Math.round(subtotal * 100) / 100,
            discount: Math.round(discount * 100) / 100,
            deliveryFee: deliveryFee,
            total: Math.round(total * 100) / 100
        };
    }

    // Функції для отримання перекладів продуктів
    getProductTitle(productId) {
        if (!window.languageManager || !window.languageManager.isInitialized) {
            console.log('⚠️ LanguageManager not ready, using default title');
            return this.items.find(item => item.id === productId)?.name || 'Product';
        }
        
        const translated = window.languageManager.getProductTranslation(productId, 'title');
        console.log(`🔍 Cart translation for product ${productId}:`, { 
            translated: translated 
        });
        
        return translated || this.items.find(item => item.id === productId)?.name || 'Product';
    }

    getColorTranslation(color) {
        if (!window.languageManager) {
            return color;
        }
        
        return window.languageManager.getColorTranslation(color) || color;
    }

    getSizeTranslation(size) {
        if (!window.languageManager) {
            return size;
        }
        
        return window.languageManager.getSizeTranslation(size) || size;
    }

    renderCart() {
        const cartItemsContainer = document.getElementById('cartItems');
        if (!cartItemsContainer) return;

        const totals = this.calculateTotals();

        if (this.items.length === 0) {
            // Використовуємо переклади напряму
            const emptyText = window.languageManager ? window.languageManager.t('cart_dynamic.empty_cart') : 'Your cart is empty';
            const addItemsText = window.languageManager ? window.languageManager.t('cart_dynamic.add_items') : 'Add some items to get started';
            const continueText = window.languageManager ? window.languageManager.t('cart_dynamic.continue_shopping') : 'Continue Shopping';
            
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <h2>${emptyText}</h2>
                    <p>${addItemsText}</p>
                    <a href="shop.html" class="continue-shopping">${continueText}</a>
                </div>
            `;
        } else {
            // Використовуємо переклади для міток
            const sizeText = window.languageManager ? window.languageManager.t('cart_dynamic.size') : 'Size';
            const colorText = window.languageManager ? window.languageManager.t('cart_dynamic.color') : 'Color';
            
            cartItemsContainer.innerHTML = this.items.map((item, index) => {
                const translatedName = this.getProductTitle(item.id);
                const translatedSize = this.getSizeTranslation(item.size);
                const translatedColor = this.getColorTranslation(item.color);
                
                return `
                <div class="cart-item" data-index="${index}" data-product-id="${item.id}">
                    <div class="item-image">
                        <button class="delete-btn" onclick="cart.removeItem(${index})" title="Remove item">
                            <i class="fas fa-trash"></i>
                        </button>
                        <img src="${item.image}" alt="${translatedName}" onerror="this.src='assets/images/placeholder.jpg'">
                    </div>
                    <div class="item-details">
                        <div class="item-name" data-product-title>${this.escapeHtml(translatedName)}</div>
                        <div class="item-variants">${sizeText}: ${translatedSize}<br>${colorText}: ${translatedColor}</div>
                        <div class="item-price">$${item.price}</div>
                        <div class="quantity-controls">
                            <button class="quantity-btn minus" onclick="cart.updateQuantity(${index}, -1)">-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="quantity-btn plus" onclick="cart.updateQuantity(${index}, 1)">+</button>
                        </div>
                    </div>
                </div>
            `}).join('');
        }

        // Update totals
        document.getElementById('subtotal').textContent = `$${totals.subtotal.toFixed(2)}`;
        document.getElementById('discount').textContent = `-$${totals.discount.toFixed(2)}`;
        document.getElementById('total').textContent = `$${totals.total.toFixed(2)}`;
    }

    // Новий метод для оновлення перекладів
    updateCartTranslations(lang) {
        console.log('🔄 Updating cart translations...');
        const cartItemsContainer = document.getElementById('cartItems');
        if (!cartItemsContainer) return;

        if (this.items.length === 0) {
            // Оновлюємо порожній кошик
            const emptyCartTitle = document.querySelector('.empty-cart h2');
            const emptyCartText = document.querySelector('.empty-cart p');
            const continueBtn = document.querySelector('.continue-shopping');
            
            if (emptyCartTitle) {
                emptyCartTitle.textContent = window.languageManager.t('cart_dynamic.empty_cart');
            }
            if (emptyCartText) {
                emptyCartText.textContent = window.languageManager.t('cart_dynamic.add_items');
            }
            if (continueBtn) {
                continueBtn.textContent = window.languageManager.t('cart_dynamic.continue_shopping');
            }
        } else {
            // Оновлюємо назви продуктів
            const productTitles = document.querySelectorAll('.item-name[data-product-title]');
            productTitles.forEach(titleElement => {
                const cartItem = titleElement.closest('.cart-item');
                const productId = cartItem.getAttribute('data-product-id');
                const translatedTitle = this.getProductTitle(parseInt(productId));
                if (translatedTitle) {
                    titleElement.textContent = translatedTitle;
                }
            });

            // Оновлюємо мітки в елементах кошика
            const sizeLabels = document.querySelectorAll('.item-variants');
            const sizeText = window.languageManager.t('cart_dynamic.size');
            const colorText = window.languageManager.t('cart_dynamic.color');
            
            sizeLabels.forEach(label => {
                const html = label.innerHTML;
                // Замінюємо Size та Color у тексті
                const newHtml = html
                    .replace(/Size:/g, `${sizeText}:`)
                    .replace(/Color:/g, `${colorText}:`)
                    .replace(/Розмір:/g, `${sizeText}:`)
                    .replace(/Колір:/g, `${colorText}:`);
                label.innerHTML = newHtml;
            });

            // Оновлюємо розміри та кольори
            const cartItems = document.querySelectorAll('.cart-item');
            cartItems.forEach(item => {
                const productId = parseInt(item.getAttribute('data-product-id'));
                const cartItem = this.items.find(i => i.id === productId);
                if (cartItem) {
                    const sizeElement = item.querySelector('.item-variants');
                    if (sizeElement) {
                        const translatedSize = this.getSizeTranslation(cartItem.size);
                        const translatedColor = this.getColorTranslation(cartItem.color);
                        const sizeText = window.languageManager.t('cart_dynamic.size');
                        const colorText = window.languageManager.t('cart_dynamic.color');
                        
                        sizeElement.innerHTML = `${sizeText}: ${translatedSize}<br>${colorText}: ${translatedColor}`;
                    }
                }
            });
        }

        // Оновлюємо тексти кнопок та заголовків
        this.updateCartStaticTexts();
    }

    // Оновлення статичних текстів кошика
    updateCartStaticTexts() {
        // Оновлюємо заголовок кошика
        const cartTitle = document.querySelector('.cart-title, h1');
        if (cartTitle && window.languageManager) {
            const translation = window.languageManager.t('cart.title');
            if (translation && translation !== 'cart.title') {
                cartTitle.textContent = translation;
            }
        }

        // Оновлюємо тексти в тоталах
        const subtotalLabel = document.querySelector('.subtotal-label');
        const discountLabel = document.querySelector('.discount-label');
        const deliveryLabel = document.querySelector('.delivery-label');
        const totalLabel = document.querySelector('.total-label');

        if (subtotalLabel && window.languageManager) {
            subtotalLabel.textContent = window.languageManager.t('cart.subtotal') || 'Subtotal';
        }
        if (discountLabel && window.languageManager) {
            discountLabel.textContent = window.languageManager.t('cart.discount') || 'Discount';
        }
        if (deliveryLabel && window.languageManager) {
            deliveryLabel.textContent = window.languageManager.t('cart.delivery') || 'Delivery Fee';
        }
        if (totalLabel && window.languageManager) {
            totalLabel.textContent = window.languageManager.t('cart.total') || 'Total';
        }

        // Оновлюємо кнопки
        const checkoutBtn = document.querySelector('.checkout-btn');
        const continueBtn = document.querySelector('.continue-btn');

        if (checkoutBtn && window.languageManager) {
            checkoutBtn.textContent = window.languageManager.t('cart.checkout') || 'Go to Checkout';
        }
        if (continueBtn && window.languageManager) {
            continueBtn.textContent = window.languageManager.t('cart.continue_shopping') || 'Continue Shopping';
        }
    }

    attachEventListeners() {
        // Promo code functionality
        const applyBtn = document.querySelector('.apply-btn');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                const promoInput = document.querySelector('.promo-input');
                const promoCode = promoInput.value.trim();
                
                if (promoCode) {
                    alert(`Promo code "${promoCode}" applied!`);
                    promoInput.value = '';
                } else {
                    alert('Please enter a promo code');
                }
            });
        }
    }

    updateCartCount() {
        const totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
        const cartCountElements = document.querySelectorAll('.cart-count');
        
        cartCountElements.forEach(element => {
            if (totalItems > 0) {
                element.textContent = totalItems > 99 ? '99+' : totalItems;
                element.style.display = 'flex';
                // ВИДАЛИТИ added-item при оновленні сторінки
                element.classList.remove('added-item');
            } else {
                element.style.display = 'none';
                element.classList.remove('added-item');
            }
        });
    }

    clearCart() {
        this.items = [];
        this.saveCart();
        if (document.getElementById('cartItems')) {
            this.renderCart();
        }
    }

    getItemCount() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Utility functions
function goBack() {
    window.history.back();
}

async function goToCheckout() {
    if (cart.items.length === 0) {
        const message = window.languageManager ? 
            window.languageManager.t('cart_dynamic.empty_cart') + '. Add some items before checkout.' : 
            'Your cart is empty. Add some items before checkout.';
        alert(message);
        return;
    }
    
    const token = localStorage.getItem("token");
    if (!token) {
        alert(window.languageManager ? "Будь ласка, авторизуйтесь для оформлення замовлення!" : "Please log in to place an order!");
        window.location.href = 'login.html';
        return;
    }

    // Розраховуємо фінальну суму
    const totals = cart.calculateTotals();

    // Формуємо дані для відправки на бекенд
    const orderData = {
        total_price: totals.total,
        // Передаємо список товарів (id, кількість, розмір, колір)
        items: cart.items.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            price: item.price
        }))
    };

    try {
        // Відправляємо замовлення на бекенд
        const response = await fetch("http://localhost:8000/orders/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            const successMessage = window.languageManager ? 
                "Дякуємо! Замовлення успішно оформлено та збережено в базі." : 
                "Thank you! Your order has been successfully placed and saved.";
            
            alert(successMessage);
            
            // Очищаємо кошик і перенаправляємо в профіль, щоб юзер побачив замовлення
            cart.clearCart(); 
            window.location.href = 'profile.html'; 
        } else {
            const errorData = await response.json().catch(() => ({}));
            alert(`Помилка оформлення: ${errorData.detail || response.statusText}`);
        }
    } catch (error) {
        console.error("Критична помилка відправки замовлення:", error);
        alert("Не вдалося зв'язатися з сервером. Перевірте з'єднання.");
    }
}

// Ініціалізація кошика
const cart = new Cart();

// Додайте стилі для анімації
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    /* Анімації для іконки кошика */
    .cart-count {
        transition: all 0.3s ease;
    }
    
    .cart-count.has-items {
        background: #22C55E !important;
        transform: scale(1.1);
        box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
    }
    
    .cart-count.pulse {
        animation: cartPulse 0.6s ease-in-out;
    }
    
    @keyframes cartPulse {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.3);
        }
        100% {
            transform: scale(1.1);
        }
    }
`;
document.head.appendChild(style);

// Зробіть cart глобально доступним
window.cart = cart;

// Initialize cart count when page loads
document.addEventListener('DOMContentLoaded', function() {
    cart.updateCartCount();
    // Оновлюємо статичні тексти при завантаженні
    if (document.getElementById('cartItems')) {
        cart.updateCartStaticTexts();
    }
});

// Додаткові функції для перекладу (запасний варіант)
document.addEventListener('DOMContentLoaded', function() {
    // Listen for language changes to update dynamic content
    window.addEventListener('languageChanged', function(e) {
        // Викликаємо метод оновлення перекладів кошика
        if (window.cart && typeof window.cart.updateCartTranslations === 'function') {
            window.cart.updateCartTranslations(e.detail.language);
        }
    });
});

// Глобальна функція для оновлення перекладів кошика
window.updateCartContent = function(lang) {
    console.log('🔄 Global updateCartContent called with lang:', lang);
    if (window.cart && typeof window.cart.updateCartTranslations === 'function') {
        window.cart.updateCartTranslations(lang);
    }
};

// Безпечна перевірка авторизації для сторінки кошика
document.addEventListener("DOMContentLoaded", async () => {
    const userLink = document.getElementById("userAuthLink");
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
        const response = await fetch("http://localhost:8000/auth/me", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const user = await response.json();
            if (userLink) {
                userLink.href = "profile.html";
                const icon = userLink.querySelector('i');
                if (icon) {
                    icon.style.color = "#00c853";
                } else {
                    userLink.style.color = "#00c853";
                }
                userLink.title = `Профіль: ${user.first_name || 'Користувач'}`;
            }
        } else if (response.status === 401 || response.status === 403) {
            console.warn("🔒 Сесія застаріла. Видаляємо токен.");
            localStorage.removeItem("token");
        } else {
            console.warn(`⚠️ Тимчасова помилка сервера (${response.status}). Токен збережено.`);
        }
    } catch (error) {
        console.error("Помилка мережі при перевірці авторизації в кошику:", error);
    }
});