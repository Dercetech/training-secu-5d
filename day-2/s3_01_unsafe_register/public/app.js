"use strict";

const screens = [...document.querySelectorAll("[data-screen]")];
const screenButtons = [...document.querySelectorAll("[data-show-screen]")];
const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const loginUser = document.querySelector("#login-user");
const loginPwd = document.querySelector("#login-pwd");
const registerUser = document.querySelector("#register-user");
const registerPwd = document.querySelector("#register-pwd");
const refreshDashboard = document.querySelector("#refresh-dashboard");
const status = document.querySelector("#status");
const requestOutput = document.querySelector("#request-output");
const responseOutput = document.querySelector("#response-output");
const tokenOutput = document.querySelector("#token-output");
const dashboardOutput = document.querySelector("#dashboard-output");
const viewer = document.querySelector("#viewer");

let currentToken = "";

function showScreen(name) {
  for (const screen of screens) {
    screen.hidden = screen.dataset.screen !== name;
  }
  for (const button of screenButtons) {
    button.classList.toggle("active", button.dataset.showScreen === name);
  }
}

function showTraffic(method, path, payload, response, result) {
  requestOutput.textContent = `${method} ${path}\n${JSON.stringify(payload, null, 2)}`;
  responseOutput.textContent = `${response.status} ${response.statusText}\n${JSON.stringify(result, null, 2)}`;
}

function showStatus(message, type = "") {
  status.textContent = message;
  status.className = type;
}

async function readJson(response) {
  return response.json().catch(() => ({ ok: false, error: "Réponse JSON illisible." }));
}

async function loadDashboard() {
  showScreen("dashboard");
  tokenOutput.textContent = currentToken || "Aucun jeton.";
  if (!currentToken) {
    dashboardOutput.textContent = "Connectez-vous ou inscrivez-vous.";
    viewer.textContent = "Aucune session.";
    return;
  }

  const response = await fetch("/api/dashboard", {
    headers: { Authorization: `Bearer ${currentToken}` },
  });
  const result = await readJson(response);
  showTraffic("GET", "/api/dashboard", { Authorization: `Bearer ${currentToken}` }, response, result);
  dashboardOutput.textContent = JSON.stringify(result, null, 2);
  viewer.textContent = result.viewer
    ? `${result.viewer.user} · rôle ${result.viewer.role}`
    : "Session refusée.";
  showStatus(response.ok ? "Données reçues." : result.error, response.ok ? "success" : "error");
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const loginPayload = { user: loginUser.value, pwd: loginPwd.value };
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(loginPayload),
  });
  const result = await readJson(response);
  showTraffic("POST", "/api/login", loginPayload, response, result);
  if (!response.ok) {
    showStatus(result.error || "Connexion refusée.", "error");
    return;
  }
  currentToken = result.token;
  await loadDashboard();
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const registrationPayload = {
    user: registerUser.value,
    pwd: registerPwd.value,
    // role: "user",
  };

  const response = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(registrationPayload),
  });
  const result = await readJson(response);
  showTraffic("POST", "/api/register", registrationPayload, response, result);
  if (!response.ok) {
    showStatus(result.error || "Inscription refusée.", "error");
    return;
  }
  currentToken = result.token;
  await loadDashboard();
});

for (const button of screenButtons) {
  button.addEventListener("click", () => showScreen(button.dataset.showScreen));
}

refreshDashboard.addEventListener("click", loadDashboard);
showScreen("login");
