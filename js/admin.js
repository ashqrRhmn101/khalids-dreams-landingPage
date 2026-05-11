// ============================================================
// KHALID'S DREAMS — ADMIN PANEL JAVASCRIPT
// Admin এ যা করা হয়, সাথে সাথে localStorage এ সেভ হয়
// সাইট সেই ডেটা পড়ে রিয়েল-টাইমে দেখায়।
// ============================================================

/* ── Auth ── */
const ADMIN_PASS_KEY = "kd_admin_pass";
let adminPass = localStorage.getItem(ADMIN_PASS_KEY) || "khalid2025";
let editingId = null; // product/cat/banner being edited
let orderFilter = "all";

/* ── Init ── */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loginUser").addEventListener("keydown", e => e.key==="Enter" && doLogin());
  document.getElementById("loginPass").addEventListener("keydown", e => e.key==="Enter" && doLogin());
  setupModalClose();
});

/* ============================================================
   AUTH
   ============================================================ */
function doLogin() {
  const u = document.getElementById("loginUser").value.trim();
  const p = document.getElementById("loginPass").value.trim();
  if (u === "admin" && p === adminPass) {
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("adminWrap").style.display = "flex";
    initAdmin();
  } else {
    const err = document.getElementById("loginErr");
    err.style.display = "block";
    setTimeout(() => err.style.display="none", 3000);
  }
}
function doLogout() {
  document.getElementById("adminWrap").style.display = "none";
  document.getElementById("loginScreen").style.display = "flex";
  document.getElementById("loginUser").value = "";
  document.getElementById("loginPass").value = "";
}

/* ============================================================
   INIT
   ============================================================ */
function initAdmin() {
  buildStats();
  buildOrdersBadge();
  renderProductsTable();
  renderCatTable();
  renderBannersTable();
  renderHeroTable();
  renderOrders();
  renderAnalytics();
  loadSettings();
}

/* ============================================================
   SIDEBAR NAV
   ============================================================ */
function showPage(page, btn) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".sb-item").forEach(b => b.classList.remove("active"));
  document.getElementById("page-"+page).classList.add("active");
  btn.classList.add("active");
  if (window.innerWidth<=900) document.getElementById("sidebar").classList.remove("open");
}
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

/* ============================================================
   STATS DASHBOARD
   ============================================================ */
function buildStats() {
  const prods   = KD.getProducts();
  const orders  = KD.getOrders();
  const pending = orders.filter(o=>o.status==="pending").length;
  const done    = orders.filter(o=>o.status==="done").length;

  document.getElementById("statProds").textContent   = prods.length;
  document.getElementById("statInStock").textContent  = prods.filter(p=>p.inStock).length;
  document.getElementById("statOrders").textContent   = orders.length;
  document.getElementById("statPending").textContent  = pending;

  // recent products
  const tbody = document.getElementById("recentProdsTbl");
  tbody.innerHTML = prods.slice(0,6).map(p=>`
    <tr>
      <td><div class="prod-cell">
        ${p.image?`<img class="prod-thumb-img" src="${p.image}" alt="${p.name}">`:`<span class="prod-thumb">${p.emoji}</span>`}
        <div><div class="pn">${p.name}</div><div class="pu">${p.unit}</div></div>
      </div></td>
      <td>৳${p.price.toLocaleString()}</td>
      <td><span class="chip chip-gold">${p.category}</span></td>
      <td><span class="chip ${p.inStock?"chip-green":"chip-red"}">${p.inStock?"স্টকে আছে":"স্টক নেই"}</span></td>
    </tr>`).join("");

  // recent orders
  const otbody = document.getElementById("recentOrdersTbl");
  otbody.innerHTML = orders.slice(0,5).map(o=>`
    <tr>
      <td><span style="font-size:.78rem;color:var(--text-muted)">${o.id}</span></td>
      <td>${o.name}</td>
      <td>${o.phone}</td>
      <td>${o.total||"-"}</td>
      <td><span class="chip ${statusChip(o.status)}">${statusLabel(o.status)}</span></td>
    </tr>`).join("");
}
function buildOrdersBadge() {
  const pending = KD.getOrders().filter(o=>o.status==="pending").length;
  const badge = document.getElementById("ordersBadge");
  if (badge) { badge.textContent=pending; badge.style.display=pending?"inline":"none"; }
}

/* ============================================================
   PRODUCTS
   ============================================================ */
