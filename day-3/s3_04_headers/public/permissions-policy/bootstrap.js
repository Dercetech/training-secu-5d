"use strict";

const policyValue = document.querySelector("#policy-value");
const parentStatus = document.querySelector("#parent-status");
const trustedAdOrigin = "https://training.dercetech.com";

fetch(window.location.href, { cache: "no-store" })
  .then((response) => {
    policyValue.textContent = response.headers.get("Permissions-Policy") || "Header absent";
  })
  .catch(() => {
    policyValue.textContent = "Impossible de relire le header. Vérifiez-le dans Network.";
  });

window.addEventListener("message", (event) => {
  if (event.origin !== trustedAdOrigin || event.data?.type !== "camera-ad-policy") return;

  if (event.data.cameraAllowed === true) {
    parentStatus.className = "status status-warning";
    parentStatus.textContent = "La policy permet à l’iframe de demander la caméra. C’est l’état initial à corriger.";
    return;
  }

  if (event.data.cameraAllowed === false) {
    parentStatus.className = "status status-success";
    parentStatus.textContent = "La policy du parent bloque la caméra avant toute demande de permission.";
    return;
  }

  parentStatus.textContent = "Ce navigateur ne permet pas d’interroger la policy avant l’essai. Vérifiez le response header.";
});
