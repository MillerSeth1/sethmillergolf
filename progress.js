(function () {
  const TYPE_LABELS = {
    lesson: "Lesson",
    practice: "Practice",
    round: "Casual round",
    tournament: "Tournament",
  };

  const esc = (v) =>
    String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const dateLabel = (iso) => {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "—";
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const shortDate = (iso) => {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "";
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const numOrNull = (v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const ratingSlopeText = (e) => {
    if (e.ratingSlope) return String(e.ratingSlope);
    const r = numOrNull(e.rating);
    const s = numOrNull(e.slope);
    if (r !== null && s !== null) return `${r.toFixed(1)} / ${Math.round(s)}`;
    if (r !== null) return `${r.toFixed(1)} / —`;
    if (s !== null) return `— / ${Math.round(s)}`;
    return "—";
  };

  let allEntries = [];
  let activeFilter = "all";

  function computeStats(entries) {
    const lessons = entries.filter((e) => e.type === "lesson").length;
    const practiceHrs = entries.reduce((sum, e) => {
      if (e.type === "practice" || e.type === "lesson") {
        const h = numOrNull(e.hours);
        return sum + (h !== null ? h : 0);
      }
      return sum;
    }, 0);
    const scoredRounds = entries.filter(
      (e) => (e.type === "round" || e.type === "tournament") && numOrNull(e.score) !== null
    );
    const roundsCount = entries.filter(
      (e) => e.type === "round" || e.type === "tournament"
    ).length;
    const tourneyCount = entries.filter((e) => e.type === "tournament").length;

    let best = null;
    let avg = null;
    if (scoredRounds.length) {
      const scores = scoredRounds.map((e) => Number(e.score));
      best = Math.min(...scores);
      avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    return { lessons, practiceHrs, roundsCount, tourneyCount, best, avg };
  }

  function renderStats(stats) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    set("stat-lessons", String(stats.lessons));
    set(
      "stat-hours",
      stats.practiceHrs > 0
        ? `${Number(stats.practiceHrs.toFixed(1))} hrs`
        : "0 hrs"
    );
    set("stat-rounds", String(stats.roundsCount));
    set("stat-tournaments", String(stats.tourneyCount));
    set("stat-best", stats.best !== null ? String(stats.best) : "—");
    set("stat-avg", stats.avg !== null ? stats.avg.toFixed(1) : "—");
  }

  function renderChart(entries) {
    const wrap = document.getElementById("trend-chart");
    if (!wrap) return;

    const rounds = entries
      .filter(
        (e) =>
          (e.type === "round" || e.type === "tournament") &&
          numOrNull(e.score) !== null
      )
      .slice()
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));

    if (!rounds.length) {
      wrap.innerHTML = `
        <div class="chart-empty">
          <svg class="chart-ghost" viewBox="0 0 840 220" aria-hidden="true">
            <line x1="56" y1="40" x2="808" y2="40" stroke="rgba(246,237,224,0.1)" stroke-dasharray="4 4"/>
            <line x1="56" y1="95" x2="808" y2="95" stroke="rgba(246,237,224,0.1)" stroke-dasharray="4 4"/>
            <line x1="56" y1="150" x2="808" y2="150" stroke="rgba(246,237,224,0.1)" stroke-dasharray="4 4"/>
            <line x1="56" y1="185" x2="808" y2="185" stroke="rgba(246,237,224,0.16)"/>
            <polyline points="80,132 220,124 360,112 500,118 640,98 780,82" fill="none" stroke="rgba(212,137,74,0.22)" stroke-width="2.5" stroke-dasharray="6 6"/>
          </svg>
          <p class="chart-empty-copy"><strong>Season starts in 2027.</strong> Score and differential trends will plot here automatically once the first round is posted.</p>
        </div>
      `;
      return;
    }

    const W = 840;
    const H = 260;
    const pad = { top: 26, right: 56, bottom: 42, left: 52 };
    const iw = W - pad.left - pad.right;
    const ih = H - pad.top - pad.bottom;

    const scores = rounds.map((r) => Number(r.score));
    const minS = Math.floor((Math.min(...scores) - 3) / 2) * 2;
    const maxS = Math.ceil((Math.max(...scores) + 3) / 2) * 2;
    const spanS = Math.max(4, maxS - minS);

    const diffs = rounds.map((r) => numOrNull(r.differential));
    const validDiffs = diffs.filter((d) => d !== null);
    const hasDiff = validDiffs.length > 0;
    const minD = hasDiff ? Math.floor(Math.min(...validDiffs) - 2) : 0;
    const maxD = hasDiff ? Math.ceil(Math.max(...validDiffs) + 2) : 30;
    const spanD = Math.max(4, maxD - minD);

    const xFor = (i) =>
      rounds.length === 1
        ? pad.left + iw / 2
        : pad.left + (i / (rounds.length - 1)) * iw;
    const yScore = (v) => pad.top + ((maxS - v) / spanS) * ih;
    const yDiff = (v) => pad.top + ((maxD - v) / spanD) * ih;

    const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => {
      const y = pad.top + t * ih;
      const val = Math.round(maxS - t * spanS);
      return `
        <line x1="${pad.left}" y1="${y.toFixed(1)}" x2="${W - pad.right}" y2="${y.toFixed(1)}" stroke="rgba(246,237,224,0.12)" stroke-dasharray="${t === 1 ? "none" : "4 4"}"/>
        <text x="${pad.left - 10}" y="${(y + 4).toFixed(1)}" text-anchor="end" fill="rgba(246,237,224,0.58)" font-size="11" font-family="Inter, sans-serif">${val}</text>
      `;
    });

    const scorePts = rounds.map((r, i) => `${xFor(i).toFixed(1)},${yScore(Number(r.score)).toFixed(1)}`).join(" ");
    const diffPairs = rounds
      .map((r, i) => (diffs[i] !== null ? [i, diffs[i]] : null))
      .filter(Boolean);
    const diffPts = diffPairs
      .map(([i, d]) => `${xFor(i).toFixed(1)},${yDiff(d).toFixed(1)}`)
      .join(" ");

    const diffAxis = hasDiff
      ? [0, 0.5, 1].map((t) => {
          const y = pad.top + t * ih;
          const val = (maxD - t * spanD).toFixed(1);
          return `<text x="${W - pad.right + 10}" y="${(y + 4).toFixed(1)}" text-anchor="start" fill="#5BB5AE" font-size="11" font-family="Inter, sans-serif">${val}</text>`;
        })
      : [];

    const stepLabel = rounds.length > 8 ? Math.ceil(rounds.length / 8) : 1;
    const xLabels = rounds.map((r, i) => {
      if (i % stepLabel !== 0 && i !== rounds.length - 1) return "";
      return `<text x="${xFor(i).toFixed(1)}" y="${H - 12}" text-anchor="middle" fill="rgba(246,237,224,0.62)" font-size="11" font-family="Inter, sans-serif">${esc(shortDate(r.date))}</text>`;
    });

    const scoreDots = rounds.map((r, i) => {
      const cx = xFor(i).toFixed(1);
      const cy = yScore(Number(r.score)).toFixed(1);
      const isT = r.type === "tournament";
      return `
        <circle cx="${cx}" cy="${cy}" r="${isT ? 5.5 : 4.5}" fill="${isT ? "#F6EDE0" : "#D4894A"}" stroke="#1F1410" stroke-width="2">
          <title>${esc(dateLabel(r.date))} · ${esc(r.course || "")} · Score ${esc(r.score)}</title>
        </circle>
        <text x="${cx}" y="${(Number(cy) - 10).toFixed(1)}" text-anchor="middle" fill="#F6EDE0" font-size="11" font-weight="600" font-family="Inter, sans-serif">${esc(r.score)}</text>
      `;
    });

    const diffDots = diffPairs.map(([i, d]) => {
      const cx = xFor(i).toFixed(1);
      const cy = yDiff(d).toFixed(1);
      return `<circle cx="${cx}" cy="${cy}" r="3.8" fill="#5BB5AE" stroke="#1F1410" stroke-width="1.5"><title>Differential ${d.toFixed(1)}</title></circle>`;
    });

    wrap.innerHTML = `
      <svg class="trend-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gross score and handicap differential trend over ${rounds.length} rounds">
        ${gridLines.join("")}
        ${diffAxis.join("")}
        ${xLabels.join("")}
        ${diffPairs.length > 1 ? `<polyline points="${diffPts}" fill="none" stroke="#5BB5AE" stroke-width="2" stroke-dasharray="5 4"/>` : ""}
        ${rounds.length > 1 ? `<polyline points="${scorePts}" fill="none" stroke="#D4894A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
        ${diffDots.join("")}
        ${scoreDots.join("")}
      </svg>
    `;
  }

  function renderFilterCounts(entries) {
    const counts = {
      all: entries.length,
      lesson: entries.filter((e) => e.type === "lesson").length,
      practice: entries.filter((e) => e.type === "practice").length,
      round: entries.filter((e) => e.type === "round").length,
      tournament: entries.filter((e) => e.type === "tournament").length,
    };
    document.querySelectorAll("[data-filter-count]").forEach((el) => {
      const k = el.getAttribute("data-filter-count");
      if (k in counts) el.textContent = String(counts[k]);
    });
  }

  function renderFeed(entries) {
    const feed = document.getElementById("activity-feed");
    if (!feed) return;

    const sorted = entries
      .slice()
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const filtered =
      activeFilter === "all"
        ? sorted
        : sorted.filter((e) => e.type === activeFilter);

    if (!entries.length) {
      feed.innerHTML = `
        <div class="log-empty-card">
          <p class="log-empty-eyebrow">Season starts in 2027</p>
          <p class="log-empty-title">No sessions or rounds logged yet.</p>
          <p class="log-empty-copy">GOLFTEC lessons, range practice, casual rounds, and 2027 VGA Arizona Tour events will appear here as every step of the climb toward Chambers Bay is logged.</p>
        </div>
      `;
      return;
    }

    if (!filtered.length) {
      const label = TYPE_LABELS[activeFilter] || activeFilter;
      feed.innerHTML = `
        <div class="log-empty-card">
          <p class="log-empty-title">No ${esc(label.toLowerCase())} entries yet.</p>
          <p class="log-empty-copy">Select "All" above to view the full log, or check back after the next session.</p>
        </div>
      `;
      return;
    }

    feed.innerHTML = filtered
      .map((e) => {
        const typeKey = e.type in TYPE_LABELS ? e.type : "practice";
        const typeLabel = TYPE_LABELS[typeKey];
        const score = numOrNull(e.score);
        const par = numOrNull(e.par);
        const diff = numOrNull(e.differential);
        const hrs = numOrNull(e.hours);

        const metrics = [];
        if (score !== null) {
          const toPar =
            par !== null
              ? (() => {
                  const d = score - par;
                  return d === 0 ? "E" : d > 0 ? `+${d}` : `${d}`;
                })()
              : null;
          metrics.push(
            `<span><strong>${esc(score)}</strong>${toPar ? ` (${esc(toPar)})` : ""}</span>`
          );
        }
        if (e.tees) metrics.push(`<span>Tees: <strong>${esc(e.tees)}</strong></span>`);
        if (ratingSlopeText(e) !== "—")
          metrics.push(`<span>R/S: <strong>${esc(ratingSlopeText(e))}</strong></span>`);
        if (diff !== null)
          metrics.push(`<span>Diff: <strong>${diff.toFixed(1)}</strong></span>`);
        if (hrs !== null)
          metrics.push(`<span>Time: <strong>${Number(hrs.toFixed(1))} hrs</strong></span>`);
        if (e.coach)
          metrics.push(`<span>Coach: <strong>${esc(e.coach)}</strong></span>`);

        return `
          <article class="log-entry">
            <div class="log-entry-head">
              <span class="log-type log-type-${esc(typeKey)}">${esc(typeLabel)}</span>
              <time class="log-date">${esc(dateLabel(e.date))}</time>
            </div>
            <h3 class="log-course">${esc(e.course || (typeKey === "lesson" ? "GOLFTEC Lesson" : "Practice Session"))}</h3>
            ${metrics.length ? `<div class="log-metrics">${metrics.join("")}</div>` : ""}
            ${e.notes ? `<p class="log-notes">${esc(e.notes)}</p>` : ""}
          </article>
        `;
      })
      .join("");
  }

  function renderTournaments(entries) {
    const tbody = document.querySelector("#tournament-table tbody");
    const wrap = document.getElementById("tournament-wrap");
    const empty = document.getElementById("tournament-empty");
    if (!tbody) return;

    const list = entries
      .filter((e) => e.type === "tournament")
      .slice()
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    if (!list.length) {
      if (wrap) wrap.hidden = true;
      if (empty) empty.hidden = false;
      tbody.innerHTML = "";
      return;
    }
    if (wrap) wrap.hidden = false;
    if (empty) empty.hidden = true;

    tbody.innerHTML = list
      .map((e) => {
        const diff = numOrNull(e.differential);
        return `
          <tr>
            <td>${esc(dateLabel(e.date))}</td>
            <td>${esc(e.course || "—")}</td>
            <td>${esc(e.tees || "—")}</td>
            <td class="num"><strong>${numOrNull(e.score) !== null ? esc(e.score) : "—"}</strong></td>
            <td class="num">${numOrNull(e.par) !== null ? esc(e.par) : "—"}</td>
            <td class="num">${esc(ratingSlopeText(e))}</td>
            <td class="num">${diff !== null ? diff.toFixed(1) : "—"}</td>
            <td>${esc(e.notes || "—")}</td>
          </tr>
        `;
      })
      .join("");
  }

  document.querySelectorAll("[data-log-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeFilter = btn.getAttribute("data-log-filter") || "all";
      document.querySelectorAll("[data-log-filter]").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      renderFeed(allEntries);
    });
  });

  fetch("progress.json?v=8")
    .then((r) => {
      if (!r.ok) throw new Error("Could not load Season Log");
      return r.json();
    })
    .then((data) => {
      const updated = document.getElementById("progress-updated");
      if (updated) {
        updated.textContent = data.lastUpdated
          ? "Last updated " + dateLabel(data.lastUpdated)
          : "Season starts 2027 · Ready for day-one logging";
      }
      const note = document.getElementById("progress-note");
      if (note && data.note) note.textContent = data.note;

      allEntries = Array.isArray(data.entries) ? data.entries : [];
      renderStats(computeStats(allEntries));
      renderChart(allEntries);
      renderFilterCounts(allEntries);
      renderFeed(allEntries);
      renderTournaments(allEntries);
    })
    .catch((err) => {
      const note = document.getElementById("progress-note");
      if (note) note.textContent = "The Season Log could not be loaded right now. Please try again.";
      console.error(err);
    });
})();
