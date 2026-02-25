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

function createCuisineFilters(restaurants) {
  const cuisineSet = new Set();
  restaurants.forEach((restaurant) => {
    restaurant.cuisines.forEach((c) => cuisineSet.add(c));
  });

  const filtersContainer = document.getElementById("cuisineFilters");
  if (!filtersContainer) return;
  filtersContainer.innerHTML = "";

  const cuisines = Array.from(cuisineSet).sort();
  cuisines.forEach((cuisine) => {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.textContent = cuisine;
    chip.dataset.cuisine = cuisine;
    filtersContainer.appendChild(chip);
  });
}

function ratingClass(rating) {
  if (rating >= 4.3) return "rating-pill";
  if (rating >= 3.8) return "rating-pill rating-pill--mid";
  return "rating-pill rating-pill--low";
}

function renderRestaurants(restaurants) {
  const hotelGrid = document.getElementById("hotelGrid");
  if (!hotelGrid) return;
  hotelGrid.innerHTML = "";

  restaurants.forEach((restaurant) => {
    const card = document.createElement("article");
    card.className = "hotel-card";
    card.dataset.hotelId = restaurant.id;

    const cuisines = restaurant.cuisines.join(", ");
    const tags =
      restaurant.tags && restaurant.tags.length > 0
        ? restaurant.tags.join(" · ")
        : "";

    card.innerHTML = `
      <div class="hotel-card__image">
        <div class="hotel-card__badge">${tags || restaurant.area}</div>
      </div>
      <h3 class="hotel-card__name">${restaurant.name}</h3>
      <div class="hotel-card__meta">
        <span class="${ratingClass(restaurant.rating)}">
          ★ ${restaurant.rating.toFixed(1)}
        </span>
        <span>•</span>
        <span>${restaurant.deliveryTime}</span>
      </div>
      <p class="hotel-card__cuisines" title="${cuisines}">${cuisines}</p>
      <p class="hotel-card__info">${restaurant.area} · ${
      restaurant.costForTwo
    }</p>
    `;

    hotelGrid.appendChild(card);
  });
}

