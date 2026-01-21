/* =========================
   YoungDesert Merch MVP
   - Local cart (localStorage)
   - Product modal + cart drawer
   - Stripe-ready (paste links later)
========================= */

// 1) Paste Stripe Payment Links later (optional):
// Create one per product in Stripe Dashboard → Payment Links
// Then paste the URL here. Example: "p1": "https://buy.stripe.com/...."
const STRIPE_LINKS = {
  // "p1": "https://buy.stripe.com/xxx",
  // "p2": "https://buy.stripe.com/xxx",
  // "p3": "https://buy.stripe.com/xxx",
  // "p4": "https://buy.stripe.com/xxx",
  // "p5": "https://buy.stripe.com/xxx",
  // "p6": "https://buy.stripe.com/xxx",
};

const PRODUCTS = [
  {
    id: "p1",
    title: "YoungDesert Essential Tee",
    category: "tees",
    price: 29.00,
    desc: "Minimal premium cotton tee with clean YoungDesert identity. Built for daily moves.",
    tags: ["Premium", "Minimal", "Street"],
  },
  {
    id: "p2",
    title: "YoungDesert Hoodie — Midnight",
    category: "hoodies",
    price: 59.00,
    desc: "Heavyweight hoodie with subtle branding and sharp silhouette. Cold-ready.",
    tags: ["Heavyweight", "Cozy", "Drop"],
  },
  {
    id: "p3",
    title: "YoungTrader Cap — Mono",
    category: "caps",
    price: 25.00,
    desc: "Structured cap, clean mono look. Perfect for low-key days and high focus.",
    tags: ["Cap", "Clean", "Everyday"],
  },
  {
    id: "p4",
    title: "YD Wallet — Stealth",
    category: "accessories",
    price: 39.00,
    desc: "Slim, simple, tough. A wallet that matches the grey-dark aesthetic.",
    tags: ["Slim", "Stealth", "Utility"],
  },
  {
    id: "p5",
    title: "YoungDesert Crewneck — Ash",
    category: "hoodies",
    price: 49.00,
    desc: "Crewneck sweatshirt with a minimal identity. Comfort + confidence.",
    tags: ["Comfort", "Ash", "Classic"],
  },
  {
    id: "p6",
    title: "YD Tote Bag — Concrete",
    category: "accessories",
    price: 22.00,
    desc: "Minimal tote for laptop, gym, or daily carry. Built for movers.",
    tags: ["Carry", "Minimal", "Daily"],
  },
];

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

const grid = $("#grid");
const yearEl = $("#year");

const productModal = $("#productModal");
const guideModal = $("#guideModal");
const cartDrawer = $("#cartDrawer");

const cartBtn = $("#cartBtn");
const cartCount = $("#cartCount");
const cartItems = $("#cartItems");
const cartTotal = $("#cartTotal");
const checkoutBtn = $("#checkoutBtn");
const clearCartBtn = $("#clearCartBtn");

const searchInput = $("#searchInput");
const sortSelect = $("#sortSelect");
const themeBtn = $("#themeBtn");
const stripeGuideBtn = $("#stripeGuideBtn");

const modalMedia = $("#modalMedia");
const modalCategory = $("#modalCategory");
const modalTitle = $("#modalTitle");
const modalDesc = $("#modalDesc");
const modalPrice = $("#modalPrice");
const modalTags = $("#modalTags");
const sizeSelect = $("#sizeSelect");
const qtyMinus = $("#qtyMinus");
const qtyPlus = $("#qtyPlus");
const qtyInput = $("#qtyInput");
const addToCartBtn = $("#addToCartBtn");
const buyNowBtn = $("#buyNowBtn");
const stripeHint = $("#stripeHint");

let state = {
  filter: "all",
  search: "",
  sort: "featured",
  activeProduct: null,
};

const CART_KEY = "yd_cart_v1";
const THEME_KEY = "yd_theme_v1";

function money(n){
  return new Intl.NumberFormat("en-US", { style:"currency", currency:"USD" }).format(n);
}

