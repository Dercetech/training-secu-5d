"use strict";

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const host = "127.0.0.1";
const port = Number(process.env.CONSUMER_PORT || 8014);
const publicDir = path.join(__dirname, "public");
const staticFiles = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
]);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sendText(response, status, contentType, content) {
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
  });
  response.end(content);
}

function sendStatic(response, fileName, contentType) {
  fs.readFile(path.join(publicDir, fileName), (error, content) => {
    if (error) {
      sendText(response, 500, "text/plain; charset=utf-8", "Fichier local introuvable.");
      return;
    }
    sendText(response, 200, contentType, content);
  });
}

function readSmallBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 4096) {
        reject(new Error("Corps trop grand."));
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || host}`);

  if (request.method === "POST" && url.pathname === "/login") {
    try {
      const form = new URLSearchParams(await readSmallBody(request));
      const username = escapeHtml(form.get("username") || "élève");
      sendText(response, 200, "text/html; charset=utf-8", `<!doctype html>
<html lang="fr">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Soumission terminée</title>
<style>body{max-width:42rem;margin:12vh auto;padding:1rem;font:18px/1.6 system-ui;color:#0f172a}a{color:#1d4ed8}</style>
<h1>Soumission normale terminée</h1>
<p>Bonjour, ${username}. Le serveur consommateur a bien reçu le formulaire après l’exécution du script.</p>
<p>Le mot de passe n’est ni affiché, ni conservé par ce serveur.</p>
<p><a href="/">Recommencer</a></p>
</html>`);
    } catch {
      sendText(response, 400, "text/plain; charset=utf-8", "Formulaire illisible.");
    }
    return;
  }

  if (request.method === "GET" && staticFiles.has(url.pathname)) {
    const [fileName, contentType] = staticFiles.get(url.pathname);
    sendStatic(response, fileName, contentType);
    return;
  }

  sendText(response, 404, "text/plain; charset=utf-8", "Route introuvable.");
});

server.listen(port, host, () => {
  console.log(`Site consommateur disponible sur http://${host}:${port}/`);
});
