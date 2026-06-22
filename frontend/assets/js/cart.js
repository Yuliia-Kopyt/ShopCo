// assets/js/cart.js
class Cart {
   constructor() {
        this.items = this.loadCart();
        this.appliedPromo = null; // Тут зберігатимемо дані про активований промокод
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
                originalName: product.title || product.name,
                price: product.price,
                image: product.image || (product.images && product.images[0]),
                size: size,
                color: color,
                quantity: quantity
            });
        }

        this.saveCart();
        this.animateCartIcon();
        
        if (document.getElementById('cartItems')) {
            this.renderCart();
        }
    }

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
        console.log(`🗑️ Спроба видалення елемента з індексом: ${index}`);
        this.items.splice(index, 1);
        this.saveCart();
        
        // Перевіряємо чи ми точно бачимо контейнер кошика
        const container = document.getElementById('cartItems');
        if (container) {
            console.log('🔄 Контейнер знайдено, викликаємо renderCart()...');
            this.renderCart();
        } else {
            console.error('❌ Помилка: Елемент #cartItems не знайдено в DOM дереві!');
        }
    }

    updateQuantity(index, change) {
        console.log(`➕➖ Зміна кількості для індексу ${index} на: ${change}`);
        const item = this.items[index];
        if (!item) {
            console.error(`❌ Товар за індексом ${index} не знайдено в масиві кошика!`);
            return;
        }
        
        item.quantity += change;

        if (item.quantity <= 0) {
            this.removeItem(index);
        } else {
            this.saveCart();
            const container = document.getElementById('cartItems');
            if (container) {
                this.renderCart();
            }
        }
    }

    calculateTotals() {
        const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Початкова знижка 0
        let discount = 0; 

        // Якщо промокод застосовано, рахуємо знижку від суми товарів
        if (this.appliedPromo) {
            discount = subtotal * this.appliedPromo.discountPercent;
        }

        const deliveryFee = subtotal > 0 ? 15 : 0; // Доставка 0, якщо кошик порожній
        const total = subtotal - discount + deliveryFee;

        return {
            subtotal: Math.round(subtotal * 100) / 100,
            discount: Math.round(discount * 100) / 100,
            deliveryFee: deliveryFee,
            total: Math.round(total * 100) / 100
        };
    }

   getProductTitle(productId) {
        // Перевіряємо чи є взагалі languageManager і чи є в нього потрібний метод
        if (!window.languageManager || typeof window.languageManager.getProductTranslation !== 'function') {
            console.log('⚠️ LanguageManager або метод getProductTranslation не знайдені, беру дефолтну назву');
            return this.items.find(item => item.id === productId)?.name || 'Product';
        }
        
        try {
            const translated = window.languageManager.getProductTranslation(productId, 'title');
            return translated || this.items.find(item => item.id === productId)?.name || 'Product';
        } catch (e) {
            console.error('Помилка при спробі перекладу назви:', e);
            return this.items.find(item => item.id === productId)?.name || 'Product';
        }
    }

        getColorTranslation(color) {
        if (!window.languageManager || typeof window.languageManager.getColorTranslation !== 'function') {
            return color;
        }
        return window.languageManager.getColorTranslation(color) || color;
    }

        getSizeTranslation(size) {
        if (!window.languageManager || typeof window.languageManager.getSizeTranslation !== 'function') {
            return size;
        }
        return window.languageManager.getSizeTranslation(size) || size;
    }

    renderCart() {
        const cartItemsContainer = document.getElementById('cartItems');
        if (!cartItemsContainer) return;

        const totals = this.calculateTotals();

        if (this.items.length === 0) {
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
            const sizeText = window.languageManager ? window.languageManager.t('cart_dynamic.size') : 'Size';
            const colorText = window.languageManager ? window.languageManager.t('cart_dynamic.color') : 'Color';
            
            cartItemsContainer.innerHTML = this.items.map((item, index) => {
                const translatedName = this.getProductTitle(item.id);
                const translatedSize = this.getSizeTranslation(item.size);
                const translatedColor = this.getColorTranslation(item.color);
                
                return `
                <div class="cart-item" data-index="${index}" data-product-id="${item.id}">
                    <div class="item-image">
                        <button class="delete-btn js-delete-item" title="Remove item" type="button">
                            <i class="fas fa-trash"></i>
                        </button>
                        <img src="${item.image}" alt="${translatedName}" onerror="this.src='assets/images/placeholder.jpg'">
                    </div>
                    <div class="item-details">
                        <div class="item-name" data-product-title>${this.escapeHtml(translatedName)}</div>
                        <div class="item-variants">${sizeText}: ${translatedSize}<br>${colorText}: ${translatedColor}</div>
                        <div class="item-price">$${item.price}</div>
                        <div class="quantity-controls">
                            <button class="quantity-btn minus js-qty-minus" type="button">-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="quantity-btn plus js-qty-plus" type="button">+</button>
                        </div>
                    </div>
                </div>
            `;
            }).join('');
        }

        // Оновлюємо фінальні суми
        const subtotalEl = document.getElementById('subtotal');
        const discountEl = document.getElementById('discount');
        const totalEl = document.getElementById('total');

        if (subtotalEl) subtotalEl.textContent = `$${totals.subtotal.toFixed(2)}`;
        if (discountEl) discountEl.textContent = `-$${totals.discount.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `$${totals.total.toFixed(2)}`;
        this.attachEventListeners();
    }

    updateCartTranslations(lang) {
        const cartItemsContainer = document.getElementById('cartItems');
        if (!cartItemsContainer) return;

        if (this.items.length === 0) {
            const emptyCartTitle = document.querySelector('.empty-cart h2');
            const emptyCartText = document.querySelector('.empty-cart p');
            const continueBtn = document.querySelector('.continue-shopping');
            
            if (emptyCartTitle) emptyCartTitle.textContent = window.languageManager.t('cart_dynamic.empty_cart');
            if (emptyCartText) emptyCartText.textContent = window.languageManager.t('cart_dynamic.add_items');
            if (continueBtn) continueBtn.textContent = window.languageManager.t('cart_dynamic.continue_shopping');
        } else {
            const productTitles = document.querySelectorAll('.item-name[data-product-title]');
            productTitles.forEach(titleElement => {
                const cartItem = titleElement.closest('.cart-item');
                const productId = cartItem.getAttribute('data-product-id');
                const translatedTitle = this.getProductTitle(parseInt(productId));
                if (translatedTitle) titleElement.textContent = translatedTitle;
            });

            const sizeLabels = document.querySelectorAll('.item-variants');
            const sizeText = window.languageManager.t('cart_dynamic.size');
            const colorText = window.languageManager.t('cart_dynamic.color');
            
            sizeLabels.forEach(label => {
                const html = label.innerHTML;
                const newHtml = html
                    .replace(/Size:/g, `${sizeText}:`)
                    .replace(/Color:/g, `${colorText}:`)
                    .replace(/Розмір:/g, `${sizeText}:`)
                    .replace(/Колір:/g, `${colorText}:`);
                label.innerHTML = newHtml;
            });

            const cartItems = document.querySelectorAll('.cart-item');
            cartItems.forEach(item => {
                const productId = parseInt(item.getAttribute('data-product-id'));
                const cartItem = this.items.find(i => i.id === productId);
                if (cartItem) {
                    const sizeElement = item.querySelector('.item-variants');
                    if (sizeElement) {
                        const translatedSize = this.getSizeTranslation(cartItem.size);
                        const translatedColor = this.getColorTranslation(cartItem.color);
                        sizeElement.innerHTML = `${sizeText}: ${translatedSize}<br>${colorText}: ${translatedColor}`;
                    }
                }
            });
        }
        this.updateCartStaticTexts();
    }

    updateCartStaticTexts() {
        const cartTitle = document.querySelector('.cart-title, h1');
        if (cartTitle && window.languageManager) {
            const translation = window.languageManager.t('cart.title');
            if (translation && translation !== 'cart.title') cartTitle.textContent = translation;
        }

        const subtotalLabel = document.querySelector('.subtotal-label');
        const discountLabel = document.querySelector('.discount-label');
        const deliveryLabel = document.querySelector('.delivery-label');
        const totalLabel = document.querySelector('.total-label');

        if (subtotalLabel && window.languageManager) subtotalLabel.textContent = window.languageManager.t('cart.subtotal') || 'Subtotal';
        if (discountLabel && window.languageManager) discountLabel.textContent = window.languageManager.t('cart.discount') || 'Discount';
        if (deliveryLabel && window.languageManager) deliveryLabel.textContent = window.languageManager.t('cart.delivery') || 'Delivery Fee';
        if (totalLabel && window.languageManager) totalLabel.textContent = window.languageManager.t('cart.total') || 'Total';

        const checkoutBtn = document.querySelector('.checkout-btn');
        const continueBtn = document.querySelector('.continue-btn');

        if (checkoutBtn && window.languageManager) checkoutBtn.textContent = window.languageManager.t('cart.checkout') || 'Go to Checkout';
        if (continueBtn && window.languageManager) continueBtn.textContent = window.languageManager.t('cart.continue_shopping') || 'Continue Shopping';
    }

    attachEventListeners() {
        const cartItemsContainer = document.getElementById('cartItems');
        if (!cartItemsContainer) return;

        // Очищаємо попередні слухачі з контейнера товарів, щоб вони не дублювалися
        const newCartItemsContainer = cartItemsContainer.cloneNode(true);
        cartItemsContainer.parentNode.replaceChild(newCartItemsContainer, cartItemsContainer);

        // Вішаємо ОДИН загальний обробник подій на чистий контейнер кошика
        newCartItemsContainer.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.js-delete-item');
            const minusBtn = e.target.closest('.js-qty-minus');
            const plusBtn = e.target.closest('.js-qty-plus');

            if (!deleteBtn && !minusBtn && !plusBtn) return;

            const cartItem = e.target.closest('.cart-item');
            if (!cartItem) return;
            
            const index = parseInt(cartItem.getAttribute('data-index'));

            if (deleteBtn) {
                this.removeItem(index);
            } else if (minusBtn) {
                this.updateQuantity(index, -1);
            } else if (plusBtn) {
                this.updateQuantity(index, 1);
            }
        });

        // Налаштовуємо кнопку промокоду (тепер вона працюватиме завжди)
        const applyBtn = document.querySelector('.apply-btn');
        if (applyBtn) {
            // Спочатку видаляємо старий обробник подій через клонування кнопки
            const newApplyBtn = applyBtn.cloneNode(true);
            applyBtn.parentNode.replaceChild(newApplyBtn, applyBtn);

            newApplyBtn.addEventListener('click', () => {
                const promoInput = document.querySelector('.promo-input');
                if (!promoInput) return;
                
                const promoCode = promoInput.value.trim().toUpperCase(); 
                
                if (promoCode === 'WELCOME10') { 
                    this.appliedPromo = {
                        code: promoCode,
                        discountPercent: 0.10 // 10% знижки
                    };
                    
                    showToast(`Промокод ${promoCode} успішно застосовано! Ви отримали 10% знижки.`, 'success');
                    this.renderCart(); // Перемальовуємо, і суми миттєво оновлюються
                    promoInput.value = ''; 
                    
                } else if (promoCode === '') {
                    showToast(window.languageManager.t('toast.promo_empty'), 'warning');
                } else {
                    showToast(window.languageManager.t('toast.promo_invalid'), 'warning');
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
        showToast(window.languageManager.t('toast.checkout_empty'), 'warning');
        return;
    }
    
    const token = localStorage.getItem("token");
    if (!token) {
        showToast(window.languageManager.t('toast.auth_required_checkout'), 'warning');
        window.location.href = 'login.html';
        return;
    }

    const totals = cart.calculateTotals();

    const orderData = {
        total_price: totals.total,
        items: cart.items.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            price: item.price
        }))
    };

    try {
        const response = await fetch("http://localhost:8000/orders/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            // 1. Показуємо ТІЛЬКИ ОДИН тост про успіх
            showToast(window.languageManager.t('toast.order_success'), 'success');
            
            // 2. Чекаємо 2.5 секунди, щоб користувач його побачив
            setTimeout(() => {
                cart.clearCart(); 
                window.location.href = 'profile.html'; 
            }, 2500);

        } else {
            const errorData = await response.json().catch(() => ({}));
            const errorLabel = window.languageManager.t('toast.order_error');
            showToast(`${errorLabel}: ${errorData.detail || response.statusText}`, 'warning');
        }
    } catch (error) {
        console.error("Критична помилка відправки замовлення:", error);
        showToast(window.languageManager.t('toast.server_error'), 'warning');
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
        0% { transform: scale(1); }
        50% { transform: scale(1.3); }
        100% { transform: scale(1.1); }
    }
`;
document.head.appendChild(style);

window.cart = cart;

document.addEventListener('DOMContentLoaded', function() {
    cart.updateCartCount();
    if (document.getElementById('cartItems')) {
        cart.updateCartStaticTexts();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    window.addEventListener('languageChanged', function(e) {
        if (window.cart && typeof window.cart.updateCartTranslations === 'function') {
            window.cart.updateCartTranslations(e.detail.language);
        }
    });
});

window.updateCartContent = function(lang) {
    if (window.cart && typeof window.cart.updateCartTranslations === 'function') {
        window.cart.updateCartTranslations(lang);
    }
};

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
            localStorage.removeItem("token");
            showToast(window.languageManager.t('toast.session_expired'), 'warning');
        }
    } catch (error) {
        console.error("Помилка мережі при перевірці авторизації в кошику:", error);
    }
});