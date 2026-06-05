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
// ЗАВАНТАЖЕННЯ ПРОДУКТІВ З JSON
// -------------------------------
async function loadProducts() {
    try {
        const response = await fetch('./assets/data/product.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        SHOP_PRODUCTS = await response.json();
        
        // Оновлюємо списки для фільтрів
        updateFilterLists();
        
        // Ініціалізуємо сторінку
        init();
        
    } catch (error) {
        // Просто показуємо повідомлення про помилку
        productGrid.innerHTML = "<div class='card'><em>Помилка завантаження продуктів. Спробуйте оновити сторінку.</em></div>";
    }
}

function updateFilterLists() {
    ALL_CATS = Array.from(new Set(SHOP_PRODUCTS.map(p => p.category)));
    ALL_COLORS = Array.from(new Set(SHOP_PRODUCTS.flatMap(p => p.colors)));
    ALL_SIZES = Array.from(new Set(SHOP_PRODUCTS.flatMap(p => p.sizes))).filter(Boolean);
    ALL_STYLES = Array.from(new Set(SHOP_PRODUCTS.map(p => p.style)));
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
function init(){
  if (SHOP_PRODUCTS.length === 0) {
    return;
  }

  // price range bounds
  const maxPrice = Math.max(...SHOP_PRODUCTS.map(p => p.price)) + 50;
  priceRange.max = maxPrice;
  priceRange.value = maxPrice;
  priceMinInput.value = 0;
  priceMaxInput.value = maxPrice;
  state.priceMax = maxPrice;

  // categories
  categoryList.innerHTML = '';
  ALL_CATS.forEach(cat => {
    const li = document.createElement("li");
    li.textContent = getCategoryTranslation(cat);
    li.dataset.cat = cat;
    li.addEventListener("click", () => {
      if(state.category === cat) state.category = "";
      else state.category = cat;

      document.querySelectorAll("#categoryList li").forEach(n => n.classList.remove("active"));
      if(state.category) li.classList.add("active");

      state.page = 1;
      render();
    });
    categoryList.appendChild(li);
  });

  // colors
  colorsWrap.innerHTML = '';
  ALL_COLORS.forEach(c => {
    const sw = document.createElement("div");
    sw.className = "color-swatch";
    sw.title = getColorTranslation(c);
    sw.style.background = mapColor(c);
    sw.dataset.color = c;

    sw.addEventListener("click", () => {
      if(state.colors.has(c)) { state.colors.delete(c); sw.classList.remove("selected"); }
      else { state.colors.add(c); sw.classList.add("selected"); }
      state.page = 1; 
      render();
    });

    colorsWrap.appendChild(sw);
  });

  // sizes
  sizesWrap.innerHTML = '';
  ALL_SIZES.forEach(s => {
    const pill = document.createElement("div");
    pill.className = "size-pill";
    pill.textContent = getSizeTranslation(s);

    pill.addEventListener("click", () => {
      if(state.sizes.has(s)){ state.sizes.delete(s); pill.classList.remove("selected"); }
      else { state.sizes.add(s); pill.classList.add("selected"); }
      state.page = 1; 
      render();
    });

    sizesWrap.appendChild(pill);
  });

  // styles
  stylesWrap.innerHTML = '';
  ALL_STYLES.forEach(st => {
    const it = document.createElement("div");
    it.className = "style-item";
    it.textContent = getStyleTranslation(st);

    it.addEventListener("click", () => {
      if(state.styles.has(st)){ state.styles.delete(st); it.classList.remove("selected"); }
      else { state.styles.add(st); it.classList.add("selected"); }
      state.page = 1; 
      render();
    });

    stylesWrap.appendChild(it);
  });

  // events
  priceRange.addEventListener("input", () => {
    priceMaxInput.value = priceRange.value;
    state.priceMax = Number(priceRange.value);
    state.page = 1;
    render();
  });

  priceMaxInput.addEventListener("change", () => {
    priceRange.value = priceMaxInput.value;
    state.priceMax = Number(priceMaxInput.value);
    state.page = 1;
    render();
  });

  priceMinInput.addEventListener("change", () => {
    state.priceMin = Number(priceMinInput.value);
    state.page = 1;
    render();
  });

  inStockEl.addEventListener("change", () => {
    state.inStockOnly = inStockEl.checked;
    state.page = 1;
    render();
  });

  applyBtn.addEventListener("click", () => { 
    closeFilters(); 
    render(); 
  });

  clearBtn.addEventListener("click", clearFilters);

  prevPage.addEventListener("click", () => { 
    if(state.page > 1){ state.page--; render(); } 
  });

  nextPage.addEventListener("click", () => { 
    state.page++; render(); 
  });

  sortSelect.addEventListener("change", (e) => {
    state.sort = e.target.value;
    state.page = 1;
    render();
  });

  // filter panel
  openFiltersBtn.addEventListener("click", openFilters);
  closeFiltersBtn.addEventListener("click", closeFilters);
  filtersOverlay.addEventListener("click", closeFilters);

  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape") closeFilters();
  });

  render();
}

