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
  const restaurantCount = document.getElementById("restaurantCount");
  if (!hotelGrid) return;

  hotelGrid.innerHTML = "";
  if (restaurantCount) {
    restaurantCount.textContent = `${restaurants.length} restaurants`;
  }

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

function renderCarousel(restaurants) {
  const track = document.getElementById("carouselTrack");
  if (!track) return;

  track.innerHTML = "";
  restaurants.slice(0, 16).forEach((restaurant) => {
    const card = document.createElement("article");
    card.className = "hotel-card carousel__card";
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

    track.appendChild(card);
  });

  const prevBtn = document.getElementById("carouselPrev");
  const nextBtn = document.getElementById("carouselNext");
  const viewport = document.querySelector(".carousel__viewport");

  if (viewport && prevBtn && nextBtn) {
    const scrollAmount = () => viewport.clientWidth * 0.9;

    prevBtn.onclick = () => {
      viewport.scrollBy({ left: -scrollAmount(), behavior: "smooth" });
    };
    nextBtn.onclick = () => {
      viewport.scrollBy({ left: scrollAmount(), behavior: "smooth" });
    };

    track.addEventListener("click", (event) => {
      const card = event.target.closest(".hotel-card");
      if (!card) return;
      const hotelId = Number(card.dataset.hotelId);
      if (!hotelId) return;
      window.location.href = `restaurant.html?id=${hotelId}`;
    });
  }
}

function attachListInteractions(state) {
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

    let filteredRestaurants = [...state.restaurants];

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

async function initRestaurantsPage() {
  try {
    const config = await loadConfig();
    const restaurants = buildRestaurants(config, 100);

    const state = {
      restaurants,
      activeTag: "All",
      activeCuisine: null,
      showAll: false
    };

    createCuisineFilters(restaurants);
    renderRestaurants(restaurants);
    attachListInteractions(state);

    renderCarousel(restaurants);

    const showAllBtn = document.getElementById("showAllRestaurants");
    const hotelGrid = document.getElementById("hotelGrid");
    const carousel = document.getElementById("restaurantCarousel");

    if (showAllBtn && hotelGrid) {
      showAllBtn.addEventListener("click", () => {
        state.showAll = !state.showAll;

        if (state.showAll) {
          hotelGrid.classList.remove("hidden");
          if (carousel) carousel.classList.add("hidden");
          showAllBtn.innerHTML =
            '<span>Show less</span><span>▴</span>';
          const top =
            hotelGrid.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top, behavior: "smooth" });
        } else {
          hotelGrid.classList.add("hidden");
          if (carousel) carousel.classList.remove("hidden");
          showAllBtn.innerHTML =
            '<span>Show all restaurants</span><span>▾</span>';
        }
      });
    }
  } catch (error) {
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", initRestaurantsPage);

