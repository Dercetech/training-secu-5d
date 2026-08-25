"use strict";

const unsafeEndpoint = "https://training.dercetech.com/trainings/python-html5-security/labs/day-1/s2/get-unsafe.php";
const resultCard = document.querySelector("#result-card");
const result = document.querySelector("#result");

function showResult(message) {
  resultCard.hidden = false;
  result.textContent = message;
}

document.querySelector("#fetch-button").addEventListener("click", async () => {
  showResult("Requête fetch() en cours…");

  try {
    const response = await fetch(`${unsafeEndpoint}?format=json&theme=red`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json();

    if (response.status === 401 && data.ok === false) {
      showResult(
        `${response.status} — ${data.error}\n\n`
        + "Conclusion : le navigateur a fait la requête sans joindre le cookie Lax. "
        + "Le serveur n’a donc pas changé le thème."
      );
      return;
    }

    showResult(`${response.status} — ${JSON.stringify(data, null, 2)}`);
  } catch (error) {
    showResult(
      "Le navigateur n’a pas pu lire la réponse. Vérifiez que le serveur local utilise bien "
      + "http://127.0.0.1 ou http://localhost, sur le port 8012 ou 8013, puis réessayez."
    );
    console.warn("Impossible de terminer la démonstration fetch().", error);
  }
});

document.querySelector("#navigation-button").addEventListener("click", () => {
  const returnTo = `${window.location.origin}/`;
  window.location.assign(
    `${unsafeEndpoint}?theme=red&return_to=${encodeURIComponent(returnTo)}`
  );
});
