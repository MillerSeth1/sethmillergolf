// Shop — product data + option pickers. Buy opens the matching Stripe Payment Link (size tier picks the link).
(() => {
  const IMG = "assets/img/shop/";
  const C = { black: "#141414", navy: "#1f2a44", white: "#f4f4f2", stone: "#cbbd9f", "steel-grey": "#62676c", "cool-heather": "#c4c8cd",
    "sport-grey": "#a9abae", khaki: "#c3b091", spruce: "#2f4a3e", "dark-chocolate": "#4a3428", "military-green": "#5b5f3f",
    sand: "#d6c4a3", natural: "#eee5d0", "black-white": "#141414", "white-black": "#f4f4f2", "light-blue-white": "#7f9fc4" };
  const N = (k) => k.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ").replace("Black White", "Black / White").replace("White Black", "White / Black").replace("Light Blue White", "Light Blue / White");
  const DESIGNS = { "desert-flag": "Desert Flag", "monogram-flag": "SM Monogram" };
  const SZ = ["S", "M", "L", "XL", "2XL (+$2)", "3XL (+$4)"];
  // Stripe Payment Links (live). Key = product id, plus "-2xl"/"-3xl" for upsized tiers.
  const LINKS = {
      "polo-m": "https://buy.stripe.com/dRmdR24YDbWL3iIf3i9k401",
      "polo-m-2xl": "https://buy.stripe.com/00w3cobn13qf1aA5sI9k402",
      "polo-m-3xl": "https://buy.stripe.com/dRm8wI1Mrd0P8D26wM9k403",
      "polo-w": "https://buy.stripe.com/9B6aEQaiX5yn8D208o9k404",
      "polo-w-2xl": "https://buy.stripe.com/aFa28k0InbWL1aA7AQ9k405",
      "hat": "https://buy.stripe.com/bJe9AM8aPd0P2eEcVa9k406",
      "tee": "https://buy.stripe.com/fZuaEQ8aP7Gv1aAf3i9k407",
      "tee-2xl": "https://buy.stripe.com/00wfZa2Qv3qfg5u08o9k408",
      "tee-3xl": "https://buy.stripe.com/3cIcMY9eT3qfdXmaN29k409",
      "towel": "https://buy.stripe.com/7sYdR21Mr4ujbPeg7m9k40a",
      "rope": "https://buy.stripe.com/9B6bIU1Mr4uj3iI1cs9k40b",
      "tumbler": "https://buy.stripe.com/00w4gs3Uzgd11aA9IY9k40c",
      "cooler": "https://buy.stripe.com/fZufZa62H7Gvf1q8EU9k40d",
      "tag": "https://buy.stripe.com/7sY4gsbn1d0Pf1q7AQ9k40e"
  };
  const P = [
    { id: "polo-m", group: "apparel", name: "Men's Polo", price: 45, meta: "Port Authority K500 pique · embroidered",
      designs: ["desert-flag", "monogram-flag"], colors: ["black", "navy", "white", "stone", "steel-grey", "cool-heather"],
      img: (d, c, s) => `polo-m-${d}-${c}${s === "front" ? "-chest" : ""}.jpg`, zoom: true, sizes: SZ },
    { id: "polo-w", group: "apparel", name: "Women's Polo", price: 45, meta: "Gildan 64800L pique · embroidered",
      designs: ["desert-flag", "monogram-flag"], colors: ["black", "navy", "white", "sport-grey"],
      img: (d, c, s) => `polo-w-${d}-${c}${s === "front" ? "-chest" : ""}.jpg`, zoom: true, sizes: ["S", "M", "L", "XL", "2XL (+$2)"] },
    { id: "hat", group: "apparel", name: "Classic Dad Hat", price: 35, meta: "Yupoong 6245CM twill · SM monogram",
      colors: ["black", "navy", "spruce", "khaki", "stone", "white"], img: (d, c) => `hat-sm-${c}.jpg`, sizes: ["One size"], contain: true },
    { id: "tee", group: "apparel", name: "Arizona Tee", price: 35, meta: "Gildan 64000 · SM chest + ARIZONA back",
      colors: ["black", "navy", "dark-chocolate", "military-green", "sand", "natural"], img: (d, c, s) => `tee-arizona-${c}-${s || "back"}.jpg`, flip: true, sizes: SZ },
    { id: "towel", group: "acc", name: "Golf Towel", price: 28, tag: "New", meta: "16 × 24 in microfiber · ARIZONA print",
      colors: [], img: () => "acc-golf-towel.jpg", sizes: ["16 × 24 in"] },
    { id: "rope", group: "acc", name: "Rope Golf Cap", price: 36, tag: "New", meta: "Richardson 258 · SM monogram",
      colors: ["black-white", "white-black", "light-blue-white"], img: (d, c) => `acc-rope-cap-${c}.jpg`, sizes: ["One size"], contain: true },
    { id: "tumbler", group: "acc", name: "20 oz Tumbler", price: 38, tag: "New", meta: "Insulated steel · lid + straw",
      colors: ["black", "navy", "white"], img: (d, c) => `acc-tumbler-${c}.jpg`, sizes: ["20 oz"], contain: true },
    { id: "cooler", group: "acc", name: "Can Cooler", price: 14, tag: "New", meta: "Neoprene · ARIZONA print",
      colors: [], img: () => "acc-can-cooler.jpg", sizes: ["Regular", "Slim"], contain: true },
    { id: "tag", group: "acc", name: "Golf Bag Tag", price: 28, tag: "New", meta: "Acrylic + leather strap · ID slot",
      colors: [], img: () => "acc-bag-tag.jpg", sizes: ["2.5 × 4 in"], contain: true },
  ];

  const toast = document.createElement("div"); toast.className = "toast"; toast.setAttribute("role", "status"); document.body.appendChild(toast);
  let tt; const say = (m) => { toast.textContent = m; toast.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove("show"), 3200); };

  const card = (p) => {
    const st = { d: p.designs ? p.designs[0] : null, c: p.colors[0] || null, s: "back" };
    if (p.id === "polo-m") st.c = "navy";
    const el = document.createElement("article"); el.className = "p-card";
    const base = p.price;
    el.innerHTML = `
      <div class="p-media${p.contain ? " contain" : ""}">
        <img alt="" loading="lazy" width="900" height="900" />
        ${p.tag ? `<span class="p-tag">${p.tag}</span>` : ""}
        ${p.flip || p.zoom ? `<button type="button" class="p-flip"></button>` : ""}
      </div>
      <div class="p-body">
        <div class="p-top"><h3 class="p-name">${p.name}</h3><span class="p-price" data-price>$${base}</span></div>
        <p class="p-meta">${p.meta}</p>
        ${p.designs || p.colors.length ? `<div class="p-opts">
          ${p.designs ? `<div class="seg" role="group" aria-label="Design">${p.designs.map((d) => `<button type="button" data-d="${d}">${DESIGNS[d]}</button>`).join("")}</div>` : ""}
          ${p.colors.length ? `<div class="swatches" role="group" aria-label="Color">${p.colors.map((c) => `<button type="button" data-c="${c}" title="${N(c)}" aria-label="${N(c)}" style="background:${C[c]}"></button>`).join("")}</div>` : ""}
        </div><p class="p-sel" data-sel></p>` : ""}
        <div class="p-row">
          ${p.sizes.length > 1 ? `<select aria-label="Size">${p.sizes.map((s) => `<option>${s}</option>`).join("")}</select>` : ""}
          <a class="btn-buy" href="#" target="_blank" rel="noopener">Buy</a>
        </div>
      </div>`;
    const sel = el.querySelector("select");
    const tier = () => { const v = sel ? sel.value : ""; return v.startsWith("3XL") ? "3xl" : v.startsWith("2XL") ? "2xl" : ""; };
    const buy = el.querySelector(".btn-buy");
    const sync = () => {
      const t = tier(); const price = base + (t === "2xl" ? 2 : t === "3xl" ? 4 : 0);
      el.querySelector("[data-price]").textContent = `$${price}`;
      const url = LINKS[t ? `${p.id}-${t}` : p.id];
      const ref = [p.id, st.d, st.c, sel ? sel.value.split(" ")[0] : ""].filter(Boolean).join("_").replace(/[^A-Za-z0-9_-]/g, "");
      buy.href = url ? `${url}?client_reference_id=${encodeURIComponent(ref)}` : "#";
      buy.setAttribute("aria-label", `Buy ${p.name}, $${price}`);
    };
    if (sel) sel.addEventListener("change", sync);
    const img = el.querySelector("img");
    const paint = () => {
      img.src = IMG + p.img(st.d, st.c, st.s);
      img.alt = `${p.name}${st.d ? " — " + DESIGNS[st.d] : ""}${st.c ? " — " + N(st.c) : ""}`;
      el.querySelectorAll("[data-d]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.d === st.d));
      el.querySelectorAll("[data-c]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.c === st.c));
      const sl = el.querySelector("[data-sel]"); if (sl) sl.innerHTML = [st.c ? `<b>${N(st.c)}</b>` : "", st.d ? DESIGNS[st.d] : ""].filter(Boolean).join(" · ");
      const fl = el.querySelector(".p-flip"); if (fl) fl.textContent = p.zoom ? (st.s === "back" ? "Close-up" : "Full view") : (st.s === "back" ? "Show front" : "Show back");
      el.querySelector(".p-media").classList.toggle("zoomed", !!p.zoom && st.s === "front");
      sync();
    };
    el.addEventListener("click", (e) => {
      if (e.target.closest(".btn-buy")) { if (buy.getAttribute("href") === "#") { e.preventDefault(); say("Checkout is not available yet — email Seth to order."); } return; }
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.d) st.d = b.dataset.d;
      else if (b.dataset.c) st.c = b.dataset.c;
      else if (b.classList.contains("p-flip")) st.s = st.s === "back" ? "front" : "back";
      paint();
    });
    paint(); return el;
  };
  if (new URLSearchParams(location.search).has("thanks")) setTimeout(() => say("Thank you! Your order is in. You'll get a Stripe receipt by email."), 400);
  document.querySelectorAll("[data-shop-grid]").forEach((g) => P.filter((p) => p.group === g.dataset.shopGrid).forEach((p) => g.appendChild(card(p))));
})();
