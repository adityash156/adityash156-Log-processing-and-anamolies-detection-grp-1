const CHECKOUT_API_URL = "data.json";

async function checkoutLoadConfig() {
  try {
    const response = await fetch(CHECKOUT_API_URL);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function renderCart() {
  const itemsContainer = document.getElementById("cartItems");
  const emptyEl = document.getElementById("cartEmpty");
  const summaryItems = document.getElementById("summaryItems");
  const summarySubtotal = document.getElementById("summarySubtotal");
  const summaryTotal = document.getElementById("summaryTotal");
  const payButton = document.getElementById("payButton");

  if (!itemsContainer || !emptyEl) return;

  const cart = typeof fdGetCart === "function" ? fdGetCart() : [];

  itemsContainer.innerHTML = "";

  if (cart.length === 0) {
    emptyEl.classList.remove("hidden");
    if (summaryItems) summaryItems.textContent = "0";
    if (summarySubtotal) summarySubtotal.textContent = "₹0";
    if (summaryTotal) summaryTotal.textContent = "₹0";
    if (payButton) payButton.disabled = true;
    return;
  }

  emptyEl.classList.add("hidden");
  if (payButton) payButton.disabled = false;

  let totalItems = 0;
  let subtotal = 0;

  cart.forEach((item) => {
    const quantity = item.quantity || 1;
    totalItems += quantity;
    subtotal += item.price * quantity;

    const row = document.createElement("div");
    row.className = "checkout-item";
    row.dataset.id = String(item.id);
    row.dataset.restaurantId = String(item.restaurantId);

    row.innerHTML = `
      <div class="checkout-item-info">
        <div class="checkout-item-title">${item.name}</div>
        <div class="checkout-item-sub">${item.restaurantName}</div>
      </div>
      <div class="qty-controls">
        <button class="qty-btn" data-action="decrease">-</button>
        <span class="qty-value">${quantity}</span>
        <button class="qty-btn" data-action="increase">+</button>
      </div>
      <div class="checkout-item-price">₹${item.price * quantity}</div>
    `;

    itemsContainer.appendChild(row);
  });

  const deliveryFee = 40;

  if (summaryItems) summaryItems.textContent = String(totalItems);
  if (summarySubtotal) summarySubtotal.textContent = `₹${subtotal}`;
  if (summaryTotal) summaryTotal.textContent = `₹${subtotal + deliveryFee}`;
}

function attachCartInteractions() {
  const itemsContainer = document.getElementById("cartItems");
  if (!itemsContainer) return;

  itemsContainer.addEventListener("click", (event) => {
    const btn = event.target.closest(".qty-btn");
    if (!btn) return;

    const row = btn.closest(".checkout-item");
    if (!row) return;

    const id = Number(row.dataset.id);
    const restaurantId = Number(row.dataset.restaurantId);
    const action = btn.dataset.action;

    const cart = typeof fdGetCart === "function" ? fdGetCart() : [];
    const item = cart.find(
      (c) => c.id === id && c.restaurantId === restaurantId
    );
    if (!item) return;

    if (action === "increase") {
      item.quantity = (item.quantity || 1) + 1;
    } else if (action === "decrease") {
      item.quantity = (item.quantity || 1) - 1;
      if (item.quantity <= 0) {
        const idx = cart.indexOf(item);
        if (idx >= 0) cart.splice(idx, 1);
      }
    }

    if (typeof fdSaveCart === "function") {
      fdSaveCart(cart);
    } else {
      localStorage.setItem("fd_cart", JSON.stringify(cart));
    }
    renderCart();
  });
}

async function initCheckoutPage() {
  const config = await checkoutLoadConfig();
  const areas = config?.areas || [
    "MG Road",
    "Koramangala",
    "Indiranagar",
    "HSR Layout",
    "Jayanagar"
  ];

  const locationSelect = document.getElementById("locationSelect");
  if (locationSelect) {
    areas.forEach((area) => {
      const option = document.createElement("option");
      option.value = area;
      option.textContent = area;
      locationSelect.appendChild(option);
    });
    const storedLoc =
      typeof fdGetLocation === "function" ? fdGetLocation() : "";
    if (storedLoc) {
      locationSelect.value = storedLoc;
    }
  }

  const user = typeof fdGetUser === "function" ? fdGetUser() : null;
  const nameField = document.getElementById("nameField");
  if (user && user.name && nameField) {
    nameField.value = user.name;
  }

  renderCart();
  attachCartInteractions();

  const form = document.getElementById("checkoutForm");
  const errorEl = document.getElementById("checkoutError");
  const successEl = document.getElementById("checkoutSuccess");

  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (errorEl) errorEl.textContent = "";
    if (successEl) successEl.classList.add("hidden");

    const cart = typeof fdGetCart === "function" ? fdGetCart() : [];
    if (cart.length === 0) {
      if (errorEl) errorEl.textContent = "Your cart is empty.";
      return;
    }

    const name = document.getElementById("nameField")?.value.trim();
    const phone = document.getElementById("phoneField")?.value.trim();
    const address = document.getElementById("addressField")?.value.trim();
    const locationValue = locationSelect?.value || "";
    const paymentMethod = document.querySelector(
      'input[name="paymentMethod"]:checked'
    )?.value;

    if (!name || !phone || !address || !locationValue || !paymentMethod) {
      if (errorEl)
        errorEl.textContent = "Please fill all details and choose payment.";
      return;
    }

    if (phone.length < 10) {
      if (errorEl) errorEl.textContent = "Enter a valid phone number.";
      return;
    }

    if (typeof fdSetLocation === "function") {
      fdSetLocation(locationValue);
    }

    if (typeof fdSaveCart === "function") {
      fdSaveCart([]);
    } else {
      localStorage.removeItem("fd_cart");
    }

    renderCart();

    if (successEl) {
      successEl.classList.remove("hidden");
    }
  });
}

document.addEventListener("DOMContentLoaded", initCheckoutPage);