function renderProductsTable(filter="") {
  let prods = KD.getProducts();
  if (filter) prods = prods.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()) || p.category.includes(filter));
  const tbody = document.getElementById("prodsTbl");
  tbody.innerHTML = prods.length ? prods.map(p => {
    const disc = p.oldPrice ? Math.round((p.oldPrice-p.price)/p.oldPrice*100) : 0;
    return `<tr>
      <td><div class="prod-cell">
        ${p.image?`<img class="prod-thumb-img" src="${p.image}" alt="${p.name}">`:`<span class="prod-thumb">${p.emoji}</span>`}
        <div><div class="pn">${p.name}</div><div class="pu">${p.unit}</div></div>
      </div></td>
      <td>৳${p.price.toLocaleString()}${p.oldPrice?`<br><span style="font-size:.73rem;color:var(--text-muted);text-decoration:line-through">৳${p.oldPrice}</span>`:""}</td>
      <td><span class="chip chip-gold">${p.category}</span></td>
      <td>${p.badge?`<span class="chip chip-blue">${p.badge}</span>`:"-"}</td>
      <td>${disc>0?`<span class="chip chip-red">${disc}%</span>`:"-"}</td>
      <td><span class="chip ${p.inStock?"chip-green":"chip-red"}">${p.inStock?"✅ আছে":"❌ নেই"}</span></td>
      <td><div class="act-row">
        <button class="btn-sm-edit" onclick="openProdModal(${p.id})">✏️ এডিট</button>
        <button class="btn-sm-del"  onclick="deleteProd(${p.id})">🗑️ মুছুন</button>
        <button class="btn-sm-green" onclick="toggleStock(${p.id})">${p.inStock?"স্টক বন্ধ":"স্টক চালু"}</button>
      </div></td>
    </tr>`;
  }).join("") : `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted)">কোনো পণ্য নেই</td></tr>`;
}

function openProdModal(id=null) {
  editingId = id;
  const p = id ? KD.getProducts().find(x=>x.id===id) : null;
  document.getElementById("prodModalTitle").textContent = id ? "✏️ পণ্য এডিট করুন" : "+ নতুন পণ্য যোগ করুন";

  // fill fields
  setVal("pName",    p?.name    || "");
  setVal("pNameEn",  p?.nameEn  || "");
  setVal("pCategory",p?.category|| "honey");
  setVal("pEmoji",   p?.emoji   || "🍯");
  setVal("pPrice",   p?.price   || "");
  setVal("pOldPrice",p?.oldPrice|| "");
  setVal("pUnit",    p?.unit    || "");
  setVal("pBadge",   p?.badgeType||"");
  setVal("pDesc",    p?.description||"");
  setVal("pFeats",   (p?.features||[]).join("\n"));
  setVal("pRating",  p?.rating  || 4.5);
  setVal("pReviews", p?.reviews || 0);
  setCheck("pInStock", p?.inStock!==false);

  // image preview
  const prev = document.getElementById("prodImgPreview");
  prev.innerHTML = p?.image
    ? `<img src="${p.image}" alt="${p.name}">`
    : `<div class="img-placeholder"><div class="pi">📷</div><p>ছবি আপলোড করুন</p></div>`;

  openModal("prodModal");
}

function handleProdImg(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 2*1024*1024) { aToast("⚠️ ছবি ২ MB-এর বেশি হওয়া উচিত নয়","err"); return; }
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById("prodImgPreview").innerHTML = `<img src="${e.target.result}" alt="preview">`;
    document.getElementById("prodImgData").value = e.target.result;
  };
  reader.readAsDataURL(file);
}

function saveProd() {
  const name  = getVal("pName").trim();
  const price = parseFloat(getVal("pPrice"));
  if (!name)  { aToast("⚠️ পণ্যের নাম দিন","err"); return; }
  if (!price) { aToast("⚠️ মূল্য দিন","err");      return; }

  const bType = getVal("pBadge");
  const bLabels = {bestseller:"বেস্টসেলার",new:"নতুন",offer:"অফার",hot:"হট ডিল",premium:"প্রিমিয়াম",seasonal:"সিজনাল"};
  const imgData = getVal("prodImgData");

  const prods = KD.getProducts();
  const maxId = prods.reduce((m,p)=>Math.max(m,p.id),0);

  const data = {
    id:        editingId || maxId+1,
    name,
    nameEn:    getVal("pNameEn"),
    category:  getVal("pCategory"),
    emoji:     getVal("pEmoji") || "📦",
    image:     imgData || (editingId ? (prods.find(p=>p.id===editingId)?.image||"") : ""),
    price,
    oldPrice:  parseFloat(getVal("pOldPrice")) || null,
    unit:      getVal("pUnit"),
    badgeType: bType,
    badge:     bLabels[bType] || "",
    description: getVal("pDesc"),
    features:  getVal("pFeats").split("\n").filter(f=>f.trim()),
    rating:    parseFloat(getVal("pRating")) || 4.5,
    reviews:   parseInt(getVal("pReviews"))  || 0,
    inStock:   document.getElementById("pInStock").checked,
    color:     "#D4A017"
  };

  if (editingId) {
    const idx = prods.findIndex(p=>p.id===editingId);
    prods[idx] = data;
  } else {
    prods.push(data);
  }
  KD.setProducts(prods);
  closeModal("prodModal");
  renderProductsTable();
  buildStats();
  aToast(editingId ? "✅ পণ্য আপডেট হয়েছে!" : "✅ নতুন পণ্য যোগ হয়েছে!", "ok");
  editingId = null;
  setVal("prodImgData","");
}

