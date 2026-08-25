"use strict";

const startButton = document.querySelector("#start-camera");
const stopButton = document.querySelector("#stop-camera");
const preview = document.querySelector("#camera-preview");
const placeholder = document.querySelector("#camera-placeholder");
const message = document.querySelector("#camera-message");
const policyState = document.querySelector("#policy-state");
const policyApi = document.permissionsPolicy || document.featurePolicy;
const cameraAllowed = policyApi?.allowsFeature("camera") ?? null;
let cameraStream = null;

function reportPolicy() {
  window.parent.postMessage(
    { type: "camera-ad-policy", cameraAllowed },
    "*",
  );

  if (cameraAllowed === true) {
    policyState.className = "policy-state policy-warning";
    policyState.textContent = "La page parent autorise cette iframe à demander la caméra.";
    return;
  }

  if (cameraAllowed === false) {
    policyState.className = "policy-state policy-blocked";
    policyState.textContent = "Bloqué par Permissions-Policy : cette iframe ne peut pas demander la caméra.";
    return;
  }

  policyState.textContent = "Policy non détectable avant l’essai dans ce navigateur.";
}

function stopCamera() {
  if (cameraStream) {
    for (const track of cameraStream.getTracks()) track.stop();
  }
  cameraStream = null;
  preview.srcObject = null;
  preview.hidden = true;
  placeholder.hidden = false;
  stopButton.hidden = true;
  startButton.hidden = false;
  message.textContent = "Caméra arrêtée. Aucun flux n’est conservé.";
}

startButton.addEventListener("click", async () => {
  if (cameraAllowed === false) {
    message.textContent = "Demande refusée avant le prompt : la policy du parent interdit camera.";
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    message.textContent = "getUserMedia n’est pas disponible dans ce navigateur ou ce contexte.";
    return;
  }

  message.textContent = "Le navigateur attend votre décision…";
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    preview.srcObject = cameraStream;
    preview.hidden = false;
    placeholder.hidden = true;
    startButton.hidden = true;
    stopButton.hidden = false;
    message.textContent = "Caméra active localement dans l’iframe. Rien n’est envoyé au serveur.";
  } catch (error) {
    const blockedByPolicy = error?.name === "NotAllowedError" && cameraAllowed === false;
    message.textContent = blockedByPolicy
      ? "Bloqué par Permissions-Policy."
      : "Accès refusé ou indisponible. Votre choix de refuser reste valable.";
  }
});

stopButton.addEventListener("click", stopCamera);
window.addEventListener("pagehide", stopCamera);
reportPolicy();
