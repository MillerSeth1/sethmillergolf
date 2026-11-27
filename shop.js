// Shop — product data + option pickers. Buy opens the matching Stripe Payment Link (size tier picks the link).
(() => {
  const IMG = "assets/img/shop/";
  const C = { black: "#141414", navy: "#1f2a44", "forest-green": "#004224", grey: "#5c5e5d", white: "#f4f4f2", stone: "#cbbd9f", "steel-grey": "#62676c", "cool-heather": "#c4c8cd",
    "sport-grey": "#a9abae", khaki: "#bdaa97", spruce: "#2f4a3e", "dark-chocolate": "#4a3428", "military-green": "#5b5f3f",
    sand: "#d6c4a3", natural: "#eee5d0", "black-white": "#282927", "white-black": "#f4f4f2", "light-blue-white": "#4d617b",
    "dark-grey": "#554e46", "dark-navy": "#171822", grey: "#717171", "multicam-black": "#131211", "multicam-green": "#585c30",
    olive: "#483d20", red: "#bf0a1b", "royal-blue": "#0b3466", "kelly-white": "#206b57",
    "black-charcoal": "#000000", "charcoal-black": "#616161", "heather-grey-black": "#afafb3", "heather-grey-white": "#a3a3a3", loden: "#8e845e" };
  const NAMES = { "black-white": "Black / White", "white-black": "White / Black", "light-blue-white": "Light Blue / White",
    "kelly-white": "Kelly / White", "black-charcoal": "Black / Charcoal", "charcoal-black": "Charcoal / Black",
    "heather-grey-black": "Heather Grey / Black", "heather-grey-white": "Heather Grey / White",
    "forest-green": "Forest Green", "dark-navy": "Dark Navy", "dark-grey": "Dark Grey", "royal-blue": "Royal Blue",
    "multicam-black": "Multicam Black", "multicam-green": "Multicam Green" };
  const N = (k) => NAMES[k] || k.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  const DESIGNS = { "desert-flag": "Desert Flag", "monogram-flag": "SM Monogram" };
  const SZ = ["S", "M", "L", "XL", "2XL (+$2)", "3XL (+$4)"];
  // Stripe Payment Links (live). Key = product id, plus "-2xl"/"-3xl" for upsized tiers.
  const LINKS = {
      "polo-m": "https://buy.stripe.com/4gMeV64YD9OD9H6aN29k40E",
      "polo-m-2xl": "https://buy.stripe.com/bJe8wIcr52mb8D2f3i9k40F",
      "polo-w": "https://buy.stripe.com/28E00c9eTe4T5qQbR69k40G",
      "polo-w-2xl": "https://buy.stripe.com/fZu14g0In9ODdXm1cs9k40H",
      "polo-classic": "https://buy.stripe.com/fZufZa3UzaSH8D24oE9k40J",
      "polo-classic-2xl": "https://buy.stripe.com/7sYfZa9eT4uj6uU08o9k40K",
      "polo-classic-3xl": "https://buy.stripe.com/6oU8wI2Qv1i706wcVa9k40L",
      "structured": "https://buy.stripe.com/aFaeV62Qvf8Xf1qcVa9k40y",
      "flag-cap": "https://buy.stripe.com/aFa5kw62H6Cr5qQf3i9k40I",
      "tee": "https://buy.stripe.com/fZuaEQ8aP7Gv1aAf3i9k407",
      "tee-2xl": "https://buy.stripe.com/00wfZa2Qv3qfg5u08o9k408",
      "tee-3xl": "https://buy.stripe.com/3cIcMY9eT3qfdXmaN29k409",
      "towel": "https://buy.stripe.com/7sYdR21Mr4ujbPeg7m9k40a",
      "rope": "https://buy.stripe.com/6oUaEQ62H5yn4mM1cs9k40z",
      "trucker": "https://buy.stripe.com/14A3cobn12mbg5ubR69k40A",
      "tumbler": "https://buy.stripe.com/00w4gs3Uzgd11aA9IY9k40c",
      "cooler": "https://buy.stripe.com/fZufZa62H7Gvf1q8EU9k40d",
      "tag": "https://buy.stripe.com/7sY4gsbn1d0Pf1q7AQ9k40e"
  };
  const P = [
    { id: "polo-m", group: "apparel", name: "Men's Performance Polo", price: 75, meta: "Under Armour Tech Polo · 100% polyester, moisture-wicking · embroidered",
      designs: ["desert-flag", "monogram-flag"], colors: ["navy", "black", "forest-green", "grey", "white"],
      img: (d, c) => `polo-m-${d}-${c}.jpg`, sizes: ["S", "M", "L", "XL", "2XL (+$2)"] },
    { id: "polo-w", group: "apparel", name: "Women's Performance Polo", price: 75, meta: "Under Armour Tech Polo · 100% polyester, moisture-wicking · embroidered",
      designs: ["desert-flag", "monogram-flag"], colors: ["navy", "black", "forest-green", "grey", "white"],
      img: (d, c) => `polo-w-${d}-${c}.jpg`, sizes: ["S", "M", "L", "XL", "2XL (+$2)"] },
    { id: "polo-classic", group: "apparel", name: "Men's Classic Polo", price: 45, tag: "New", meta: "Classic Polo · 65% poly / 35% cotton pique · embroidered",
      designs: ["desert-flag", "monogram-flag"], colors: ["navy", "black", "steel-grey", "white", "stone", "cool-heather"],
      img: (d, c) => `polo-classic-${d}-${c}.jpg`, sizes: ["S", "M", "L", "XL", "2XL (+$2)", "3XL (+$4)"] },
    { id: "structured", group: "apparel", name: "Structured Cap", price: 38, tag: "New", meta: "Flexfit 6277 closed-back · wordmark",
      colors: ["dark-navy", "black", "olive", "khaki", "white", "dark-grey", "grey", "red", "royal-blue", "multicam-black", "multicam-green"],
      img: (d, c) => `structured-${c}.jpg`, sizes: ["S/M", "L/XL"], contain: true },
    { id: "flag-cap", group: "apparel", name: "Desert Flag Cap", price: 38, tag: "New", meta: "Flexfit 6277 closed-back · Desert Flag front",
      colors: ["dark-navy", "black", "olive", "khaki", "white", "dark-grey"],
      img: (d, c) => `flag-cap-${c}.jpg`, sizes: ["S/M", "L/XL"], contain: true },
    { id: "rope", group: "apparel", name: "Rope Golf Cap", price: 38, tag: "New", meta: "Richardson 258 · ARIZONA front, name on the side",
      colors: ["black-white", "white-black", "kelly-white", "light-blue-white"],
      img: (d, c, s) => s === "front" ? `rope-${c}-side.jpg` : `rope-${c}.jpg`, sizes: ["One size"], contain: true, flip: true },
    { id: "trucker", group: "apparel", name: "Trucker Cap", price: 40, tag: "New", meta: "Richardson 112 snapback · mesa + flag",
      colors: ["loden", "heather-grey-black", "black", "black-charcoal", "black-white", "charcoal-black", "heather-grey-white"],
      img: (d, c) => `trucker-${c}.jpg`, sizes: ["One size"], contain: true },
    { id: "tee", group: "apparel", name: "Arizona Tee", price: 35, meta: "Gildan 64000 · SM chest + ARIZONA back",
      colors: ["black", "navy", "dark-chocolate", "military-green", "sand", "natural"], img: (d, c, s) => `tee-arizona-${c}-${s || "back"}.jpg`, flip: true, sizes: SZ },
    { id: "towel", group: "acc", name: "Golf Towel", price: 28, tag: "New", meta: "16 × 24 in microfiber · ARIZONA print",
      colors: [], img: () => "acc-golf-towel.jpg", sizes: ["16 × 24 in"] },
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
      const fl = el.querySelector(".p-flip");
      if (fl) fl.textContent = p.zoom ? (st.s === "back" ? "Close-up" : "Full view") : p.id === "rope" ? (st.s === "back" ? "Show side" : "Show front") : (st.s === "back" ? "Show front" : "Show back");
      el.querySelector(".p-media").classList.toggle("zoomed", !!p.zoom && st.s === "front");
      sync();
    };
    img.style.cursor = "zoom-in";
    img.addEventListener("click", (e) => {
      e.stopPropagation();
      const box = document.getElementById("lightbox");
      const lbImg = document.getElementById("lightbox-img");
      const cap = document.getElementById("lightbox-caption");
      if (!box || !lbImg) return;
      lbImg.src = img.src;
      lbImg.alt = img.alt || "";
      if (cap) cap.textContent = img.alt || "";
      box.hidden = false;
      document.body.style.overflow = "hidden";
    });
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
