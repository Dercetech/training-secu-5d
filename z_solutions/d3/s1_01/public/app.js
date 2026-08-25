"use strict";

async function readJson(response) {
  return response.json().catch(() => ({ ok: false, error: "Réponse illisible." }));
}

async function sessionUser() {
  const response = await fetch("/api/session");
  const payload = await readJson(response);
  return response.ok ? payload.user : null;
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
      const payload = await readJson(response);
      if (!response.ok) {
        status.textContent = payload.error || "Connexion refusée.";
        return;
      }
      location.assign("/dashboard");
    } catch {
      status.textContent = "Serveur inaccessible.";
    }
  });
}

async function initialiseDashboard() {
  const user = await sessionUser().catch(() => null);
  if (!user) {
    location.replace("/login");
    return;
  }
  document.querySelector("#current-name").textContent = user.name;
  document.querySelector("#current-role").textContent = user.role;
  document.querySelector("#logout").addEventListener("click", signOut);
}

function renderUsers(users) {
  const cards = users.map((user) => {
    const card = document.createElement("article");
    const title = document.createElement("h3");
    const details = document.createElement("p");
    title.textContent = user.name;
    details.textContent = `${user.username} · ${user.role}`;
    card.append(title, details);
    return card;
  });
  document.querySelector("#users").replaceChildren(...cards);
}

async function initialiseUsers() {
  const warning = document.querySelector("#admin-warning");
  const usersArea = document.querySelector("#users-area");
  const user = await sessionUser().catch(() => null);
  if (!user || user.role !== "admin") {
    warning.classList.remove("hidden");
    return;
  }
  const response = await fetch("/api/users");
  const payload = await readJson(response);
  if (!response.ok) {
    warning.querySelector("p").textContent = payload.error || "Accès refusé.";
    warning.classList.remove("hidden");
    return;
  }
  renderUsers(payload.users);
  usersArea.classList.remove("hidden");
}

const initialisers = {
  login: initialiseLogin,
  dashboard: initialiseDashboard,
  users: initialiseUsers,
};

initialisers[document.body.dataset.page]?.();
