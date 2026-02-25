function initLoginPage() {
  const form = document.getElementById("loginForm");
  const errorEl = document.getElementById("loginError");

  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (errorEl) errorEl.textContent = "";

    const name = document.getElementById("nameInput")?.value.trim();
    const email = document.getElementById("emailInput")?.value.trim();
    const password = document.getElementById("passwordInput")?.value.trim();

    if (!name || !email || !password) {
      if (errorEl) errorEl.textContent = "Please fill all fields.";
      return;
    }

    const user = { name, email };
    if (typeof fdSetUser === "function") {
      fdSetUser(user);
    } else {
      localStorage.setItem("fd_user", JSON.stringify(user));
    }

    window.location.href = "index.html";
  });
}

document.addEventListener("DOMContentLoaded", initLoginPage);

