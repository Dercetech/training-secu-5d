const result = document.querySelector("#result");

async function readJson(response) {
  return response.json().catch(() => ({ error: "Réponse serveur illisible." }));
}

function formatDuration(milliseconds) {
  if (milliseconds < 1_000) return `${milliseconds.toLocaleString("fr-FR")} ms`;
  const seconds = milliseconds / 1_000;
  if (seconds < 60) return `${seconds.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} s`;
  const minutes = seconds / 60;
  return `${minutes.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} min`;
}

document.querySelector("#hash-button").addEventListener("click", async () => {
  result.textContent = "Calcul Argon2id…";
  try {
    const response = await fetch("/api/argon2/hash", { method: "POST" });
    const data = await readJson(response);
    result.textContent = `${data.algorithm}\n${data.hash}`;
  } catch {
    result.textContent = "Le calcul Argon2id ne répond pas.";
  }
});

document.querySelector("#benchmark-button").addEventListener("click", async () => {
  result.textContent = "Mesure d’un petit échantillon Argon2id…";
  try {
    const response = await fetch("/api/argon2/benchmark", { method: "POST" });
    const data = await readJson(response);
    result.textContent = [
      `${data.algorithm} · ${data.measured_iterations} vrais calculs`,
      `Temps mesuré : ${formatDuration(data.measured_ms)}`,
      `Projection pour ${data.target_iterations.toLocaleString("fr-FR")} calculs : ${formatDuration(data.projected_ms)}`,
      "Projection pédagogique : les 10 000 calculs ne sont pas exécutés.",
      `Exemple : ${data.sample_hash}`,
    ].join("\n");
  } catch {
    result.textContent = "Le benchmark Argon2id ne répond pas.";
  }
});
