let cart = JSON.parse(localStorage.getItem("cart")) || [];

function goToCheckout() {
  window.location.href = "checkout.html";
}

function getCartTotal() {
  return cart.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);
}

function renderCheckout() {
  const container = document.getElementById("checkout-items");
  const totalEl = document.getElementById("checkout-total");

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
      <div class="checkout-item">
        <img src="${item.image}" width="60" />
        <div>
          <p>${item.name}</p>
          <p>Qty: ${item.quantity}</p>
          <p>Size: ${item.size || "-"}</p>
          <p>₦${item.price * item.quantity}</p>
        </div>
      </div>
    `;

    container.appendChild(div);
  });

  totalEl.textContent = `₦${total}`;
}

function initCheckout() {
  const btn = document.getElementById("pay-btn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    const phoneNumber = "2348138065824";
    const message = buildWhatsAppMessage();

    const url = `https://wa.me/${phoneNumber}?text=${message}`;

    window.location.href = url;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderCheckout();
  initCheckout();
});

function buildWhatsAppMessage() {
  let message = "Hello, I want to place an order:%0A%0A";

  cart.forEach((item, index) => {
    message += `${index + 1}. ${item.name}%0A`;
    message += `Qty: ${item.quantity}%0A`;
    message += `Size: ${item.size || "N/A"}%0A`;
    message += `Price: ₦${item.price * item.quantity}%0A%0A`;
  });

  const total = cart.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  message += `TOTAL: ₦${total}%0A%0A`;
  message += "Please confirm availability and payment details.";

  return message;
}