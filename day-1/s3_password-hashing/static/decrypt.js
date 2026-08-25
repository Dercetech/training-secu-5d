const hashInput = document.querySelector("#hash-input");
const minLengthInput = document.querySelector("#min-length");
const maxLengthInput = document.querySelector("#max-length");
const result = document.querySelector("#result");
const alphanumeric = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const maxAllowedLength = 10;

async function readJson(response) {
  return response.json().catch(() => ({ error: "Réponse serveur illisible." }));
}

function normalizeRange(changedField) {
  let minLength = Number.parseInt(minLengthInput.value, 10);
  let maxLength = Number.parseInt(maxLengthInput.value, 10);

  if (!Number.isInteger(minLength) || !Number.isInteger(maxLength)) return null;

  minLength = Math.min(Math.max(minLength, 1), maxAllowedLength);
  maxLength = Math.min(Math.max(maxLength, 1), maxAllowedLength);

  if (changedField === "min" && minLength > maxLength) {
    minLength = maxLength;
  }
  if (changedField === "max" && maxLength < minLength) {
    maxLength = minLength;
  }

  minLengthInput.value = String(minLength);
  maxLengthInput.value = String(maxLength);
  return { minLength, maxLength };
}

function randomPassword(minLength, maxLength) {
  const randomValues = new Uint32Array(maxLength + 1);
  crypto.getRandomValues(randomValues);
  const length =
    (randomValues[0] % (maxLength - minLength + 1)) + minLength;
  let password = "";

  for (let index = 0; index < length; index += 1) {
    password += alphanumeric[randomValues[index + 1] % alphanumeric.length];
  }
  return password;
}

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function createChallenge(changedField) {
  const range = normalizeRange(changedField);
  if (range === null) return;

  result.textContent = "Création locale du hash…";
  const password = randomPassword(range.minLength, range.maxLength);
  hashInput.value = await sha256(password);
  console.log(
    `[LABO] Texte passé à SHA-256 : ${password} (plage ${range.minLength}-${range.maxLength})`,
  );
  result.textContent = "Nouveau hash prêt · aucun appel API n'a été effectué.";
}

async function createPresetChallenge(password, label) {
  minLengthInput.value = String(password.length);
  maxLengthInput.value = String(password.length);
  result.textContent = `Création locale du preset ${label}…`;
  hashInput.value = await sha256(password);
  console.log(
    `[LABO] Texte passé à SHA-256 : ${password} (preset ${label})`,
  );
  result.textContent = `${label} prêt : ${password} · aucun appel API n'a été effectué.`;
}

function recomputeForRange(changedField) {
  createChallenge(changedField).catch((error) => {
    result.textContent = error.message;
  });
}

minLengthInput.addEventListener("input", () => recomputeForRange("min"));
maxLengthInput.addEventListener("input", () => recomputeForRange("max"));

document.querySelector("#challenge-button").addEventListener("click", () => {
  createChallenge().catch((error) => {
    result.textContent = error.message;
  });
});

document.querySelector("#shortest-button").addEventListener("click", () => {
  createPresetChallenge("aaaa", "Shortest").catch((error) => {
    result.textContent = error.message;
  });
});

document.querySelector("#longest-button").addEventListener("click", () => {
  createPresetChallenge("9999", "Longest").catch((error) => {
    result.textContent = error.message;
  });
});

document.querySelector("#decrypt-button").addEventListener("click", async () => {
  if (
    !minLengthInput.reportValidity() ||
    !maxLengthInput.reportValidity() ||
    !hashInput.reportValidity()
  ) return;

  const range = normalizeRange();
  if (range === null) return;
  result.textContent = "Recherche séquentielle en cours…";

  try {
    const response = await fetch("/api/decrypt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hash: hashInput.value,
        min_length: range.minLength,
        max_length: range.maxLength,
      }),
    });
    const data = await readJson(response);
    const elapsedTime = Number.isFinite(data.elapsed_ms)
      ? `\nTemps de recherche : ${data.elapsed_ms} ms`
      : "";
    const searchedRange = Number.isInteger(data.min_length)
      ? `\nPlage testée : ${data.min_length} à ${data.max_length}`
      : "";
    result.textContent = response.ok
      ? `Mot de passe retrouvé : ${data.password}${elapsedTime}${searchedRange}\nMéthode : ${data.method} (aucun décryptage)`
      : `${data.error || "Mot de passe introuvable."}${elapsedTime}${searchedRange}`;
  } catch {
    result.textContent = "Le serveur ne répond pas.";
  }
});

createChallenge().catch((error) => {
  result.textContent = error.message;
});
