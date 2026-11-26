(function () {
  const money = (n) =>
    Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });

  const dateLabel = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const tbody = (id) => document.querySelector(`#${id} tbody`);
  const tfoot = (id) => document.querySelector(`#${id} tfoot td.num`);

  function rowsOrEmpty(tbodyEl, rows, htmlFor) {
    if (!rows.length) {
      tbodyEl.innerHTML = `<tr><td class="ledger-empty" colspan="3">No entries yet.</td></tr>`;
      return;
    }
    tbodyEl.innerHTML = rows.map(htmlFor).join("");
  }

  fetch("ledger.json?v=4")
    .then((r) => {
      if (!r.ok) throw new Error("Could not load ledger");
      return r.json();
    })
    .then((data) => {
      const updated = document.getElementById("ledger-updated");
      if (updated && data.lastUpdated) {
        updated.textContent = "Last updated " + dateLabel(data.lastUpdated);
      }
      const note = document.getElementById("ledger-note");
      if (note && data.note) note.textContent = data.note;

      const incoming = data.moneyIn || [];
      const outgoing = data.moneyOut || [];
      rowsOrEmpty(tbody("money-in"), incoming, (row) => {
        const kind =
          row.type && row.type.toLowerCase() === "in-kind"
            ? '<span class="tag-inkind">In-kind</span>'
            : "";
        const source = row.source || "Anonymous";
        return `<tr>
          <td>${dateLabel(row.date)}</td>
          <td>${source}${kind}</td>
          <td class="num">${money(row.amount)}</td>
        </tr>`;
      });
      rowsOrEmpty(tbody("money-out"), outgoing, (row) => {
        return `<tr>
          <td>${dateLabel(row.date)}</td>
          <td>${row.item || ""}</td>
          <td class="num">${money(row.amount)}</td>
        </tr>`;
      });
      const inTotal = incoming.reduce((s, r) => s + Number(r.amount || 0), 0);
      const outTotal = outgoing.reduce((s, r) => s + Number(r.amount || 0), 0);
      tfoot("money-in").textContent = money(inTotal);
      tfoot("money-out").textContent = money(outTotal);
    })
    .catch((err) => {
      const note = document.getElementById("ledger-note");
      if (note) note.textContent = "The ledger could not be loaded. Please try again.";
      console.error(err);
    });
})();
