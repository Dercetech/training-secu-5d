"use strict";

const waitingPanel = document.querySelector("#waiting");
const capturePanel = document.querySelector("#capture");
const capturedPassword = document.querySelector("#captured-password");
const capturedAt = document.querySelector("#captured-at");

async function refreshCapture() {
  try {
    const response = await fetch("/api/latest", { cache: "no-store" });
    const data = await response.json();
    if (!data.capture) {
      return;
    }

    capturedPassword.textContent = data.capture.password;
    capturedAt.textContent = `Reçu à ${new Date(data.capture.capturedAt).toLocaleTimeString("fr-FR")}`;
    waitingPanel.hidden = true;
    capturePanel.hidden = false;
  } catch {
    // Le prochain passage réessaiera automatiquement.
  }
}

refreshCapture();
setInterval(refreshCapture, 1000);
