// ============================================================
// KHALID'S DREAMS — MAIN SITE APP
// ============================================================

/* ── State ── */
let wishlist = JSON.parse(localStorage.getItem("kd_wish") || "[]");
let cart = JSON.parse(localStorage.getItem("kd_cart2") || "[]");
let orderProduct = null; // current product for order modal
let curPayment = "cod";
let heroIdx = 0,
  heroTimer;
let midIdx = 0,
  midTimer;

/* ── On Load ── */
document.addEventListener("DOMContentLoaded", () => {
  KD.track("visit");
  injectAnalytics();
  buildNav();
  buildHero();
  buildOfferStrip();
  buildCategories();
  buildFeatured();
  buildMidCarousel();
  buildAllProducts();
  buildTrust();
  buildFooter();
  setupSearch();
  setupNavScroll();
  updateBadges();
  setupScrollAnim();
  setupModalClose();
  setupQtyInput();

  // listen for admin data changes (cross-tab)
  window.addEventListener("storage", (e) => {
    if (e.key === "kd_store") {
      buildHero();
      buildCategories();
      buildFeatured();
      buildAllProducts();
    }
  });
});

/* ============================================================
   ANALYTICS INJECT
   ============================================================ */
function injectAnalytics() {
  const cfg = KD.getConfig();
  // Facebook Pixel
  if (cfg.fbPixelId) {
    const s = document.createElement("script");
    s.text = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${cfg.fbPixelId}');fbq('track','PageView');`;
    document.head.appendChild(s);
  }
  // Google Analytics
  if (cfg.gaId) {
    const s1 = document.createElement("script");
    s1.async = true;
    s1.src = `https://www.googletagmanager.com/gtag/js?id=${cfg.gaId}`;
    document.head.appendChild(s1);
    const s2 = document.createElement("script");
    s2.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${cfg.gaId}');`;
    document.head.appendChild(s2);
  }
}

/* ============================================================
   NAV
   ============================================================ */
function buildNav() {
  const cfg = KD.getConfig();
  // update logo text & WA link
  const logoEl = document.getElementById("siteLogo");
  if (logoEl) logoEl.textContent = cfg.siteName;
  const logoImgEl = document.getElementById("logoImg");
  if (logoImgEl && cfg.logoImage) {
    logoImgEl.src = cfg.logoImage;
    logoImgEl.style.display = "block";
    document.getElementById("logoEmoji").style.display = "none";
  }
  const waLinks = document.querySelectorAll(".wa-link");
  waLinks.forEach((el) => (el.href = `https://wa.me/${cfg.whatsapp}`));
  const callLinks = document.querySelectorAll(".call-link");
  callLinks.forEach((el) => (el.href = `tel:${cfg.phone}`));
}

function setupNavScroll() {
  window.addEventListener("scroll", () => {
    document
      .getElementById("navbar")
      .classList.toggle("scrolled", scrollY > 40);
  });
}

/* ============================================================
   SEARCH
   ============================================================ */
function setupSearch() {
  const inp = document.getElementById("searchInput");
  const drop = document.getElementById("searchDrop");
  inp.addEventListener("input", () => {
    const q = inp.value.trim().toLowerCase();
    if (!q) {
      drop.classList.remove("show");
      return;
    }
    const results = KD.getProducts().filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.nameEn || "").toLowerCase().includes(q),
    );
    if (!results.length) {
      drop.innerHTML = `<div class="sd-item" style="color:var(--text-muted)">কোনো পণ্য পাওয়া যায়নি</div>`;
    } else {
      drop.innerHTML = results
        .slice(0, 6)
        .map(
          (p) => `
        <div class="sd-item" onclick="openDetail(${p.id}); clearSearch()">
          ${p.image ? `<img class="sd-img" src="${p.image}" alt="${p.name}">` : `<span class="sd-emoji">${p.emoji}</span>`}
          <div><div class="sd-name">${p.name}</div><div class="sd-price">৳ ${p.price} / ${p.unit}</div></div>
        </div>`,
        )
        .join("");
    }
    drop.classList.add("show");
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".nav-search")) drop.classList.remove("show");
  });
}
function clearSearch() {
  document.getElementById("searchInput").value = "";
  document.getElementById("searchDrop").classList.remove("show");
}

/* ============================================================
   HERO CAROUSEL
   ============================================================ */
