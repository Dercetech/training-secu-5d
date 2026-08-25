"use strict";

const trustedStatus = document.querySelector("#trusted-status");
const trustedButton = document.querySelector("#trusted-button");

if (trustedStatus && trustedButton) {
  trustedStatus.className = "status status-success";
  trustedStatus.textContent = "Exécuté : l’origine Training est explicitement autorisée.";
  trustedButton.disabled = false;

  trustedButton.addEventListener("click", () => {
    trustedButton.textContent = "Composant distant actif !";
  });
}
