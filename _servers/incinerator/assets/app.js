"use strict";

for (const form of document.querySelectorAll("[data-confirm-delete]")) {
  form.addEventListener("submit", (event) => {
    const name = form.dataset.confirmDelete || "cet élément";
    if (!window.confirm(`Supprimer définitivement « ${name} » ?`)) {
      event.preventDefault();
    }
  });
}

for (const button of document.querySelectorAll("[data-copy-url]")) {
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copyUrl || "");
      button.textContent = "Copié !";
      window.setTimeout(() => { button.textContent = "Copier"; }, 1400);
    } catch {
      button.textContent = "Copie impossible";
    }
  });
}
