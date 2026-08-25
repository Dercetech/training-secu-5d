"use strict";

const localStatus = document.querySelector("#local-status");
const policyValue = document.querySelector("#policy-value");

localStatus.className = "status status-success";
localStatus.textContent = "Exécuté : le fichier local est autorisé par 'self'.";

fetch(window.location.href, { cache: "no-store" })
  .then((response) => {
    policyValue.textContent = response.headers.get("Content-Security-Policy") || "Header absent";
  })
  .catch(() => {
    policyValue.textContent = "Impossible de relire le header. Vérifiez-le dans Network.";
  });
