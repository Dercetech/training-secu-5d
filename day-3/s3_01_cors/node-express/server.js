"use strict";

const path = require("node:path");
const express = require("express");

const publicDir = path.resolve(__dirname, "..", "public");

function createApiApp() {
  const app = express();
  app.disable("x-powered-by");
  app.get("/api/data", (request, response) => {
    const origin = request.get("Origin") || "";
    if (origin) {
      // Vulnérabilité volontaire : n’importe quelle origine est recopiée.
      response.set("Access-Control-Allow-Origin", origin);
      response.set("Vary", "Origin");
    }
    response.json({
      ok: true,
      message: "Données fictives de la vraie application.",
      requested_by: origin || "same-origin",
    });
  });
  app.use(express.static(publicDir));
  return app;
}

function createSecondaryUiApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.static(publicDir));
  return app;
}

if (require.main === module) {
  const apiPort = Number(process.env.API_PORT || 8034);
  const secondaryPort = Number(process.env.SECONDARY_PORT || 8038);
  createApiApp().listen(apiPort, "127.0.0.1", () => {
    console.log(`Real app + API : http://127.0.0.1:${apiPort}`);
  });
  createSecondaryUiApp().listen(secondaryPort, "127.0.0.1", () => {
    console.log(`Script kiddie's app : http://127.0.0.1:${secondaryPort}`);
  });
}

module.exports = { createApp: createApiApp, createApiApp, createSecondaryUiApp };
