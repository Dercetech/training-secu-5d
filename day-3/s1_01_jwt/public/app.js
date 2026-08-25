"use strict";

const authCookie = "secu5d_auth";

function cookieToken() {
  const prefix = `${authCookie}=`;
  const entry = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : "";
}

function decodeToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) throw new Error("Le JWT doit contenir trois parties.");
  const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = payload + "=".repeat((4 - payload.length % 4) % 4);
  const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function fetchUsers() {
  const response = await fetch("/api/users");
  const payload = await response.json().catch(() => ({ ok: false, error: "Réponse illisible." }));
  return { response, payload };
}

async function signOut() {
  try {
    await fetch("/api/logout", { method: "POST" });
  } finally {
    location.assign("/login");
  }
}

function initialiseLogin() {
  const form = document.querySelector("#login-form");
  const status = document.querySelector("#status");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "Connexion…";
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const payload = await response.json();
      if (!response.ok) {
        status.textContent = payload.error || "Connexion refusée.";
        return;
      }
      location.assign("/dashboard");
    } catch {
      status.textContent = "Serveur inaccessible. Vérifiez qu’il est démarré.";
    }
  });
}

function readClaims() {
  try {
    return decodeToken(cookieToken());
  } catch {
    return null;
  }
}

function initialiseDashboard() {
  const claims = readClaims();
  if (!claims) {
    location.replace("/login");
    return;
  }
  document.querySelector("#current-name").textContent = claims.name || claims.sub || "utilisateur";
  document.querySelector("#current-role").textContent = claims.role || "inconnu";
  document.querySelector("#logout").addEventListener("click", signOut);
}

function renderUsers(users) {
  const container = document.querySelector("#users");
  container.replaceChildren(...users.map((user) => {
    const card = document.createElement("article");
    const title = document.createElement("h3");
    const details = document.createElement("p");
    title.textContent = user.name;
    details.textContent = `${user.username} · ${user.role}`;
    card.append(title, details);
    return card;
  }));
}

async function initialiseUsers() {
  const warning = document.querySelector("#admin-warning");
  const usersArea = document.querySelector("#users-area");
  const claims = readClaims();

  if (!claims || claims.role !== "admin") {
    warning.classList.remove("hidden");
    return;
  }

  try {
    const { response, payload } = await fetchUsers();
    if (!response.ok) {
      warning.querySelector("p").textContent = payload.error || "L’API a refusé la requête.";
      warning.classList.remove("hidden");
      return;
    }
    renderUsers(payload.users);
    usersArea.classList.remove("hidden");
  } catch {
    warning.querySelector("p").textContent = "Serveur inaccessible. Vérifiez qu’il est démarré.";
    warning.classList.remove("hidden");
  }
}

const initialisers = {
  login: initialiseLogin,
  dashboard: initialiseDashboard,
  users: initialiseUsers,
};

initialisers[document.body.dataset.page]?.();
