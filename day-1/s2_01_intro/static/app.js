const loginView = document.querySelector("#login-view");
const dashboardView = document.querySelector("#dashboard-view");
const loginForm = document.querySelector("#login-form");
const loginStatus = document.querySelector("#login-status");
const dashboardStatus = document.querySelector("#dashboard-status");
const displayName = document.querySelector("#display-name");
const meResult = document.querySelector("#me-result");

function showLogin(message = "") {
  loginView.hidden = false;
  dashboardView.hidden = true;
  loginStatus.textContent = message;
  displayName.textContent = "";
  meResult.textContent = "Cliquez sur « Appeler /api/me » pour vérifier le JWT.";
}

function showDashboard(user) {
  displayName.textContent = user.name;
  loginView.hidden = true;
  dashboardView.hidden = false;
  loginStatus.textContent = "";
  dashboardStatus.textContent = "";
  meResult.textContent = "Cliquez sur « Appeler /api/me » pour vérifier le JWT.";
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
      body: JSON.stringify({
        username: form.get("username"),
        password: form.get("password"),
      }),
    });
    const result = await readJson(response);

    if (!response.ok || !result.ok) {
      showLogin(result.error || "Connexion impossible.");
      return;
    }

    loginForm.reset();
    showDashboard(result.user);
  } catch {
    showLogin("Le serveur ne répond pas.");
  }
});

document.querySelector("#me-button").addEventListener("click", async () => {
  dashboardStatus.textContent = "";
  meResult.textContent = "Appel de /api/me…";

  try {
    const response = await fetch("/api/me", { credentials: "same-origin" });
    const result = await readJson(response);

    if (!response.ok || !result.ok) {
      meResult.textContent = `${response.status} ${JSON.stringify(result, null, 2)}`;
      dashboardStatus.textContent = result.error || "Le JWT n’est pas valide.";
      return;
    }

    displayName.textContent = result.user.name;
    meResult.textContent = [
      `Le JWT est valide : ${result.user.name} (${result.user.username}).`,
      "",
      `${response.status} ${JSON.stringify(result, null, 2)}`,
    ].join("\n");
  } catch {
    meResult.textContent = "Le serveur ne répond pas.";
  }
});

document.querySelector("#logout-button").addEventListener("click", async () => {
  dashboardStatus.textContent = "Déconnexion…";
  try {
    const response = await fetch("/api/logout", {
      method: "POST",
      credentials: "same-origin",
    });

    if (!response.ok) throw new Error("logout failed");
    showLogin("Vous êtes déconnecté.");
  } catch {
    dashboardStatus.textContent = "Déconnexion impossible.";
  }
});

async function restoreSession() {
  const response = await fetch("/api/me", { credentials: "same-origin" });
  if (!response.ok) {
    showLogin();
    return;
  }

  const result = await readJson(response);
  if (result.ok) showDashboard(result.user);
}

restoreSession().catch(() => showLogin("Le serveur ne répond pas."));