function renderDishCards(dishes, restaurantsById, targetGridId, countLabelEl) {
  const dishGrid = document.getElementById(targetGridId);
  const noResults = document.getElementById("noResults");

  if (!dishGrid) return;

  dishGrid.innerHTML = "";
  if (countLabelEl) {
    countLabelEl.textContent = `${dishes.length} dishes`;
  }

  if (dishes.length === 0) {
    if (noResults) noResults.classList.remove("hidden");
    return;
  }

  if (noResults) noResults.classList.add("hidden");

  dishes.forEach((dish) => {
    const restaurant = restaurantsById[dish.restaurantId];
    const isVegIcon = dish.isVeg ? "🟢" : "🔴";

    const card = document.createElement("article");
    card.className = "dish-card";
    card.dataset.dishId = String(dish.id);
    card.dataset.restaurantId = String(dish.restaurantId);
    card.dataset.dishName = dish.name;
    card.dataset.restaurantName = restaurant ? restaurant.name : "";
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
        <p class="dish-card__hotel">${restaurant ? restaurant.name : ""} · ${
      dish.cuisine
    }</p>
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

function attachAddToCartHandler(gridId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  grid.addEventListener("click", (event) => {
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

function attachHomeInteractions(state) {
  const filterAllBtn = document.getElementById("filterAll");
  const filterButtons = document.querySelectorAll(".nav__item[data-filter]");
  const cuisineFilters = document.getElementById("cuisineFilters");
  const searchInput = document.getElementById("searchInput");
  const searchInputMobile = document.getElementById("searchInputMobile");
  const hotelGrid = document.getElementById("hotelGrid");

  function applyFilters() {
    const query = (searchInput?.value || searchInputMobile?.value || "")
      .trim()
      .toLowerCase();

    let filteredRestaurants = state.restaurants.slice(0, state.featureCount);

    if (state.activeTag && state.activeTag !== "All") {
      filteredRestaurants = filteredRestaurants.filter((restaurant) =>
        restaurant.tags?.includes(state.activeTag)
      );
    }

    if (state.activeCuisine) {
      filteredRestaurants = filteredRestaurants.filter((restaurant) =>
        restaurant.cuisines.includes(state.activeCuisine)
      );
    }

    if (query) {
      filteredRestaurants = filteredRestaurants.filter((restaurant) => {
        const name = restaurant.name.toLowerCase();
        const area = restaurant.area.toLowerCase();
        const cuisines = restaurant.cuisines.join(" ").toLowerCase();
        return (
          name.includes(query) ||
          area.includes(query) ||
          cuisines.includes(query)
        );
      });
    }

    renderRestaurants(filteredRestaurants);
  }

  if (filterAllBtn) {
    filterAllBtn.addEventListener("click", () => {
      state.activeTag = "All";
      document
        .querySelectorAll(".nav__item")
        .forEach((btn) => btn.removeAttribute("data-active"));
      filterAllBtn.dataset.active = "true";
      applyFilters();
    });
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tag = btn.dataset.filter;
      state.activeTag = tag;

      document
        .querySelectorAll(".nav__item")
        .forEach((b) => b.removeAttribute("data-active"));
      btn.dataset.active = "true";
      applyFilters();
    });
  });

  if (cuisineFilters) {
    cuisineFilters.addEventListener("click", (event) => {
      const chip = event.target.closest(".chip");
      if (!chip) return;

      const cuisine = chip.dataset.cuisine;
      if (state.activeCuisine === cuisine) {
        state.activeCuisine = null;
        chip.classList.remove("chip--active");
      } else {
        state.activeCuisine = cuisine;
        document
          .querySelectorAll(".chip")
          .forEach((c) => c.classList.remove("chip--active"));
        chip.classList.add("chip--active");
      }
      applyFilters();
    });
  }

  const searchHandler = () => applyFilters();
  if (searchInput) searchInput.addEventListener("input", searchHandler);
  if (searchInputMobile)
    searchInputMobile.addEventListener("input", searchHandler);

  if (hotelGrid) {
    hotelGrid.addEventListener("click", (event) => {
      const card = event.target.closest(".hotel-card");
      if (!card) return;
      const hotelId = Number(card.dataset.hotelId);
      if (!hotelId) return;
      window.location.href = `restaurant.html?id=${hotelId}`;
    });
  }

  applyFilters();
}

async function initHome() {
  try {
    const config = await loadConfig();
    const restaurants = buildRestaurants(config, 100);
    const restaurantsById = restaurants.reduce((acc, r) => {
      acc[r.id] = r;
      return acc;
    }, {});

    const featureCount = 12;

    const sampleRestaurants = restaurants.slice(0, 4);
    const dishes = sampleRestaurants.flatMap((restaurant) =>
      buildDishesForRestaurant(restaurant, config, 10)
    );

    const bestDishes = [...dishes]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 8);

    const state = {
      restaurants,
      restaurantsById,
      dishes,
      featureCount,
      activeTag: "All",
      activeCuisine: null
    };

    createCuisineFilters(restaurants);
    renderRestaurants(restaurants.slice(0, featureCount));
    renderDishCards(
      dishes,
      restaurantsById,
      "dishGrid",
      document.getElementById("dishCount")
    );
    renderDishCards(bestDishes, restaurantsById, "bestDishGrid", null);
    attachAddToCartHandler("dishGrid");
    attachAddToCartHandler("bestDishGrid");
    attachHomeInteractions(state);
    attachBestCategoryInteractions();
  } catch (error) {
    console.error(error);
    const noResults = document.getElementById("noResults");
    if (noResults) {
      noResults.textContent = "Failed to load data. Please refresh the page.";
      noResults.classList.remove("hidden");
    }
  }
}

document.addEventListener("DOMContentLoaded", initHome);

function attachBestCategoryInteractions() {
  const container = document.getElementById("bestCategories");
  if (!container) return;

  const searchInput = document.getElementById("searchInput");
  const searchInputMobile = document.getElementById("searchInputMobile");
  const dishGrid = document.getElementById("dishGrid");

  container.addEventListener("click", (event) => {
    const card = event.target.closest(".best-category-card");
    if (!card) return;
    const keyword = card.dataset.keyword || "";

    if (searchInput) searchInput.value = keyword;
    if (searchInputMobile) searchInputMobile.value = keyword;

    const targetInput = searchInput || searchInputMobile;
    if (targetInput) {
      const ev = new Event("input", { bubbles: true });
      targetInput.dispatchEvent(ev);
    }

    if (dishGrid) {
      const top =
        dishGrid.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: "smooth" });
    }
  });
}







