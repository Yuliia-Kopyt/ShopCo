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

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.header-search');
    const clearSearchBtn = document.querySelector('.clear-search-icon');
    
    if (searchInput) {
        const params = new URLSearchParams(window.location.search);
        const currentQuery = params.get('search');
        
        // Якщо повернулися на сторінку, а в URL є запит — записуємо в інпут
        if (currentQuery) {
            searchInput.value = currentQuery;
        }

        if (params.get('focus') === 'search') {
            const searchWrapper = document.querySelector('.search-wrapper');
            if (searchWrapper) {
                searchWrapper.style.display = 'flex'; 
                searchWrapper.style.margin = '10px 15px'; // Акуратний мобільний відступ
                
                // Ставимо курсор в поле (підніметься клавіатура)
                setTimeout(() => searchInput.focus(), 100); 
            }
        }

        // Функція, яка показує або ховає хрестик залежно від тексту в інпуті
        function toggleClearButton() {
            if (clearSearchBtn) {
                if (searchInput.value.trim().length > 0) {
                    clearSearchBtn.style.display = 'block';
                } else {
                    clearSearchBtn.style.display = 'none';
                }
            }
        }

        // Перевіряємо стан кнопки при завантаженні сторінки
        toggleClearButton();

        // Стежимо за введенням тексту, щоб вчасно ховати/показувати хрестик
        searchInput.addEventListener('input', toggleClearButton);

        // Слухаємо натискання Enter для пошуку
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                
                if (query) {
                    window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
                } else {
                    window.location.href = 'shop.html';
                }
            }
        });

        // ЛОГІКА КЛІКУ НА ХРЕСТИК
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = ''; // Очищаємо інпут
                toggleClearButton();    // Ховаємо хрестик
                
                // Перевіряємо, де ми зараз перебуваємо
                const params = new URLSearchParams(window.location.search);
                
                if (params.has('search')) {
                    // Якщо ми вже на сторінці каталогу, просто прибираємо параметр пошуку з URL і перезавантажуємо товари
                    params.delete('search');
                    
                    // Формуємо чисте посилання (якщо є інші фільтри, вони збережуться)
                    const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
                    window.history.replaceState({}, '', newUrl);
                    
                    // Очищаємо стан у нашому shop.js та запускаємо перемальовку
                    if (typeof state !== 'undefined') {
                        state.query = "";
                        state.page = 1; // Скидаємо сторінку на першу
                        if (typeof render === 'function') render();
                    } else {
                        // Якщо об'єкт state з якоїсь причини недоступний напряму, просто освіжимо сторінку
                        window.location.href = 'shop.html';
                    }
                }
            });
        }
    }
});

