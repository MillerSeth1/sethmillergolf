(function () {
  // Single place to update live links, handles, and phone.
  // Leave any CONTACT_CONFIG value empty ("") to keep that slot hidden on the site.
  const DONATE_URL = "https://donate.stripe.com/dRm6oA3Uz8Kz8D2f3i9k40o";
  const CONTACT_CONFIG = {
    instagram: "", // e.g. "https://instagram.com/sethmillergolf" or "@sethmillergolf"
    tiktok: "",    // e.g. "https://tiktok.com/@sethmillergolf" or "@sethmillergolf"
    phone: "",     // e.g. "(520) 555-0199"
  };

  document.querySelectorAll("[data-donate]").forEach((a) => {
    a.href = DONATE_URL;
  });

  // Social links & phone slots (hidden until handles / number are filled in CONTACT_CONFIG)
  function normalizeSocialUrl(network, val) {
    const v = String(val || "").trim();
    if (!v) return "";
    if (/^https?:\/\//i.test(v)) return v;
    const handle = v.replace(/^@/, "");
    if (network === "instagram") return "https://instagram.com/" + handle;
    if (network === "tiktok") return "https://www.tiktok.com/@" + handle;
    return v;
  }

  let anySocialVisible = false;
  ["instagram", "tiktok"].forEach((net) => {
    const url = normalizeSocialUrl(net, CONTACT_CONFIG[net]);
    document.querySelectorAll(`[data-social="${net}"]`).forEach((el) => {
      if (url) {
        el.href = url;
        el.hidden = false;
        anySocialVisible = true;
      } else {
        el.hidden = true;
      }
    });
  });
  document.querySelectorAll("[data-social-row]").forEach((row) => {
    row.hidden = !anySocialVisible;
  });

  const phoneVal = String(CONTACT_CONFIG.phone || "").trim();
  const phoneDigits = phoneVal.replace(/[^\d+]/g, "");
  document.querySelectorAll("[data-contact-phone]").forEach((el) => {
    if (phoneVal && phoneDigits) {
      el.textContent = phoneVal;
      el.href = "tel:" + phoneDigits;
      el.hidden = false;
    } else {
      el.hidden = true;
    }
  });

  // Thank-you banner after Stripe redirects back with ?thanks=1
  const banner = document.getElementById("thanks-banner");
  if (banner && new URLSearchParams(window.location.search).get("thanks") === "1") {
    banner.hidden = false;
    document.body.classList.add("has-banner");
    const setBannerH = () => document.documentElement.style.setProperty("--banner-h", banner.offsetHeight + "px");
    setBannerH();
    window.addEventListener("resize", setBannerH);
    const close = banner.querySelector(".thanks-close");
    if (close) close.addEventListener("click", () => {
      banner.hidden = true;
      document.body.classList.remove("has-banner");
    });
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    }
  }

  // Header: solid after scrolling past the top
  const header = document.querySelector("[data-header]");
  const onScroll = () => {
    if (header) header.classList.toggle("is-solid", window.scrollY > 40);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile nav toggle
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("primary-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("nav-open", open);
    });
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("nav-open");
      });
    });
  }

  // Scroll reveals
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const items = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
  } else {
    document.documentElement.classList.add("js-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    items.forEach((el) => {
      const sibs = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.classList.contains("reveal")) : [];
      const i = sibs.indexOf(el);
      if (i > 0) el.style.transitionDelay = Math.min(i * 90, 450) + "ms";
      io.observe(el);
    });
  }

  // Countdown to VGA Nationals
  const clock = document.querySelector("[data-countdown]");
  if (clock) {
    const target = new Date(clock.getAttribute("data-countdown")).getTime();
    const pad = (n, w) => String(n).padStart(w, "0");
    const set = (unit, val) => {
      const el = clock.querySelector(`[data-unit="${unit}"]`);
      if (el) el.textContent = val;
    };
    const tick = () => {
      let ms = Math.max(0, target - Date.now());
      const days = Math.floor(ms / 86400000); ms -= days * 86400000;
      const hours = Math.floor(ms / 3600000); ms -= hours * 3600000;
      const mins = Math.floor(ms / 60000); ms -= mins * 60000;
      const secs = Math.floor(ms / 1000);
      set("days", pad(days, 3));
      set("hours", pad(hours, 2));
      set("mins", pad(mins, 2));
      set("secs", pad(secs, 2));
    };
    tick();
    setInterval(tick, 1000);
  }

  // Ledger snapshot on the home page
  const snap = document.querySelector("[data-ledger-snap]");
  if (snap) {
    const money = (n) => Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });
    fetch("ledger.json?v=8")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        const sum = (rows) => (rows || []).reduce((s, r) => s + Number(r.amount || 0), 0);
        snap.querySelector('[data-snap="in"]').textContent = money(sum(d.moneyIn));
        snap.querySelector('[data-snap="out"]').textContent = money(sum(d.moneyOut));
        if (d.lastUpdated) {
          const [y, m, day] = d.lastUpdated.split("-").map(Number);
          snap.querySelector('[data-snap="updated"]').textContent =
            "Last updated " + new Date(y, m - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        }
      })
      .catch(() => {});
  }

  // Season Log snapshot on the home page
  const progSnap = document.querySelector("[data-progress-snap]");
  if (progSnap) {
    fetch("progress.json?v=10")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        const entries = Array.isArray(d.entries) ? d.entries : [];
        const lessons = entries.filter((e) => e.type === "lesson").length;
        const hrs = entries.reduce((s, e) => (e.type === "practice" || e.type === "lesson" ? s + Number(e.hours || 0) : s), 0);
        const rounds = entries.filter((e) => e.type === "round" || e.type === "tournament").length;
        const tourneys = entries.filter((e) => e.type === "tournament").length;
        const setP = (k, v) => {
          const el = progSnap.querySelector(`[data-psnap="${k}"]`);
          if (el) el.textContent = v;
        };
        setP("lessons", String(lessons));
        setP("hours", hrs > 0 ? `${Number(hrs.toFixed(1))} hrs` : "0 hrs");
        setP("rounds", String(rounds));
        setP("tournaments", String(tourneys));
      })
      .catch(() => {});
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
      const img = btn.querySelector("img");
      lbImg.src = btn.getAttribute("data-enlarge");
      lbImg.alt = img ? img.alt : "";
      if (lbCaption) lbCaption.textContent = btn.getAttribute("data-caption") || "";
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
    });
  });
  if (lightbox) {
    lightbox.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeLightbox));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
    });
  }


  // Supporters wall (default Anonymous; names only when a donor opted in)
  const wall = document.querySelector("[data-supporters-wall]");
  if (wall) {
    fetch("supporters.json?v=1")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const list = Array.isArray(data.supporters) ? data.supporters : [];
        const visible = list.filter((s) => s && s.showName && String(s.name || "").trim());
        if (!visible.length) {
          wall.innerHTML = "<p class=\"supporters-empty\">No public names yet — and that's by design. Every gift still counts, and the default is Anonymous.</p>";
          return;
        }
        wall.innerHTML =
          "<ul class=\"supporters-list\">" +
          visible
            .map((s) => {
              const name = String(s.name).trim()
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
              return "<li>" + name + "</li>";
            })
            .join("") +
          "</ul>";
      })
      .catch(() => {
        wall.innerHTML = "<p class=\"supporters-empty\">The supporter wall could not be loaded right now.</p>";
      });
  }
})();
