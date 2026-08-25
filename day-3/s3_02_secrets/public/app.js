"use strict";

const result = document.querySelector("#result");

for (const button of document.querySelectorAll("[data-mode]")) {
  button.addEventListener("click", async () => {
    result.textContent = "Requête en cours…";
    try {
      const response = await fetch(`/api/${button.dataset.mode}/config`);
      const payload = await response.json();
      result.textContent = JSON.stringify({ status: response.status, ...payload }, null, 2);
    } catch {
      result.textContent = "Le serveur local ne répond pas.";
    }
  });
}
