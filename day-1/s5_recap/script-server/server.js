"use strict";

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const host = "127.0.0.1";
const port = Number(process.env.SCRIPT_PORT || 8012);
const publicDir = path.join(__dirname, "public");
const staticFiles = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/dashboard.js", ["dashboard.js", "text/javascript; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/xss-demo.js", ["xss-demo.js", "text/javascript; charset=utf-8"]],
]);

let latestCapture = null;

function isAllowedConsumerOrigin(origin) {
  try {
    const url = new URL(origin);
    return url.protocol === "http:"
      && (url.hostname === "127.0.0.1" || url.hostname === "localhost");
  } catch {
    return false;
  }
}

function addCorsHeaders(response, origin) {
  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Vary", "Origin");
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(payload));
}

function sendStatic(response, fileName, contentType) {
  fs.readFile(path.join(publicDir, fileName), (error, content) => {
    if (error) {
      sendJson(response, 500, { ok: false, error: "Fichier local introuvable." });
      return;
    }

    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
    });
    response.end(content);
  });
}

function readSmallBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    let tooLarge = false;

    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      if (body.length + chunk.length > 4096) {
        tooLarge = true;
        return;
      }
      body += chunk;
    });
    request.on("end", () => {
      if (tooLarge) {
        reject(new Error("Corps trop grand."));
        return;
      }
      resolve(body);
    });
    request.on("error", reject);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || host}`);
  const origin = request.headers.origin || "";

  if (request.method === "OPTIONS" && url.pathname === "/capture") {
    if (!isAllowedConsumerOrigin(origin)) {
      sendJson(response, 403, { ok: false, error: "Origine refusée." });
      return;
    }
    addCorsHeaders(response, origin);
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method === "POST" && url.pathname === "/capture") {
    if (!isAllowedConsumerOrigin(origin)) {
      sendJson(response, 403, { ok: false, error: "Origine refusée." });
      return;
    }

    addCorsHeaders(response, origin);
    try {
      const payload = JSON.parse(await readSmallBody(request));
      const password = typeof payload.password === "string" ? payload.password : "";
      if (password.length === 0 || password.length > 128) {
        sendJson(response, 400, { ok: false, error: "Mot de passe fictif invalide." });
        return;
      }

      latestCapture = {
        password,
        capturedAt: new Date().toISOString(),
      };
      sendJson(response, 201, { ok: true });
    } catch {
      sendJson(response, 400, { ok: false, error: "Capture illisible." });
    }
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/latest") {
    sendJson(response, 200, { ok: true, capture: latestCapture });
    return;
  }

  if (request.method === "GET" && staticFiles.has(url.pathname)) {
    const [fileName, contentType] = staticFiles.get(url.pathname);
    sendStatic(response, fileName, contentType);
    return;
  }

  sendJson(response, 404, { ok: false, error: "Route introuvable." });
});

server.listen(port, host, () => {
  console.log(`Serveur du script disponible sur http://${host}:${port}/`);
});
