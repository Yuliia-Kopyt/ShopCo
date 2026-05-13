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

// МОДАЛЬНЕ ВІКНО 
class AuthModal {
    constructor() {
        this.modal = document.getElementById('authModal');
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.closeBtn = document.querySelector('.auth-close-btn');
        this.switchToRegisterLinks = document.querySelectorAll('.switch-to-register');
        this.switchToLoginLinks = document.querySelectorAll('.switch-to-login');
        
        if (this.modal) this.init();
    }
    
    init() {
        this.setupUserIcons();
        this.closeBtn?.addEventListener('click', () => this.closeModal());
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        this.switchToRegisterLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchToRegister();
            });
        });
        
        this.switchToLoginLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchToLogin();
            });
        });
        
        this.setupFormHandlers();
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal?.style.display === 'block') {
                this.closeModal();
            }
        });
    }
  
    setupUserIcons() {
        const userIcons = document.querySelectorAll('a.icon-link .fa-circle-user, a.icon-link .fa-user');
        userIcons.forEach(icon => {
            const link = icon.closest('a.icon-link');
            if (link) {
                link.href = '#';
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.openModal('login');
                });
            }
        });
        
        const loginLinks = document.querySelectorAll('a[href="login.html"]');
        loginLinks.forEach(link => {
            link.href = '#';
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal('login');
            });
        });
    }
  
    openModal(formType = 'login') {
        if (!this.modal) return;
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        formType === 'login' ? this.switchToLogin() : this.switchToRegister();
    }
  
    closeModal() {
        if (!this.modal) return;
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
    }
  
    switchToLogin() {
        this.registerForm?.classList.remove('active');
        this.loginForm?.classList.add('active');
    }
  
    switchToRegister() {
        this.loginForm?.classList.remove('active');
        this.registerForm?.classList.add('active');
    }
  
    setupFormHandlers() {
        const loginForm = this.loginForm?.querySelector('form');
        const registerForm = this.registerForm?.querySelector('form');
        
        loginForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        registerForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
    }
  
    handleLogin() {
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;
        console.log('Login attempt:', { email, password });
        this.showMessage('Successfully signed in!', 'success');
        this.closeModal();
    }
  
    handleRegister() {
        const name = document.getElementById('registerName')?.value;
        const email = document.getElementById('registerEmail')?.value;
        const password = document.getElementById('registerPassword')?.value;
        const confirmPassword = document.getElementById('registerConfirmPassword')?.value;
        
        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match!', 'error');
            return;
        }
        
        console.log('Registration attempt:', { name, email, password });
        this.showMessage('Account created successfully!', 'success');
        this.switchToLogin();
    }
  
    showMessage(message, type = 'info') {
        alert(message);
    }
}

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
    new AuthModal();
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

// Mega Deal Countdown
document.addEventListener('DOMContentLoaded', function() {
    const popup = document.getElementById('megaDealPopup');
    if (popup) {
        popup.style.display = 'flex';
        startMegaCountdown();
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
        
        document.getElementById('megaDays').textContent = days.toString().padStart(2, '0');
        document.getElementById('megaHours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('megaMins').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('megaSecs').textContent = seconds.toString().padStart(2, '0');
    }
    
    updateMegaTimer();
    setInterval(updateMegaTimer, 1000);
}

function closeMegaDeal() {
    const popup = document.getElementById('megaDealPopup');
    if (popup) {
        popup.style.display = 'none';
    }
}

window.closeMegaDeal = closeMegaDeal;