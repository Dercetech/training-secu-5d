"use strict";

const card = document.querySelector("#protocol-card");
const protocolValue = document.querySelector("#protocol-value");
const protocolMessage = document.querySelector("#protocol-message");
const finalUrl = document.querySelector("#final-url");
const isHttps = window.location.protocol === "https:";
const finalUrlCode = document.createElement("code");

protocolValue.textContent = window.location.protocol;
finalUrlCode.textContent = window.location.href;
finalUrl.replaceChildren(finalUrlCode);

if (isHttps) {
  card.classList.add("protocol-success");
  protocolMessage.textContent = "Réussi : le navigateur a chargé la destination via une connexion HTTPS.";
} else {
  card.classList.add("protocol-warning");
  protocolMessage.textContent = "HSTS n’était pas encore mémorisé. Revenez sur la page de départ en HTTPS, rechargez-la, puis retentez le lien.";
}
