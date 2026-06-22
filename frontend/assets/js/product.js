// ---------------------------
// PRODUCT LOADER
// ---------------------------
let PRODUCTS_DATA = [];

async function loadProductsData() {
    try {

        const productsResponse = await fetch(
            'http://localhost:8000/products/'
        );

        if (!productsResponse.ok) {
            throw new Error(
                `HTTP error! status: ${productsResponse.status}`
            );
        }

        PRODUCTS_DATA = await productsResponse.json();
        console.log("PRODUCTS_DATA", PRODUCTS_DATA);
        console.log("FIRST PRODUCT", PRODUCTS_DATA[0]);
        console.log(
            "FIRST PRODUCT TRANSLATIONS",
            PRODUCTS_DATA[0]?.translations
        );

        initializeProductPage();

    } catch (error) {

        console.error('❌ Error loading products:', error);

        PRODUCTS_DATA = getFallbackProducts();

        initializeProductPage();
    }
}

function getFallbackProducts() {
    return [
        {
            id: 1,
            title: "T-Shirt with tape details",
            price: 240,
            old_price: null,
            category: "T-Shirts",
            image: "assets/images/blacktshirt.png",
            rating: 4.5,
            colors: ["black", "white"],
            sizes: ["s", "m", "l"],
            style: "Casual",
            in_stock: true,
            discount: null,
            description: "This comfortable t-shirt features unique tape details for a modern look."
        },
        {
            id: 2,
            title: "Skinny Fit Jeans",
            price: 240,
            old_price: 260,
            category: "Jeans",
            image: "assets/images/blackjeans.png",
            rating: 3.5,
            colors: ["blue", "black"],
            sizes: ["s", "m", "l"],
            style: "Casual",
            in_stock: true,
            discount: 20,
            description: "Classic skinny fit jeans with comfortable stretch fabric."
        },
        {
            id: 3,
            title: "Checkered Shirt",
            price: 180,
            old_price: null,
            category: "Shirts",
            image: "assets/images/chekeredshirt.png",
            rating: 4.5,
            colors: ["red", "blue"],
            sizes: ["s", "m", "l"],
            style: "Casual",
            in_stock: true,
            discount: null,
            description: "Stylish checkered shirt perfect for casual occasions."
        },
        {
            id: 4,
            title: "Sleeve Striped T-shirt",
            price: 130,
            old_price: 160,
            category: "T-shirts",
            image: "assets/images/stripedtshirt.png",
            rating: 4.5,
            colors: ["orange", "black"],
            sizes: ["m", "l"],
            style: "Casual",
            in_stock: true,
            discount: 30,
            description: "Striped t-shirt with comfortable sleeve design."
        }
    ];
}


