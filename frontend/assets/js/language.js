// =======================================
// Language Manager (STABLE VERSION)
// =======================================

class LanguageManager {
    constructor() {
        this.currentLang = localStorage.getItem('preferredLanguage') || 'en';
        this.translations = {};
        this.isInitialized = false;

        console.log('🌍 LanguageManager init, lang:', this.currentLang);

        this.init();
    }

    async init() {
        console.log('🔄 Language init...');

        await this.loadAllTranslations();

        this.isInitialized = true;

        this.applyLanguage(this.currentLang);
        this.setupLanguageSwitcher();
        this.setupDynamicContentHandlers();

        console.log('✅ LanguageManager ready');
    }

    // ---------------------------------------
    // LOAD TRANSLATIONS
    // ---------------------------------------
    async loadAllTranslations() {
        try {
            const response = await fetch('./assets/data/translation.json');

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            this.translations = await response.json();

            console.log('✅ translations loaded');
        } catch (error) {
            console.error('❌ translations failed:', error);

            // SAFE FALLBACK
            this.translations = {
                en: {
                    header: { shop: "Shop" },
                    home: { hero_title: "Find clothes that match your style" }
                },
                uk: {
                    header: { shop: "Магазин" },
                    home: { hero_title: "Знайдіть одяг який відповідає вашому стилю" }
                }
            };
        }
    }

    // ---------------------------------------
    // SWITCH LANGUAGE
    // ---------------------------------------
    async switchLanguage(lang) {
        if (this.currentLang === lang) return;

        this.currentLang = lang;
        localStorage.setItem('preferredLanguage', lang);

        this.applyLanguage(lang);
        this.updateLanguageSwitcher(lang);

        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: lang }
        }));

        console.log('🔄 language switched:', lang);
    }

    // ---------------------------------------
    // APPLY TRANSLATIONS
    // ---------------------------------------
    applyLanguage(lang) {
        if (!this.translations[lang]) return;

        const elements = document.querySelectorAll('[data-i18n]');

        let updated = 0;

        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const value = this.getTranslation(key, lang);

            if (!value) return;

            if (el.tagName === 'INPUT') {
                el.placeholder = value;
            } else {
                el.textContent = value;
            }

            updated++;
        });

        document.documentElement.lang = lang;

        console.log(`🎯 applied ${lang}: ${updated} elements`);
    }

    // ---------------------------------------
    // GET TRANSLATION
    // ---------------------------------------
    getTranslation(key, lang = this.currentLang) {
        const data = this.translations[lang];
        if (!data) return null;

        return key.split('.').reduce((obj, k) => obj?.[k], data) || null;
    }

    // ---------------------------------------
    // SWITCHER UI
    // ---------------------------------------
    setupLanguageSwitcher() {
        const buttons = document.querySelectorAll('.lang-btn');

        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();

                const lang = btn.dataset.lang;
                this.switchLanguage(lang);
            });
        });

        this.updateLanguageSwitcher(this.currentLang);
    }

    updateLanguageSwitcher(lang) {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            const isActive = btn.dataset.lang === lang;

            btn.classList.toggle('active', isActive);
            btn.style.pointerEvents = isActive ? 'none' : 'auto';
        });
    }

    // ---------------------------------------
    // DYNAMIC DOM HANDLER
    // ---------------------------------------
    setupDynamicContentHandlers() {
        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.nodeType !== 1) continue;

                    if (node.matches?.('[data-i18n]')) {
                        this.translateElement(node);
                    }

                    node.querySelectorAll?.('[data-i18n]')
                        .forEach(el => this.translateElement(el));
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    translateElement(el) {
        const key = el.getAttribute('data-i18n');
        const value = this.getTranslation(key);

        if (!value) return;

        if (el.tagName === 'INPUT') {
            el.placeholder = value;
        } else {
            el.textContent = value;
        }
    }

    // ---------------------------------------
    // PUBLIC API
    // ---------------------------------------
    t(key) {
        return this.getTranslation(key) || key;
    }

    async refreshTranslations() {
        await this.loadAllTranslations();
        this.applyLanguage(this.currentLang);
    }

    getStatus() {
        return {
            currentLang: this.currentLang,
            isInitialized: this.isInitialized,
            hasTranslations: !!this.translations?.[this.currentLang]
        };
    }

    waitForInitialization() {
        return new Promise(resolve => {
            const check = () => {
                if (this.isInitialized) resolve(true);
                else setTimeout(check, 100);
            };
            check();
        });
    }

    // =======================================
// SHOP COMPATIBILITY METHODS
// =======================================

    // category translation
    getCategoryTranslation(category) {
        return this.translations?.[this.currentLang]?.categories?.[category]
            || category;
    }

    // color translation
    getColorTranslation(color) {
        return this.translations?.[this.currentLang]?.colors?.[color]
            || color;
    }

    // size translation
    getSizeTranslation(size) {
        return this.translations?.[this.currentLang]?.sizes?.[size]
            || size;
    }

    // style translation
    getStyleTranslation(style) {
        return this.translations?.[this.currentLang]?.styles?.[style]
            || style;
    }
}

// =======================================
// INIT
// =======================================
document.addEventListener('DOMContentLoaded', () => {
    window.languageManager = new LanguageManager();

    window.getLanguageStatus = () =>
        window.languageManager?.getStatus() || 'not ready';
});

// fallback init
if (document.readyState !== 'loading') {
    setTimeout(() => {
        if (!window.languageManager) {
            window.languageManager = new LanguageManager();
        }
    }, 100);
}

// export (optional)
if (typeof module !== 'undefined') {
    module.exports = LanguageManager;
}