function buildHero() {
  const slides = KD.getHeroSlides();
  const cont = document.getElementById("heroSlides");
  const dots = document.getElementById("heroDots");
  cont.innerHTML = slides
    .map(
      (s) => `
    <div class="hero-slide" style="${!s.image ? "background:" + s.bg : ""}">
      ${s.image ? `<img class="hero-bg-img" src="${s.image}" alt="${s.title}">` : ""}
      <div class="hs-content">
        <div class="hs-badge">${s.offer}</div>
        <h1>${s.title}</h1>
        <p>${s.subtitle}</p>
        <a href="#all-prods" class="hs-cta">${s.cta} →</a>
      </div>
      <div class="hs-media">
        ${s.image ? "" : s.emoji ? `<span class="hs-emoji">${s.emoji}</span>` : ""}
      </div>
    </div>`,
    )
    .join("");
  dots.innerHTML = slides
    .map(
      (_, i) =>
        `<div class="hero-dot ${i === 0 ? "active" : ""}" onclick="goHero(${i})"></div>`,
    )
    .join("");
  heroIdx = 0;
  clearInterval(heroTimer);
  heroTimer = setInterval(() => heroMove(1), 4500);
}
function heroMove(d) {
  const n = KD.getHeroSlides().length;
  heroIdx = (heroIdx + d + n) % n;
  updateHero();
}
function goHero(i) {
  heroIdx = i;
  updateHero();
  clearInterval(heroTimer);
  heroTimer = setInterval(() => heroMove(1), 4500);
}
function updateHero() {
  document.getElementById("heroSlides").style.transform =
    `translateX(-${heroIdx * 100}%)`;
  document
    .querySelectorAll(".hero-dot")
    .forEach((d, i) => d.classList.toggle("active", i === heroIdx));
}

/* ============================================================
   OFFER STRIP
   ============================================================ */
function buildOfferStrip() {
  const cfg = KD.getConfig();
  const el = document.getElementById("offerStrip");
  if (!el) return;
  el.innerHTML = `
    <div class="os-item">🎉 <span>ঈদ স্পেশাল</span> সব পণ্যে ১৫% ছাড় <span class="os-tag">কোড: KHALID26</span></div>
    <div class="os-item">🚚 <span>${cfg.freeDeliveryAbove} টাকার উপরে</span> ফ্রি ডেলিভারি</div>
    <div class="os-item">⭐ <span>১০০% খাঁটি পণ্য</span> গ্যারান্টি</div>`;
}

/* ============================================================
   CATEGORIES
   ============================================================ */
function buildCategories() {
  const cats = KD.getCategories();
  document.getElementById("catList").innerHTML = cats
    .map(
      (c) => `
    <div class="cat-item ${c.id === "all" ? "active" : ""}" onclick="filterCat('${c.id}',this)">
      ${c.image ? `<img class="cat-img" src="${c.image}" alt="${c.name}">` : `<span class="cat-emoji">${c.icon}</span>`}
      <span class="cat-name">${c.name}</span>
    </div>`,
    )
    .join("");
}
function filterCat(id, el) {
  document
    .querySelectorAll(".cat-item")
    .forEach((c) => c.classList.remove("active"));
  el.classList.add("active");
  buildAllProducts(id);
  document.getElementById("all-prods").scrollIntoView({ behavior: "smooth" });
}

/* ============================================================
   PRODUCT CARD BUILDER
   ============================================================ */
