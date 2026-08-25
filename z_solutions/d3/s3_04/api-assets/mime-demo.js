"use strict";

const scriptStatus = document.querySelector("#script-status");
const actionButton = document.querySelector("#action-button");
const preview = document.querySelector("#interactive-preview");

scriptStatus.className = "status status-success";
scriptStatus.textContent = "JavaScript interprété : le type MIME autorise maintenant son exécution.";
actionButton.disabled = false;

actionButton.addEventListener("click", () => {
  const active = preview.classList.toggle("preview-active");
  actionButton.textContent = active ? "Interaction réussie !" : "Tester le JavaScript";
});
