// -------------------------------
// PRODUCTS (завантажуються з JSON)
// -------------------------------
let SHOP_PRODUCTS = [];
let ALL_CATS = [];
let ALL_COLORS = [];
let ALL_SIZES = [];
let ALL_STYLES = [];

const PRODUCTS_PER_PAGE = 9;

// -------------------------------
// State
// -------------------------------
let state = {
  query: "",
  category: "",
  priceMin: 0,
  priceMax: 1000,
  colors: new Set(),
  sizes: new Set(),
  styles: new Set(),
  inStockOnly: false,
  sort: "popular",
  page: 1,
  perPage: 9
};

// -------------------------------
// DOM REFERENCES
// -------------------------------
const productGrid = document.getElementById("productGrid");
const categoryList = document.getElementById("categoryList");
const colorsWrap = document.getElementById("colors");
const sizesWrap = document.getElementById("sizes");
const stylesWrap = document.getElementById("stylesPanel");
const priceRange = document.getElementById("priceRange");
const priceMinInput = document.getElementById("priceMin");
const priceMaxInput = document.getElementById("priceMax");
const inStockEl = document.getElementById("inStock");
const applyBtn = document.getElementById("applyFilters");
const clearBtn = document.getElementById("clearFilters");
const prevPage = document.getElementById("prevPage");
const nextPage = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");
const resultCount = document.getElementById("resultCount");
const sortSelect = document.getElementById("sortSelect");

// filter panel elements
const openFiltersBtn = document.getElementById("openFiltersBtn");
const closeFiltersBtn = document.getElementById("closeFilters");
const filtersPanel = document.getElementById("filtersPanel");
const filtersOverlay = document.getElementById("filtersOverlay");

// -------------------------------
// LOAD PRODUCTS FROM BACKEND API
// -------------------------------
async function loadProducts() {
    try {
        const response = await fetch('http://localhost:8000/products/');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        SHOP_PRODUCTS = await response.json();
        console.log("PRODUCTS LOADED:", SHOP_PRODUCTS);

        updateFilterLists();
        init();

    } catch (error) {
        console.error('❌ Error loading products:', error);
        if (productGrid) {
            const errorText = window.languageManager ? window.languageManager.t('shop.load_error') : "Error loading products.";
            productGrid.innerHTML = `
                <div class='card'>
                    <em>${errorText}</em>
                </div>
            `;
        }
    }
}

function updateFilterLists() {
    ALL_CATS = Array.from(new Set(SHOP_PRODUCTS.map(p => p.category?.name).filter(Boolean)));
    ALL_COLORS = Array.from(new Set(SHOP_PRODUCTS.flatMap(p => p.colors || [])));
    ALL_SIZES = Array.from(new Set(SHOP_PRODUCTS.flatMap(p => p.sizes || []))).filter(Boolean);
    ALL_STYLES = Array.from(new Set(SHOP_PRODUCTS.map(p => p.style).filter(Boolean)));
}

