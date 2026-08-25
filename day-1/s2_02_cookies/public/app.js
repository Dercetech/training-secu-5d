const loginView = document.querySelector("#login-view");
const dashboardView = document.querySelector("#dashboard-view");
const loginForm = document.querySelector("#login-form");
const loginStatus = document.querySelector("#login-status");
const displayName = document.querySelector("#display-name");
const result = document.querySelector("#result");

function showLogin(message = "") {
  loginView.hidden = false;
  dashboardView.hidden = true;
  loginStatus.textContent = message;
  displayName.textContent = "";
}

function showDashboard(user) {
  displayName.textContent = user.name;
  loginView.hidden = true;
  dashboardView.hidden = false;
  loginStatus.textContent = "";
  result.textContent = "Connexion réussie. Ouvrez DevTools → Network et Application/Storage.";
}

async function readJson(response) {
  return response.json().catch(() => ({ ok: false, error: "Réponse serveur illisible." }));
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginStatus.textContent = "Connexion…";
  try {
    const form = new FormData(loginForm);
    const response = await fetch("/api/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
    });
    const data = await readJson(response);
    if (!response.ok || !data.ok) {
      showLogin(data.error || "Connexion impossible.");
      return;
    }
    loginForm.reset();
    showDashboard(data.user);
  } catch {
    showLogin("Le serveur ne répond pas.");
  }
});

document.querySelector("#read-cookie-button").addEventListener("click", () => {
  result.textContent = document.cookie || "(aucun cookie visible depuis JavaScript)";
});

document.querySelector("#me-button").addEventListener("click", async () => {
  const response = await fetch("/api/me", { credentials: "same-origin" });
  const data = await readJson(response);
  result.textContent = `${response.status} ${JSON.stringify(data, null, 2)}`;
});

document.querySelector("#logout-button").addEventListener("click", async () => {
  try {
    const response = await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
    if (!response.ok) throw new Error("logout failed");
    showLogin("Vous êtes déconnecté.");
  } catch {
    result.textContent = "Déconnexion impossible.";
  }
});

async function restoreSession() {
  const response = await fetch("/api/me", { credentials: "same-origin" });
  if (!response.ok) {
    showLogin();
    return;
  }
  const data = await readJson(response);
  if (data.ok) showDashboard(data.user);
}

restoreSession().catch(() => showLogin("Le serveur ne répond pas."));
