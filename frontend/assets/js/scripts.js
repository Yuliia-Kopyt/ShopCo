// Додаємо обробник для відстеження кліків по посиланнях
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && link.href) {
            try {
                const currentDomain = window.location.hostname;
                const linkDomain = new URL(link.href).hostname;
                
                // Якщо це внутрішнє посилання
                if (linkDomain === currentDomain) {
                    sessionStorage.setItem('navigationSource', 'internal');
                }
            } catch (error) {
                console.log('Error checking link domain');
            }
        }
    });
});

//БУРГЕР МЕНЮ ТА НАВІГАЦІЯ 
document.addEventListener('DOMContentLoaded', function() {
    const burgerMenu = document.getElementById('burgerMenu');
    const openIcon = document.getElementById('openIcon');
    const closeIcon = document.getElementById('closeIcon');
    const headerNav = document.getElementById('headerNav');

    if (burgerMenu) {
        burgerMenu.addEventListener('click', () => {
            openIcon.classList.toggle('d-none');
            closeIcon.classList.toggle('d-none');
            headerNav.classList.toggle('header-nav-open');
        });
    }

    const submenuParent = document.querySelector(".has-submenu");
    if (submenuParent) {
        submenuParent.querySelector(".submenu-toggle").addEventListener("click", function(e) {
            e.preventDefault();
            submenuParent.classList.toggle("open");
        });
    }
});

//ЗАВАНТАЖУВАЧ ПРОДУКТІВ З ПІДТРИМКОЮ ПЕРЕКЛАДІВ 
class ProductLoader {
    constructor() {
        this.products = [];
        this.loaded = false;
    }

    async loadProducts() {
        try {
            const response = await fetch('./assets/data/product.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            this.products = await response.json();
            this.loaded = true;
            return this.products;
        } catch (error) {
            this.products = this.getFallbackProducts();
            this.loaded = true;
            return this.products;
        }
    }

    getAllProducts() {
        return this.products;
    }

    generateRatingStars(rating) {
        let stars = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fa-solid fa-star"></i>';
        }
        
        if (hasHalfStar) {
            stars += '<i class="fa-solid fa-star-half-stroke"></i>';
        }

        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="fa-regular fa-star"></i>';
        }

        return stars;
    }

    // ОНОВЛЕНА ФУНКЦІЯ - з підтримкою перекладів
    generateProductHTML(product) {
        const discountBadge = product.discount ?
            `<span class="discount">-${product.discount}%</span>` : '';

        const oldPrice = product.oldPrice ?
            `<p class="old-price">$${product.oldPrice}</p>` : '';

        const ratingStars = this.generateRatingStars(product.rating);
        const ratingValue = product.rating.toFixed(1);

        // Отримуємо переклад назви продукту
        const productTitle = this.getProductTitle(product);
        const productDescription = this.getProductDescription(product);

        return `
            <div class="clothes" data-id="${product.id}" data-product-id="${product.id}">
                <div class="image-container">
                    <img src="${product.image}" alt="${productTitle}" onerror="this.src='assets/images/placeholder.png'">
                </div>
                <div class="texts">
                    <p data-product-title>${productTitle}</p>
                    <div class="stars">
                        ${ratingStars}
                        <span>${ratingValue}/5</span>
                    </div>
                    <div class="pricing ${!product.oldPrice ? 'no-discount' : ''}">
                        <p class="current-price">$${product.price}</p>
                        ${oldPrice}
                        ${discountBadge}
                    </div>
                </div>
            </div>
        `;
    }

    // Функції для отримання перекладів продуктів
    getProductTitle(product) {
        if (!window.languageManager || !window.languageManager.isInitialized) {
            console.log('⚠️ LanguageManager not ready, using default title');
            return product.title;
        }
        
        const translated = window.languageManager.getProductTranslation(product.id, 'title');
        console.log(`🔍 Home page translation for product ${product.id}:`, { 
            original: product.title, 
            translated: translated 
        });
        
        return translated || product.title;
    }

    getProductDescription(product) {
        if (!window.languageManager || !window.languageManager.isInitialized) {
            return product.description;
        }
        
        const translated = window.languageManager.getProductTranslation(product.id, 'description');
        return translated || product.description;
    }

    async displayProducts(containerSelector, products = null) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        if (!this.loaded) {
            await this.loadProducts();
        }

        let productsToShow = products || this.products;
        if (productsToShow.length === 0) {
            const noProductsText = window.languageManager ? 
                window.languageManager.t('home.no_products') : 
                'Продукти не знайдено';
            container.innerHTML = `<p class="no-products">${noProductsText}</p>`;
            return;
        }

        container.innerHTML = productsToShow.map(product =>
            this.generateProductHTML(product)
        ).join('');
    }

    // Функція для оновлення перекладів продуктів на головній сторінці
    updateHomePageTranslations() {
        console.log('🔄 Updating home page product translations...');
        
        const productElements = document.querySelectorAll('.clothes[data-product-id]');
        productElements.forEach(element => {
            const productId = element.getAttribute('data-product-id');
            const titleElement = element.querySelector('[data-product-title]');
            
            if (titleElement && window.languageManager) {
                const translatedTitle = this.getProductTitle({ id: productId, title: titleElement.textContent });
                if (translatedTitle) {
                    titleElement.textContent = translatedTitle;
                }
            }
        });
    }
}