// -------------------------------
// UTIL
// -------------------------------
function setBodyScrollLocked(lock){
  document.body.style.overflow = lock ? "hidden" : "";
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

// -------------------------------
// INIT
// -------------------------------
function init() {
  if (SHOP_PRODUCTS.length === 0) return;

  // Звільняємо інпути від блокування ARIA на десктопах заздалегідь
  if (filtersPanel && window.innerWidth > 992) {
    filtersPanel.removeAttribute("aria-hidden");
    filtersPanel.removeAttribute("inert");
  }

  // Зчитуємо параметр ?search=
  const params = new URLSearchParams(window.location.search);
  const searchQuery = params.get('search');
  if (searchQuery) {
    state.query = searchQuery.trim().toLowerCase();
  }

  // Налаштування ціни
  const prices = SHOP_PRODUCTS.map(p => Number(p.price) || 0);
  const maxPrice = prices.length > 0 ? Math.max(...prices) + 50 : 1000;

if (priceRange) {
    priceRange.max = maxPrice;
    priceRange.value = maxPrice;

    // Рухаємо бігунець -> змінюється текстовий інпут макс. ціни та оновлюється state
    priceRange.addEventListener("input", (e) => {
      if (priceMaxInput) priceMaxInput.value = e.target.value;
      state.priceMax = Number(e.target.value);
      state.page = 1; 
      render(); // Розкоментовуємо, щоб товари фільтрувалися одразу при русі повзунка
    });
  }

  // Слухач на ручне введення в текстовий інпут макс. ціни -> рухає бігунець назад
  if (priceMaxInput && priceRange) {
    priceMaxInput.addEventListener("input", (e) => {
      const val = Number(e.target.value) || 0;
      priceRange.value = val;
      state.priceMax = val;
      state.page = 1;
      render(); // Додаємо рендер і сюди
    });
  }
  if (priceMinInput) priceMinInput.value = 0;
  if (priceMaxInput) priceMaxInput.value = maxPrice;
  state.priceMax = maxPrice;

  // Категорії
  if (categoryList) {
    categoryList.innerHTML = '';
    ALL_CATS.forEach(cat => {
      const li = document.createElement("li");
      li.textContent = typeof getCategoryTranslation === 'function' ? getCategoryTranslation(cat) : cat;
      li.dataset.cat = cat;
      
      li.addEventListener("click", () => {
        document.querySelectorAll("#categoryList li").forEach(n => n.classList.remove("active"));
        if (state.category === cat) {
          state.category = ""; 
        } else {
          state.category = cat;
          li.classList.add("active");
        }
        state.page = 1;
        render(); 
      });
      categoryList.appendChild(li);
    });
  }

  // Кольори
  if (colorsWrap) {
    colorsWrap.innerHTML = '';
    ALL_COLORS.forEach(color => {
      const span = document.createElement("span");
      span.className = "color-swatch";
      span.style.backgroundColor = mapColor(color);
      span.title = typeof getColorTranslation === 'function' ? getColorTranslation(color) : color;
      span.dataset.color = color;

      span.addEventListener("click", () => {
        span.classList.toggle("selected");
        if (state.colors.has(color)) {
          state.colors.delete(color);
        } else {
          state.colors.add(color);
        }
        state.page = 1;
        render();
      });
      colorsWrap.appendChild(span);
    });
  }

  // Розміри
  if (sizesWrap) {
    sizesWrap.innerHTML = '';
    ALL_SIZES.forEach(size => {
      const button = document.createElement("button");
      button.className = "size-pill";
      button.textContent = typeof getSizeTranslation === 'function' ? getSizeTranslation(size) : size;
      button.dataset.size = size;

      button.addEventListener("click", () => {
        button.classList.toggle("selected");
        if (state.sizes.has(size)) {
          state.sizes.delete(size);
        } else {
          state.sizes.add(size);
        }
        state.page = 1;
        render();
      });
      sizesWrap.appendChild(button);
    });
  }

  // Стилі
  if (stylesWrap) {
    stylesWrap.innerHTML = '';
    ALL_STYLES.forEach(style => {
      const div = document.createElement("div");
      div.className = "style-item";
      div.textContent = typeof getStyleTranslation === 'function' ? getStyleTranslation(style) : style;
      div.dataset.style = style;

      div.addEventListener("click", () => {
        div.classList.toggle("selected");
        if (state.styles.has(style)) {
          state.styles.delete(style);
        } else {
          state.styles.add(style);
        }
        state.page = 1;
        render();
      });
      stylesWrap.appendChild(div);
    });
  }

  // Кнопки дій
  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      if (priceMinInput) state.priceMin = Number(priceMinInput.value) || 0;
      if (priceMaxInput) {
        const val = Number(priceMaxInput.value) || maxPrice;
        state.priceMax = val;
        if (priceRange) priceRange.value = val; // Синхронізуємо бігунець при застосуванні
      }
      if (inStockEl) state.inStockOnly = inStockEl.checked;
      
      state.page = 1;
      render();
      closeFilters();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", clearFilters);
  }

  // Пагінація
  if (prevPage) {
    prevPage.addEventListener("click", () => {
      if (state.page > 1) { state.page--; render(); }
    });
  }
  if (nextPage) {
    nextPage.addEventListener("click", () => { state.page++; render(); });
  }

  // Стартовий рендер товарів
  render();
}

// -------------------------------
// УПРАВЛІННЯ МОБІЛЬНИМИ ФІЛЬТРАМИ
// -------------------------------
function openFilters(){
  if (!filtersPanel) return;
  filtersPanel.classList.add("open");
  filtersPanel.removeAttribute("aria-hidden");
  filtersPanel.removeAttribute("inert");
  if (filtersOverlay) {
    filtersOverlay.style.opacity = "1";
    filtersOverlay.style.pointerEvents = "auto";
  }
  setBodyScrollLocked(true);
}

function closeFilters(){
  if (!filtersPanel) return;
  filtersPanel.classList.remove("open");
  if (window.innerWidth <= 992) {
    filtersPanel.setAttribute("aria-hidden", "true");
    filtersPanel.setAttribute("inert", "");
  }
  if (filtersOverlay) {
    filtersOverlay.style.opacity = "0";
    filtersOverlay.style.pointerEvents = "none";
  }
  setBodyScrollLocked(false);
}

