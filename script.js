(function () {
  // Single place to change the donation link.
  const DONATE_URL = "https://donate.stripe.com/14A3co9eTf8X9H6f3i9k400";
  document.querySelectorAll("[data-donate]").forEach((a) => {
    a.href = DONATE_URL;
  });

  // Thank-you banner after Stripe redirects back with ?thanks=1
  const banner = document.getElementById("thanks-banner");
  if (banner && new URLSearchParams(window.location.search).get("thanks") === "1") {
    banner.hidden = false;
    const close = banner.querySelector(".thanks-close");
    if (close) close.addEventListener("click", () => { banner.hidden = true; });
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    }
  }

  // Mobile nav toggle
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("primary-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Click-to-enlarge lightbox
  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lightbox-img");
  const lbCaption = document.getElementById("lightbox-caption");

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    lbImg.removeAttribute("src");
    lbImg.alt = "";
    document.body.style.overflow = "";
  }

  document.querySelectorAll("[data-enlarge]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!lightbox || !lbImg) return;
      const src = btn.getAttribute("data-enlarge");
      const caption = btn.getAttribute("data-caption") || "";
      const img = btn.querySelector("img");
      lbImg.src = src;
      lbImg.alt = img ? img.alt : caption;
      if (lbCaption) lbCaption.textContent = caption;
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
    });
  });

  if (lightbox) {
    lightbox.querySelectorAll("[data-close]").forEach((el) => {
      el.addEventListener("click", closeLightbox);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !lightbox.hidden) {
        closeLightbox();
      }
    });
  }
})();