function deleteProd(id) {
  if (!confirm("এই পণ্যটি মুছে ফেলবেন?")) return;
  KD.setProducts(KD.getProducts().filter(p=>p.id!==id));
  renderProductsTable(); buildStats();
  aToast("🗑️ পণ্য মুছে ফেলা হয়েছে","ok");
}

function toggleStock(id) {
  const prods = KD.getProducts();
  const p = prods.find(x=>x.id===id);
  if (!p) return;
  p.inStock = !p.inStock;
  KD.setProducts(prods);
  renderProductsTable(); buildStats();
  aToast(`${p.name}: স্টক ${p.inStock?"চালু":"বন্ধ"} করা হয়েছে`,"ok");
}

/* ============================================================
   CATEGORIES
   ============================================================ */
function renderCatTable() {
  const cats  = KD.getCategories().filter(c=>c.id!=="all");
  const prods = KD.getProducts();
  document.getElementById("catTbl").innerHTML = cats.map(c=>`
    <tr>
      <td>${c.image?`<img class="tbl-img" src="${c.image}" alt="${c.name}">`:`<span style="font-size:1.8rem">${c.icon}</span>`}</td>
      <td>${c.name}</td>
      <td><span class="chip chip-gold">${c.id}</span></td>
      <td>${prods.filter(p=>p.category===c.id).length} টি</td>
      <td><div class="act-row">
        <button class="btn-sm-edit" onclick="openCatModal('${c.id}')">✏️ এডিট</button>
        <button class="btn-sm-del"  onclick="deleteCat('${c.id}')">🗑️ মুছুন</button>
      </div></td>
    </tr>`).join("");
}

function openCatModal(id=null) {
  editingId = id;
  const cats = KD.getCategories();
  const c = id ? cats.find(x=>x.id===id) : null;
  setVal("cId",   c?.id   ||"");
  setVal("cName", c?.name ||"");
  setVal("cIcon", c?.icon ||"");
  document.getElementById("cId").disabled = !!id;

  const prev = document.getElementById("catImgPreview");
  prev.innerHTML = c?.image
    ? `<img src="${c.image}" alt="${c.name}">`
    : `<div class="img-placeholder"><div class="pi">🏷️</div><p>ক্যাটাগরি ছবি</p></div>`;
  openModal("catModal");
}

function handleCatImg(input) {
  const file = input.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById("catImgPreview").innerHTML = `<img src="${e.target.result}">`;
    document.getElementById("catImgData").value = e.target.result;
  };
  reader.readAsDataURL(file);
}

function saveCat() {
  const id   = getVal("cId").trim().toLowerCase();
  const name = getVal("cName").trim();
  const icon = getVal("cIcon").trim() || "📦";
  if (!id||!name) { aToast("⚠️ ID ও নাম দিন","err"); return; }

  const cats = KD.getCategories();
  const imgData = getVal("catImgData");

  if (editingId) {
    const c = cats.find(x=>x.id===editingId);
    if (c) { c.name=name; c.icon=icon; if(imgData) c.image=imgData; }
  } else {
    if (cats.find(c=>c.id===id)) { aToast("⚠️ এই ID আগে থেকে আছে","err"); return; }
    cats.push({id,name,icon,image:imgData||""});
  }
  KD.setCategories(cats);
  closeModal("catModal");
  renderCatTable();
  aToast("✅ ক্যাটাগরি সেভ হয়েছে!","ok");
  editingId=null; setVal("catImgData","");
}

function deleteCat(id) {
  if (!confirm("এই ক্যাটাগরি মুছবেন?")) return;
  KD.setCategories(KD.getCategories().filter(c=>c.id!==id));
  renderCatTable();
  aToast("🗑️ ক্যাটাগরি মুছে ফেলা হয়েছে","ok");
}

/* ============================================================
   OFFER BANNERS
   ============================================================ */