function clearFilters(){
  state = {
    ...state,
    category: "",
    colors: new Set(),
    sizes: new Set(),
    styles: new Set(),
    inStockOnly: false,
    priceMin: 0,
    priceMax: priceRange ? priceRange.max : 1000,
    page: 1
  };

  document.querySelectorAll("#categoryList li").forEach(n => n.classList.remove("active"));
  document.querySelectorAll(".color-swatch").forEach(n => n.classList.remove("selected"));
  document.querySelectorAll(".size-pill").forEach(n => n.classList.remove("selected"));
  document.querySelectorAll(".style-item").forEach(n => n.classList.remove("selected"));

  if (inStockEl) inStockEl.checked = false;
  if (priceMinInput) priceMinInput.value = 0;
  if (priceMaxInput && priceRange) priceMaxInput.value = priceRange.max;
  if (priceRange) priceRange.value = priceRange.max;
  if (sortSelect) sortSelect.value = "popular";

  render();
}

// -------------------------------
// ФІЛЬТРАЦІЯ ТА СОРТУВАННЯ
// -------------------------------
function applyFilters(items){
  return items.filter(p => {
    if (state.query) {
      const searchWord = state.query.toLowerCase();
      const title = typeof getProductTitle === 'function' ? getProductTitle(p).toLowerCase() : (p.title || '').toLowerCase();
      const description = typeof getProductDescription === 'function' ? getProductDescription(p).toLowerCase() : (p.description || '').toLowerCase();
      if (!title.includes(searchWord) && !description.includes(searchWord)) return false;
    }

    if(state.category && p.category?.name !== state.category) return false;
    if(Number(p.price) < (Number(state.priceMin) || 0)) return false;
    if(state.priceMax && Number(p.price) > Number(state.priceMax)) return false;
    if(state.inStockOnly && !p.in_stock) return false;

    if(state.colors.size > 0 && !(p.colors || []).some(c => state.colors.has(c))) return false;
    if(state.sizes.size > 0 && !(p.sizes || []).some(s => state.sizes.has(s))) return false;
    if(state.styles.size > 0 && !state.styles.has(p.style)) return false;

    return true;
  });
}

function applySort(items){
  const arr = [...items];
  if(state.sort === "price-asc") arr.sort((a, b) => a.price - b.price);
  else if(state.sort === "price-desc") arr.sort((a, b) => b.price - a.price);
  else if(state.sort === "rating-desc") arr.sort((a, b) => b.rating - a.rating);
  else if(state.sort === "name-asc") {
      arr.sort((a, b) => {
          const titleA = typeof getProductTitle === 'function' ? getProductTitle(a) : (a.title || "");
          const titleB = typeof getProductTitle === 'function' ? getProductTitle(b) : (b.title || "");
          return titleA.localeCompare(titleB);
      });
  }
  return arr;
}

function formatPrice(v){ return `$${v}`; }

// -------------------------------
// ГОЛОВНИЙ РЕНДЕР КАРТОК
// -------------------------------
function render(){
  if (!productGrid) return;

  if (SHOP_PRODUCTS.length === 0) {
  const loadingText = window.languageManager ? window.languageManager.t('shop.loading') : "Loading...";
  productGrid.innerHTML = `<div class='card'><em>${loadingText}</em></div>`;
  return;
}

  let filtered = applyFilters(SHOP_PRODUCTS);
  filtered = applySort(filtered);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / state.perPage));

  if(state.page > totalPages) state.page = totalPages;

  const start = (state.page - 1) * state.perPage;
  const pageItems = filtered.slice(start, start + state.perPage);

  if (resultCount) resultCount.textContent = total;
  if (pageInfo) pageInfo.textContent = `${state.page} / ${totalPages}`;

  productGrid.innerHTML = "";

  if (pageItems.length === 0) {
    let details = [];
    
    if (state.query) {
      details.push(`"${state.query}"`);
    }
    if (state.category) {
      const catName = typeof getCategoryTranslation === 'function' ? getCategoryTranslation(state.category) : state.category;
      if (catName) details.push(catName);
    }
    // Якщо вибрано інші фільтри (кольори, розміри тощо), просто додамо загальну мітку
    if (state.colors?.size > 0 || state.sizes?.size > 0 || state.styles?.size > 0) {
      const currentLang = window.languageManager?.currentLang || localStorage.getItem('preferredLanguage') || 'en';
      details.push(currentLang === 'uk' ? "обрані фільтри" : "selected filters");
    }

    const currentLang = window.languageManager?.currentLang || localStorage.getItem('preferredLanguage') || 'en';
    let message = "";

    if (currentLang === 'uk') {
      message = details.length > 0 
        ? `Немає товарів, які відповідають критеріям: <strong>${details.join(', ')}</strong>.`
        : "Товарів не знайдено.";
    } else {
      message = details.length > 0 
        ? `No products match the criteria: <strong>${details.join(', ')}</strong>.`
        : "No products found.";
    }

    productGrid.innerHTML = `<div class='card no-results'><em>${message}</em></div>`;
    return;
  }

  pageItems.forEach(p => {
    const card = document.createElement("article");
    card.className = "card";

    const translatedTitle = typeof getProductTitle === 'function' ? getProductTitle(p) : p.title;
    const rating = Number(p.rating) || 0;

    card.innerHTML = `
      <div class="img-wrap">
        <img src="${p.image}" alt="${escapeHtml(translatedTitle)}" loading="lazy">
      </div>
      <div class="texts">
        <h4>${escapeHtml(translatedTitle)}</h4>
        <div class="rating">
          ${renderStars(rating)}
          <span class="muted">${rating.toFixed(1)}/5</span>
        </div>
        ${p.old_price ? `
          <div class="pricing">
            <p class="current-price">${formatPrice(p.price)}</p>
            <p class="old-price">${formatPrice(p.old_price)}</p>
            <span class="discount">-${p.discount}%</span>
          </div>
        ` : `
          <div class="pricing no-discount">
            <p class="current-price">${formatPrice(p.price)}</p>
          </div>
        `}
      </div>
    `;

    card.querySelector(".img-wrap").addEventListener("click", () => { window.location.href = `product.html?id=${p.id}`; });
    card.querySelector("h4").addEventListener("click", () => { window.location.href = `product.html?id=${p.id}`; });
    productGrid.appendChild(card);
  });
}

