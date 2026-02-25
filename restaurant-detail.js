const API_URL = "data.json";

async function loadConfig() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Failed to load data");
  }
  return response.json();
}

function buildRestaurants(config, total = 100) {
  const areas = config.areas || [];
  const cuisineCombos = config.cuisineCombos || [];
  const prefixes = config.restaurantNamePrefixes || [];

  const restaurants = [];

  for (let i = 0; i < total; i++) {
    const id = i + 1;
    const prefix = prefixes[i % prefixes.length] || `Restaurant`;
    const name = `${prefix} ${id}`;
    const area = areas[i % areas.length] || "City Center";
    const cuisines = cuisineCombos[i % cuisineCombos.length] || ["Indian"];

    const rating = 3.6 + ((i % 15) * 0.06);
    const deliveryMinutes = 25 + (i % 6) * 5;
    const costBase = 250 + (i % 8) * 50;

    const tags = [];
    if (rating >= 4.4) tags.push("Top Rated");
    if (i % 4 === 0) tags.push("Offers");

    restaurants.push({
      id,
      name,
      cuisines,
      rating: Number(rating.toFixed(1)),
      deliveryTime: `${deliveryMinutes}-${deliveryMinutes + 5} mins`,
      costForTwo: `₹${costBase} for two`,
      tags,
      area
    });
  }

  return restaurants;
}

function buildDishesForRestaurant(restaurant, config, count = 30) {
  const templates = config.dishTemplates || [];
  const dishes = [];

  for (let i = 0; i < count; i++) {
    const tIndex = (restaurant.id * 17 + i) % templates.length;
    const template = templates[tIndex] || {
      name: "Chef Special",
      veg: true,
      basePrice: 200,
      cuisine: "Indian"
    };

    const price = template.basePrice + (i % 6) * 10;
    const rating = 3.8 + (i % 8) * 0.05;

    dishes.push({
      id: restaurant.id * 100 + i,
      restaurantId: restaurant.id,
      name: `${template.name} ${i + 1}`,
      price,
      rating: Number(rating.toFixed(1)),
      isVeg: !!template.veg,
      cuisine: template.cuisine
    });
  }

  return dishes;
}

function renderRestaurantHero(restaurant) {
  const nameEl = document.getElementById("restaurantName");
  const metaEl = document.getElementById("restaurantMeta");

  if (!nameEl || !metaEl) return;

  const cuisines = restaurant.cuisines.join(", ");
  nameEl.textContent = restaurant.name;
  metaEl.textContent = `${cuisines} • ★ ${restaurant.rating.toFixed(
    1
  )} • ${restaurant.deliveryTime} • ${restaurant.area} • ${
    restaurant.costForTwo
  }`;
}

function renderDishes(dishes, restaurant) {
  const dishGrid = document.getElementById("dishGrid");
  const dishCount = document.getElementById("dishCount");
  const noResults = document.getElementById("noResults");

  if (!dishGrid || !dishCount || !noResults) return;

  dishGrid.innerHTML = "";
  dishCount.textContent = `${dishes.length} dishes • ${restaurant.name}`;

  if (dishes.length === 0) {
    noResults.classList.remove("hidden");
    return;
  }

  noResults.classList.add("hidden");

  dishes.forEach((dish) => {
    const isVegIcon = dish.isVeg ? "🟢" : "🔴";

    const card = document.createElement("article");
    card.className = "dish-card";
    card.dataset.dishId = String(dish.id);
    card.dataset.restaurantId = String(restaurant.id);
    card.dataset.dishName = dish.name;
    card.dataset.restaurantName = restaurant.name;
    card.dataset.price = String(dish.price);

    card.innerHTML = `
      <div class="dish-card__info">
        <div class="dish-card__meta">
          <span title="${dish.isVeg ? "Veg" : "Non-veg"}">${isVegIcon}</span>
          <span class="dish-card__price">₹${dish.price}</span>
          <span>•</span>
          <span>★ ${dish.rating.toFixed(1)}</span>
        </div>
        <h3 class="dish-card__name">${dish.name}</h3>
        <p class="dish-card__hotel">${restaurant.name} · ${dish.cuisine}</p>
      </div>
      <div class="dish-card__image-wrapper">
        <div class="dish-card__image"></div>
        <div class="dish-card__btn-wrap">
          <button class="dish-card__btn" type="button">ADD</button>
        </div>
      </div>
    `;

    dishGrid.appendChild(card);
  });
}

function attachDetailInteractions(state) {
  const searchInput = document.getElementById("searchInput");
  const searchInputMobile = document.getElementById("searchInputMobile");
  const dishGrid = document.getElementById("dishGrid");

  function applyFilter() {
    const query = (searchInput?.value || searchInputMobile?.value || "")
      .trim()
      .toLowerCase();

    const filtered = state.dishes.filter((dish) => {
      if (!query) return true;
      const name = dish.name.toLowerCase();
      const cuisine = dish.cuisine.toLowerCase();
      return name.includes(query) || cuisine.includes(query);
    });

    renderDishes(filtered, state.restaurant);
  }

  const searchHandler = () => applyFilter();
  if (searchInput) searchInput.addEventListener("input", searchHandler);
  if (searchInputMobile)
    searchInputMobile.addEventListener("input", searchHandler);

  if (dishGrid) {
    dishGrid.addEventListener("click", (event) => {
      const btn = event.target.closest(".dish-card__btn");
      if (!btn) return;
      const card = btn.closest(".dish-card");
      if (!card) return;

      const id = Number(card.dataset.dishId);
      const restaurantId = Number(card.dataset.restaurantId);
      const name = card.dataset.dishName || "";
      const restaurantName = card.dataset.restaurantName || "";
      const price = Number(card.dataset.price || "0");

      if (!id || !restaurantId || !name || !price) return;

      const item = {
        id,
        restaurantId,
        name,
        restaurantName,
        price
      };

      if (typeof fdAddToCart === "function") {
        fdAddToCart(item);
      }
    });
  }
}

async function initRestaurantDetailPage() {
  try {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get("id");
    const restaurantId = Number(idParam);

    if (!restaurantId) {
      throw new Error("Missing restaurant id");
    }

    const config = await loadConfig();
    const restaurants = buildRestaurants(config, 100);
    const restaurant = restaurants.find((r) => r.id === restaurantId);

    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    const dishes = buildDishesForRestaurant(restaurant, config, 30);

    const state = {
      restaurant,
      dishes
    };

    renderRestaurantHero(restaurant);
    renderDishes(dishes, restaurant);
    attachDetailInteractions(state);
  } catch (error) {
    console.error(error);
    const noResults = document.getElementById("noResults");
    const nameEl = document.getElementById("restaurantName");
    const metaEl = document.getElementById("restaurantMeta");
    if (noResults) {
      noResults.textContent =
        "Failed to load restaurant. Go back and try another one.";
      noResults.classList.remove("hidden");
    }
    if (nameEl) nameEl.textContent = "Restaurant unavailable";
    if (metaEl) metaEl.textContent = "";
  }
}

document.addEventListener("DOMContentLoaded", initRestaurantDetailPage);

