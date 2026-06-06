/* =========================
   GLOBAL ERROR HANDLER
========================= */
window.addEventListener("error", (e) => {
  console.error("JS ERROR:", e.message);
});

/* =========================
   CLOUDINARY CONFIG
========================= */
const CLOUD_NAME = "du6e7pzwg";
const UPLOAD_PRESET = "product_image";

/* =========================
   SAFE SUPABASE INIT (FIXED)
========================= */
const supabaseClient = window.supabase?.createClient(
  "https://dxbhhisexvakxolhmqld.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4YmhoaXNleHZha3hvbGhtcWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0Nzk3MDgsImV4cCI6MjA5NjA1NTcwOH0.t1iim-IYnJTNGD1V_hBU6aPEoucmG9TcRU4iCs-yhAU"
);

if (!supabaseClient) {
  console.error("Supabase failed to initialize. Check CDN or keys.");
}

/* =========================
   CLOUDINARY UPLOAD SYSTEM (FIXED)
========================= */
async function uploadImages(files) {
  const urls = [];

  if (!files || files.length === 0) {
    console.warn("No files selected for upload");
    return [];
  }

  for (const file of files) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();

    if (!res.ok || !data.secure_url) {
      console.error("Cloudinary error:", data);
      throw new Error(data.error?.message || "Upload failed");
    }

    urls.push(data.secure_url);
  }

  return urls;
}

/* =========================
   PRODUCT UPLOAD FORM
========================= */
function initProductUpload() {
  const form = document.getElementById("product-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const name = document.getElementById("name").value;
      const price = Number(document.getElementById("price").value);
      const badge = document.getElementById("badge").value;
      const files = document.getElementById("image").files;

      console.log("Uploading files...", files);

      const imageUrls = await uploadImages(files);

      console.log("Uploaded images:", imageUrls);

     const rating = Number(document.getElementById("rating").value || 0);

      const { data, error } = await supabaseClient
        .from("products")
        .insert([
          {
            name,
            price,
            badge,
            images: imageUrls,
            rating
          },
        ])
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Inserted:", data);

      alert("Upload successful");
      form.reset();
    } catch (err) {
      console.error("UPLOAD FAILED:", err);
      alert(err.message);
    }
  });
}

/* =========================
   CART SYSTEM (SOURCE OF TRUTH)
========================= */
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function syncCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

/* =========================
   LOAD PRODUCTS
========================= */
async function loadProducts(limit = null) {
  if (!supabaseClient) return;

  let query = supabaseClient
    .from("products")
    .select("*")
    .order("id", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return;
  }

  renderProducts(data);
}

/* =========================
   RENDER PRODUCTS
========================= */
function getProductsContainer() {
  return document.getElementById("products");
}

function renderProducts(products) {
  const productsContainer = getProductsContainer();
  if (!productsContainer) return;

  productsContainer.innerHTML = "";

  products.forEach(product => {
    const card = document.createElement("div");
    card.classList.add("card");

    const fakePrice = Math.round(product.price * 1.3);

    card.innerHTML = `
      <div class="card-image">

        ${product.badge ? `
          <div class="product-badge">${product.badge}</div>` : ""
        }

        <img src="${product.images?.[0] || ''}" />

        <div class="card-overlay">
          <button class="view-btn">View</button>
          <button class="quick-add-btn desktop-only">Quick Add</button>
        </div>

      </div>

      <div class="card-content">
        <h3>${product.name}</h3>

        <div class="price-block">
          <span class="current-price">₦${product.price}</span>
          <span class="old-price">₦${fakePrice}</span>
        </div>

        <div class="rating">
          ${renderStars(product.rating || 0)}
          <span class="rating-number">${product.rating || 0}</span>
        </div>


        <button class="mobile-add-btn mobile-only">
          <i class="fa-solid fa-cart-shopping"></i>
        </button>
      </div>
    `;

    // OPEN PRODUCT PAGE
    card.addEventListener("click", () => {
      localStorage.setItem("selectedProduct", JSON.stringify(product));
      window.location.href = "details.html";
    });

    // DESKTOP ADD
    card.querySelector(".quick-add-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      addToCart(product);
      showToast(`${product.name} added`);
    });

    // MOBILE ADD
    card.querySelector(".mobile-add-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      addToCart(product);
      showToast(`${product.name} added`);
    });

    productsContainer.appendChild(card);
  });
}
function renderStars(rating) {
  const max = 5;
  let stars = "";

  for (let i = 1; i <= max; i++) {
    if (i <= Math.floor(rating)) {
      stars += "★";
    } else if (i - rating < 1) {
      stars += "☆"; // optional half-star approximation
    } else {
      stars += "☆";
    }
  }

  return `<span class="stars">${stars}</span>`;
}

function goToProdcut() {
  window.location.href = "product.html";
}
/* =========================
   PRODUCT PAGE LOGIC
========================= */
const selectedProduct = JSON.parse(localStorage.getItem("selectedProduct"));
let selectedSize = null;

if (selectedProduct) {
  const img = document.getElementById("product-image");
  const name = document.getElementById("product-name");
  const price = document.getElementById("product-price");
  const thumbs = document.getElementById("thumbnail-container");

  if (img) img.src = selectedProduct.images[0];
  if (name) name.textContent = selectedProduct.name;
  if (price) price.textContent = `₦${selectedProduct.price}`;

  if (thumbs) {
    thumbs.innerHTML = "";

    selectedProduct.images.forEach(image => {
      const t = document.createElement("img");
      t.src = image;
      t.classList.add("thumbnail");

      t.onclick = () => (img.src = image);

      thumbs.appendChild(t);

      const addBtn = document.getElementById("add-to-cart");

      if (addBtn && selectedProduct) {
        addBtn.addEventListener("click", () => {
          addToCart(selectedProduct);
          showToast("Added to cart");
        });
      }
    });
  }
}