function discount(p) {
  return p.oldPrice
    ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
    : 0;
}
function imgOrEmoji(p, cls = "card-img-wrap") {
  if (p.image)
    return `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover">`;
  return `<span class="card-emoji">${p.emoji || "📦"}</span>`;
}
function buildCard(p) {
  const disc = discount(p);
  const onWL = wishlist.includes(p.id);
  return `
  <div class="prod-card ${!p.inStock ? "oos" : ""}" data-id="${p.id}">
    <div class="card-img-wrap" onclick="openDetail(${p.id})">
      ${imgOrEmoji(p)}
      ${p.badge ? `<div class="card-badge b-${p.badgeType}">${p.badge}</div>` : ""}
      ${!p.inStock ? `<div class="card-badge b-oos" style="left:auto;right:10px">স্টক নেই</div>` : ""}
      <button class="wish-btn ${onWL ? "on" : ""}" onclick="event.stopPropagation();toggleWish(${p.id},this)">${onWL ? "❤️" : "🤍"}</button>
    </div>
    <div class="card-body" onclick="openDetail(${p.id})">
      <div class="card-name">${p.name}</div>
      <div class="card-unit">${p.unit}</div>
      <div class="card-rating"><span class="stars">${"⭐".repeat(Math.floor(p.rating || 4))}</span> <span>${p.rating || 4} (${p.reviews || 0})</span></div>
      <div class="card-price-row">
        <div class="price-wrap">
          <span class="price-now">৳${p.price.toLocaleString()}</span>
          ${p.oldPrice ? `<span class="price-old">৳${p.oldPrice}</span>` : ""}
          ${disc > 0 ? `<span class="price-save">${disc}%</span>` : ""}
        </div>
        <button class="cart-add-btn" onclick="event.stopPropagation();addCart(${p.id})" title="কার্টে যোগ করুন">+</button>
      </div>
    </div>
    <div class="card-footer">
      <button class="btn-order" onclick="openOrder(${p.id})">📦 অর্ডার</button>
      <button class="btn-detail" onclick="openDetail(${p.id})">বিবরণ</button>
    </div>
  </div>`;
}

function buildFeatured() {
  const all = KD.getProducts();
  const feat = all
    .filter((p) => ["bestseller", "hot", "premium"].includes(p.badgeType))
    .slice(0, 6);
  const grid = document.getElementById("featuredGrid");
  grid.innerHTML = feat.map(buildCard).join("");
  observeCards(grid);
}

function buildAllProducts(catId = "all") {
  const all = KD.getProducts();
  const list = catId === "all" ? all : all.filter((p) => p.category === catId);
  const grid = document.getElementById("allProdGrid");
  grid.innerHTML = list.length
    ? list.map(buildCard).join("")
    : `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted)">এই ক্যাটাগরিতে কোনো পণ্য নেই</div>`;
  observeCards(grid);
}

/* ============================================================
   MID CAROUSEL
   ============================================================ */
function buildMidCarousel() {
  const banners = KD.getOfferBanners();
  const cont = document.getElementById("midSlides");
  const dots = document.getElementById("midDots");
  cont.innerHTML = banners
    .map(
      (b) => `
    <div class="mid-slide" style="${!b.image ? "background:" + b.bg : ""}">
      ${b.image ? `<img class="mid-slide-bg" src="${b.image}" alt="${b.title}"><div class="mid-overlay"></div>` : ""}
      <div class="mid-text">
        <h3>${b.title}</h3>
        <p>${b.subtitle}</p>
        <span class="mid-code">${b.detail}</span>
      </div>
      ${b.image ? `<img class="mid-img" src="${b.image}" alt="">` : `<span class="mid-emoji">${b.emoji || "🎉"}</span>`}
    </div>`,
    )
    .join("");
  dots.innerHTML = banners
    .map(
      (_, i) =>
        `<div class="mid-dot ${i === 0 ? "active" : ""}" onclick="goMid(${i})"></div>`,
    )
    .join("");
  midIdx = 0;
  clearInterval(midTimer);
  midTimer = setInterval(() => {
    midIdx = (midIdx + 1) % banners.length;
    updateMid();
  }, 3800);
}
function goMid(i) {
  midIdx = i;
  updateMid();
}
function updateMid() {
  document.getElementById("midSlides").style.transform =
    `translateX(-${midIdx * 100}%)`;
  document
    .querySelectorAll(".mid-dot")
    .forEach((d, i) => d.classList.toggle("active", i === midIdx));
}

/* ============================================================
   TRUST + FOOTER
   ============================================================ */
function buildTrust() {
  const cfg = KD.getConfig();
  // trust cards are static HTML in index.html — nothing to rebuild
}
function buildFooter() {
  const cfg = KD.getConfig();
  const el = document.getElementById("footerPhone");
  if (el) el.textContent = cfg.phone;
  const el2 = document.getElementById("footerAddr");
  if (el2) el2.textContent = cfg.address;
}

/* ============================================================
   SCROLL ANIMATIONS
   ============================================================ */
function observeCards(container) {
  const cards = container.querySelectorAll(".prod-card:not(.show)");
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add("show"), i * 65);
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.08 },
  );
  cards.forEach((c) => obs.observe(c));
}
function setupScrollAnim() {
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("show");
      });
    },
    { threshold: 0.12 },
  );
  document.querySelectorAll(".trust-card").forEach((el) => obs.observe(el));
}

