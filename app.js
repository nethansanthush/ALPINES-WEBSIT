(() => {
  "use strict";

  const STORAGE_KEY = "alpines_agro_cart_v1";
  const FREE_DELIVERY_THRESHOLD_LKR = 10000;
  const STANDARD_DELIVERY_LKR = 450;

  const products = Array.isArray(window.ALPINE_PRODUCTS) ? window.ALPINE_PRODUCTS : [];

  const state = {
    category: "All Products",
    searchQuery: "",
    cardQuantities: {},
    cart: loadCart(),
    drawerStep: "cart" // "cart" | "checkout" | "confirmed"
  };

  // DOM References
  const el = {
    productsGrid: document.getElementById("products-grid"),
    productsEmpty: document.getElementById("products-empty"),
    categoryFilters: document.getElementById("category-filters"),
    catalogStatus: document.getElementById("catalog-status"),
    catalogStatusText: document.getElementById("catalog-status-text"),
    resetFiltersBtn: document.getElementById("reset-filters-btn"),
    emptyResetBtn: document.getElementById("empty-reset-btn"),

    searchForm: document.getElementById("search-form"),
    searchInput: document.getElementById("search-input"),
    searchClear: document.getElementById("search-clear"),

    mobileMenuBtn: document.getElementById("mobile-menu-btn"),
    mobileNav: document.getElementById("mobile-nav"),

    cartOpenBtn: document.getElementById("cart-open-btn"),
    cartCloseBtn: document.getElementById("cart-close-btn"),
    cartBackdrop: document.getElementById("cart-backdrop"),
    cartDrawer: document.getElementById("cart-drawer"),
    cartCount: document.getElementById("cart-count"),
    cartDrawerTitle: document.getElementById("cart-drawer-title"),
    cartDrawerSubtitle: document.getElementById("cart-drawer-subtitle"),

    cartView: document.getElementById("cart-view"),
    cartItemsList: document.getElementById("cart-items-list"),
    cartEmptyState: document.getElementById("cart-empty-state"),
    cartBrowseBtn: document.getElementById("cart-browse-btn"),
    cartFooter: document.getElementById("cart-footer"),
    cartSubtotal: document.getElementById("cart-subtotal"),
    cartDeliveryNote: document.getElementById("cart-delivery-note"),
    proceedCheckoutBtn: document.getElementById("proceed-checkout-btn"),

    checkoutView: document.getElementById("checkout-view"),
    backToCartBtn: document.getElementById("back-to-cart-btn"),
    checkoutSummaryItems: document.getElementById("checkout-summary-items"),
    checkoutSubtotal: document.getElementById("checkout-subtotal"),
    checkoutDelivery: document.getElementById("checkout-delivery"),
    checkoutTotal: document.getElementById("checkout-total"),
    checkoutForm: document.getElementById("checkout-form"),

    orderConfirmedView: document.getElementById("order-confirmed-view"),
    confirmedOrderRef: document.getElementById("confirmed-order-ref"),
    confirmedCustomerMsg: document.getElementById("confirmed-customer-msg"),
    confirmedSummaryBox: document.getElementById("confirmed-summary-box"),
    continueShoppingBtn: document.getElementById("continue-shopping-btn"),

    newsletterForm: document.getElementById("newsletter-form"),
    newsletterEmail: document.getElementById("newsletter-email"),
    newsletterFeedback: document.getElementById("newsletter-feedback"),
    toast: document.getElementById("toast"),
    footerYear: document.getElementById("footer-year")
  };

  let toastTimer = null;

  // Helpers
  function formatLkr(amount) {
    return `LKR ${Math.round(amount).toLocaleString("en-US")}`;
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart));
    } catch {
      // Ignore storage quota errors in restricted contexts
    }
  }

  function getProductById(id) {
    return products.find((item) => item.id === id) || null;
  }

  function getCardQty(id) {
    return state.cardQuantities[id] || 1;
  }

  function calculateCartTotals() {
    let itemCount = 0;
    let subtotal = 0;

    const lines = state.cart
      .map((entry) => {
        const product = getProductById(entry.id);
        if (!product) return null;
        const qty = Math.max(1, Number(entry.qty) || 1);
        const lineTotal = product.priceLkr * qty;
        itemCount += qty;
        subtotal += lineTotal;
        return { product, qty, lineTotal };
      })
      .filter(Boolean);

    const delivery =
      subtotal === 0
        ? 0
        : subtotal >= FREE_DELIVERY_THRESHOLD_LKR
          ? 0
          : STANDARD_DELIVERY_LKR;

    return {
      lines,
      itemCount,
      subtotal,
      delivery,
      total: subtotal + delivery
    };
  }

  function hideToast() {
    clearTimeout(toastTimer);
    if (el.toast) el.toast.hidden = true;
  }

  function showToast(message) {
    if (!el.toast) return;
    el.toast.textContent = message;
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.toast.hidden = true;
    }, 2600);
  }

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Catalog Filtering & Rendering
  function renderCategoryFilters() {
    if (!el.categoryFilters) return;
    const seen = new Set();
    const categories = [];
    products.forEach((product) => {
      const raw = (product.category || "").trim();
      if (!raw) return;
      const key = raw.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        categories.push(raw);
      }
    });

    const allTabs = ["All Products", ...categories];
    el.categoryFilters.innerHTML = allTabs
      .map((cat) => {
        const active = cat.toLowerCase() === state.category.toLowerCase();
        return `
          <button
            type="button"
            class="filter-pill${active ? " is-active" : ""}"
            data-category="${escapeHtml(cat)}"
            role="tab"
            aria-selected="${active}"
          >
            ${escapeHtml(cat)}
          </button>
        `;
      })
      .join("");
  }

  function getFilteredProducts() {
    const query = state.searchQuery.trim().toLowerCase();
    const terms = query ? query.split(/\s+/).filter(Boolean) : [];

    return products.filter((product) => {
      const matchesCategory =
        state.category === "All Products" ||
        (product.category || "").toLowerCase() === state.category.toLowerCase();
      if (!matchesCategory) return false;
      if (terms.length === 0) return true;

      const primaryFields = `${product.name} ${product.category} ${product.unit}`.toLowerCase();
      const description = product.description.toLowerCase();

      return terms.every((term) => {
        if (primaryFields.includes(term)) return true;
        const wordPrefix = new RegExp(`\\b${escapeRegExp(term)}`, "i");
        return wordPrefix.test(description);
      });
    });
  }

  function renderCatalog() {
    const filtered = getFilteredProducts();
    const isFiltered =
      state.category !== "All Products" || state.searchQuery.trim().length > 0;

    if (isFiltered) {
      const parts = [];
      if (state.category !== "All Products") parts.push(`Category: ${state.category}`);
      if (state.searchQuery.trim()) parts.push(`Search: "${state.searchQuery.trim()}"`);
      el.catalogStatusText.textContent = `Showing ${filtered.length} product${
        filtered.length === 1 ? "" : "s"
      } (${parts.join(" • ")})`;
      el.catalogStatus.hidden = false;
    } else {
      el.catalogStatus.hidden = true;
    }

    if (filtered.length === 0) {
      el.productsGrid.innerHTML = "";
      el.productsEmpty.hidden = false;
      return;
    }

    el.productsEmpty.hidden = true;
    el.productsGrid.innerHTML = filtered
      .map((product) => {
        const qty = getCardQty(product.id);
        const badgeHtml = product.badge
          ? `<span class="product-card__badge">${escapeHtml(product.badge)}</span>`
          : "";

        return `
          <article class="product-card" data-product-id="${escapeHtml(product.id)}">
            <div class="product-card__media">
              <img
                src="${escapeHtml(product.image)}"
                alt="${escapeHtml(product.name)}"
                class="product-card__img"
                loading="lazy"
              />
              ${badgeHtml}
            </div>
            <div class="product-card__body">
              <div class="product-card__meta">
                <span class="product-card__cat">${escapeHtml(product.category)}</span>
                <span class="product-card__unit">${escapeHtml(product.unit)}</span>
              </div>
              <h3 class="product-card__title">${escapeHtml(product.name)}</h3>
              <p class="product-card__desc">${escapeHtml(product.description)}</p>
              <div class="product-card__price-row">
                <span class="product-card__price">${formatLkr(product.priceLkr)}</span>
              </div>
              <div class="product-card__controls">
                <div class="qty-control" aria-label="Quantity for ${escapeHtml(product.name)}">
                  <button
                    type="button"
                    class="qty-control__btn"
                    data-action="dec-card"
                    data-id="${escapeHtml(product.id)}"
                    aria-label="Decrease quantity"
                  >&minus;</button>
                  <span class="qty-control__val" data-card-qty="${escapeHtml(product.id)}">${qty}</span>
                  <button
                    type="button"
                    class="qty-control__btn"
                    data-action="inc-card"
                    data-id="${escapeHtml(product.id)}"
                    aria-label="Increase quantity"
                  >+</button>
                </div>
                <button
                <a href="${product.whatsappLink}" target="_blank" class="btn btn--primary">Order on WhatsApp</a> 
              </div>
            </div>
          </article>
       
      .join("");
  }

  function resetFilters() {
    state.category = "All Products";
    state.searchQuery = "";
    el.searchInput.value = "";
    el.searchClear.hidden = true;
    syncFilterButtons();
    renderCatalog();
  }

  function syncFilterButtons() {
    const buttons = el.categoryFilters.querySelectorAll(".filter-pill");
    buttons.forEach((btn) => {
      const active = btn.dataset.category === state.category;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });
  }

  // Cart Operations
  function addToCart(productId, quantity) {
    const product = getProductById(productId);
    if (!product) return;

    const existing = state.cart.find((item) => item.id === productId);
    if (existing) {
      existing.qty = Math.min(99, existing.qty + quantity);
    } else {
      state.cart.push({ id: productId, qty: Math.min(99, quantity) });
    }

    saveCart();
    renderCart();
    showToast(${quantity} × ${product.name} to cart);
  }

  function updateCartItemQty(productId, delta) {
    const idx = state.cart.findIndex((item) => item.id === productId);
    if (idx === -1) return;

    const nextQty = state.cart[idx].qty + delta;
    if (nextQty <= 0) {
      state.cart.splice(idx, 1);
    } else {
      state.cart[idx].qty = Math.min(99, nextQty);
    }

    saveCart();
    renderCart();
  }

  function removeCartItem(productId) {
    state.cart = state.cart.filter((item) => item.id !== productId);
    saveCart();
    renderCart();
  }

  // Cart Drawer & Checkout Rendering
  function renderCart() {
    const { lines, itemCount, subtotal, delivery, total } = calculateCartTotals();
    el.cartCount.textContent = String(itemCount);

    if (state.drawerStep === "cart") {
      el.cartDrawerTitle.textContent = "Your Cart";
      el.cartDrawerSubtitle.textContent = `${itemCount} item${itemCount === 1 ? "" : "s"} selected`;
    } else if (state.drawerStep === "checkout") {
      el.cartDrawerTitle.textContent = "Checkout";
      el.cartDrawerSubtitle.textContent = `${itemCount} item${itemCount === 1 ? "" : "s"} • ${formatLkr(total)}`;
    } else {
      el.cartDrawerTitle.textContent = "Order Placed";
      el.cartDrawerSubtitle.textContent = "Thank you for choosing Alpine";
    }

    // View visibility
    el.cartView.hidden = state.drawerStep !== "cart";
    el.checkoutView.hidden = state.drawerStep !== "checkout";
    el.orderConfirmedView.hidden = state.drawerStep !== "confirmed";

    const hasItems = lines.length > 0;
    el.cartEmptyState.hidden = hasItems;
    el.cartItemsList.hidden = !hasItems;
    el.cartFooter.hidden = state.drawerStep !== "cart" || !hasItems;

    // Cart items markup
    el.cartItemsList.innerHTML = lines
      .map(
        ({ product, qty, lineTotal }) => `
        <div class="cart-item" data-cart-id="${escapeHtml(product.id)}">
          <img
            src="${escapeHtml(product.image)}"
            alt="${escapeHtml(product.name)}"
            class="cart-item__img"
          />
          <div>
            <div class="cart-item__top">
              <h3 class="cart-item__title">${escapeHtml(product.name)}</h3>
              <button
                type="button"
                class="cart-item__remove"
                data-action="remove-cart-item"
                data-id="${escapeHtml(product.id)}"
                aria-label="Remove ${escapeHtml(product.name)}"
              >Remove</button>
            </div>
            <p class="cart-item__unit-price">${formatLkr(product.priceLkr)} / ${escapeHtml(product.unit)}</p>
            <div class="cart-item__bottom">
              <div class="qty-control" aria-label="Cart quantity for ${escapeHtml(product.name)}">
                <button
                  type="button"
                  class="qty-control__btn"
                  data-action="dec-cart"
                  data-id="${escapeHtml(product.id)}"
                  aria-label="Decrease quantity"
                >&minus;</button>
                <span class="qty-control__val">${qty}</span>
                <button
                  type="button"
                  class="qty-control__btn"
                  data-action="inc-cart"
                  data-id="${escapeHtml(product.id)}"
                  aria-label="Increase quantity"
                >+</button>
              </div>
              <span class="cart-item__line-total">${formatLkr(lineTotal)}</span>
            </div>
          </div>
        </div>
      `
      )
      .join("");

    // Totals
    el.cartSubtotal.textContent = formatLkr(subtotal);
    el.cartDeliveryNote.textContent =
      subtotal >= FREE_DELIVERY_THRESHOLD_LKR
        ? "Free islandwide delivery unlocked"
        : `Add ${formatLkr(FREE_DELIVERY_THRESHOLD_LKR - subtotal)} more for free delivery`;

    // Checkout summary
    el.checkoutSummaryItems.innerHTML = lines
      .map(
        ({ product, qty, lineTotal }) => `
        <li>
          <span>${qty} &times; ${escapeHtml(product.name)}</span>
          <strong>${formatLkr(lineTotal)}</strong>
        </li>
      `
      )
      .join("");

    el.checkoutSubtotal.textContent = formatLkr(subtotal);
    el.checkoutDelivery.textContent = delivery === 0 ? "Free" : formatLkr(delivery);
    el.checkoutTotal.textContent = formatLkr(total);
  }

  function openCartDrawer(step = "cart") {
    hideToast();
    state.drawerStep = step;
    renderCart();
    el.cartBackdrop.hidden = false;
    el.cartDrawer.hidden = false;
    el.cartOpenBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    el.cartCloseBtn.focus();
  }

  function closeCartDrawer() {
    el.cartBackdrop.hidden = true;
    el.cartDrawer.hidden = true;
    el.cartOpenBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    if (state.drawerStep === "confirmed") {
      state.drawerStep = "cart";
      renderCart();
    }
    el.cartOpenBtn.focus();
  }

  // Checkout Form Validation
  function clearFormErrors() {
    ["name", "address", "phone", "email"].forEach((field) => {
      const input = el.checkoutForm.elements[field];
      const err = document.getElementById(`err-${field}`);
      if (input) input.classList.remove("is-invalid");
      if (err) err.textContent = "";
    });
  }

  function setFieldError(field, message) {
    const input = el.checkoutForm.elements[field];
    const err = document.getElementById(`err-${field}`);
    if (input) input.classList.add("is-invalid");
    if (err) err.textContent = message;
  }

  function validateCheckoutForm() {
    clearFormErrors();
    let valid = true;

    const name = el.checkoutForm.elements.name.value.trim();
    const address = el.checkoutForm.elements.address.value.trim();
    const phone = el.checkoutForm.elements.phone.value.trim();
    const email = el.checkoutForm.elements.email.value.trim();

    if (name.length < 2) {
      setFieldError("name", "Please enter your full name.");
      valid = false;
    }

    if (address.length < 6) {
      setFieldError("address", "Please provide a complete delivery address.");
      valid = false;
    }

    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length < 9) {
      setFieldError("phone", "Enter a valid contact phone number.");
      valid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFieldError("email", "Enter a valid email address.");
      valid = false;
    }

    return valid ? { name, address, phone, email } : null;
  }

  // Event Listeners
  function bindEvents() {
    if (el.footerYear) {
      el.footerYear.textContent = String(new Date().getFullYear());
    }

    // Category filter tabs
    el.categoryFilters.addEventListener("click", (event) => {
      const btn = event.target.closest(".filter-pill");
      if (!btn) return;
      state.category = btn.dataset.category || "All Products";
      syncFilterButtons();
      renderCatalog();
    });

    // Search bar
    el.searchInput.addEventListener("input", () => {
      state.searchQuery = el.searchInput.value;
      el.searchClear.hidden = state.searchQuery.length === 0;
      renderCatalog();
    });

    el.searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      state.searchQuery = el.searchInput.value;
      renderCatalog();
      const shopEl = document.getElementById("shop");
      if (shopEl) shopEl.scrollIntoView({ behavior: "smooth" });
    });

    el.searchClear.addEventListener("click", () => {
      state.searchQuery = "";
      el.searchInput.value = "";
      el.searchClear.hidden = true;
      renderCatalog();
      el.searchInput.focus();
    });

    el.resetFiltersBtn.addEventListener("click", resetFilters);
    el.emptyResetBtn.addEventListener("click", resetFilters);

    // Product grid interactions (quantity & add to cart)
    el.productsGrid.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-action]");
      if (!btn) return;

      const { action, id } = btn.dataset;
      if (!id) return;

      if (action === "inc-card" || action === "dec-card") {
        const current = getCardQty(id);
        const next = action === "inc-card" ? Math.min(99, current + 1) : Math.max(1, current - 1);
        state.cardQuantities[id] = next;
        const qtySpan = el.productsGrid.querySelector(`[data-card-qty="${CSS.escape(id)}"]`);
        if (qtySpan) qtySpan.textContent = String(next);
      } else if (action === "add-to-cart") {
        const qty = getCardQty(id);
        addToCart(id, qty);
        btn.classList.add("is-added");
        btn.textContent = "Added ✓";
        setTimeout(() => {
          btn.classList.remove("is-added");
          btn.textContent = "Add to Cart";
        }, 1100);
      }
    });

    // Cart drawer open/close
    el.cartOpenBtn.addEventListener("click", () => openCartDrawer("cart"));
    el.cartCloseBtn.addEventListener("click", closeCartDrawer);
    el.cartBackdrop.addEventListener("click", closeCartDrawer);

    el.cartBrowseBtn.addEventListener("click", () => {
      closeCartDrawer();
      document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
    });

    // Cart item quantity & removal
    el.cartItemsList.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-action]");
      if (!btn) return;
      const { action, id } = btn.dataset;
      if (!id) return;

      if (action === "inc-cart") updateCartItemQty(id, 1);
      else if (action === "dec-cart") updateCartItemQty(id, -1);
      else if (action === "remove-cart-item") removeCartItem(id);
    });

    // Checkout transitions
    el.proceedCheckoutBtn.addEventListener("click", () => {
      if (state.cart.length === 0) return;
      state.drawerStep = "checkout";
      renderCart();
    });

    el.backToCartBtn.addEventListener("click", () => {
      state.drawerStep = "cart";
      renderCart();
    });

    el.checkoutForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const customer = validateCheckoutForm();
      if (!customer) return;

      const snapshot = calculateCartTotals();
      if (snapshot.lines.length === 0) return;

      const orderRef = `ALP-${Math.floor(1000 + Math.random() * 9000)}`;
      el.confirmedOrderRef.textContent = orderRef;
      el.confirmedCustomerMsg.textContent = `We have received your order for ${customer.name}. A confirmation summary has been prepared for ${customer.email} and our dispatch team will call ${customer.phone} prior to delivery to ${customer.address}.`;

      el.confirmedSummaryBox.innerHTML = `
        <h4 class="checkout-block-title">Confirmed Items</h4>
        <ul class="checkout-items-list">
          ${snapshot.lines
            .map(
              ({ product, qty, lineTotal }) => `
              <li>
                <span>${qty} &times; ${escapeHtml(product.name)}</span>
                <strong>${formatLkr(lineTotal)}</strong>
              </li>
            `
            )
            .join("")}
        </ul>
        <div class="checkout-totals">
          <div class="summary-row">
            <span>Delivery</span>
            <span>${snapshot.delivery === 0 ? "Free" : formatLkr(snapshot.delivery)}</span>
          </div>
          <div class="summary-row summary-row--total">
            <span>Total Paid / Due</span>
            <strong>${formatLkr(snapshot.total)}</strong>
          </div>
        </div>
      `;

      state.cart = [];
      saveCart();
      el.checkoutForm.reset();
      state.drawerStep = "confirmed";
      renderCart();
    });

    el.continueShoppingBtn.addEventListener("click", closeCartDrawer);

    // Mobile nav toggle
    el.mobileMenuBtn.addEventListener("click", () => {
      const isHidden = el.mobileNav.hidden;
      el.mobileNav.hidden = !isHidden;
      el.mobileMenuBtn.setAttribute("aria-expanded", String(isHidden));
    });

    el.mobileNav.addEventListener("click", (event) => {
      if (event.target.matches(".mobile-nav__link")) {
        el.mobileNav.hidden = true;
        el.mobileMenuBtn.setAttribute("aria-expanded", "false");
      }
    });

    // Newsletter subscription
    el.newsletterForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const email = el.newsletterEmail.value.trim();
      if (!email) return;
      el.newsletterFeedback.textContent = `Subscribed ${email} to Alpine seasonal updates.`;
      el.newsletterForm.reset();
    });

    // Escape closes drawer
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !el.cartDrawer.hidden) {
        closeCartDrawer();
      }
    });
  }

  // Initialize
  renderCategoryFilters();
  renderCatalog();
  renderCart();
  bindEvents();
})();
