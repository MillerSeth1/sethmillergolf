(function () {
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

  const hoursLabel = (n) => {
    if (!n) return "0 hrs";
    const rounded = Math.round(n * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded} hrs` : `${rounded.toFixed(1)} hrs`;
  };

  const toPar = (score, par) => {
    if (par === null) return "";
    const d = score - par;
    return d === 0 ? "E" : d > 0 ? `+${d}` : `${d}`;
  };

  const resultText = (e) => {
    const score = numOrNull(e.score);
    const par = numOrNull(e.par);
    if (score !== null) {
      const rel = toPar(score, par);
      return rel ? `${score} (${rel})` : String(score);
    }
    const notes = String(e.notes || "");
    const team = notes.match(/team\s*([+-]?\d+|e)\b/i);
    if (team) {
      const n = team[1];
      const label = n.toUpperCase() === "E" ? "E" : n.startsWith("+") || n.startsWith("-") ? n : `-${n}`.replace("--", "-");
      // keep the signed value from the note as-is when it already has a sign
      const shown = /^[+-]/.test(n) || n.toUpperCase() === "E" ? (n.toUpperCase() === "E" ? "E" : n) : n;
      return `Team ${shown}`;
    }
    return "—";
  };

  function computeStats(entries) {
    const lessons = entries.filter((e) => e.type === "lesson").length;
    const practiceHrs = entries.reduce((sum, e) => {
      if (e.type === "practice") {
        const h = numOrNull(e.hours);
        return sum + (h !== null ? h : 0);
      }
      return sum;
    }, 0);
    const roundsCount = entries.filter((e) => e.type === "round").length;
    const scored = entries.filter(
      (e) => (e.type === "round" || e.type === "tournament") && numOrNull(e.score) !== null
    );
    const best = scored.length ? Math.min(...scored.map((e) => Number(e.score))) : null;
    return { lessons, practiceHrs, roundsCount, best };
  }

  function renderStats(stats) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    set("stat-lessons", String(stats.lessons));
    set("stat-hours", hoursLabel(stats.practiceHrs));
    set("stat-rounds", String(stats.roundsCount));
    set("stat-best", stats.best !== null ? String(stats.best) : "—");
  }

  function renderChart(entries) {
    const wrap = document.getElementById("trend-chart");
    if (!wrap) return;
    const legend = document.getElementById("chart-legend");

    const rounds = entries
      .filter(
        (e) =>
          (e.type === "round" || e.type === "tournament") &&
          numOrNull(e.score) !== null
      )
      .slice()
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));

    const diffs = rounds.map((r) => numOrNull(r.differential));
    const hasDiff = diffs.some((d) => d !== null);
    if (legend) legend.hidden = !hasDiff;

    if (!rounds.length) {
      wrap.innerHTML = `
        <div class="chart-empty">
          <p class="chart-empty-copy">Scores will appear here after the next posted round.</p>
        </div>
      `;
      return;
    }

    const W = 840;
    const H = 176;
    const pad = { top: 22, right: 40, bottom: 32, left: 40 };
    const iw = W - pad.left - pad.right;
    const ih = H - pad.top - pad.bottom;

    const scores = rounds.map((r) => Number(r.score));
    const minS = Math.floor((Math.min(...scores) - 3) / 2) * 2;
    const maxS = Math.ceil((Math.max(...scores) + 3) / 2) * 2;
    const spanS = Math.max(4, maxS - minS);

    const xFor = (i) =>
      rounds.length === 1
        ? pad.left + iw / 2
        : pad.left + (i / (rounds.length - 1)) * iw;
    const yScore = (v) => pad.top + ((maxS - v) / spanS) * ih;

    const gridLines = [0, 0.5, 1].map((t) => {
      const y = pad.top + t * ih;
      const val = Math.round(maxS - t * spanS);
      return `
        <line x1="${pad.left}" y1="${y.toFixed(1)}" x2="${W - pad.right}" y2="${y.toFixed(1)}" stroke="rgba(246,237,224,0.12)" stroke-dasharray="${t === 1 ? "none" : "4 4"}"/>
        <text x="${pad.left - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" fill="rgba(246,237,224,0.58)" font-size="11" font-family="Inter, sans-serif">${val}</text>
      `;
    });

    const scorePts = rounds
      .map((r, i) => `${xFor(i).toFixed(1)},${yScore(Number(r.score)).toFixed(1)}`)
      .join(" ");

    const stepLabel = rounds.length > 6 ? Math.ceil(rounds.length / 6) : 1;
    const xLabels = rounds.map((r, i) => {
      if (i % stepLabel !== 0 && i !== rounds.length - 1) return "";
      return `<text x="${xFor(i).toFixed(1)}" y="${H - 10}" text-anchor="middle" fill="rgba(246,237,224,0.62)" font-size="11" font-family="Inter, sans-serif">${esc(shortDate(r.date))}</text>`;
    });

    const scoreDots = rounds.map((r, i) => {
      const cx = xFor(i).toFixed(1);
      const cy = yScore(Number(r.score)).toFixed(1);
      const isT = r.type === "tournament";
      return `
        <circle cx="${cx}" cy="${cy}" r="${isT ? 5 : 4.5}" fill="${isT ? "#F6EDE0" : "#D4894A"}" stroke="#1F1410" stroke-width="2">
          <title>${esc(dateLabel(r.date))} · ${esc(r.course || "")} · ${esc(r.score)}</title>
        </circle>
        <text x="${cx}" y="${(Number(cy) - 10).toFixed(1)}" text-anchor="middle" fill="#F6EDE0" font-size="11" font-weight="600" font-family="Inter, sans-serif">${esc(r.score)}</text>
      `;
    });

    wrap.innerHTML = `
      <svg class="trend-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Scores over ${rounds.length} rounds">
        ${gridLines.join("")}
        ${xLabels.join("")}
        ${rounds.length > 1 ? `<polyline points="${scorePts}" fill="none" stroke="#D4894A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
        ${scoreDots.join("")}
      </svg>
    `;
  }

  function renderRoundsEvents(entries) {
    const wrap = document.getElementById("rounds-events");
    if (!wrap) return;

    const list = entries
      .filter((e) => e.type === "round" || e.type === "tournament")
      .slice()
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    if (!list.length) {
      wrap.innerHTML = `<p class="log-quiet">No rounds or events posted yet.</p>`;
      return;
    }

    const rows = list
      .map((e) => {
        const kind = e.type === "tournament" ? "Event" : "Round";
        return `
          <tr>
            <td class="re-date"><time datetime="${esc(e.date)}">${esc(dateLabel(e.date))}</time></td>
            <td class="re-course">
              <span class="log-type log-type-${esc(e.type)}">${esc(kind)}</span>
              ${esc(e.course || "—")}
            </td>
            <td class="re-result">${esc(resultText(e))}</td>
          </tr>
        `;
      })
      .join("");

    wrap.innerHTML = `
      <table class="rounds-table">
        <caption class="visually-hidden">Rounds and events</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Course</th>
            <th scope="col">Score / Result</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  fetch("progress.json?v=10")
    .then((r) => {
      if (!r.ok) throw new Error("Could not load Season Log");
      return r.json();
    })
    .then((data) => {
      const updated = document.getElementById("progress-updated");
      if (updated) {
        updated.textContent = data.lastUpdated
          ? "Last updated " + dateLabel(data.lastUpdated)
          : "Season prep · October 2026";
      }

      const entries = Array.isArray(data.entries) ? data.entries : [];
      renderStats(computeStats(entries));
      renderChart(entries);
      renderRoundsEvents(entries);
    })
    .catch((err) => {
      const updated = document.getElementById("progress-updated");
      if (updated) updated.textContent = "The Season Log could not be loaded right now.";
      console.error(err);
    });
})();