/* ============================================================
   WISHLIST
   ============================================================ */
function saveWish() {
  localStorage.setItem("kd_wish", JSON.stringify(wishlist));
}
function toggleWish(id, btn) {
  const idx = wishlist.indexOf(id);
  if (idx === -1) {
    wishlist.push(id);
    btn.innerHTML = "❤️";
    btn.classList.add("on");
    KD.track("wishlistAdd", { id });
    toast("❤️ উইশলিস্টে যোগ হয়েছে!", "ok");
  } else {
    wishlist.splice(idx, 1);
    btn.innerHTML = "🤍";
    btn.classList.remove("on");
    toast("উইশলিস্ট থেকে সরানো হয়েছে", "inf");
  }
  saveWish();
  updateBadges();
}
function openWishlist() {
  const body = document.getElementById("wishBody");
  const items = wishlist
    .map((id) => KD.getProducts().find((p) => p.id === id))
    .filter(Boolean);
  if (!items.length) {
    body.innerHTML = `<div class="wl-empty"><div class="ei">💔</div><p>উইশলিস্ট খালি!</p><p style="font-size:.82rem;margin-top:6px">পছন্দের পণ্যে ❤️ চাপুন</p></div>`;
  } else {
    body.innerHTML = `<div class="wl-list">${items
      .map(
        (p) => `
      <div class="wl-item">
        ${p.image ? `<img class="wl-img" src="${p.image}" alt="${p.name}">` : `<span class="wl-emoji">${p.emoji}</span>`}
        <div class="wl-info"><div class="wl-name">${p.name}</div><div class="wl-price">৳${p.price} / ${p.unit}</div></div>
        <button class="wl-rm" onclick="removeWish(${p.id})">✕</button>
        <button class="btn-order" style="border-radius:50px;padding:7px 12px;font-size:.78rem" onclick="closeModal('wishModal');openOrder(${p.id})">অর্ডার</button>
      </div>`,
      )
      .join("")}</div>`;
  }
  openModal("wishModal");
}
function removeWish(id) {
  wishlist = wishlist.filter((w) => w !== id);
  saveWish();
  updateBadges();
  openWishlist();
  document.querySelectorAll(`[data-id="${id}"] .wish-btn`).forEach((b) => {
    b.innerHTML = "🤍";
    b.classList.remove("on");
  });
}

/* ============================================================
   CART
   ============================================================ */
function saveCart() {
  localStorage.setItem("kd_cart2", JSON.stringify(cart));
}
function addCart(id) {
  const p = KD.getProducts().find((x) => x.id === id);
  if (!p || !p.inStock) {
    toast("⚠️ স্টকে নেই", "err");
    return;
  }
  const ex = cart.find((c) => c.id === id);
  if (ex) ex.qty++;
  else cart.push({ id, qty: 1 });
  saveCart();
  updateBadges();
  KD.track("cartAdd", { id });
  toast(`✅ ${p.name} কার্টে যোগ হয়েছে!`, "ok");
}
function openCartModal() {
  const body = document.getElementById("cartBody");
  const prods = KD.getProducts();
  if (!cart.length) {
    body.innerHTML = `<div class="cart-empty"><div style="font-size:3.5rem">🛒</div><p style="margin-top:10px">কার্ট খালি!</p></div>`;
  } else {
    const items = cart
      .map((c) => ({ ...prods.find((p) => p.id === c.id), qty: c.qty }))
      .filter((x) => x.id);
    const sub = items.reduce((s, p) => s + p.price * p.qty, 0);
    const cfg = KD.getConfig();
    const del = sub >= cfg.freeDeliveryAbove ? 0 : cfg.deliveryCharge;
    body.innerHTML = `
      <div class="cart-list">${items
        .map(
          (p) => `
        <div class="cart-item">
          ${p.image ? `<img class="cart-img" src="${p.image}" alt="${p.name}">` : `<span class="cart-emoji">${p.emoji}</span>`}
          <div class="ci-info"><div class="ci-name">${p.name}</div><div class="ci-unit">${p.unit}</div><div class="ci-price">৳${(p.price * p.qty).toLocaleString()}</div></div>
          <div class="ci-qty">
            <button class="ci-qb" onclick="updateCart(${p.id},-1)">−</button>
            <span class="ci-qn">${p.qty}</span>
            <button class="ci-qb" onclick="updateCart(${p.id},1)">+</button>
          </div>
          <button class="ci-rm" onclick="removeCart(${p.id})">✕</button>
        </div>`,
        )
        .join("")}
      </div>
      <div class="cart-summary">
        <div class="cs-row"><span>সাবটোটাল</span><span>৳${sub.toLocaleString()}</span></div>
        <div class="cs-row"><span>ডেলিভারি</span><span>${del === 0 ? "ফ্রি" : "৳" + del}</span></div>
        <div class="cs-row tot"><span>মোট</span><span>৳${(sub + del).toLocaleString()}</span></div>
      </div>
      <button class="btn-checkout" onclick="closeModal('cartModal');cartCheckout()">✅ চেকআউট করুন</button>`;
  }
  openModal("cartModal");
}
function updateCart(id, d) {
  const item = cart.find((c) => c.id === id);
  if (!item) return;
  item.qty += d;
  if (item.qty <= 0) cart = cart.filter((c) => c.id !== id);
  saveCart();
  updateBadges();
  openCartModal();
}
function removeCart(id) {
  cart = cart.filter((c) => c.id !== id);
  saveCart();
  updateBadges();
  openCartModal();
}