function renderBannersTable() {
  const banners = KD.getOfferBanners();
  document.getElementById("bannerTbl").innerHTML = banners.map((b,i)=>`
    <tr>
      <td>${b.image?`<img class="tbl-img" src="${b.image}" alt="${b.title}">`:`<span style="font-size:1.8rem">${b.emoji}</span>`}</td>
      <td>${b.title}</td>
      <td>${b.subtitle}</td>
      <td>${b.detail}</td>
      <td><div class="act-row">
        <button class="btn-sm-edit" onclick="openBannerModal(${i})">✏️ এডিট</button>
        <button class="btn-sm-del"  onclick="deleteBanner(${i})">🗑️ মুছুন</button>
      </div></td>
    </tr>`).join("");
}

function openBannerModal(idx=null) {
  editingId = idx;
  const banners = KD.getOfferBanners();
  const b = idx!==null ? banners[idx] : null;
  setVal("bTitle",    b?.title   ||"");
  setVal("bSubtitle", b?.subtitle||"");
  setVal("bDetail",   b?.detail  ||"");
  setVal("bEmoji",    b?.emoji   ||"🎉");
  setVal("bBg",       b?.bg      ||"linear-gradient(135deg,#1B5E20,#D4A017)");

  const prev = document.getElementById("bannerImgPreview");
  prev.innerHTML = b?.image
    ? `<img src="${b.image}" alt="${b.title}">`
    : `<div class="img-placeholder"><div class="pi">🎠</div><p>ব্যানার ছবি</p></div>`;
  openModal("bannerModal");
}

function handleBannerImg(input) {
  const file = input.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById("bannerImgPreview").innerHTML = `<img src="${e.target.result}">`;
    document.getElementById("bannerImgData").value = e.target.result;
  };
  reader.readAsDataURL(file);
}

function saveBanner() {
  const title = getVal("bTitle").trim();
  if (!title) { aToast("⚠️ শিরোনাম দিন","err"); return; }
  const imgData = getVal("bannerImgData");
  const banners = KD.getOfferBanners();
  const data = {
    title, subtitle:getVal("bSubtitle"),
    detail:getVal("bDetail"),
    emoji:getVal("bEmoji")||"🎉",
    bg:getVal("bBg")||"linear-gradient(135deg,#1B5E20,#D4A017)",
    image: imgData || (editingId!==null ? (banners[editingId]?.image||"") : "")
  };
  if (editingId!==null) banners[editingId]=data;
  else banners.push(data);
  KD.setOfferBanners(banners);
  closeModal("bannerModal");
  renderBannersTable();
  aToast("✅ ব্যানার সেভ হয়েছে!","ok");
  editingId=null; setVal("bannerImgData","");
}

function deleteBanner(i) {
  if (!confirm("এই ব্যানার মুছবেন?")) return;
  const banners = KD.getOfferBanners();
  banners.splice(i,1);
  KD.setOfferBanners(banners);
  renderBannersTable();
  aToast("🗑️ ব্যানার মুছে ফেলা হয়েছে","ok");
}

/* ============================================================
   HERO SLIDES
   ============================================================ */
function renderHeroTable() {
  const slides = KD.getHeroSlides();
  document.getElementById("heroTbl").innerHTML = slides.map((s,i)=>`
    <tr>
      <td>${s.image?`<img class="tbl-img" src="${s.image}" alt="${s.title}">`:`<span style="font-size:1.8rem">${s.emoji}</span>`}</td>
      <td>${s.title}</td>
      <td>${s.subtitle}</td>
      <td><span class="chip chip-blue">${s.offer}</span></td>
      <td><div class="act-row">
        <button class="btn-sm-edit" onclick="openHeroModal(${i})">✏️ এডিট</button>
        <button class="btn-sm-del"  onclick="deleteHero(${i})">🗑️ মুছুন</button>
      </div></td>
    </tr>`).join("");
}

function openHeroModal(idx=null) {
  editingId = idx;
  const slides = KD.getHeroSlides();
  const s = idx!==null ? slides[idx] : null;
  setVal("hTitle",    s?.title   ||"");
  setVal("hSubtitle", s?.subtitle||"");
  setVal("hOffer",    s?.offer   ||"");
  setVal("hEmoji",    s?.emoji   ||"🍯");
  setVal("hCta",      s?.cta     ||"এখনই কিনুন");
  setVal("hBg",       s?.bg      ||"linear-gradient(135deg,#1a4a1a,#D4A017)");

  const prev = document.getElementById("heroImgPreview");
  prev.innerHTML = s?.image
    ? `<img src="${s.image}" alt="${s.title}">`
    : `<div class="img-placeholder"><div class="pi">🖼️</div><p>হিরো ব্যানার ছবি</p></div>`;
  openModal("heroModal");
}

function handleHeroImg(input) {
  const file = input.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById("heroImgPreview").innerHTML = `<img src="${e.target.result}">`;
    document.getElementById("heroImgData").value = e.target.result;
  };
  reader.readAsDataURL(file);
}