/* SIZE SELECT */
function initSizeSelector() {
  document.addEventListener("click", (e) => {
    if (!e.target.classList.contains("size-btn")) return;

    document.querySelectorAll(".size-btn").forEach(b =>
      b.classList.remove("active")
    );

    e.target.classList.add("active");
    selectedSize = e.target.textContent;
  });
}

/* =========================
   CART ACTIONS
========================= */
function addToCart(product) {
  const existing = cart.find(i => i.id === product.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      ...product,
      image: product.images?.[0],
      quantity: 1,
      size: selectedSize || null
    });
  }

  syncCart();
  updateCartCount();
  renderCart();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.quantity += delta;

  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== id);
  }

  syncCart();
  updateCartCount();
  renderCart();
}

function removeItem(id) {
  cart = cart.filter(i => i.id !== id);

  syncCart();
  updateCartCount();
  renderCart();
}

/* =========================
   CART UI
========================= */
function updateCartCount() {
  const el = document.getElementById("cart-count");
  if (!el) return;

  el.textContent = cart.reduce((s, i) => s + i.quantity, 0);
}

function renderCart() {
  const container = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");

  if (!container || !totalEl) return;

  container.innerHTML = "";

  if (cart.length === 0) {
    container.innerHTML = "<p>Your cart is empty</p>";
    totalEl.textContent = "₦0";
    return;
  }

  let total = 0;

  cart.forEach(item => {
    total += item.price * item.quantity;

    const div = document.createElement("div");

    div.innerHTML = `
      <div class="cart-item">
        <img src="${item.image}" class="cart-img" />

        <div class="cart-info">
          <p>${item.name}</p>
          <p>Size ${item.size || "-"}</p>

          <div>
            <button onclick="changeQty(${item.id}, -1)">−</button>
            <span>${item.quantity}</span>
            <button onclick="changeQty(${item.id}, 1)">+</button>
          </div>

          <p>₦${item.price * item.quantity}</p>

          <button onclick="removeItem(${item.id})">Remove</button>
        </div>
      </div>
    `;

    container.appendChild(div);
  });

  totalEl.textContent = `₦${total}`;
}
/* =========================
   CHECK OUT 
========================= */

function goToCheckout() {
  window.location.href = "checkout.html";
}


/* =========================
   TOAST
========================= */
function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = msg;
  toast.classList.add("show");

  setTimeout(() => toast.classList.remove("show"), 2000);
}

/* =========================
   INIT SYSTEM
========================= */
function initApp() {
  initCart();
  initSizeSelector();

  updateCartCount();
  renderCart();

  initProductUpload();
}

function initCart() {
  const cartBtn = document.getElementById("cart-btn");
  const closeCartBtn = document.getElementById("close-cart");
  const cartDrawer = document.getElementById("cart-drawer");

  if (cartBtn && cartDrawer) {
    cartBtn.addEventListener("click", () => {
      cartDrawer.classList.add("open");
      renderCart();
    });
  }

  if (closeCartBtn && cartDrawer) {
    closeCartBtn.addEventListener("click", () => {
      cartDrawer.classList.remove("open");
    });
  }
}
/* =========================
   HERO EFFECT
========================= */
const hero = document.querySelector(".hero");
const content = document.querySelector(".hero-content");

if (hero && content) {
  hero.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;

    content.style.transform = `translate(${x}px, ${y}px)`;
  });
}

/* =========================
   HEADER SCROLL
========================= */
const header = document.querySelector(".header");

if (header) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });
}


const cartBtn = document.getElementById("cart-btn");
const closeCartBtn = document.getElementById("close-cart");
/* =========================
   NAVIGATION (CART + MENU)
========================= */
const cartDrawer = document.getElementById("cart-drawer");

if (cartBtn && cartDrawer) {
  cartBtn.addEventListener("click", () => {
    cartDrawer.classList.add("open");
    renderCart();
  });
}

if (closeCartBtn && cartDrawer) {
  closeCartBtn.addEventListener("click", () => {
    cartDrawer.classList.remove("open");
  });
}

/* BURGER MENU */
const burger = document.getElementById("burger");
const mobileMenu = document.getElementById("mobile-menu");
const closeMenu = document.getElementById("close-menu");

if (burger && mobileMenu) {
  burger.addEventListener("click", () => mobileMenu.classList.add("open"));
}

if (closeMenu && mobileMenu) {
  closeMenu.addEventListener("click", () => mobileMenu.classList.remove("open"));
}
// view all product
if (window.location.pathname.includes("index.html")) {
  loadProducts(7);
}

if (window.location.pathname.includes("products.html")) {
  loadProducts(); // no limit = all products
}

function goToProducts() {
  window.location.href = "products.html";
}

document.addEventListener("DOMContentLoaded", initApp);


const banner = document.querySelector(".drop-banner");
const bg = document.querySelector(".drop-bg");
const text = document.querySelector(".drop-overlay");

banner.addEventListener("mousemove", (e) => {
  const x = (e.clientX / window.innerWidth - 0.5);
  const y = (e.clientY / window.innerHeight - 0.5);

  // background moves slower (depth)
  bg.style.transform = `scale(1.18) translate(${x * 20}px, ${y * 20}px)`;

  // text moves opposite direction slightly
  text.style.transform = `translate(${x * -10}px, ${y * -10}px)`;
});

banner.addEventListener("mouseleave", () => {
  bg.style.transform = "scale(1.1)";
  text.style.transform = "translate(0,0)";
});