/* cart checkout — full item list to WhatsApp */
function cartCheckout() {
  const prods = KD.getProducts();
  const cfg = KD.getConfig();
  const items = cart
    .map((c) => ({ ...prods.find((p) => p.id === c.id), qty: c.qty }))
    .filter((x) => x.id);
  const sub = items.reduce((s, p) => s + p.price * p.qty, 0);
  const del = sub >= cfg.freeDeliveryAbove ? 0 : cfg.deliveryCharge;

  // build order product info display
  const listTxt = items
    .map(
      (p) =>
        `  • ${p.name} × ${p.qty} = ৳${(p.price * p.qty).toLocaleString()}`,
    )
    .join("\n");
  document.getElementById("orderProdBar").innerHTML = `
    <div>
      <div style="font-weight:600;margin-bottom:4px">🛒 কার্ট অর্ডার — ${items.length}টি পণ্য</div>
      <div style="font-size:.8rem;color:var(--text-muted)">${items.map((p) => p.name + " ×" + p.qty).join(", ")}</div>
    </div>`;
  document.getElementById("qtyRow").style.display = "none";
  orderProduct = null; // cart mode
  window._cartItems = items;
  window._cartSub = sub;
  window._cartDel = del;
  updateTotal(sub + del);
  openModal("orderModal");
}

/* ============================================================
   ORDER MODAL
   ============================================================ */
function openOrder(id) {
  const p = KD.getProducts().find((x) => x.id === id);
  if (!p) return;
  if (!p.inStock) {
    toast("⚠️ পণ্যটি এখন স্টকে নেই", "err");
    return;
  }
  orderProduct = p;
  window._cartItems = null;
  KD.track("productView", { id });

  document.getElementById("orderProdBar").innerHTML = `
    <div class="${p.image ? "" : "m-prod-emoji"}" style="${p.image ? "display:flex;align-items:center;gap:12px" : ""}">
      ${p.image ? `<img class="m-prod-img" src="${p.image}" alt="${p.name}"><div>` : ""}
      <div class="m-prod-emoji" style="${p.image ? "display:none" : "display:block"}">${p.emoji}</div>
      <div class="m-prod-name">${p.name}</div>
      <div class="m-prod-price">৳${p.price.toLocaleString()} / ${p.unit}</div>
      ${p.image ? "</div>" : ""}
    </div>`;
  document.getElementById("orderProdBar").innerHTML = `
    <span style="font-size:${p.image ? 0 : 2.5}rem">${p.image ? "" : p.emoji}</span>
    ${p.image ? `<img class="m-prod-img" src="${p.image}" alt="${p.name}">` : ""}
    <div><div class="m-prod-name">${p.name}</div><div class="m-prod-price">৳${p.price.toLocaleString()} / ${p.unit}</div></div>`;
  document.getElementById("qtyRow").style.display = "block";
  document.getElementById("orderQty").value = 1;
  curPayment = "cod";
  resetPayTabs();
  const cfg = KD.getConfig();
  updateTotal(p.price + cfg.deliveryCharge);
  openModal("orderModal");
}