// -------------------------------
// МОВНІ ФУНКЦІЇ ТА ПЕРЕКЛАДИ
// -------------------------------
function getProductTitle(product) {
    const currentLang = localStorage.getItem('preferredLanguage') || 'en';
    const translation = product.translations?.find(t => t.language === currentLang);
    return translation?.title || product.title;
}

function getProductDescription(product) {
    const currentLang = localStorage.getItem('preferredLanguage') || 'en';
    const translation = product.translations?.find(t => t.language === currentLang);
    return translation?.description || product.description;
}

function getCategoryTranslation(category) {
  return window.languageManager ? window.languageManager.getCategoryTranslation(category) : category;
}
function getStyleTranslation(style) {
  return window.languageManager ? window.languageManager.getStyleTranslation(style) : style;
}
function getColorTranslation(color) {
  return window.languageManager ? window.languageManager.getColorTranslation(color) : color;
}
function getSizeTranslation(size) {
  return window.languageManager ? window.languageManager.getSizeTranslation(size) : size;
}

function updateShopTranslations() {
  document.querySelectorAll("#categoryList li").forEach(li => { li.textContent = getCategoryTranslation(li.dataset.cat); });
  document.querySelectorAll(".color-swatch").forEach(sw => { sw.title = getColorTranslation(sw.dataset.color); });
  document.querySelectorAll(".size-pill").forEach(pill => { pill.textContent = getSizeTranslation(pill.dataset.size); });
  document.querySelectorAll(".style-item").forEach(item => { item.textContent = getStyleTranslation(item.dataset.style); });
  render();
}

function renderStars(rating){
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let html = "";
  for(let i = 0; i < full; i++) html += '<i class="fa-solid fa-star"></i>';
  if(half) html += '<i class="fa-solid fa-star-half-stroke"></i>';
  return html;
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":"&#39;" }[m]));
}

// -------------------------------
// СЛУХАЧІ ЗАВАНТАЖЕННЯ СТОРІНКИ
// -------------------------------
document.addEventListener('DOMContentLoaded', async function() {
    while (!window.languageManager || !window.languageManager.isInitialized) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    loadProducts();
});

window.addEventListener('languageChanged', () => updateShopTranslations());
window.updateProductsContent = () => updateShopTranslations();

// СОРТУВАННЯ ТА КЛІКИ НА КНОПКИ
document.addEventListener('DOMContentLoaded', () => {
    if (openFiltersBtn) openFiltersBtn.addEventListener('click', (e) => { e.stopPropagation(); openFilters(); });
    if (closeFiltersBtn) closeFiltersBtn.addEventListener('click', closeFilters);
    if (filtersOverlay) filtersOverlay.addEventListener('click', closeFilters);

    const dropdown = document.getElementById('customSortDropdown');
    if (!dropdown) return;

    const trigger = dropdown.querySelector('.dropdown-trigger');
    const targetText = document.getElementById('currentTarget');
    const menuItems = dropdown.querySelectorAll('.dropdown-menu li');
    const nativeSelect = document.getElementById('sortSelect');

    if (trigger) {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });
    }

    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            if (targetText) targetText.textContent = this.textContent;

            const val = this.getAttribute('data-value');
            if (nativeSelect) {
                nativeSelect.value = val;
                state.sort = val;
                nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
            dropdown.classList.remove('open');
            render();
        });
    });

    document.addEventListener('click', () => dropdown.classList.remove('open'));
});