// Complete Language Manager with Product Translations
class LanguageManager {
    constructor() {
        this.currentLang = localStorage.getItem('preferredLanguage') || 'en';
        this.translations = {};
        this.productTranslations = null; // Змінимо на null для кращого відстеження
        this.isInitialized = false;
        console.log('🌍 LanguageManager initialized, current lang:', this.currentLang);
        this.init();
    }

    async init() {
        console.log('🔄 Starting initialization...');
        await this.loadAllTranslations();
        await this.loadProductTranslations();
        this.isInitialized = true;
        this.applyLanguage(this.currentLang);
        this.setupLanguageSwitcher();
        this.setupDynamicContentHandlers();
    }

    async loadAllTranslations() {
        try {
            console.log('📥 Loading translations from: ./assets/data/translation.json');
            const response = await fetch('./assets/data/translation.json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.translations = await response.json();
            console.log('✅ Main translations loaded successfully');
            
        } catch (error) {
            console.error('❌ ERROR loading translations:', error);
            // Create minimal fallback translations
            this.translations = {
                en: { 
                    header: { shop: "Shop" },
                    home: { hero_title: "Find clothes that matches your style" }
                },
                uk: { 
                    header: { shop: "Магазин" },
                    home: { hero_title: "Знайдіть одяг який відповідає вашому стилю" }
                }
            };
        }
    }

    async loadProductTranslations() {
        try {
            console.log('📥 Loading product translations from: ./assets/data/producttranslation.json');
            const response = await fetch('./assets/data/producttranslation.json');
            
            if (response.ok) {
                this.productTranslations = await response.json();
                console.log('✅ Product translations loaded successfully:', this.productTranslations);
            } else {
                console.warn('⚠️ Product translations file not found, using fallback');
                this.productTranslations = { en: {}, uk: {} };
            }
        } catch (error) {
            console.error('❌ ERROR loading product translations:', error);
            this.productTranslations = { en: {}, uk: {} };
        }
    }

    async switchLanguage(lang) {
        console.log('🔄 Switching to language:', lang);
        
        if (this.currentLang === lang) {
            console.log('✅ Same language, skipping');
            return;
        }
        
        this.currentLang = lang;
        localStorage.setItem('preferredLanguage', lang);
        
        this.applyLanguage(lang);
        this.updateLanguageSwitcher(lang);
        
        // Trigger product translation updates
        this.updateProductTranslations();
        
        // Dispatch custom event for other scripts
        window.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: lang } 
        }));
    }

    applyLanguage(lang) {
        console.log('🎯 Applying language:', lang);
        
        if (!this.translations[lang]) {
            console.warn('⚠️ No translations for language:', lang);
            return;
        }

        const elements = document.querySelectorAll('[data-i18n]');
        console.log(`📝 Found ${elements.length} elements to translate`);

        let updatedCount = 0;
        let missingCount = 0;

        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.getTranslation(key, lang);
            
            if (translation) {
                if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'email')) {
                    element.placeholder = translation;
                } else if (element.tagName === 'TITLE') {
                    element.textContent = translation;
                } else {
                    element.textContent = translation;
                }
                updatedCount++;
            } else {
                console.warn(`❌ No translation for: ${key}`);
                missingCount++;
            }
        });

        // Update HTML lang attribute
        document.documentElement.lang = lang;
        
        console.log(`✅ Language ${lang} applied: ${updatedCount} updated, ${missingCount} missing`);
    }

    getTranslation(key, lang = this.currentLang) {
        if (!this.translations[lang]) {
            return null;
        }

        try {
            const keys = key.split('.');
            let value = this.translations[lang];
            
            for (const k of keys) {
                if (value && typeof value === 'object' && k in value) {
                    value = value[k];
                } else {
                    return null;
                }
            }
            return value;
        } catch (error) {
            console.warn(`Error getting translation for ${key}:`, error);
            return null;
        }
    }

    // Product translation methods - ВИПРАВЛЕНІ
    getProductTranslation(productId, field, lang = this.currentLang) {
        // Перевіряємо, чи завантажені переклади
        if (!this.productTranslations || !this.productTranslations[lang]) {
            console.warn(`❌ Product translations not loaded for language: ${lang}`, {
                hasProductTranslations: !!this.productTranslations,
                currentLang: lang,
                availableLangs: this.productTranslations ? Object.keys(this.productTranslations) : 'none'
            });
            return null;
        }
        
        try {
            // Конвертуємо productId в рядок для безпеки
            const idStr = String(productId);
            const products = this.productTranslations[lang].products;
            
            if (!products || !products[idStr]) {
                console.warn(`❌ No translation found for product ${idStr}, field: ${field}`);
                return null;
            }
            
            const translation = products[idStr][field];
            console.log(`✅ Product translation found:`, { 
                productId: idStr, 
                field, 
                translation,
                availableProducts: Object.keys(products)
            });
            
            return translation || null;
        } catch (error) {
            console.warn(`Error getting product translation for ${productId}.${field}:`, error);
            return null;
        }
    }

    getCategoryTranslation(category, lang = this.currentLang) {
        if (!this.productTranslations || !this.productTranslations[lang]) {
            console.warn('❌ Product translations not loaded for category');
            return category;
        }
        
        const translation = this.productTranslations[lang]?.categories?.[category];
        console.log(`🏷️ Category translation:`, { category, translation });
        return translation || category;
    }

    getStyleTranslation(style, lang = this.currentLang) {
        if (!this.productTranslations || !this.productTranslations[lang]) {
            console.warn('❌ Product translations not loaded for style');
            return style;
        }
        
        const translation = this.productTranslations[lang]?.styles?.[style];
        console.log(`🎨 Style translation:`, { style, translation });
        return translation || style;
    }

    getColorTranslation(color, lang = this.currentLang) {
        if (!this.productTranslations || !this.productTranslations[lang]) {
            console.warn('❌ Product translations not loaded for color');
            return color;
        }
        
        const translation = this.productTranslations[lang]?.colors?.[color];
        console.log(`🎨 Color translation:`, { color, translation });
        return translation || color;
    }

    getSizeTranslation(size, lang = this.currentLang) {
        if (!this.productTranslations || !this.productTranslations[lang]) {
            console.warn('❌ Product translations not loaded for size');
            return size;
        }
        
        const translation = this.productTranslations[lang]?.sizes?.[size];
        console.log(`📏 Size translation:`, { size, translation });
        return translation || size;
    }

    updateProductTranslations() {
        console.log('🔄 Updating product translations across the site...');
        
        // This will be called by product.js and shop.js to update product content
        if (typeof window.updateProductContent === 'function') {
            console.log('📞 Calling updateProductContent');
            window.updateProductContent(this.currentLang);
        }
        if (typeof window.updateProductsContent === 'function') {
            console.log('📞 Calling updateProductsContent');
            window.updateProductsContent(this.currentLang);
        }
        
        // Update cart content if on cart page
        if (typeof window.cart !== 'undefined' && typeof window.cart.updateCartTranslations === 'function') {
            console.log('📞 Calling cart.updateCartTranslations');
            window.cart.updateCartTranslations(this.currentLang);
        }
        
        // Direct DOM updates for product elements
        this.updateProductElements();
    }

    updateProductElements() {
        // Оновлюємо елементи продуктів, які вже є в DOM
        const productElements = document.querySelectorAll('[data-product-id]');
        console.log(`🔄 Updating ${productElements.length} product elements`);
        
        productElements.forEach(element => {
            const productId = element.getAttribute('data-product-id');
            const titleElement = element.querySelector('[data-product-title]');
            const descriptionElement = element.querySelector('[data-product-description]');
            
            if (titleElement) {
                const translatedTitle = this.getProductTranslation(productId, 'title');
                if (translatedTitle) {
                    titleElement.textContent = translatedTitle;
                }
            }
            
            if (descriptionElement) {
                const translatedDescription = this.getProductTranslation(productId, 'description');
                if (translatedDescription) {
                    descriptionElement.textContent = translatedDescription;
                }
            }
        });
    }

    setupLanguageSwitcher() {
        console.log('🔧 Setting up language switcher...');
        
        const buttons = document.querySelectorAll('.lang-btn');
        console.log(`🔘 Found ${buttons.length} language buttons`);
        
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const lang = btn.getAttribute('data-lang');
                console.log('👆 Button clicked, language:', lang);
                this.switchLanguage(lang);
            });
        });

        this.updateLanguageSwitcher(this.currentLang);
        console.log('✅ Language switcher ready');
    }

    updateLanguageSwitcher(activeLang) {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            const btnLang = btn.getAttribute('data-lang');
            if (btnLang === activeLang) {
                btn.classList.add('active');
                btn.style.pointerEvents = 'none';
            } else {
                btn.classList.remove('active');
                btn.style.pointerEvents = 'auto';
            }
        });
    }

    setupDynamicContentHandlers() {
        // Handle dynamic content that might be added later
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            // Check if added node has data-i18n attributes
                            if (node.hasAttribute && node.hasAttribute('data-i18n')) {
                                const key = node.getAttribute('data-i18n');
                                const translation = this.getTranslation(key);
                                if (translation) {
                                    node.textContent = translation;
                                }
                            }
                            
                            // Check children of added node
                            if (node.querySelectorAll) {
                                node.querySelectorAll('[data-i18n]').forEach(element => {
                                    const key = element.getAttribute('data-i18n');
                                    const translation = this.getTranslation(key);
                                    if (translation) {
                                        if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'email')) {
                                            element.placeholder = translation;
                                        } else {
                                            element.textContent = translation;
                                        }
                                    }
                                });
                            }
                        }
                    });
                }
            });
        });

        // Start observing the document body for changes
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Helper method to get translation in other scripts
    t(key) {
        return this.getTranslation(key) || key;
    }

    // Method to refresh translations (useful if JSON files change)
    async refreshTranslations() {
        await this.loadAllTranslations();
        await this.loadProductTranslations();
        this.applyLanguage(this.currentLang);
        this.updateProductTranslations();
    }

    // Додатковий метод для перевірки стану
    getStatus() {
        return {
            currentLang: this.currentLang,
            isInitialized: this.isInitialized,
            hasTranslations: !!this.translations[this.currentLang],
            hasProductTranslations: !!this.productTranslations,
            productTranslations: this.productTranslations,
            translationKeys: this.translations[this.currentLang] ? Object.keys(this.translations[this.currentLang]) : [],
            productTranslationKeys: this.productTranslations && this.productTranslations[this.currentLang] ? 
                Object.keys(this.productTranslations[this.currentLang]) : []
        };
    }

    // Метод для очікування ініціалізації
    waitForInitialization() {
        return new Promise((resolve) => {
            const checkInit = () => {
                if (this.isInitialized) {
                    resolve(true);
                } else {
                    setTimeout(checkInit, 100);
                }
            };
            checkInit();
        });
    }
}

// Initialize language manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, initializing LanguageManager...');
    window.languageManager = new LanguageManager();
    
    // Додаємо глобальну функцію для дебагу
    window.getLanguageStatus = function() {
        return window.languageManager ? window.languageManager.getStatus() : 'LanguageManager not initialized';
    };
});

// Fallback initialization in case DOM is already loaded
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    console.log('📄 DOM already ready, initializing LanguageManager...');
    setTimeout(() => {
        if (!window.languageManager) {
            window.languageManager = new LanguageManager();
        }
    }, 100);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LanguageManager;
}