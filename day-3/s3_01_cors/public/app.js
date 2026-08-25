"use strict";

const query = new URLSearchParams(location.search);
const apiPort = query.get("api_port") || "8034";
const secondaryPort = query.get("secondary_port") || "8038";
const isSecondaryApp = location.port === secondaryPort;
const apiUrl = `http://127.0.0.1:${apiPort}/api/data`;
const result = document.querySelector("#result");

document.querySelector("#app-name").textContent = isSecondaryApp
  ? "Script kiddie's app"
  : "Real app";
document.querySelector("#current-origin").textContent = location.origin;

document.querySelector("#load-data").addEventListener("click", async () => {
  result.textContent = `Requête vers ${apiUrl}…`;
  try {
    const response = await fetch(apiUrl);
    const payload = await response.json();
    result.textContent = JSON.stringify(
      {
        status: response.status,
        page_origin: location.origin,
        api: apiUrl,
        body: payload,
      },
      null,
      2,
    );
  } catch {
    result.textContent = [
      "Lecture refusée par le navigateur, ou API indisponible.",
      `Page : ${location.origin}`,
      `API : ${apiUrl}`,
      "Consultez Console et Network.",
    ].join("\n");
  }
});
