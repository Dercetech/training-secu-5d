"use strict";

const loginView = document.querySelector("#login-view");
const dashboardView = document.querySelector("#dashboard-view");
const loginHint = document.querySelector("#login-hint");
const labHint = document.querySelector("#lab-hint");
const loginForm = document.querySelector("#login-form");
const loginMessage = document.querySelector("#login-message");
const dashboardMessage = document.querySelector("#dashboard-message");
const notesContainer = document.querySelector("#notes");
const routeMode = document.querySelector("#route-mode");

let currentNotes = [];

async function readJson(response) {
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "La requête a échoué.");
  return payload;
}

function showLogin(message = "") {
  loginView.hidden = false;
  dashboardView.hidden = true;
  loginHint.hidden = false;
  labHint.hidden = true;
  loginMessage.textContent = message;
}

function noteLink(note) {
  const link = document.createElement("a");
  link.className = "note-card";
  link.href = `/${routeMode.value}/notes/${note.id}/`;

  const id = document.createElement("span");
  id.className = "note-id";
  id.textContent = `Document ${note.id}`;

  const title = document.createElement("strong");
  title.textContent = note.title;

  const action = document.createElement("span");
  action.className = "note-action";
  action.textContent = "Lire la note →";

  link.append(id, title, action);
  return link;
}

function renderNotes() {
  notesContainer.replaceChildren(...currentNotes.map(noteLink));
}

async function showDashboard(user) {
  loginView.hidden = true;
  dashboardView.hidden = false;
  loginHint.hidden = true;
  labHint.hidden = false;
  document.querySelector("#display-name").textContent = user.name;
  dashboardMessage.textContent = "Chargement de vos notes…";

  try {
    const payload = await readJson(await fetch("/api/notes"));
    currentNotes = payload.notes;
    renderNotes();
    dashboardMessage.textContent = `${currentNotes.length} notes trouvées pour ${user.username}.`;
  } catch (error) {
    dashboardMessage.textContent = error.message;
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "Connexion…";
  const form = new FormData(loginForm);

  try {
    const payload = await readJson(await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        password: form.get("password"),
      }),
    }));
    history.replaceState({}, "", "/dashboard/");
    await showDashboard(payload.user);
  } catch (error) {
    loginMessage.textContent = error.message;
  }
});

routeMode.addEventListener("change", renderNotes);

document.querySelector("#logout").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  history.replaceState({}, "", "/");
  loginForm.reset();
  showLogin("Vous êtes déconnecté.");
});

async function restoreSession() {
  try {
    const payload = await readJson(await fetch("/api/session"));
    history.replaceState({}, "", "/dashboard/");
    await showDashboard(payload.user);
  } catch {
    showLogin();
  }
}

restoreSession();