//  ПЕРЕХІД НА СТОРІНКУ ПРОДУКТУ 
function setupProductClickHandlers() {
    document.addEventListener('click', function(e) {
        const productCard = e.target.closest('.clothes');
        if (productCard) {
            e.preventDefault();
            const productId = productCard.getAttribute('data-id');
            if (productId) {
                window.location.href = `product.html?id=${productId}`;
            }
        }
    });

    const productCards = document.querySelectorAll('.clothes');
    productCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });
}

function setupProductInteractions() {
    const viewAllButtons = document.querySelectorAll('.new-arrivals .btn, .top-selling .btn');
    viewAllButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function() {
                window.location.href = 'shop.html';
            });
        }
    });
}

// КАРУСЕЛЬ ВІДГУКІВ
function initFeedbackSlider() {
    const container = document.querySelector('.feedback-container');
    const leftBtn = document.querySelector('.arrow-left');
    const rightBtn = document.querySelector('.arrow-right');

    if (!container || !leftBtn || !rightBtn) return;

    fetch("assets/data/reviews.json")
        .then(r => r.json())
        .then(data => {
            const mainReviews = data.global;
            container.innerHTML = mainReviews.map(r => `
                <div class="border">
                    <div class="feedback-box">
                        <div class="stars">${renderStars(r.rating)}</div>
                        <h5>${r.name} <span><i class="fa-solid fa-circle-check"></i></span></h5>
                        <p>"${r.text}"</p>
                    </div>
                </div>
            `).join("");

            initSlider();
        })
        .catch(err => console.error("❌ Can't load reviews.json", err));

    function renderStars(rating) {
        const full = Math.floor(rating);
        const half = rating % 1 !== 0;
        return `<i class="fa-solid fa-star"></i>`.repeat(full) +
               (half ? `<i class="fa-solid fa-star-half"></i>` : "");
    }

    function initSlider() {
        const feedbacks = document.querySelectorAll(".feedback-container .border");
        let currentIndex = 0;

        const getVisibleCount = () => {
            const containerWidth = container.offsetWidth;
            const cardWidth = feedbacks[0]?.offsetWidth || 300;
            return Math.floor(containerWidth / cardWidth);
        };

        const scrollToIndex = (index) => {
            const cardWidth = feedbacks[0]?.offsetWidth || 300;
            container.scrollTo({
                left: cardWidth * index,
                behavior: "smooth"
            });
            currentIndex = index;
            updateBlur();
        };

        const updateBlur = () => {
            const visibleCount = getVisibleCount();
            feedbacks.forEach((card, idx) => {
                if (visibleCount === 1) {
                    card.classList.remove("blur");
                } else {
                    card.classList.toggle("blur", !(idx >= currentIndex && idx < currentIndex + visibleCount));
                }
            });
        };

        rightBtn.addEventListener("click", () => {
            const visibleCount = getVisibleCount();
            if (currentIndex < feedbacks.length - visibleCount) {
                scrollToIndex(currentIndex + 1);
            }
        });

        leftBtn.addEventListener("click", () => {
            if (currentIndex > 0) {
                scrollToIndex(currentIndex - 1);
            }
        });

        window.addEventListener("resize", updateBlur);
        updateBlur();
    }
}

