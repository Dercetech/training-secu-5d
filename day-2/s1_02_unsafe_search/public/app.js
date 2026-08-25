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

function renderUsers(rows) {
  cards.replaceChildren();
  rowCount.textContent = `${rows.length} utilisateur${rows.length === 1 ? "" : "s"}`;

  if (rows.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Aucun utilisateur trouvé.";
    cards.append(empty);
    return;
  }

  for (const user of rows) {
    const article = document.createElement("article");
    const email = document.createElement("h3");
    const id = document.createElement("p");
    email.textContent = user.email;
    id.className = "meta";
    id.textContent = `Identifiant : ${user.id}`;
    article.append(email, id);
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
  cards.innerHTML = '<p class="empty">Effectuez l’étape pour voir les utilisateurs.</p>';
}

async function searchUsers(email) {
  resetObservations();
  status.textContent = "Recherche…";
  const requestPath = `/api/search?email=${encodeURIComponent(email)}`;
  requestOutput.textContent = `GET ${requestPath}`;

  try {
    const response = await fetch(requestPath);
    const result = await response.json().catch(() => ({
      ok: false,
      error: "Le serveur a renvoyé une réponse illisible.",
    }));

    receivedOutput.textContent = JSON.stringify(result.received ?? { email }, null, 2);
    sqlOutput.textContent = result.sql || "Requête SQL indisponible.";
    responseOutput.textContent = `${response.status} ${response.statusText}\n${JSON.stringify(result, null, 2)}`;

    if (!response.ok || !result.ok) {
      status.textContent = result.error || "La recherche a échoué.";
      status.className = "error";
      renderUsers([]);
      return;
    }

    renderUsers(result.rows);
    timing.textContent = `${result.elapsed_ms} ms`;
    const changedMeaning = email.includes("' OR");
    status.textContent = changedMeaning
      ? "La saisie a modifié le sens de la requête SQL."
      : "La requête est terminée.";
    status.className = changedMeaning ? "warning" : "success";
  } catch {
    status.textContent = "Le serveur local ne répond pas.";
    status.className = "error";
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  searchUsers(searchInput.value);
});