function openQuickOrder() {
  orderProduct = null;
  window._cartItems = null;
  document.getElementById("orderProdBar").innerHTML =
    `<div style="color:var(--text-muted);font-size:.88rem">📦 যেকোনো পণ্য অর্ডার করতে পারেন। নির্দেশনায় পণ্যের নাম লিখুন।</div>`;
  document.getElementById("qtyRow").style.display = "none";
  const cfg = KD.getConfig();
  updateTotal(cfg.deliveryCharge);
  openModal("orderModal");
}

function changeQty(d) {
  const inp = document.getElementById("orderQty");
  const v = Math.max(1, parseInt(inp.value || 1) + d);
  inp.value = v;
  if (orderProduct) {
    const cfg = KD.getConfig();
    updateTotal(orderProduct.price * v + cfg.deliveryCharge);
  }
}
function setupQtyInput() {
  document.getElementById("orderQty")?.addEventListener("input", () => {
    if (!orderProduct) return;
    const v = parseInt(document.getElementById("orderQty").value || 1);
    const cfg = KD.getConfig();
    updateTotal(orderProduct.price * v + cfg.deliveryCharge);
  });
}
function updateTotal(amt) {
  document.getElementById("orderTotal").textContent =
    "৳ " + amt.toLocaleString();
}
function selectPay(type, btn) {
  curPayment = type;
  document
    .querySelectorAll(".ptab")
    .forEach((t) => t.classList.remove("active"));
  btn.classList.add("active");
  showPayInfo(type);
}
function resetPayTabs() {
  document
    .querySelectorAll(".ptab")
    .forEach((t, i) => t.classList.toggle("active", i === 0));
  showPayInfo("cod");
}
function showPayInfo(type) {
  const cfg = KD.getConfig();
  const msgs = {
    cod: `💵 পণ্য পেলে নগদ পেমেন্ট করুন। ডেলিভারি চার্জ ৳${cfg.deliveryCharge}।`,
    bkash: `💳 bKash নম্বর: ${cfg.bkash} — পেমেন্ট করে Transaction ID দিন।`,
    nagad: `📱 Nagad নম্বর: ${cfg.nagad} — পেমেন্ট করে Transaction ID দিন।`,
  };
  document.getElementById("payInfoBox").textContent = msgs[type] || "";
  document.getElementById("payInfoBox").classList.add("show");
}