//ЗАВАНТАЖУВАЧ ПРОДУКТІВ З ПІДТРИМКОЮ БЕКЕНДУ ТА ПЕРЕКЛАДІВ 
if (!window.ProductLoader) {
    window.ProductLoader = class ProductLoader { // 🌟 ОСЬ ТУТ: прибрали зайву дужку перед назвою
        constructor() {
            this.products = [];
            this.loaded = false;
        }

        async loadProducts() {
            try {
                // 🌟 Міняємо запит зі старого JSON на твій реальний FastAPI бекенд
                const response = await fetch('http://localhost:8000/products');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                this.products = await response.json();
                this.loaded = true;
                return this.products;
            } catch (error) {
                console.warn("⚠️ Не вдалося завантажити продукти з бекенду, вмикаємо резервні дані:", error);
                // 🌟 Тепер функція getFallbackProducts існує і скрипт не падатиме!
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
            const fullStars = Math.floor(rating || 5);
            const hasHalfStar = (rating % 1) >= 0.5;

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

        generateProductHTML(product) {
            // Захист на випадок, якщо якісь поля з бази прийдуть пустими
            const currentPrice = product.price || 0;
            const oldPriceHtml = product.old_price || product.oldPrice ? 
                `<p class="old-price">$${product.old_price || product.oldPrice}</p>` : '';
            
            let discountPercent = product.discount;
            if (!discountPercent && (product.old_price || product.oldPrice)) {
                const old = product.old_price || product.oldPrice;
                discountPercent = Math.round(((old - currentPrice) / old) * 100);
            }
            const discountBadge = discountPercent ? `<span class="discount">-${discountPercent}%</span>` : '';

            const ratingVal = product.rating ? Number(product.rating) : 5.0;
            const ratingStars = this.generateRatingStars(ratingVal);

            const productTitle = this.getProductTitle(product);
            const productImg = product.image || 'assets/images/placeholder.png';

            return `
                <div class="clothes" data-id="${product.id}" data-product-id="${product.id}">
                    <div class="image-container">
                        <img src="${productImg}" alt="${productTitle}" onerror="this.src='assets/images/placeholder.png'">
                    </div>
                    <div class="texts">
                        <p data-product-title>${productTitle}</p>
                        <div class="stars">
                            ${ratingStars}
                            <span>${ratingVal.toFixed(1)}/5</span>
                        </div>
                        <div class="pricing ${!(product.old_price || product.oldPrice) ? 'no-discount' : ''}">
                            <p class="current-price">$${currentPrice}</p>
                            ${oldPriceHtml}
                            ${discountBadge}
                        </div>
                    </div>
                </div>
            `;
        }

        getProductTitle(product) {
            if (!window.languageManager || !window.languageManager.isInitialized) {
                return product.title || `Товар #${product.id}`;
            }
            
            // 🌟 ВИПРАВЛЕНО: додано захист `product.translations &&`
            if (product.translations && product.translations.length > 0) {
                const currentLang = window.languageManager.currentLang || 'en';
                const target = product.translations.find(t => (t.language || '').toLowerCase() === currentLang);
                if (target && target.title) return target.title;
            }

            const translated = window.languageManager.getProductTranslation(product.id, 'title');
            return translated || product.title || `Товар #${product.id}`;
        }

        getProductDescription(product) {
            if (!window.languageManager || !window.languageManager.isInitialized) {
                return product.description || '';
            }
            // 🌟 ВИПРАВЛЕНО: додано захист `product.translations &&`
            if (product.translations && product.translations.length > 0) {
                const currentLang = window.languageManager.currentLang || 'en';
                const target = product.translations.find(t => (t.language || '').toLowerCase() === currentLang);
                if (target && target.description) return target.description;
            }
            const translated = window.languageManager.getProductTranslation(product.id, 'description');
            return translated || product.description || '';
        }

        async displayProducts(containerSelector, products = null) {
            const container = document.querySelector(containerSelector);
            if (!container) return;

            if (!this.loaded) {
                await this.loadProducts();
            }

            let productsToShow = products || this.products;
            if (!productsToShow || productsToShow.length === 0) {
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

        updateHomePageTranslations() {
            console.log('🔄 Updating home page product translations...');
            const productElements = document.querySelectorAll('.clothes[data-product-id]');
            productElements.forEach(element => {
                const productId = Number(element.getAttribute('data-product-id'));
                const titleElement = element.querySelector('[data-product-title]');
                
                // Шукаємо оригінальний об'єкт продукту в пам'яті, щоб знати його translations
                const originalProduct = this.products.find(p => p.id === productId);
                
                if (titleElement && originalProduct) {
                    const translatedTitle = this.getProductTitle(originalProduct);
                    if (translatedTitle) {
                        titleElement.textContent = translatedTitle;
                    }
                }
            });
        }

        // 🌟 РЕЗЕРВНІ ПРОДУКТИ (якщо бекенд недоступний, сторінка не буде порожньою)
        getFallbackProducts() {
            return [
                { id: 1, title: "Футболка з смугастими рукавами", price: 130, old_price: 150, rating: 4.5, image: "assets/images/placeholder.png" },
                { id: 2, title: "Футболка з стрічковими деталями", price: 240, old_price: null, rating: 4.8, image: "assets/images/placeholder.png" },
                { id: 3, title: "Бермуди вільного крою", price: 80, old_price: 100, rating: 4.2, image: "assets/images/placeholder.png" },
                { id: 4, title: "Графічна футболка з градієнтом", price: 145, old_price: null, rating: 4.7, image: "assets/images/placeholder.png" },
                { id: 5, title: "Сорочка в клітинку", price: 120, old_price: 160, rating: 4.6, image: "assets/images/placeholder.png" },
                { id: 6, title: "Класичні джинси", price: 200, old_price: null, rating: 4.4, image: "assets/images/placeholder.png" }
            ];
        }
    }; // 🌟 ЗАКРИВАЄМО КЛАС
} // 🌟 ЗАКРИВАЄМО IF

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

// =========================================================================
// СИСТЕМА КАСТОМНИХ СПОВІЩЕНЬ (TOASTS) — ЗАМІНА СТАРОГО ALERT
// =========================================================================
function showNotification(message, type = 'success', duration = 4000) {
    // 1. Перевіряємо наявність контейнера у DOM. Якщо немає — створюємо один раз
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Адаптуємо тип 'error' під наш стиль 'warning' для зворотної сумісності
    const toastType = type === 'error' ? 'warning' : type;

    // 2. Визначаємо іконку FontAwesome залежно від типу
    let iconClass = 'fas fa-check-circle'; // за замовчуванням для success
    if (toastType === 'warning') {
        iconClass = 'fas fa-exclamation-triangle';
    }

    // 3. Конструюємо структуру тосту
    const toast = document.createElement('div');
    toast.className = `toast ${toastType}`;
    toast.innerHTML = `
        <i class="${iconClass} toast-icon"></i>
        <span class="toast-message">${message}</span>
    `;

    // 4. Додаємо новий тост у контейнер
    container.appendChild(toast);

    // 5. Тригеримо запуск CSS-анімації висунення
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // 6. Таймер автоматичного закриття
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');

        // Видаляємо елемент із DOM після завершення CSS-анімації згасання
        toast.addEventListener('transitionend', () => {
            toast.remove();
            
            // Якщо контейнер порожній — прибираємо його повністю
            if (container.children.length === 0) {
                container.remove();
            }
        });
    }, duration);
}

// Створюємо аліас showToast, щоб ти міг викликати функцію обома іменами
window.showToast = showNotification;

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
            const sessionMsg = window.languageManager.t('toast.session_expired');
                        showNotification(sessionMsg, "warning");        }
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

// ======================== ЛОГІКА ПІДПИСКИ НА РОЗСИЛКУ ========================
document.addEventListener('DOMContentLoaded', () => {
    const newsletterForm = document.getElementById('newsletterForm');
    const emailInput = document.getElementById('newsletterEmail');

    if (newsletterForm && emailInput) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Захист від перезавантаження сторінки
            
            const emailValue = emailInput.value.trim();
            if (!emailValue) return;

            try {
                // Запит на твій FastAPI ендпоінт підписки
                const response = await fetch('http://localhost:8000/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: emailValue })
                });

                if (response.ok) {
                    // Успішна підписка з JSON
                    const successMsg = window.languageManager.t('toast.subscribe_success');
                    showNotification(successMsg, 'success');
                    newsletterForm.reset(); // Очищуємо інпут
                } else {
                    const errorData = await response.json();
                    const errorLabel = window.languageManager.t('toast.subscribe_error');
                    
                    // Виводимо заголовок помилки з JSON + деталь від бекенду
                    showNotification(`${errorLabel}: ${errorData.detail || ''}`, 'error');
                }
            } catch (error) {
                console.error('Помилка підписки:', error);
                // Помилка з'єднання з сервером з JSON
                const serverErrorMsg = window.languageManager.t('toast.subscribe_server_error');
                showNotification(serverErrorMsg, 'error');
            }
        });
    }
});

