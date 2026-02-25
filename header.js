const FD_CART_KEY = "fd_cart";
const FD_USER_KEY = "fd_user";
const FD_LOCATION_KEY = "fd_location";

function fdGetCart() {
  try {
    const raw = localStorage.getItem(FD_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function fdSaveCart(cart) {
  localStorage.setItem(FD_CART_KEY, JSON.stringify(cart));
  fdRefreshCartBadge();
}

function fdAddToCart(item) {
  const cart = fdGetCart();
  const existing = cart.find(
    (c) => c.id === item.id && c.restaurantId === item.restaurantId
  );
  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    cart.push({
      ...item,
      quantity: 1
    });
  }
  fdSaveCart(cart);
}

function fdGetUser() {
  try {
    const raw = localStorage.getItem(FD_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function fdSetUser(user) {
  localStorage.setItem(FD_USER_KEY, JSON.stringify(user));
}

function fdGetLocation() {
  return localStorage.getItem(FD_LOCATION_KEY) || "";
}

function fdSetLocation(value) {
  localStorage.setItem(FD_LOCATION_KEY, value);
  fdUpdateHeaderLocation();
}

function fdRefreshCartBadge() {
  const badge = document.getElementById("cartCount");
  if (!badge) return;
  const cart = fdGetCart();
  const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  if (count > 0) {
    badge.textContent = String(count);
    badge.style.display = "inline-flex";
  } else {
    badge.textContent = "0";
    badge.style.display = "none";
  }
}

function fdUpdateHeaderLocation() {
  const el = document.querySelector(".location__text");
  const loc = fdGetLocation();
  if (el && loc) {
    el.innerHTML = `Deliver to <strong>${loc}</strong>`;
  }
}

function fdInitHeader() {
  fdRefreshCartBadge();
  fdUpdateHeaderLocation();

  const loginBtn = document.getElementById("loginButton");
  const user = fdGetUser();
  if (loginBtn && user && user.name) {
    loginBtn.textContent = `Hi, ${user.name}`;
    loginBtn.href = "#";
    loginBtn.addEventListener("click", (event) => {
      event.preventDefault();
      localStorage.removeItem(FD_USER_KEY);
      window.location.href = "login.html";
    });
  }
}

document.addEventListener("DOMContentLoaded", fdInitHeader);