function submitOrder() {
  const name = document.getElementById("oName").value.trim();
  const phone = document.getElementById("oPhone").value.trim();
  const address = document.getElementById("oAddr").value.trim();
  const note = document.getElementById("oNote").value.trim();
  if (!name) {
    toast("⚠️ নাম দিন", "err");
    return;
  }
  if (phone.length < 11) {
    toast("⚠️ সঠিক মোবাইল নম্বর দিন", "err");
    return;
  }
  if (!address) {
    toast("⚠️ ডেলিভারি ঠিকানা দিন", "err");
    return;
  }

  const cfg = KD.getConfig();
  const qty = parseInt(document.getElementById("orderQty").value || 1);
  const payLabel = { cod: "Cash on Delivery", bkash: "bKash", nagad: "Nagad" }[
    curPayment
  ];

  let msgBody = "";
  let orderData = {
    name,
    phone,
    address,
    note,
    payment: curPayment,
    total: document.getElementById("orderTotal").textContent,
    items: [],
  };

  if (window._cartItems && window._cartItems.length) {
    // Cart checkout
    const itemLines = window._cartItems
      .map(
        (p) =>
          `  • ${p.name} × ${p.qty} = ৳${(p.price * p.qty).toLocaleString()}`,
      )
      .join("\n");
    const sub = window._cartSub;
    const del = window._cartDel;
    orderData.items = window._cartItems.map((p) => ({
      name: p.name,
      qty: p.qty,
      price: p.price,
    }));
    msgBody =
      `🍯 *Khalid's Dreams — নতুন অর্ডার*\n\n` +
      `👤 নাম: ${name}\n📱 মোবাইল: ${phone}\n📍 ঠিকানা: ${address}\n\n` +
      `📦 *অর্ডারকৃত পণ্যসমূহ:*\n${itemLines}\n\n` +
      `💰 সাবটোটাল: ৳${sub.toLocaleString()}\n🚚 ডেলিভারি: ${del === 0 ? "ফ্রি" : "৳" + del}\n` +
      `✅ *মোট: ৳${(sub + del).toLocaleString()}*\n💳 পেমেন্ট: ${payLabel}` +
      (note ? `\n📝 নোট: ${note}` : "");
    // clear cart after order
    cart = [];
    saveCart();
    updateBadges();
  } else if (orderProduct) {
    const total = orderProduct.price * qty + (qty > 0 ? cfg.deliveryCharge : 0);
    orderData.items = [
      { name: orderProduct.name, qty, price: orderProduct.price },
    ];
    msgBody =
      `🍯 *Khalid's Dreams — নতুন অর্ডার*\n\n` +
      `👤 নাম: ${name}\n📱 মোবাইল: ${phone}\n📍 ঠিকানা: ${address}\n\n` +
      `📦 পণ্য: ${orderProduct.name}\n📏 পরিমাণ: ${qty}টি (${orderProduct.unit})\n` +
      `💰 পণ্যমূল্য: ৳${(orderProduct.price * qty).toLocaleString()}\n🚚 ডেলিভারি: ৳${cfg.deliveryCharge}\n` +
      `✅ *মোট: ৳${total.toLocaleString()}*\n💳 পেমেন্ট: ${payLabel}` +
      (note ? `\n📝 নোট: ${note}` : "");
  } else {
    msgBody =
      `🍯 *Khalid's Dreams — নতুন অর্ডার*\n\n👤 নাম: ${name}\n📱 মোবাইল: ${phone}\n📍 ঠিকানা: ${address}` +
      (note ? `\n📝 বিশেষ অনুরোধ: ${note}` : "") +
      `\n💳 পেমেন্ট: ${payLabel}`;
  }

  // save to admin
  KD.addOrder(orderData);
  KD.track("order");

  const waUrl = `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(msgBody)}`;
  closeModal("orderModal");
  toast("✅ অর্ডার পাঠানো হচ্ছে...", "ok");
  setTimeout(() => window.open(waUrl, "_blank"), 500);

  // clear form
  ["oName", "oPhone", "oAddr", "oNote"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

/* ============================================================
   DETAIL MODAL
   ============================================================ */
function openDetail(id) {
  const p = KD.getProducts().find((x) => x.id === id);
  if (!p) return;
  KD.track("productView", { id });
  const disc = discount(p);
  const cfg = KD.getConfig();
  document.getElementById("detailBody").innerHTML = `
    <div class="detail-top">
      <div class="det-img-box">
        ${p.image ? `<img src="${p.image}" alt="${p.name}">` : `<span class="det-emoji">${p.emoji}</span>`}
      </div>
      <div class="det-info">
        <h2>${p.name}</h2>
        <div class="det-rat"><span class="stars">${"⭐".repeat(Math.floor(p.rating || 4))}</span><span style="color:var(--text-muted)">${p.rating} (${p.reviews} রিভিউ)</span></div>
        <div class="det-prices">
          <span class="det-price">৳${p.price.toLocaleString()}</span>
          ${p.oldPrice ? `<span class="det-old">৳${p.oldPrice}</span>` : ""}
          <span class="det-unit">${p.unit}</span>
          ${disc > 0 ? `<span class="price-save">${disc}% ছাড়</span>` : ""}
        </div>
        <p class="det-desc">${p.description || ""}</p>
        <div class="det-feats">${(p.features || []).map((f) => `<div class="det-feat">${f}</div>`).join("")}</div>
      </div>
    </div>
    <div class="det-acts">
      <button class="btn-det-order" onclick="closeModal('detailModal');openOrder(${p.id})">📦 অর্ডার করুন</button>
      <a class="btn-wa" href="https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent("🍯 আমি " + p.name + " সম্পর্কে জানতে চাই।")}" target="_blank">💬 WhatsApp</a>
    </div>`;
  openModal("detailModal");
}

/* ============================================================
   MODAL HELPERS
   ============================================================ */
function openModal(id) {
  document.getElementById(id).classList.add("show");
  document.body.style.overflow = "hidden";
}
function closeModal(id) {
  document.getElementById(id).classList.remove("show");
  document.body.style.overflow = "";
}
function setupModalClose() {
  document.querySelectorAll(".m-overlay").forEach((o) => {
    o.addEventListener("click", (e) => {
      if (e.target === o) closeModal(o.id);
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape")
      document
        .querySelectorAll(".m-overlay.show")
        .forEach((o) => closeModal(o.id));
  });
}

/* ============================================================
   BADGES
   ============================================================ */
function updateBadges() {
  const wc = wishlist.length;
  const cc = cart.reduce((s, c) => s + c.qty, 0);
  ["wishBdg", "mobWishBdg"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = wc ? "flex" : "none";
      el.textContent = wc;
    }
  });
  ["cartBdg", "mobCartBdg"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = cc ? "flex" : "none";
      el.textContent = cc;
    }
  });
}