function saveHero() {
  const title = getVal("hTitle").trim();
  if (!title) { aToast("⚠️ শিরোনাম দিন","err"); return; }
  const imgData = getVal("heroImgData");
  const slides = KD.getHeroSlides();
  const data = {
    title, subtitle:getVal("hSubtitle"),
    offer:getVal("hOffer"),
    emoji:getVal("hEmoji")||"🍯",
    cta:getVal("hCta")||"এখনই কিনুন",
    bg:getVal("hBg")||"linear-gradient(135deg,#1a4a1a,#D4A017)",
    image: imgData || (editingId!==null ? (slides[editingId]?.image||"") : "")
  };
  if (editingId!==null) slides[editingId]=data;
  else slides.push(data);
  KD.setHeroSlides(slides);
  closeModal("heroModal");
  renderHeroTable();
  aToast("✅ হিরো স্লাইড সেভ হয়েছে!","ok");
  editingId=null; setVal("heroImgData","");
}

function deleteHero(i) {
  if (!confirm("এই স্লাইড মুছবেন?")) return;
  const slides = KD.getHeroSlides();
  slides.splice(i,1);
  KD.setHeroSlides(slides);
  renderHeroTable();
  aToast("🗑️ স্লাইড মুছে ফেলা হয়েছে","ok");
}

/* ============================================================
   ORDERS
   ============================================================ */
function renderOrders(filter="all") {
  orderFilter = filter;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.toggle("active", b.dataset.f===filter));
  let orders = KD.getOrders();
  if (filter!=="all") orders = orders.filter(o=>o.status===filter);

  const tbody = document.getElementById("ordersTbl");
  tbody.innerHTML = orders.length ? orders.map(o=>`
    <tr>
      <td><span style="font-size:.76rem;color:var(--text-muted)">${o.id}</span></td>
      <td><div><div class="pn">${o.name}</div><div class="pu">${o.phone}</div></div></td>
      <td style="max-width:160px;font-size:.8rem">${o.address||"-"}</td>
      <td style="font-size:.82rem">${(o.items||[]).map(i=>`${i.name}×${i.qty}`).join(", ")||"-"}</td>
      <td>${o.total||"-"}</td>
      <td><span class="chip ${statusChip(o.status)}">${statusLabel(o.status)}</span></td>
      <td style="font-size:.76rem;color:var(--text-muted)">${o.time||"-"}</td>
      <td><div class="act-row">
        ${o.status==="pending" ? `<button class="btn-sm-green" onclick="markOrder('${o.id}','done')">✅ সম্পন্ন</button>` : ""}
        ${o.status!=="cancelled" ? `<button class="btn-sm-del" onclick="markOrder('${o.id}','cancelled')">❌ বাতিল</button>` : ""}
        <button class="btn-sm-edit" onclick="waContact('${o.phone}','${o.name}')">📱 WA</button>
      </div></td>
    </tr>`).join("")
  : `<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted)">কোনো অর্ডার নেই</td></tr>`;

  buildOrdersBadge();
}

function markOrder(id, status) {
  KD.updateOrderStatus(id, status);
  renderOrders(orderFilter);
  buildStats();
  aToast(`অর্ডার ${statusLabel(status)} হয়েছে`, "ok");
}

function waContact(phone, name) {
  const msg = encodeURIComponent(`আসসালামুয়ালাইকুম ${name} ভাই/আপু, Khalid's Dreams থেকে বলছি। আপনার অর্ডার সম্পর্কে জানাতে চাইছিলাম।`);
  window.open(`https://wa.me/${phone.replace(/[^0-9]/g,"")}?text=${msg}`, "_blank");
}

function statusLabel(s) { return {pending:"পেন্ডিং",done:"সম্পন্ন",cancelled:"বাতিল"}[s]||s; }
function statusChip(s)  { return {pending:"chip-blue",done:"chip-green",cancelled:"chip-red"}[s]||"chip-gray"; }

/* ============================================================
   ANALYTICS
   ============================================================ */
