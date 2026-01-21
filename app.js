// app.js
import {
  db,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "./firebase.js";
import { auth } from "./auth.js";

const productList = document.getElementById("productList");
const cartPanel = document.getElementById("cartPanel");
const cartToggle = document.getElementById("cartToggle");
const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const cartCountEl = document.getElementById("cartCount");
const checkoutBtn = document.getElementById("checkoutBtn");

let products = [];
let cart = [];

// Load products from Firestore
async function loadProducts() {
  const snap = await getDocs(collection(db, "products"));
  products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderProducts();
}

function renderProducts() {
  productList.innerHTML = "";
  products.forEach((p) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-image">
        <img src="${p.imageUrl || "https://via.placeholder.com/400x300"}" alt="${
      p.name
    }" />
        <span class="product-badge">New</span>
      </div>
      <div class="product-info">
        <h3 class="product-title">${p.name}</h3>
        <p class="product-desc">${p.description || ""}</p>
        <div class="product-bottom">
          <span class="product-price">$${Number(p.price).toFixed(2)}</span>
          <button class="btn primary product-add" data-id="${
            p.id
          }">Add to cart</button>
        </div>
      </div>
    `;
    productList.appendChild(card);
  });

  productList.addEventListener("click", (e) => {
    const btn = e.target.closest(".product-add");
    if (!btn) return;
    const id = btn.dataset.id;
    addToCart(id);
  });
}

function addToCart(productId) {
  const existing = cart.find((c) => c.productId === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ productId, qty: 1 });
  }
  renderCart();
}

function updateQty(productId, delta) {
  const item = cart.find((c) => c.productId === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter((c) => c.productId !== productId);
  }
  renderCart();
}

function renderCart() {
  cartItemsEl.innerHTML = "";
  let total = 0;
  let count = 0;

  cart.forEach((c) => {
    const product = products.find((p) => p.id === c.productId);
    if (!product) return;
    const line = c.qty * Number(product.price);
    total += line;
    count += c.qty;

    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <span class="cart-item-name">${product.name}</span>
      <div class="cart-item-qty">
        <button class="qty-btn" data-id="${product.id}" data-delta="-1">-</button>
        <span>${c.qty}</span>
        <button class="qty-btn" data-id="${product.id}" data-delta="1">+</button>
      </div>
      <span>$${line.toFixed(2)}</span>
    `;
    cartItemsEl.appendChild(row);
  });

  cartTotalEl.textContent = `$${total.toFixed(2)}`;
  cartCountEl.textContent = count;

  cartItemsEl.querySelectorAll(".qty-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const delta = parseInt(btn.dataset.delta, 10);
      updateQty(id, delta);
    });
  });
}

cartToggle.addEventListener("click", () => {
  cartPanel.classList.toggle("hidden");
});

checkoutBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("Please log in to checkout.");
    return;
  }
  if (!cart.length) {
    alert("Your cart is empty.");
    return;
  }

  const items = cart.map((c) => {
    const p = products.find((p) => p.id === c.productId);
    return {
      productId: c.productId,
      name: p?.name || "",
      price: Number(p?.price || 0),
      qty: c.qty,
    };
  });

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  try {
    await addDoc(collection(db, "orders"), {
      userId: user.uid,
      items,
      total,
      createdAt: serverTimestamp(),
    });
    cart = [];
    renderCart();
    alert("Order placed successfully!");
  } catch (err) {
    alert("Error placing order: " + err.message);
  }
});

// Initial load
loadProducts().catch((e) => console.error(e));