function loadCart(){
  try{
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  }catch{
    return [];
  }
}
function saveCart(cart){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function getCartCount(cart){
  return cart.reduce((sum, item) => sum + item.qty, 0);
}
function getCartTotal(cart){
  return cart.reduce((sum, item) => sum + item.qty * item.price, 0);
}

function renderProducts(){
  const filtered = PRODUCTS
    .filter(p => state.filter === "all" ? true : p.category === state.filter)
    .filter(p => {
      if(!state.search) return true;
      const q = state.search.toLowerCase();
      return (p.title + " " + p.desc + " " + p.tags.join(" ")).toLowerCase().includes(q);
    });

  const sorted = [...filtered];
  if(state.sort === "priceLow") sorted.sort((a,b) => a.price - b.price);
  if(state.sort === "priceHigh") sorted.sort((a,b) => b.price - a.price);
  if(state.sort === "nameAZ") sorted.sort((a,b) => a.title.localeCompare(b.title));

  grid.innerHTML = sorted.map(p => `
    <article class="card" role="button" tabindex="0" aria-label="Open ${escapeHtml(p.title)}"
      data-id="${p.id}">
      <div class="thumb">${escapeHtml(shortMark(p.title))}</div>
      <div class="card-body">
        <p class="badge">${escapeHtml(labelCategory(p.category))}</p>
        <h3 class="card-title">${escapeHtml(p.title)}</h3>
        <p class="muted tiny">${escapeHtml(p.desc)}</p>
        <div class="card-meta">
          <div class="price">${money(p.price)}</div>
          <div class="tags">
            ${p.tags.slice(0,2).map(t => `<span class="chip">${escapeHtml(t)}</span>`).join("")}
          </div>
        </div>
      </div>
    </article>
  `).join("");

  // Attach open handlers
  $$(".card", grid).forEach(card => {
    const open = () => openProduct(card.dataset.id);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if(e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  });
}

function labelCategory(cat){
  const map = { tees:"Tees", hoodies:"Hoodies", caps:"Caps", accessories:"Accessories" };
  return map[cat] || "Product";
}
function shortMark(title){
  // Simple "YD" style mark for thumbnails
  const first = title.split(" ")[0] || "YD";
  return (first.length <= 3 ? first : "YD");
}
function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function openProduct(id){
  const p = PRODUCTS.find(x => x.id === id);
  if(!p) return;

  state.activeProduct = p;
  qtyInput.value = "1";

  modalMedia.textContent = "YD";
  modalCategory.textContent = labelCategory(p.category);
  modalTitle.textContent = p.title;
  modalDesc.textContent = p.desc;
  modalPrice.textContent = money(p.price);

  modalTags.innerHTML = p.tags.map(t => `<span class="chip">${escapeHtml(t)}</span>`).join("");

  // Stripe availability
  const hasStripe = Boolean(STRIPE_LINKS[p.id]);
  buyNowBtn.disabled = !hasStripe;
  stripeHint.style.display = hasStripe ? "none" : "block";

  showModal(productModal);
}

function showModal(modal){
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function hideModal(modal){
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function openCart(){
  cartDrawer.classList.add("show");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  renderCart();
}
function closeCart(){
  cartDrawer.classList.remove("show");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function addToCart(product, qty, size){
  const cart = loadCart();
  const key = `${product.id}__${size}`;
  const existing = cart.find(i => i.key === key);

  if(existing){
    existing.qty += qty;
  }else{
    cart.push({
      key,
      id: product.id,
      title: product.title,
      price: product.price,
      qty,
      size
    });
  }

  saveCart(cart);
  updateCartUI();
}

function removeFromCart(key){
  const cart = loadCart().filter(i => i.key !== key);
  saveCart(cart);
  updateCartUI();
  renderCart();
}

function setCartQty(key, qty){
  const cart = loadCart();
  const item = cart.find(i => i.key === key);
  if(!item) return;

  item.qty = Math.max(1, qty);
  saveCart(cart);
  updateCartUI();
  renderCart();
}

function renderCart(){
  const cart = loadCart();
  if(cart.length === 0){
    cartItems.innerHTML = `
      <div class="cart-item">
        <p class="muted">Your cart is empty.</p>
        <p class="tiny muted">Open a product and tap <strong>Add to Cart</strong>.</p>
      </div>
    `;
  } else {
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-top">
          <div>
            <h4>${escapeHtml(item.title)}</h4>
            <p class="tiny muted">Size: <strong>${escapeHtml(item.size)}</strong></p>
          </div>
          <div class="price">${money(item.price)}</div>
        </div>

        <div class="cart-controls">
          <div class="cart-mini">
            <button data-dec="${item.key}" aria-label="Decrease">−</button>
            <span>${item.qty}</span>
            <button data-inc="${item.key}" aria-label="Increase">+</button>
          </div>
          <button class="link-danger" data-remove="${item.key}">Remove</button>
        </div>
      </div>
    `).join("");
  }

  // Totals
  cartTotal.textContent = money(getCartTotal(cart));

  // Enable checkout only if Stripe exists for all items
  const allStripe = cart.length > 0 && cart.every(i => Boolean(STRIPE_LINKS[i.id]));
  checkoutBtn.disabled = !allStripe;
  checkoutBtn.textContent = allStripe ? "Checkout" : "Checkout (Stripe not connected)";

  // Bind buttons
  $$("[data-remove]", cartItems).forEach(btn => {
    btn.addEventListener("click", () => removeFromCart(btn.dataset.remove));
  });
  $$("[data-inc]", cartItems).forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.inc;
      const item = loadCart().find(i => i.key === key);
      if(item) setCartQty(key, item.qty + 1);
    });
  });
  $$("[data-dec]", cartItems).forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.dec;
      const item = loadCart().find(i => i.key === key);
      if(item) setCartQty(key, item.qty - 1);
    });
  });
}

function updateCartUI(){
  const cart = loadCart();
  cartCount.textContent = String(getCartCount(cart));
}

function checkout(){
  // Simple MVP strategy:
  // If you have multiple items, redirect to the FIRST item's payment link.
  // Better later: build real checkout session with line items.
  const cart = loadCart();
  if(cart.length === 0) return;

  const first = cart[0];
  const link = STRIPE_LINKS[first.id];
  if(!link){
    alert("Stripe is not connected yet. Add Stripe Payment Links in app.js.");
    return;
  }

  // Optional: you can append ?client_reference_id=... if needed later
  window.location.href = link;
}

/* Theme */
function applyTheme(theme){
  if(theme === "light"){
    document.body.classList.add("light");
  } else {
    document.body.classList.remove("light");
  }
  localStorage.setItem(THEME_KEY, theme);
}

/* Events */
function bindEvents(){
  yearEl.textContent = new Date().getFullYear();

  // Filters
  $$(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      $$(".nav-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.filter = btn.dataset.filter;
      renderProducts();
    });
  });
  // default active
  const allBtn = $(`.nav-btn[data-filter="all"]`);
  if(allBtn) allBtn.classList.add("active");

  // Search + sort
  searchInput.addEventListener("input", () => {
    state.search = searchInput.value.trim();
    renderProducts();
  });
  sortSelect.addEventListener("change", () => {
    state.sort = sortSelect.value;
    renderProducts();
  });

  // Product modal close
  productModal.addEventListener("click", (e) => {
    const close = e.target.matches("[data-close]");
    if(close) hideModal(productModal);
  });

  // Guide modal
  stripeGuideBtn.addEventListener("click", () => showModal(guideModal));
  guideModal.addEventListener("click", (e) => {
    if(e.target.matches("[data-close-guide]")) hideModal(guideModal);
  });

  // Qty controls
  qtyMinus.addEventListener("click", () => {
    const v = clampInt(qtyInput.value, 1, 99);
    qtyInput.value = String(Math.max(1, v - 1));
  });
  qtyPlus.addEventListener("click", () => {
    const v = clampInt(qtyInput.value, 1, 99);
    qtyInput.value = String(Math.min(99, v + 1));
  });
  qtyInput.addEventListener("input", () => {
    qtyInput.value = String(clampInt(qtyInput.value, 1, 99));
  });

  // Add to cart / buy now
  addToCartBtn.addEventListener("click", () => {
    if(!state.activeProduct) return;
    const qty = clampInt(qtyInput.value, 1, 99);
    const size = sizeSelect.value;
    addToCart(state.activeProduct, qty, size);
    hideModal(productModal);
    openCart();
  });

  buyNowBtn.addEventListener("click", () => {
    if(!state.activeProduct) return;
    const link = STRIPE_LINKS[state.activeProduct.id];
    if(!link){
      alert("Stripe is not connected yet. Add Stripe Payment Links in app.js.");
      return;
    }
    window.location.href = link;
  });

  // Cart drawer
  cartBtn.addEventListener("click", openCart);
  cartDrawer.addEventListener("click", (e) => {
    if(e.target.matches("[data-close-cart]")) closeCart();
  });

  clearCartBtn.addEventListener("click", () => {
    saveCart([]);
    updateCartUI();
    renderCart();
  });

  checkoutBtn.addEventListener("click", checkout);

  // Theme
  themeBtn.addEventListener("click", () => {
    const current = localStorage.getItem(THEME_KEY) || "dark";
    applyTheme(current === "dark" ? "light" : "dark");
  });

  // Escape key closes modals/drawer
  window.addEventListener("keydown", (e) => {
    if(e.key !== "Escape") return;
    if(productModal.classList.contains("show")) hideModal(productModal);
    if(guideModal.classList.contains("show")) hideModal(guideModal);
    if(cartDrawer.classList.contains("show")) closeCart();
  });
}

function clampInt(val, min, max){
  const n = parseInt(String(val).replace(/[^\d]/g,""), 10);
  if(Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

/* Init */
(function init(){
  const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
  applyTheme(savedTheme);

  bindEvents();
  renderProducts();
  updateCartUI();
})();