function renderAnalytics() {
  const analytics = KD.getAnalytics();
  const prods = KD.getProducts();
  const days  = Object.keys(analytics).sort().slice(-7);

  let totalVisits=0, totalOrders=0, totalCart=0, totalWish=0;
  const visitData = [];
  days.forEach(d => {
    const day = analytics[d];
    totalVisits += day.visits||0;
    totalOrders += day.orders||0;
    totalCart   += day.cartAdds||0;
    totalWish   += day.wishlistAdds||0;
    visitData.push({label:d.slice(5), val:day.visits||0});
  });

  // mini stats
  setHTML("anVisits",  totalVisits);
  setHTML("anOrders",  totalOrders);
  setHTML("anCart",    totalCart);
  setHTML("anWish",    totalWish);

  // visits bar chart
  const maxV = Math.max(1,...visitData.map(v=>v.val));
  const visitChart = document.getElementById("visitChart");
  if (visitChart) visitChart.innerHTML = visitData.map(v=>`
    <div class="bar-row">
      <span class="bar-label">${v.label}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round(v.val/maxV*100)}%"></div></div>
      <span class="bar-val">${v.val}</span>
    </div>`).join("") || `<div style="color:var(--text-muted);font-size:.85rem">ডেটা নেই</div>`;

  // top products by views
  const allViews = {};
  days.forEach(d=>{
    const pv = analytics[d]?.productViews||{};
    Object.entries(pv).forEach(([id,c])=>{ allViews[id]=(allViews[id]||0)+c; });
  });
  const topProds = Object.entries(allViews).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxPV = Math.max(1,...topProds.map(x=>x[1]));
  const prodChart = document.getElementById("prodViewChart");
  if (prodChart) prodChart.innerHTML = topProds.length ? topProds.map(([id,cnt])=>{
    const p = prods.find(x=>x.id===parseInt(id));
    return `<div class="bar-row">
      <span class="bar-label">${p?.name||"ID:"+id}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round(cnt/maxPV*100)}%"></div></div>
      <span class="bar-val">${cnt}</span>
    </div>`;
  }).join("") : `<div style="color:var(--text-muted);font-size:.85rem">ডেটা নেই</div>`;
}

function clearAnalytics() {
  if (!confirm("সব Analytics ডেটা মুছবেন?")) return;
  localStorage.removeItem("kd_analytics");
  renderAnalytics();
  aToast("Analytics ডেটা মুছে ফেলা হয়েছে","ok");
}

/* ============================================================
   SETTINGS
   ============================================================ */
function loadSettings() {
  const cfg = KD.getConfig();
  Object.keys(cfg).forEach(k => {
    const el = document.getElementById("cfg_"+k);
    if (el) el.value = cfg[k]||"";
  });
  // logo preview
  if (cfg.logoImage) {
    document.getElementById("logoImgPreview").innerHTML = `<img src="${cfg.logoImage}" alt="logo">`;
  }
}

function handleLogoImg(input) {
  const file = input.files[0]; if(!file) return;
  if(file.size>500*1024){aToast("⚠️ লোগো ৫০০KB-এর কম হওয়া উচিত","err");return;}
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById("logoImgPreview").innerHTML = `<img src="${e.target.result}" alt="logo">`;
    document.getElementById("logoImgData").value = e.target.result;
  };
  reader.readAsDataURL(file);
}

function saveSettings() {
  const cfg = KD.getConfig();
  const fields = ["siteName","tagline","whatsapp","phone","email","address","deliveryCharge","freeDeliveryAbove","bkash","nagad","fbPixelId","gaId"];
  fields.forEach(k => {
    const el = document.getElementById("cfg_"+k);
    if (el) cfg[k] = el.type==="number" ? parseFloat(el.value)||0 : el.value;
  });
  const logoImg = getVal("logoImgData");
  if (logoImg) cfg.logoImage = logoImg;
  KD.setConfig(cfg);
  aToast("✅ সেটিংস সেভ হয়েছে! সাইট রিফ্রেশ করলে দেখা যাবে।","ok");
}

function changePassword() {
  const old  = document.getElementById("oldPass").value;
  const nw   = document.getElementById("newPass").value;
  const conf = document.getElementById("confPass").value;
  if (old!==adminPass)  { aToast("❌ বর্তমান পাসওয়ার্ড ভুল","err"); return; }
  if (nw.length<6)      { aToast("⚠️ কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন","err"); return; }
  if (nw!==conf)        { aToast("❌ পাসওয়ার্ড মিলছে না","err"); return; }
  adminPass = nw;
  localStorage.setItem(ADMIN_PASS_KEY, nw);
  ["oldPass","newPass","confPass"].forEach(id=>document.getElementById(id).value="");
  aToast("✅ পাসওয়ার্ড পরিবর্তন হয়েছে!","ok");
}

function resetData() {
  if (!confirm("সব ডেটা ডিফল্টে ফিরিয়ে আনবেন? এই কাজ ফেরানো যাবে না!")) return;
  KD.reset();
  aToast("✅ ডেটা রিসেট হয়েছে। পেজ রিলোড হচ্ছে...","ok");
  setTimeout(()=>location.reload(), 1500);
}

