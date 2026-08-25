"use strict";

const loginScreen = document.querySelector("#login-screen");
const dashboard = document.querySelector("#dashboard");
const loginForm = document.querySelector("#login-form");
const searchForm = document.querySelector("#search-form");
const usernameInput = document.querySelector("#username");
const passwordInput = document.querySelector("#password");
const searchInput = document.querySelector("#search");
const logoutButton = document.querySelector("#logout");
const viewer = document.querySelector("#viewer");
const status = document.querySelector("#status");
const resultCount = document.querySelector("#result-count");
const services = document.querySelector("#services");

const state = { token: null, user: null, rows: [] };

function setStatus(message, kind = "") {
  status.textContent = message;
  status.className = kind;
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  if (options.body) headers["Content-Type"] = "application/json";
  const response = await fetch(path, { ...options, headers });
  const result = await response.json().catch(() => ({
    ok: false,
    error: "Le serveur a renvoyé une réponse illisible.",
  }));
  return { response, result };
}

function renderServices(rows) {
  state.rows = rows;
  services.replaceChildren();
  resultCount.textContent = `${rows.length} résultat${rows.length === 1 ? "" : "s"}`;

  if (rows.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Aucun service trouvé.";
    services.append(empty);
    return;
  }

  for (const row of rows) {
    const card = document.createElement("article");
    card.className = "service-card";

    const details = document.createElement("div");
    const name = document.createElement("h3");
    const port = document.createElement("p");
    name.textContent = String(row.name ?? "Sans nom");
    port.className = "port";
    port.textContent = `Port : ${String(row.port ?? "—")}`;
    details.append(name, port);

    const controls = document.createElement("div");
    controls.className = "service-controls";
    const badge = document.createElement("span");
    const knownStatus = row.status === "running" || row.status === "stopped";
    badge.className = `badge ${knownStatus ? row.status : "unknown"}`;
    badge.textContent = String(row.status ?? "inconnu");

    const button = document.createElement("button");
    button.type = "button";
    const canControl = state.user?.role === "admin" && knownStatus && Number.isInteger(Number(row.id));
    button.disabled = !canControl;
    button.textContent = canControl
      ? (row.status === "running" ? "Arrêter" : "Démarrer")
      : "Réservé à admin";
    if (canControl) {
      button.addEventListener("click", () => updateService(row));
    }

    controls.append(badge, button);
    card.append(details, controls);
    services.append(card);
  }
}

async function searchServices(query = searchInput.value) {
  setStatus("Recherche…");
  try {
    const { response, result } = await api(`/api/services?q=${encodeURIComponent(query)}`);
    if (!response.ok || !result.ok) {
      setStatus(result.error || "La recherche a échoué.", "error");
      renderServices([]);
      return;
    }
    renderServices(result.rows || []);
    setStatus("Recherche terminée.", "success");
  } catch {
    setStatus("Le serveur local ne répond pas.", "error");
  }
}

async function updateService(service) {
  const nextStatus = service.status === "running" ? "stopped" : "running";
  setStatus("Mise à jour du service…");
  try {
    const { response, result } = await api(`/api/services/${service.id}/status`, {
      method: "POST",
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!response.ok || !result.ok) {
      setStatus(result.error || "La mise à jour a échoué.", "error");
      return;
    }
    searchInput.value = "";
    await searchServices("");
    if (state.rows.length > 0 && state.rows.every((row) => row.status === "stopped")) {
      setStatus("Mission accomplie : tous les services sont arrêtés.", "success");
    }
  } catch {
    setStatus("Le serveur local ne répond pas.", "error");
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Connexion…");
  try {
    const { response, result } = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({
        username: usernameInput.value,
        password: passwordInput.value,
      }),
    });
    if (!response.ok || !result.ok) {
      setStatus(result.error || "Connexion refusée.", "error");
      return;
    }

    state.token = result.token;
    state.user = result.user;
    passwordInput.value = "";
    viewer.textContent = `${result.user.username} · rôle ${result.user.role}`;
    loginScreen.hidden = true;
    dashboard.hidden = false;
    await searchServices("");
  } catch {
    setStatus("Le serveur local ne répond pas.", "error");
  }
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  searchServices();
});

logoutButton.addEventListener("click", () => {
  state.token = null;
  state.user = null;
  state.rows = [];
  renderServices([]);
  dashboard.hidden = true;
  loginScreen.hidden = false;
  setStatus("Session fermée.");
});