// CART MANAGEMENT 
function updateCartCount() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        const cartCountElements = document.querySelectorAll('.cart-count');
        cartCountElements.forEach(element => {
            if (totalItems > 0) {
                element.textContent = totalItems > 99 ? '99+' : totalItems;
                element.style.display = 'flex';
            } else {
                element.style.display = 'none';
            }
        });
    } catch (error) {
        // Обробка помилок
    }
}

function animateCartIcon() {
    const cartIcon = document.querySelector('.fa-cart-shopping');
    const cartLink = document.querySelector('.cart-icon-animation');
    const cartCount = document.querySelector('.cart-count');
    
    if (cartIcon && cartLink) {
        cartLink.classList.add('cart-pulse');
        cartIcon.classList.add('cart-pulse');
        if (cartCount) cartCount.classList.add('cart-badge-pop');
        
        setTimeout(() => {
            cartLink.classList.remove('cart-pulse');
            cartIcon.classList.remove('cart-pulse');
            if (cartCount) cartCount.classList.remove('cart-badge-pop');
        }, 600);
    }
}

function showNotification(message, type = 'success') {
    alert(message);
}

// ЯКОРНІ ПОСИЛАННЯ 
function initAnchorLinks() {
    const anchorLinks = document.querySelectorAll('a.anchor-link');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = this.getAttribute('data-target');
            const currentPage = window.location.pathname;
            const isHomePage = currentPage === '/' || currentPage === '/index.html';
            
            if (isHomePage) {
                scrollToSection(targetSection);
            } else {
                window.location.href = `/${targetSection !== 'home' ? '#' + targetSection : ''}`;
            }
        });
    });

    function scrollToSection(sectionId) {
        const targetElement = document.getElementById(sectionId);
        if (targetElement) {
            const headerHeight = document.querySelector('header')?.offsetHeight || 0;
            const offsetTop = targetElement.offsetTop - headerHeight;
            window.scrollTo({ top: offsetTop, behavior: 'smooth' });
        }
    }

    if (window.location.hash) {
        const sectionId = window.location.hash.replace('#', '');
        setTimeout(() => scrollToSection(sectionId), 100);
    }
}