/* export products.js */
function exportProductsJs() {
  const d = KD.get();
  const code = `// KHALID'S DREAMS — Auto Generated: ${new Date().toLocaleString("bn-BD")}\n\nconst KD_DEFAULT = ${JSON.stringify(d,null,2)};\n\n${KD_FUNC_STR}`;
  const blob = new Blob([code], {type:"text/javascript"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download="products.js"; a.click();
  aToast("📥 products.js ডাউনলোড হচ্ছে!","ok");
}

// stringified KD manager for export
const KD_FUNC_STR = `
const KD = {
  _key:"kd_store",
  load(){try{const s=localStorage.getItem(this._key);return s?JSON.parse(s):JSON.parse(JSON.stringify(KD_DEFAULT));}catch(e){return JSON.parse(JSON.stringify(KD_DEFAULT));}},
  save(d){try{localStorage.setItem(this._key,JSON.stringify(d));}catch(e){}},
  get(){return this.load();},
  getProducts(){return this.load().products||[];},
  getCategories(){return this.load().categories||[];},
  getHeroSlides(){return this.load().heroSlides||[];},
  getOfferBanners(){return this.load().offerBanners||[];},
  getConfig(){return this.load().config||KD_DEFAULT.config;},
  setProducts(a){const d=this.load();d.products=a;this.save(d);},
  setCategories(a){const d=this.load();d.categories=a;this.save(d);},
  setHeroSlides(a){const d=this.load();d.heroSlides=a;this.save(d);},
  setOfferBanners(a){const d=this.load();d.offerBanners=a;this.save(d);},
  setConfig(c){const d=this.load();d.config=c;this.save(d);},
  getOrders(){try{return JSON.parse(localStorage.getItem("kd_orders")||"[]");}catch(e){return[];}},
  addOrder(o){const orders=this.getOrders();o.id="ORD-"+Date.now();o.time=new Date().toLocaleString("bn-BD");o.status="pending";orders.unshift(o);localStorage.setItem("kd_orders",JSON.stringify(orders));return o;},
  updateOrderStatus(id,s){const orders=this.getOrders();const o=orders.find(x=>x.id===id);if(o)o.status=s;localStorage.setItem("kd_orders",JSON.stringify(orders));},
  track(e,d={}){try{const a=JSON.parse(localStorage.getItem("kd_analytics")||"{}");const t=new Date().toISOString().split("T")[0];if(!a[t])a[t]={visits:0,orders:0,cartAdds:0,wishlistAdds:0,productViews:{}};const day=a[t];if(e==="visit")day.visits++;if(e==="order")day.orders++;if(e==="cartAdd")day.cartAdds++;if(e==="wishlistAdd")day.wishlistAdds++;if(e==="productView"){day.productViews[d.id]=(day.productViews[d.id]||0)+1;}localStorage.setItem("kd_analytics",JSON.stringify(a));}catch(e){}},
  getAnalytics(){try{return JSON.parse(localStorage.getItem("kd_analytics")||"{}");}catch(e){return{};}},
  reset(){localStorage.removeItem(this._key);}
};`;

/* ============================================================
   MODAL HELPERS
   ============================================================ */
function openModal(id)  { document.getElementById(id).classList.add("show"); document.body.style.overflow="hidden"; }
function closeModal(id) { document.getElementById(id).classList.remove("show"); document.body.style.overflow=""; }
function setupModalClose() {
  document.querySelectorAll(".m-overlay").forEach(o=>{
    o.addEventListener("click", e=>{ if(e.target===o) closeModal(o.id); });
  });
  document.addEventListener("keydown", e=>{
    if(e.key==="Escape") document.querySelectorAll(".m-overlay.show").forEach(o=>closeModal(o.id));
  });
}

/* ============================================================
   TOAST
   ============================================================ */
function aToast(msg, type="ok") {
  const wrap = document.getElementById("toastWrap");
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-txt">${msg}</span>`;
  wrap.appendChild(t);
  setTimeout(()=>{t.style.animation="tOut .3s var(--ease) forwards"; setTimeout(()=>t.remove(),300);}, 3200);
}

/* ============================================================
   UTILS
   ============================================================ */
function getVal(id)      { return document.getElementById(id)?.value||""; }
function setVal(id,val)  { const el=document.getElementById(id); if(el) el.value=val; }
function setCheck(id,v)  { const el=document.getElementById(id); if(el) el.checked=v; }
function setHTML(id,html){ const el=document.getElementById(id); if(el) el.innerHTML=html; }

/* ============================================================
   DASHBOARD QUICK ACTIONS
   ============================================================ */
function goToNewProduct() {
  const btn = document.querySelector('.sb-item[onclick*="products"]');
  if (btn) showPage("products", btn);
  setTimeout(() => openProdModal(), 100);
}

function goToOrders() {
  const btn = document.querySelector('.sb-item[onclick*="orders"]');
  if (btn) showPage("orders", btn);
}

/* ============================================================
   AUTO REFRESH orders badge every 30s
   ============================================================ */
setInterval(() => {
  if (document.getElementById("adminWrap")?.style.display !== "none") {
    buildOrdersBadge();
  }
}, 30000);

/* ============================================================
   EXPORT ORDERS as CSV
   ============================================================ */
function exportOrdersCsv() {
  const orders = KD.getOrders();
  if (!orders.length) { aToast("⚠️ কোনো অর্ডার নেই","err"); return; }
  const headers = ["অর্ডার ID","নাম","ফোন","ঠিকানা","পণ্যসমূহ","মোট","পেমেন্ট","স্ট্যাটাস","সময়"];
  const rows = orders.map(o => [
    o.id, o.name, o.phone, o.address||"",
    (o.items||[]).map(i=>`${i.name}x${i.qty}`).join(" | "),
    o.total||"", o.payment||"", statusLabel(o.status), o.time||""
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${(c||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `orders_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  aToast("📥 অর্ডার CSV ডাউনলোড হচ্ছে!","ok");
}

/* ============================================================
   PRODUCT SEARCH FILTER with category
   ============================================================ */
function filterProds(val) {
  renderProductsTable(val);
}

/* ============================================================
   ORDERS — WhatsApp bulk message
   ============================================================ */
function waPendingReminder() {
  const pending = KD.getOrders().filter(o=>o.status==="pending");
  if (!pending.length) { aToast("কোনো পেন্ডিং অর্ডার নেই","inf"); return; }
  const cfg = KD.getConfig();
  pending.forEach(o => {
    const msg = encodeURIComponent(`আসসালামুয়ালাইকুম ${o.name} ভাই/আপু! Khalid's Dreams থেকে বলছি। আপনার অর্ডারটি প্রক্রিয়াধীন আছে। শীঘ্রই ডেলিভারি দেওয়া হবে। ধন্যবাদ! 🍯`);
    window.open(`https://wa.me/${(o.phone||"").replace(/[^0-9]/g,"")}?text=${msg}`, "_blank");
  });
}

/* ============================================================
   SETTINGS — live preview site name
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const nameInput = document.getElementById("cfg_siteName");
  if (nameInput) {
    nameInput.addEventListener("input", () => {
      const sb = document.querySelector(".sb-brand");
      if (sb) sb.textContent = nameInput.value || "Khalid's Dreams";
    });
  }
});

/* ============================================================
   IMAGE COMPRESSION before save (keep under 300KB)
   ============================================================ */
function compressImage(dataUrl, maxWidth=600, quality=0.78) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = dataUrl;
  });
}

/* override image handlers to auto-compress */
async function handleProdImgCompressed(input) {
  const file = input.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = async e => {
    const compressed = await compressImage(e.target.result, 500, 0.8);
    document.getElementById("prodImgPreview").innerHTML = `<img src="${compressed}" alt="preview">`;
    document.getElementById("prodImgData").value = compressed;
  };
  reader.readAsDataURL(file);
}
async function handleBannerImgCompressed(input) {
  const file = input.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = async e => {
    const compressed = await compressImage(e.target.result, 900, 0.82);
    document.getElementById("bannerImgPreview").innerHTML = `<img src="${compressed}">`;
    document.getElementById("bannerImgData").value = compressed;
  };
  reader.readAsDataURL(file);
}
async function handleHeroImgCompressed(input) {
  const file = input.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = async e => {
    const compressed = await compressImage(e.target.result, 1200, 0.82);
    document.getElementById("heroImgPreview").innerHTML = `<img src="${compressed}">`;
    document.getElementById("heroImgData").value = compressed;
  };
  reader.readAsDataURL(file);
}
async function handleCatImgCompressed(input) {
  const file = input.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = async e => {
    const compressed = await compressImage(e.target.result, 300, 0.85);
    document.getElementById("catImgPreview").innerHTML = `<img src="${compressed}">`;
    document.getElementById("catImgData").value = compressed;
  };
  reader.readAsDataURL(file);
}
async function handleLogoImgCompressed(input) {
  const file = input.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = async e => {
    const compressed = await compressImage(e.target.result, 200, 0.9);
    document.getElementById("logoImgPreview").innerHTML = `<img src="${compressed}" alt="logo">`;
    document.getElementById("logoImgData").value = compressed;
  };
  reader.readAsDataURL(file);
}

/* ============================================================
   ANALYTICS — top ordered products
   ============================================================ */
function topOrderedProducts() {
  const orders = KD.getOrders();
  const counts = {};
  orders.forEach(o => {
    (o.items||[]).forEach(item => {
      counts[item.name] = (counts[item.name]||0) + (item.qty||1);
    });
  });
  return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5);
}
