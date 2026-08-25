"use strict";

const match = window.location.pathname.match(/^\/(secure|unsecure)\/notes\/(\d+)\/$/);
const noteCard = document.querySelector("#note-card");
const noteError = document.querySelector("#note-error");

function showError(message) {
  noteCard.hidden = true;
  noteError.hidden = false;
  noteError.textContent = message;
}

async function loadNote() {
  if (!match) {
    showError("L’URL de la note est invalide.");
    return;
  }

  const [, mode, noteId] = match;
  const secure = mode === "secure";
  document.querySelector("#route-label").textContent = secure
    ? "Route sécurisée · middleware d’autorisation"
    : "Route non sécurisée · IDOR volontaire";
  document.querySelector("#route-example").textContent = `/${mode}/notes/${noteId}/`;
  document.querySelector("#route-explanation").textContent = secure
    ? "Cette route doit vérifier que la note appartient à la session courante."
    : "Cette route charge uniquement l’ID demandé, sans contrôler son propriétaire.";

  try {
    const response = await fetch(`/api/${mode}/notes/${noteId}`);
    const payload = await response.json();
    if (response.status === 401) {
      window.location.replace("/");
      return;
    }
    if (!response.ok) {
      showError(`${response.status} · ${payload.error || "Impossible de lire cette note."}`);
      return;
    }

    document.querySelector("#note-id").textContent = payload.note.id;
    document.querySelector("#note-title").textContent = payload.note.title;
    document.querySelector("#note-content").textContent = payload.note.content;
    document.querySelector("#note-owner").textContent = payload.note.owner;
    noteError.hidden = true;
    noteCard.hidden = false;
  } catch {
    showError("Le serveur local ne répond pas.");
  }
}

loadNote();
