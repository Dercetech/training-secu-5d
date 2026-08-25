"use strict";

const match = window.location.pathname.match(/^\/notes\/(\d+)\/$/);
const noteCard = document.querySelector("#note-card");
const noteError = document.querySelector("#note-error");
const storageKey = "audit_lab_jwt";

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

  try {
    const token = localStorage.getItem(storageKey);
    const response = await fetch(`/api/notes/${match[1]}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
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
    const unsafe = payload.logging_mode === "unsafe";
    document.querySelector("#log-file").textContent = unsafe
      ? "logs/logs.unsafe.txt"
      : "logs/logs.safe.txt";
    document.querySelector("#mode-explanation").textContent = unsafe
      ? "Le logger dangereux vient de sérialiser tous les headers ; Authorization et le JWT se trouvent au milieu."
      : "Le logger sûr a décodé le JWT validé et écrit uniquement user_id depuis le claim sub.";
    noteError.hidden = true;
    noteCard.hidden = false;
  } catch {
    showError("Le serveur local ne répond pas.");
  }
}

loadNote();