// -------------------------------
// ФУНКЦІЇ ФІЛЬТРІВ ТА ВІДОБРАЖЕННЯ
// -------------------------------
function openFilters(){
  filtersPanel.classList.add("open");
  filtersOverlay.style.opacity = "1";
  filtersOverlay.style.pointerEvents = "auto";
  setBodyScrollLocked(true);
}

function closeFilters(){
  filtersPanel.classList.remove("open");
  filtersOverlay.style.opacity = "0";
  filtersOverlay.style.pointerEvents = "none";
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
    priceMax: priceRange.max,
    page: 1
  };

  document.querySelectorAll("#categoryList li").forEach(n => n.classList.remove("active"));
  document.querySelectorAll(".color-swatch").forEach(n => n.classList.remove("selected"));
  document.querySelectorAll(".size-pill").forEach(n => n.classList.remove("selected"));
  document.querySelectorAll(".style-item").forEach(n => n.classList.remove("selected"));

  inStockEl.checked = false;
  priceMinInput.value = 0;
  priceMaxInput.value = priceRange.max;
  priceRange.value = priceRange.max;
  sortSelect.value = "popular";

  render();
}

function applyFilters(items){
  return items.filter(p => {
    if(state.category && p.category !== state.category) return false;
    if(p.price < (state.priceMin || 0)) return false;
    if(state.priceMax && p.price > state.priceMax) return false;
    if(state.inStockOnly && !p.inStock) return false;
    if(state.colors.size > 0 && !p.colors.some(c => state.colors.has(c))) return false;
    if(state.sizes.size > 0 && !p.sizes.some(s => state.sizes.has(s))) return false;
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
          const titleA = getProductTitle(a) || "";
          const titleB = getProductTitle(b) || "";

          return titleA.localeCompare(titleB);
      });
  }
  return arr;
}

function formatPrice(v){ return `$${v}`; }

