const loginForm = document.querySelector("#login-form");
const result = document.querySelector("#result");

async function readJson(response) {
  return response.json().catch(() => ({ ok: false, error: "Réponse serveur illisible." }));
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  result.textContent = "Connexion…";

  try {
    const form = new FormData(loginForm);
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        password: form.get("password"),
      }),
    });
    const data = await readJson(response);
    result.textContent = response.ok
      ? `Connexion réussie. Hi, ${data.user.name}`
      : `${response.status} ${data.error || "Connexion impossible."}`;
  } catch {
    result.textContent = "Le serveur ne répond pas.";
  }
});

document.querySelector("#dump-button").addEventListener("click", async () => {
  try {
    const response = await fetch("/api/dump");
    result.textContent = JSON.stringify(await readJson(response), null, 2);
  } catch {
    result.textContent = "Le serveur ne répond pas.";
  }
});

document.querySelector("#benchmark-button").addEventListener("click", async () => {
  result.textContent = "Calcul de 10 000 hashes SHA-256…";
  try {
    const response = await fetch("/api/benchmark", { method: "POST" });
    const data = await readJson(response);
    result.textContent = [
      `${data.algorithm} · ${data.iterations.toLocaleString("fr-FR")} calculs`,
      `Temps mesuré : ${data.elapsed_ms.toLocaleString("fr-FR")} ms`,
      `Débit observé : ${data.hashes_per_second.toLocaleString("fr-FR")} hashes/s`,
      `Exemple : ${data.sample_hash}`,
    ].join("\n");
  } catch {
    result.textContent = "Le benchmark ne répond pas.";
  }
});
