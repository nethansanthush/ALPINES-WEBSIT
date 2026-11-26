/**
 * Alpines Agro Investment (Pvt) Ltd — Product Catalog
 * ---------------------------------------------------------------------------
 * Easily add, update, or remove products and LKR prices in the array below.
 *
 * Fields per product:
 * - id:          Unique slug identifier (e.g., "omega-100ml")
 * - name:        Display title shown on the product card
 * - category:    Category name (filter tabs are generated automatically)
 * - unit:        Pack size or measurement shown on the card
 * - priceLkr:    Numeric price in Sri Lankan Rupees (LKR), without commas
 * - badge:       Optional short highlight tag, or ""
 * - inStock:     true | false
 * - description: Product overview / usage instructions
 * - image:       Relative path to product image inside assets/images/
 */

window.ALPINE_PRODUCTS = [
  {
    id: "omega-100ml",
    name: "Omega 100ml",
    category: "Pesticides",
    unit: "100 ml",
    priceLkr: 650,
    badge: "Starter Pack",
    inStock: true,
    description:
      "සියලුම පලිබෝධකයන් සඳහා ඵලදායී විසඳුමකි. ජලය 16L කට මෙම නිෂ්පාදනයෙන් 50ml ක් මිශ්ර කර වගාවට යොදන්න.",
    image: "assets/images/product1.jpg.jpg"
  },
  {
    id: "omega-200ml",
    name: "Omega 200ml",
    category: "Pesticides",
    unit: "200 ml",
    priceLkr: 1200,
    badge: "Popular",
    inStock: true,
    description:
      "සියලුම පලිබෝධකයන් සඳහා ඵලදායී විසඳුමකි. ජලය 16L කට මෙම නිෂ්පාදනයෙන් 50ml ක් මිශ්ර කර වගාවට යොදන්න.",
    image: "assets/images/product2.jpg.jpg"
  },
  {
    id: "omega-500ml",
    name: "Omega 500ml",
    category: "Pesticides",
    unit: "500 ml",
    priceLkr: 3000,
    badge: "Best Value",
    inStock: true,
    description:
      "සියලුම පලිබෝධකයන් සඳහා ඵලදායී විසඳුමකි. ජලය 16L කට මෙම නිෂ්පාදනයෙන් 50ml ක් මිශ්ර කර වගාවට යොදන්න.",
    image: "assets/images/product3.jpg.jpg"
  },
  {
    id: "omega-1l",
    name: "Omega 1L",
    category: "Pesticides",
    unit: "1 Litre",
    priceLkr: 5700,
    badge: "Estate Pack",
    inStock: true,
    description:
      "සියලුම පලිබෝධකයන් සඳහා ඵලදායී විසඳුමකි. ජලය 16L කට මෙම නිෂ්පාදනයෙන් 50ml ක් මිශ්ර කර වගාවට යොදන්න.",
    image: "assets/images/product4.jpg.jpg"
  }
];