// ---------------------------
// GET PRODUCT ID FROM URL
// ---------------------------
function initializeProductPage() {
    const params = new URLSearchParams(window.location.search);
    const productId = Number(params.get("id"));

    const container = document.getElementById("product-page");

    if (!container) {
        return;
    }

    const product = PRODUCTS_DATA.find(p => p.id === productId);

    if (!product) {
        container.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <h2>Продукт не знайдено</h2>
                <p>Доступні ID: ${PRODUCTS_DATA.map(p => p.id).join(', ')}</p>
                <a href="shop.html" style="color: #000; text-decoration: underline;">Повернутися до магазину</a>
            </div>
        `;
        return;
    }

    // 1. Малюємо картку товару
    renderProduct(product, container);
    setupProductInteractions(container, product);
    
    // 2. ОДРАЗУ викликаємо оновлення перекладів, щоб заповнити твої рідні таби деталями з бази даних
    updateProductTranslations();
}

function showError(message) {
    const container = document.getElementById("product-page");
    if (container) {
        container.innerHTML = `<div style="padding:20px; text-align:center;"><strong>${message}</strong></div>`;
    }
}

// ---------------------------
// ФУНКЦІЇ ПЕРЕКЛАДУ ПРОДУКТІВ
// ---------------------------
function getProductTitle(product) {

    const currentLang =
        localStorage.getItem('preferredLanguage') || 'en';

    const translation = product.translations?.find(
        t => t.language === currentLang
    );

    return translation?.title || product.title || "No title";
}

function getProductTitle(product) {

    const currentLang =
        localStorage.getItem('preferredLanguage') || 'en';

    console.log("LANG =", currentLang);

    const translation =
        product.translations?.find(
            t => t.language === currentLang
        );

    console.log("TRANSLATION =", translation);

    return translation?.title || product.title;
}

function getProductDescription(product) {

    const currentLang =
        localStorage.getItem('preferredLanguage') || 'en';

    const translation = product.translations?.find(
        t => t.language === currentLang
    );

    return translation?.description || product.description || "";
}

function getProductDetails(product) {

    const currentLang =
        localStorage.getItem('preferredLanguage') || 'en';

    const translation = product.translations?.find(
        t => t.language === currentLang
    );

    return translation?.details || product.details || "";
}

function getColorTranslation(color) {
    if (!window.languageManager) {
        return color;
    }
    
    return window.languageManager.getColorTranslation(color) || color;
}

function getSizeTranslation(size) {
    if (!window.languageManager) {
        return size;
    }
    
    return window.languageManager.getSizeTranslation(size) || size;
}

function getCategoryTranslation(category) {
    if (!window.languageManager) {
        return category;
    }
    
    return window.languageManager.getCategoryTranslation(category) || category;
}

// ---------------------------
// RENDER HELPERS
// ---------------------------
function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    let stars = "";

    for (let i = 0; i < full; i++) {
        stars += `<i class="fa-solid fa-star" style="color:#ffc633"></i>`;
    }
    if (half) {
        stars += `<i class="fa-solid fa-star-half-stroke" style="color:#ffc633"></i>`;
    }
    return stars;
}

function formatPrice(price) {
    return `$${Number(price).toFixed(2)}`;
}

function mapColor(color) {
    const colors = {
        white: "#ffffff",
        black: "#000000",
        blue: "#1e40af",
        red: "#dc2626",
        orange: "#f97316",
        pink: "#ec4899",
        green: "#22c55e",
        brown: "#92400e"
    };
    return colors[color?.toLowerCase()] || "#999";
}

function renderColors(colors = []) {
    if (!colors.length) return "";
    return `
        <div class="color-options">
            ${colors.map(c => `
                <div class="color-swatch" style="background:${mapColor(c)}" data-color="${c}" title="${getColorTranslation(c)}"></div>
            `).join("")}
        </div>
    `;
}

function renderSizes(sizes = []) {
    if (!sizes.length) return `<div class="muted">No sizes available</div>`;
    return `
        <div class="size-options">
            ${sizes.map(s => `<div class="size-pill" data-size="${s}">${getSizeTranslation(s)}</div>`).join("")}
        </div>
    `;
}

// ===============================================================
// BUILD PRODUCT HTML - ПОВНІСТЮ З ПЕРЕКЛАДАМИ
// ===============================================================
let currentRenderedProduct = null;
let currentProductContainer = null;

function renderProduct(product, container) {
    // Запам'ятовуємо поточні дані, щоб мати змогу перерендерити при зміні мови
    currentRenderedProduct = product;
    currentProductContainer = container;

    const translatedTitle = getProductTitle(product);
    const translatedDescription = getProductDescription(product);
    const translatedDetails = getProductDetails(product);

    // Отримуємо динамічні переклади
    const selectColorText = window.languageManager ? window.languageManager.t('product.select_color') : 'Select color';
    const chooseSizeText = window.languageManager ? window.languageManager.t('product.choose_size') : 'Choose size';
    const addToCartText = window.languageManager ? window.languageManager.t('product.add_to_cart') : 'Add to cart';
    const outOfStockText = window.languageManager ? window.languageManager.t('product.out_of_stock') : 'Out of stock';
    const noDescriptionText = window.languageManager ? window.languageManager.t('product.no_description') : 'No description available.';

    const html = `
        <div class="product-card">
            <div class="product-image">
                <img src="${product.image}" alt="${translatedTitle}" onerror="this.src='assets/images/placeholder.png'">
            </div>

            <div class="product-info">
                <h1 class="product-title" data-product-title>${escapeHtml(translatedTitle)}</h1>

                <div class="rating">
                    ${renderStars(product.rating)}
                    <span class="count">${product.rating.toFixed(1)}/5</span>
                </div>

                <div class="pricing">
                    <div class="current-price">${formatPrice(product.price)}</div>
                    ${product.old_price ? `<div class="old-price">${formatPrice(product.old_price)}</div>` : ""}
                    ${product.discount ? `<div class="discount">-${product.discount}%</div>` : ""}
                </div>

                <p class="description" data-product-description>${escapeHtml(translatedDescription || noDescriptionText)}</p>

                <div class="options-block">
                    <div class="line"></div>

                    <div class="option-title" data-i18n="product.select_color">${selectColorText}</div>
                    ${renderColors(product.colors)}

                    <div class="line"></div>

                    <div class="option-title" data-i18n="product.choose_size">${chooseSizeText}</div>
                    ${renderSizes(product.sizes)}

                    <div class="line"></div>
                </div>

                <div class="bottom-row">
                    <div class="qty-box">
                        <button type="button" class="qty-minus">−</button>
                        <span class="qty-value">1</span>
                        <button type="button" class="qty-plus">+</button>
                    </div>

                    <button class="add-to-cart js-add-to-cart-btn" ${!product.in_stock ? 'disabled style="opacity:0.6; cursor:not-allowed;"' : ''}>
                        ${product.in_stock ? addToCartText : outOfStockText}
                    </button>
                </div>

            </div>
        </div>
    `;

    container.innerHTML = html;

    container.innerHTML = html;
}

// ===============================================================
// INTERACTIONS - ЗБЕРЕЖЕННЯ КЛІКІВ
// ===============================================================
function setupProductInteractions(container, product) {
    // 1. Селектор кольорів
    const swatches = container.querySelectorAll(".color-swatch");
    if (swatches.length > 0) {
        swatches[0].classList.add("selected"); // Auto-select first color
        swatches.forEach(s => {
            s.addEventListener("click", () => {
                swatches.forEach(el => el.classList.remove("selected"));
                s.classList.add("selected");
            });
        });
    }

    // 2. Селектор розмірів
    const sizePills = container.querySelectorAll(".size-pill");
    if (sizePills.length > 0) {
        sizePills[0].classList.add("selected"); // Auto-select first size
        sizePills.forEach(s => {
            s.addEventListener("click", () => {
                sizePills.forEach(el => el.classList.remove("selected"));
                s.classList.add("selected");
            });
        });
    }

    // 3. Керування кількістю (QTY)
    let qty = 1;
    const qtyValue = container.querySelector(".qty-value");
    const qtyMinus = container.querySelector(".qty-minus");
    const qtyPlus = container.querySelector(".qty-plus");

    if (qtyMinus && qtyPlus && qtyValue) {
        qtyMinus.addEventListener("click", () => {
            if (qty > 1) {
                qty--;
                qtyValue.textContent = qty;
            }
        });

        qtyPlus.addEventListener("click", () => {
            qty++;
            qtyValue.textContent = qty;
        });
    }

    // 4. Кнопка "Додати в кошик" з перевіркою авторизації
    // 4. Кнопка "Додати в кошик" з перевіркою авторизації
    const addBtn = container.querySelector(".add-to-cart");
    if (addBtn) {
        addBtn.addEventListener("click", () => {
            const token = localStorage.getItem("token");
            if (!token) {
                // 1. Спочатку показуємо твій гарний тост (текст уже береться з JSON)
                showToast(window.languageManager.t('toast.auth_required_checkout'), 'warning');
                
                // 2. Робимо паузу в 2 секунди (2000 мілісекунд), щоб тост не зникав миттєво
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2000);
                
                return;
            }

            const selectedColorEl = container.querySelector(".color-swatch.selected");
            const selectedSizeEl = container.querySelector(".size-pill.selected");

            const selectedColor = selectedColorEl ? selectedColorEl.dataset.color : "Default";
            const selectedSize = selectedSizeEl ? selectedSizeEl.dataset.size : "One Size";

            if (product.sizes && product.sizes.length > 0 && !selectedSizeEl) {
                const sizeLabel = window.languageManager.t('shop.size');
                showToast(`${sizeLabel}?`, 'warning');
                return;
            }

            if (window.cart && typeof window.cart.addItem === 'function') {
                window.cart.addItem(product, selectedSize, selectedColor, qty);
                const productTitle = getProductTitle(product);
                const successMessage = window.localStorage.getItem('preferredLanguage') === 'uk' 
                    ? `«${productTitle}» успішно додано до кошика!` 
                    : `"${productTitle}" successfully added to cart!`;

                showToast(successMessage, 'success');
            } else {
                console.log('Cart item fallback:', { product, size: selectedSize, color: selectedColor, quantity: qty });
            }
        });
    }
}

// ===============================================================
// ГЛОБАЛЬНИЙ СЛУХАЧ ЗМІНИ МОВИ ДЛЯ СТОРІНКИ ПРОДУКТУ
// ===============================================================
window.addEventListener('languageChanged', () => {
    if (currentRenderedProduct && currentProductContainer) {
        console.log('🔄 Мова змінена! Перемальовуємо HTML та переініціалізуємо кліки кошика...');
        
        // 1. Перемальовуємо HTML (назва кнопки зміниться автоматично!)
        renderProduct(currentRenderedProduct, currentProductContainer);
        
        // 2. Одразу ж вішаємо на нову кнопку кліки, щоб вона додавала в кошик без оновлення сторінки!
        setupProductInteractions(currentProductContainer, currentRenderedProduct);
    }
});

// ---------------------------
// UTILITY FUNCTIONS
// ---------------------------
function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[m]));
}

function fixHyphensInTitle() {
    const titleElement = document.querySelector('.product-title');
    if (!titleElement) return;

    const parts = titleElement.textContent.split('-');
    if (parts.length <= 1) return;

    let newHTML = "";
    for (let i = 0; i < parts.length; i++) {
        newHTML += parts[i];
        if (i < parts.length - 1) {
            newHTML += '<span style="font-family: Satoshi, Arial; font-weight: 1200;">-</span>';
        }
    }
    titleElement.innerHTML = newHTML;
}

// ---------------------------
// ОНОВЛЕННЯ ПЕРЕКЛАДІВ ПРОДУКТУ
// ---------------------------
function updateProductTranslations() {
    console.log('🔄 Updating product page translations...');
    
    const params = new URLSearchParams(window.location.search);
    const productId = Number(params.get("id"));
    const product = PRODUCTS_DATA.find(p => p.id === productId);
    
    if (!product) return;
    
    const container = document.getElementById("product-page");
    if (!container) return;
    
    // Оновлюємо назву продукту
    const titleElement = container.querySelector('[data-product-title]');
    if (titleElement) {
        const translatedTitle = getProductTitle(product);
        titleElement.textContent = translatedTitle;
        
        // Оновлюємо alt атрибут зображення
        const imageElement = container.querySelector('.product-image img');
        if (imageElement) {
            imageElement.alt = translatedTitle;
        }
    }
    
    // Оновлюємо опис продукту
    const descriptionElement = container.querySelector('[data-product-description]');
    if (descriptionElement) {
        const translatedDescription = getProductDescription(product);
        descriptionElement.textContent = translatedDescription;
    }
    
    // Оновлюємо кольори
    const colorSwatches = container.querySelectorAll('.color-swatch');
    colorSwatches.forEach(swatch => {
        const originalColor = swatch.dataset.color;
        swatch.title = getColorTranslation(originalColor);
    });
    
    // Оновлюємо розміри
    const sizePills = container.querySelectorAll('.size-pill');
    sizePills.forEach(pill => {
        const originalSize = pill.dataset.size;
        pill.textContent = getSizeTranslation(originalSize);
    });
        // Оновлюємо details
    const detailsContainer =
        document.getElementById('product-details-container');

    if (detailsContainer) {

        const translatedDetails =
            getProductDetails(product);

        detailsContainer.innerHTML =
            marked.parse(translatedDetails);
    }
    // Fix hyphens again after translation
    setTimeout(fixHyphensInTitle, 200);
}

// ---------------------------
// LOAD PRODUCT REVIEWS
// ---------------------------
// Зберігаємо поточні відгуки тут для швидкого сортування
let CURRENT_REVIEWS = [];

function loadProductReviews(productId) {
    const reviewsContainer = document.querySelector(".product-reviews");
    if (!reviewsContainer) return;

    fetch("assets/data/reviews.json")
        .then(r => r.json())
        .then(data => {
            const productData = data.products.find(p => p.productId == productId);

            if (!productData || productData.reviews.length === 0) {
                reviewsContainer.innerHTML = `<p class="no-reviews">No reviews yet.</p>`;
                CURRENT_REVIEWS = [];
                return;
            }

            // Запам'ятовуємо відгуки в глобальний масив
            CURRENT_REVIEWS = productData.reviews;

            // Рендеримо за замовчуванням
            renderReviewsList(CURRENT_REVIEWS);
        })
        .catch(error => {
            reviewsContainer.innerHTML = `<p class="no-reviews">Error loading reviews.</p>`;
        });
}

// Функція, яка просто малює масив відгуків на екрані
function renderReviewsList(reviewsArray) {
    const reviewsContainer = document.querySelector(".product-reviews");
    if (!reviewsContainer) return;

    reviewsContainer.innerHTML = reviewsArray.map(review => `
        <div class="review-card">
            <div class="review-stars">
                ${renderStarsReview(review.rating)}
            </div>
            <h5 class="review-author">${review.name}</h5>
            <p class="review-text">"${review.text}"</p>
            <div class="review-date">Posted on ${formatDateLong(review.date)}</div>
        </div>
    `).join("");
}

function renderStarsReview(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    // Повні зірочки
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fa-solid fa-star"></i>';
    }
    
    // Половина зірочки
    if (hasHalfStar) {
        stars += '<i class="fa-solid fa-star-half-stroke"></i>';
    }
    
    return stars;
}

function formatDateLong(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

// ---------------------------
// TABS FUNCTIONALITY
// ---------------------------
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(`${tabId}-content`).classList.add('active');
        });
    });
}

// ---------------------------
// INITIALIZATION
// ---------------------------
document.addEventListener('DOMContentLoaded', function() {
    // Чекаємо на ініціалізацію LanguageManager
    const waitForLanguageManager = () => {
        return new Promise((resolve) => {
            const checkManager = () => {
                if (window.languageManager && window.languageManager.isInitialized) {
                    resolve(true);
                } else {
                    setTimeout(checkManager, 100);
                }
            };
            checkManager();
        });
    };

    // Ініціалізація сторінки продукту
    async function initializePage() {
        await waitForLanguageManager();
        console.log('✅ LanguageManager ready, loading product data...');
        
        // Завантажуємо продукти
        await loadProductsData();
        
        // Налаштовуємо таби
        setupTabs();
        
        // Завантажуємо відгуки (якщо є ID продукту)
        const params = new URLSearchParams(window.location.search);
        const productId = Number(params.get("id"));
        if (productId) {
            loadProductReviews(productId);
        }
    }

    initializePage();
    
    // Додаємо обробник зміни мови
    window.addEventListener('languageChanged', function(e) {
        console.log('🌍 Language changed on product page, updating...');
        updateProductTranslations();
    });
});

// Глобальна функція для оновлення контенту продукту
window.updateProductContent = function(lang) {
    console.log('🔄 Global updateProductContent called with lang:', lang);
    updateProductTranslations();
};

// Перевірка авторизації для фарбування іконки в шапці сторінки продукту
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
                    icon.style.color = "#00c853"; // Фарбуємо в зелений колір
                } else {
                    userLink.style.color = "#00c853";
                }
                userLink.title = `Профіль: ${user.first_name || 'Користувач'}`;
            }
        } else {
            localStorage.removeItem("token");
        }
    } catch (error) {
        console.error("Помилка перевірки авторизації на сторінці продукту:", error);
    }
});

// ===============================================================
// ПОВНЕ ЖИВЕ СОРТУВАННЯ ВІДГУКІВ НА СТОРІНЦІ ПРОДУКТУ (ОНОВЛЕНО)
// ===============================================================
document.addEventListener('DOMContentLoaded', () => {
    const reviewDropdown = document.getElementById('reviewSortDropdown');
    if (!reviewDropdown) return;

    const trigger = reviewDropdown.querySelector('.dropdown-trigger');
    const targetText = document.getElementById('currentReviewTarget');
    const menuItems = reviewDropdown.querySelectorAll('.dropdown-menu li');

    // 1. Відкрити / закрити меню відгуків
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        reviewDropdown.classList.toggle('open');
    });

    // 2. Вибір елемента зі списку та СОРТУВАННЯ МАСИВУ
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            if (!CURRENT_REVIEWS || CURRENT_REVIEWS.length === 0) {
                reviewDropdown.classList.remove('open');
                return;
            }

            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // Міняємо текст на кнопці
            targetText.textContent = this.textContent;
            const sortValue = this.getAttribute('data-value'); // "latest", "highest", "lowest"

            // Створюємо копію масиву для безпечного сортування
            let sortedReviews = [...CURRENT_REVIEWS];

            if (sortValue === 'highest') {
                sortedReviews.sort((a, b) => b.rating - a.rating); // Найвищий рейтинг першим
            } else if (sortValue === 'lowest') {
                sortedReviews.sort((a, b) => a.rating - b.rating); // Найнижчий рейтинг першим
            } else if (sortValue === 'latest') {
                sortedReviews.sort((a, b) => new Date(b.date) - new Date(a.date)); // Найновіші першими
            }

            // Перемальовуємо відгуки на сторінці відсортованим масивом!
            renderReviewsList(sortedReviews);
            console.log(`✅ Відгуки відсортовано за параметром: ${sortValue}`);

            reviewDropdown.classList.remove('open');
        });
    });

    // 3. Закриваємо меню, якщо клікнули повз нього
    document.addEventListener('click', () => {
        reviewDropdown.classList.remove('open');
    });
});