function render(){
  if (SHOP_PRODUCTS.length === 0) {
    productGrid.innerHTML = "<div class='card'><em>Завантаження продуктів...</em></div>";
    return;
  }

  let filtered = applyFilters(SHOP_PRODUCTS);
  filtered = applySort(filtered);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / state.perPage));

  if(state.page > totalPages) state.page = totalPages;

  const start = (state.page - 1) * state.perPage;
  const pageItems = filtered.slice(start, start + state.perPage);

  resultCount.textContent = total;
  pageInfo.textContent = `${state.page} / ${totalPages}`;

  productGrid.innerHTML = "";

  if(pageItems.length === 0){
    const noProductsText = window.languageManager ? 
      window.languageManager.t('shop.no_products') : 
      "No products found for the selected filters.";
    productGrid.innerHTML = `<div class='card'><em>${noProductsText}</em></div>`;
    return;
  }

  pageItems.forEach(p => {
    const card = document.createElement("article");
    card.className = "card";

    const translatedTitle = getProductTitle(p);
    const translatedDescription = getProductDescription(p);

    card.innerHTML = `
      <div class="img-wrap">
        <img src="${p.image}" alt="${escapeHtml(translatedTitle)}" loading="lazy">
      </div>

      <div class="texts">
        <h4>${escapeHtml(translatedTitle)}</h4>
        <div class="rating">
          ${renderStars(p.rating)} <span class="muted">${p.rating.toFixed(1)}/5</span>
        </div>

        ${
          p.oldPrice 
            ? `<div class="pricing">
                 <p class="current-price">${formatPrice(p.price)}</p>
                 <p class="old-price">${formatPrice(p.oldPrice)}</p>
                 <span class="discount">-${p.discount}%</span>
               </div>`
            : `<div class="pricing no-discount">
                 <p class="current-price">${formatPrice(p.price)}</p>
               </div>`
        }
      </div>
    `;

    // open product page
    card.querySelector(".img-wrap").addEventListener("click", () => {
      window.location.href = `product.html?id=${p.id}`;
    });
    card.querySelector("h4").addEventListener("click", () => {
      window.location.href = `product.html?id=${p.id}`;
    });

    productGrid.appendChild(card);
  });
}

// -------------------------------
// ФУНКЦІЇ ПЕРЕКЛАДУ ПРОДУКТІВ
// -------------------------------
function getProductTitle(product) {
  return window.languageManager ? 
    window.languageManager.getProductTranslation(product.id, 'title') || product.title : 
    product.title;
}

function getProductDescription(product) {
  return window.languageManager ? 
    window.languageManager.getProductTranslation(product.id, 'description') || product.description : 
    product.description;
}

function getCategoryTranslation(category) {
  return window.languageManager ? 
    window.languageManager.getCategoryTranslation(category) : 
    category;
}

function getStyleTranslation(style) {
  return window.languageManager ? 
    window.languageManager.getStyleTranslation(style) : 
    style;
}

function getColorTranslation(color) {
  return window.languageManager ? 
    window.languageManager.getColorTranslation(color) : 
    color;
}

function getSizeTranslation(size) {
  return window.languageManager ? 
    window.languageManager.getSizeTranslation(size) : 
    size;
}

function updateShopTranslations() {
  // Оновлюємо фільтри
  document.querySelectorAll("#categoryList li").forEach(li => {
    const originalCat = li.dataset.cat;
    li.textContent = getCategoryTranslation(originalCat);
  });

  document.querySelectorAll(".color-swatch").forEach(sw => {
    const originalColor = sw.dataset.color;
    sw.title = getColorTranslation(originalColor);
  });

  document.querySelectorAll(".size-pill").forEach(pill => {
    const originalSize = pill.textContent;
    // Знаходимо оригінальний розмір по перекладеному значенню
    const sizeKey = ALL_SIZES.find(size => getSizeTranslation(size) === originalSize) || originalSize;
    pill.textContent = getSizeTranslation(sizeKey);
  });

  document.querySelectorAll(".style-item").forEach(item => {
    const originalStyle = item.textContent;
    // Знаходимо оригінальний стиль по перекладеному значенню
    const styleKey = ALL_STYLES.find(style => getStyleTranslation(style) === originalStyle) || originalStyle;
    item.textContent = getStyleTranslation(styleKey);
  });

  // Оновлюємо продукти
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
  return String(s).replace(/[&<>"']/g, m => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":"&#39;"
  }[m]));
}

// -------------------------------
// ПОЧАТОК ЗАВАНТАЖЕННЯ ТА ОБРОБКА МОВИ
// -------------------------------
document.addEventListener('DOMContentLoaded', async function() {

    // Чекаємо languageManager
    while (
        !window.languageManager ||
        !window.languageManager.isInitialized
    ) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Тільки потім вантажимо продукти
    loadProducts();

    // Слухаємо зміни мови
    window.addEventListener('languageChanged', function(e) {
        updateShopTranslations();
    });

});

// Додаємо функцію для глобального доступу
window.updateProductsContent = function(lang) {
    updateShopTranslations();
};