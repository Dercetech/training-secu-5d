"use strict";

const form = document.querySelector("#brief-form");
const jsonInput = document.querySelector("#json-input");
const requestOutput = document.querySelector("#request-output");
const responseOutput = document.querySelector("#response-output");
const status = document.querySelector("#status");

const examplePayload = {
  title: "Atelier JSON du Jour 2",
  owner: {
    name: "Alice Martin",
    email: "alice@ecole.test",
  },
  participants: [
    {
      name: "Lina",
      skills: ["html", "javascript"],
      mentor: null,
    },
    {
      name: "Noah",
      skills: ["python"],
      mentor: "Alice Martin",
    },
  ],
  tags: ["json", "validation"],
  delivery: {
    format: "onsite",
    starts_at: "2026-09-15T09:00:00+02:00",
    room: "B-204",
  },
  notes: null,
};

jsonInput.value = JSON.stringify(examplePayload, null, 2);

function showStatus(message, type = "") {
  status.textContent = message;
  status.className = type;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  let payload;
  try {
    payload = JSON.parse(jsonInput.value);
  } catch (error) {
    showStatus(`Le navigateur ne peut pas parser ce JSON : ${error.message}`, "error");
    return;
  }

  requestOutput.textContent = `POST /api/briefs\n${JSON.stringify(payload, null, 2)}`;
  showStatus("Envoi…");

  try {
    const response = await fetch("/api/briefs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({
      ok: false,
      error: "Réponse JSON illisible.",
    }));
    responseOutput.textContent = `${response.status} ${response.statusText}\n${JSON.stringify(result, null, 2)}`;

    if (response.status === 400) {
      showStatus("Message invalide reçu par le serveur.", "error");
      return;
    }
    if (!response.ok) {
      showStatus(result.error || "Le serveur a refusé le brief.", "error");
      return;
    }
    showStatus("Le serveur a enregistré le brief. Est-ce qu’il aurait dû tout accepter ?", "warning");
  } catch {
    showStatus("Le serveur local ne répond pas.", "error");
  }
});
