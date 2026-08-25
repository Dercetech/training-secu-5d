"use strict";

const form = document.querySelector("#search-form");
const searchInput = document.querySelector("#search");
const requestOutput = document.querySelector("#request-output");
const receivedOutput = document.querySelector("#received-output");
const sqlOutput = document.querySelector("#sql-output");
const responseOutput = document.querySelector("#response-output");
const status = document.querySelector("#status");
const timing = document.querySelector("#timing");
const rowCount = document.querySelector("#row-count");
const cards = document.querySelector("#cards");

function renderRows(rows) {
  cards.replaceChildren();
  rowCount.textContent = `${rows.length} ligne${rows.length === 1 ? "" : "s"}`;

  if (rows.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Aucun résultat.";
    cards.append(empty);
    return;
  }

  for (const row of rows) {
    const article = document.createElement("article");
    const name = document.createElement("h3");
    const subject = document.createElement("p");
    const id = document.createElement("p");
    name.textContent = row.name;
    subject.textContent = row.subject;
    id.className = "meta";
    id.textContent = `Identifiant : ${row.id}`;
    article.append(name, subject, id);
    cards.append(article);
  }
}

function resetObservations() {
  requestOutput.textContent = "En attente.";
  receivedOutput.textContent = "En attente.";
  sqlOutput.textContent = "En attente.";
  responseOutput.textContent = "En attente.";
  status.textContent = "";
  status.className = "";
  timing.textContent = "";
  rowCount.textContent = "";
  cards.innerHTML = '<p class="empty">Effectuez une recherche pour voir les résultats.</p>';
}

async function searchTeachers(search) {
  resetObservations();
  status.textContent = "Recherche…";
  const requestPath = `/api/search?name=${encodeURIComponent(search)}`;
  requestOutput.textContent = `GET ${requestPath}`;

  try {
    const response = await fetch(requestPath);
    const result = await response.json().catch(() => ({
      ok: false,
      error: "Le serveur a renvoyé une réponse illisible.",
    }));

    receivedOutput.textContent = JSON.stringify(result.received ?? { name: search }, null, 2);
    const parameters = Array.isArray(result.parameters)
      ? `\n\nParamètres séparés :\n${JSON.stringify(result.parameters, null, 2)}`
      : "";
    sqlOutput.textContent = `${result.sql || "Requête SQL indisponible."}${parameters}`;
    responseOutput.textContent = `${response.status} ${response.statusText}\n${JSON.stringify(result, null, 2)}`;

    if (!response.ok || !result.ok) {
      status.textContent = result.error || "La recherche a échoué.";
      status.className = "error";
      renderRows([]);
      return;
    }

    renderRows(result.rows);
    timing.textContent = `${result.elapsed_ms} ms`;
    const changedStructure = /\bUNION\b/i.test(search) && !result.parameters;
    status.textContent = changedStructure
      ? "La saisie a fait lire une source qui n’était pas prévue."
      : "La requête est terminée.";
    status.className = changedStructure ? "warning" : "success";
  } catch {
    status.textContent = "Le serveur local ne répond pas.";
    status.className = "error";
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  searchTeachers(searchInput.value);
});
