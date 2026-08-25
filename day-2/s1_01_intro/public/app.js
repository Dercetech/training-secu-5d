"use strict";

const form = document.querySelector("#query-form");
const sqlInput = document.querySelector("#sql");
const status = document.querySelector("#status");
const rowCount = document.querySelector("#row-count");
const tableContainer = document.querySelector("#table-container");

function setStatus(message, kind = "") {
  status.textContent = message;
  status.className = kind;
}

function renderTable(columns, rows) {
  tableContainer.replaceChildren();
  rowCount.textContent = `${rows.length} ligne${rows.length === 1 ? "" : "s"}`;

  if (columns.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "La requête ne renvoie aucune colonne.";
    tableContainer.append(empty);
    return;
  }

  const table = document.createElement("table");
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const column of columns) {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.textContent = column;
    headRow.append(cell);
  }
  head.append(headRow);

  const body = document.createElement("tbody");
  for (const row of rows) {
    const bodyRow = document.createElement("tr");
    for (const column of columns) {
      const cell = document.createElement("td");
      const value = row[column];
      cell.textContent = value === null ? "NULL" : String(value);
      if (value === null) cell.className = "null";
      bodyRow.append(cell);
    }
    body.append(bodyRow);
  }

  table.append(head, body);
  tableContainer.append(table);
}

async function executeQuery(sql) {
  setStatus("Exécution…");
  rowCount.textContent = "";

  try {
    const response = await fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sql }),
    });
    const result = await response.json().catch(() => ({
      ok: false,
      error: "Le serveur a renvoyé une réponse illisible.",
    }));

    if (!response.ok || !result.ok) {
      setStatus(result.error || "La requête a échoué.", "error");
      tableContainer.innerHTML = '<p class="empty">Corrigez la requête puis réessayez.</p>';
      return;
    }

    renderTable(result.columns, result.rows);
    setStatus(`Terminé en ${result.elapsed_ms} ms.`, "success");
  } catch {
    setStatus("Le serveur local ne répond pas.", "error");
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  executeQuery(sqlInput.value);
});

document.querySelectorAll("[data-query]").forEach((button) => {
  button.addEventListener("click", () => {
    sqlInput.value = button.dataset.query;
    sqlInput.focus();
  });
});