// --- ДІАГНОСТИКА ТА КЕРУВАННЯ АВТОРИЗАЦІЄЮ ---
document.addEventListener("DOMContentLoaded", async () => {
    console.log("=== Скрипт перевірки статусу запустився! ===");
    
    const userLink = document.getElementById("userAuthLink");
    console.log("Шукаємо іконку користувача (userAuthLink):", userLink);

    const token = localStorage.getItem("token");
    console.log("Значення токена в пам'яті браузера:", token);

    if (!token) {
        console.log("Токена немає. Користувач вважається неавторизованим.");
        return;
    }

    try {
        console.log("Токен є! Відправляємо запит на бекенд http://localhost:8000/auth/me ...");
        const response = await fetch("http://localhost:8000/auth/me", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        console.log("Статус відповіді від бекенду:", response.status);

        if (response.ok) {
            const user = await response.json();
            console.log("Успіх! Дані користувача отримано:", user);
            
            if (userLink) {
                console.log("Міняємо посилання іконки на profile.html та фарбуємо її");
                userLink.href = "profile.html";
                
                // Перевіряємо, чи є іконка всередині посилання, і фарбуємо її
                const icon = userLink.querySelector('i');
                if (icon) {
                    icon.style.color = "#00c853";
                    console.log("Іконку успішно пофарбовано в зелений колір!");
                } else {
                    userLink.style.color = "#00c853";
                    console.log("Тег іконки не знайдено, пофарбовано саме посилання.");
                }
                userLink.title = `Профіль: ${user.first_name || 'Користувач'}`;
            } else {
                console.error("КРИТИЧНО: Елемент з id='userAuthLink' не знайдено на сторінці!");
            }
        } else {
            console.log("Бекенд відхилив токен (можливо, він застарів). Очищаємо пам'ять.");
            localStorage.removeItem("token");
        }
    } catch (error) {
        console.error("Помилка зв'язку з бекендом під час fetch:", error);
    }
});

// ОНОВЛЕННЯ ПЕРЕКЛАДІВ НА ГОЛОВНІЙ СТОРІНЦІ 
function updateHomePageContent() {
    console.log('🔄 Updating home page content translations...');
    
    // Оновлюємо продукти
    if (window.productLoader && typeof window.productLoader.updateHomePageTranslations === 'function') {
        window.productLoader.updateHomePageTranslations();
    }
    
    // Оновлюємо тексти кнопок та інші елементи
    const viewAllButtons = document.querySelectorAll('.new-arrivals .btn, .top-selling .btn');
    viewAllButtons.forEach(btn => {
        if (btn && window.languageManager) {
            const translation = window.languageManager.t('home.view_all');
            if (translation && translation !== 'home.view_all') {
                btn.textContent = translation;
            }
        }
    });
}

// ГОЛОВНА ІНІЦІАЛІЗАЦІЯ 
document.addEventListener('DOMContentLoaded', async function() {
    // Ініціалізація всіх модулів
    window.productLoader = new ProductLoader();
    updateCartCount();
    initAnchorLinks();
    initFeedbackSlider();

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

    // Завантаження продуктів
    const newArrivalsContainer = document.getElementById('new-arrivals-container');
    const topSellingContainer = document.getElementById('top-selling-container');

    if (newArrivalsContainer || topSellingContainer) {
        try {
            // Чекаємо на LanguageManager перед завантаженням продуктів
            await waitForLanguageManager();
            console.log('✅ LanguageManager ready, loading products...');
            
            await productLoader.loadProducts();
            const allProducts = productLoader.getAllProducts();

            if (newArrivalsContainer) {
                const newArrivals = allProducts.slice(0, 4);
                await productLoader.displayProducts('#new-arrivals-container', newArrivals);
            }

            if (topSellingContainer) {
                const topSelling = allProducts.slice(4, 8);
                await productLoader.displayProducts('#top-selling-container', topSelling);
            }

            setupProductInteractions();
            setupProductClickHandlers();

        } catch (error) {
            console.error('❌ Error loading products:', error);
        }
    }

    // Додаємо обробник зміни мови для головної сторінки
    window.addEventListener('languageChanged', function(e) {
        console.log('🌍 Language changed on home page, updating...');
        updateHomePageContent();
    });
});

// Глобальні функції
window.updateCartCount = updateCartCount;
window.animateCartIcon = animateCartIcon;
window.showNotification = showNotification;
window.updateHomePageContent = updateHomePageContent;

// =========================================================================
// MEGA DEAL COUNTDOWN & POPUP LOGIC (WITH SESSION PROTECTION)
// =========================================================================
document.addEventListener('DOMContentLoaded', function() {
    const popup = document.getElementById('megaDealPopup');
    
    if (popup) {
        // Перевіряємо, чи це внутрішній перехід або чи користувач уже закривав поп-ап
        const isInternalNavigation = sessionStorage.getItem('navigationSource') === 'internal';
        const hasSeenPopup = sessionStorage.getItem('hasSeenMegaDeal') === 'true';

        if (isInternalNavigation || hasSeenPopup) {
            // Якщо так — ховаємо вікно
            popup.style.display = 'none';
        } else {
            // Якщо ні (перший захід) — показуємо
            popup.style.display = 'flex';
            startMegaCountdown();
        }
        
        // Очищаємо прапорець внутрішньої навігації для наступних прямих заходів
        sessionStorage.removeItem('navigationSource');
    }
});

function startMegaCountdown() {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 5);
    
    function updateMegaTimer() {
        const now = new Date();
        const diff = targetDate - now;
        
        if (diff <= 0) return;
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        const dEl = document.getElementById('megaDays');
        const hEl = document.getElementById('megaHours');
        const mEl = document.getElementById('megaMins');
        const sEl = document.getElementById('megaSecs');

        if (dEl) dEl.textContent = days.toString().padStart(2, '0');
        if (hEl) hEl.textContent = hours.toString().padStart(2, '0');
        if (mEl) mEl.textContent = minutes.toString().padStart(2, '0');
        if (sEl) sEl.textContent = seconds.toString().padStart(2, '0');
    }
    
    updateMegaTimer();
    setInterval(updateMegaTimer, 1000);
}

function closeMegaDeal() {
    const popup = document.getElementById('megaDealPopup');
    if (popup) {
        popup.style.display = 'none';
        // Запам'ятовуємо, що користувач уже побачив і закрив вікно
        sessionStorage.setItem('hasSeenMegaDeal', 'true');
    }
}

window.closeMegaDeal = closeMegaDeal;