/* ============================================================
   TOAST
   ============================================================ */
function toast(msg, type = "inf") {
  const wrap = document.getElementById("toastWrap");
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-txt">${msg}</span>`;
  wrap.appendChild(t);
  setTimeout(() => {
    t.style.animation = "tOut .35s var(--ease) forwards";
    setTimeout(() => t.remove(), 350);
  }, 3000);
}

/* ============================================================
   MOBILE NAV HELPERS
   ============================================================ */
function mobHome(btn) {
  window.scrollTo({ top: 0, behavior: "smooth" });
  setMobActive(btn);
}
function mobProds(btn) {
  document.getElementById("all-prods")?.scrollIntoView({ behavior: "smooth" });
  setMobActive(btn);
}
function setMobActive(btn) {
  document
    .querySelectorAll(".mob-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
}

/* ============================================================
   FOOTER FILTER HELPER
   ============================================================ */
function footerFilter(catId) {
  // activate category bar item
  const cats = document.querySelectorAll(".cat-item");
  cats.forEach((c) => {
    const nameEl = c.querySelector(".cat-name");
    const catData = KD.getCategories().find((x) => x.id === catId);
    c.classList.toggle(
      "active",
      nameEl && catData && nameEl.textContent === catData.name,
    );
  });
  buildAllProducts(catId);
  document.getElementById("all-prods")?.scrollIntoView({ behavior: "smooth" });
}

/* ============================================================
   ORDER MODAL — product bar fix (clean version)
   ============================================================ */
function renderOrderProdBar(p) {
  const bar = document.getElementById("orderProdBar");
  if (!bar) return;
  if (p) {
    bar.innerHTML = `
      <div style="display:flex;align-items:center;gap:14px">
        ${
          p.image
            ? `<img src="${p.image}" alt="${p.name}" style="width:56px;height:56px;border-radius:10px;object-fit:cover;flex-shrink:0">`
            : `<span style="font-size:2.6rem;flex-shrink:0">${p.emoji || "📦"}</span>`
        }
        <div>
          <div style="font-weight:600;font-size:.95rem">${p.name}</div>
          <div style="color:var(--gold);font-size:1rem;font-weight:700">৳${p.price.toLocaleString()} / ${p.unit}</div>
        </div>
      </div>`;
  }
}

/* override openOrder to use clean render */
const _origOpenOrder = openOrder;
window.openOrder = function (id) {
  const p = KD.getProducts().find((x) => x.id === id);
  if (!p) return;
  if (!p.inStock) {
    toast("⚠️ পণ্যটি এখন স্টকে নেই", "err");
    return;
  }
  orderProduct = p;
  window._cartItems = null;
  KD.track("productView", { id });
  renderOrderProdBar(p);
  document.getElementById("qtyRow").style.display = "block";
  document.getElementById("orderQty").value = 1;
  curPayment = "cod";
  resetPayTabs();
  const cfg = KD.getConfig();
  updateTotal(p.price + cfg.deliveryCharge);
  openModal("orderModal");
};

/* ============================================================
   SHARE / COPY LINK (optional)
   ============================================================ */
function copyLink() {
  navigator.clipboard
    ?.writeText(location.href)
    .then(() => toast("🔗 লিংক কপি হয়েছে!", "ok"));
}

/* ============================================================
   BACK TO TOP on scroll
   ============================================================ */
window.addEventListener("scroll", () => {
  const mbs = document.querySelectorAll(".mob-btn");
  if (scrollY < 200 && mbs.length) {
    mbs.forEach((b) => b.classList.remove("active"));
    mbs[0]?.classList.add("active");
  }
});

/* ============================================================
   LAZY IMAGE LOAD (IntersectionObserver for product images)
   ============================================================ */
function lazyLoadImages() {
  const imgs = document.querySelectorAll("img[data-src]");
  if (!imgs.length) return;
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.src = e.target.dataset.src;
          obs.unobserve(e.target);
        }
      });
    },
    { rootMargin: "100px" },
  );
  imgs.forEach((img) => obs.observe(img));
}
document.addEventListener("DOMContentLoaded", lazyLoadImages);
