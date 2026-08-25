"use strict";

const loginView = document.querySelector("#login-view");
const dashboardView = document.querySelector("#dashboard-view");
const loginHint = document.querySelector("#login-hint");
const auditHint = document.querySelector("#audit-hint");
const loginForm = document.querySelector("#login-form");
const loginMessage = document.querySelector("#login-message");
const dashboardMessage = document.querySelector("#dashboard-message");
const notesContainer = document.querySelector("#notes");
const storageKey = "audit_lab_jwt";

async function readJson(response) {
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "La requête a échoué.");
  return payload;
}

function authenticatedFetch(url, options = {}) {
  const token = localStorage.getItem(storageKey);
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...options, headers });
}

function showLogin(message = "") {
  loginView.hidden = false;
  dashboardView.hidden = true;
  loginHint.hidden = false;
  auditHint.hidden = true;
  loginMessage.textContent = message;
}

function renderMode(mode) {
  const unsafe = mode === "unsafe";
  const banner = document.querySelector("#mode-banner");
  banner.className = `mode-banner ${unsafe ? "mode-unsafe" : "mode-safe"}`;
  banner.textContent = unsafe
    ? "Journalisation dangereuse active : tous les headers sont copiés dans les traces, Authorization compris."
    : "Journalisation sûre active : les headers sont exclus et user_id provient du claim sub validé.";
  document.querySelector("#log-file").textContent = unsafe
    ? "logs/logs.unsafe.txt"
    : "logs/logs.safe.txt";
}

function renderNotes(notes) {
  notesContainer.replaceChildren(...notes.map((note) => {
    const link = document.createElement("a");
    link.className = "note-card";
    link.href = `/notes/${note.id}/`;

    const id = document.createElement("span");
    id.className = "note-id";
    id.textContent = `Note ${note.id}`;

    const title = document.createElement("strong");
    title.textContent = note.title;

    const action = document.createElement("span");
    action.className = "note-action";
    action.textContent = "Ouvrir et auditer →";

    link.append(id, title, action);
    return link;
  }));
}

async function showDashboard(user, mode) {
  loginView.hidden = true;
  dashboardView.hidden = false;
  loginHint.hidden = true;
  auditHint.hidden = false;
  document.querySelector("#display-name").textContent = user.name;
  renderMode(mode);
  dashboardMessage.textContent = "Chargement des notes…";

  try {
    const payload = await readJson(await authenticatedFetch("/api/dashboard"));
    renderNotes(payload.notes);
    dashboardMessage.textContent = `${payload.notes.length} notes · événement DASHBOARD_ACCESS journalisé.`;
  } catch (error) {
    dashboardMessage.textContent = error.message;
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const mode = event.submitter?.value === "safe" ? "safe" : "unsafe";
  const form = new FormData(loginForm);
  loginMessage.textContent = "Authentification…";

  try {
    const payload = await readJson(await fetch(`/api/login/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        password: form.get("password"),
      }),
    }));
    localStorage.setItem(storageKey, payload.token);
    history.replaceState({}, "", "/dashboard/");
    await showDashboard(payload.user, payload.logging_mode);
  } catch (error) {
    loginMessage.textContent = error.message;
  }
});

document.querySelector("#logout").addEventListener("click", async () => {
  try {
    await authenticatedFetch("/api/logout", { method: "POST" });
  } finally {
    localStorage.removeItem(storageKey);
  }
  history.replaceState({}, "", "/");
  showLogin("Vous êtes déconnecté.");
});

async function restoreSession() {
  if (!localStorage.getItem(storageKey)) {
    showLogin();
    return;
  }
  try {
    const payload = await readJson(await authenticatedFetch("/api/session"));
    history.replaceState({}, "", "/dashboard/");
    await showDashboard(payload.user, payload.logging_mode);
  } catch {
    localStorage.removeItem(storageKey);
    showLogin();
  }
}

restoreSession();
