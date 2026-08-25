"use strict";

const path = require("node:path");

const repositoryDir = path.resolve(__dirname, "../../../..");
const exerciseDir = path.join(repositoryDir, "day-3", "s3_01_cors");
const express = require(path.join(exerciseDir, "node-express", "node_modules", "express"));
const publicDir = path.join(exerciseDir, "public");
const allowedOrigin = "http://127.0.0.1:8034";

function createApiApp() {
  const app = express();
  app.disable("x-powered-by");
  app.get("/api/data", (request, response) => {
    const origin = request.get("Origin") || "";
    response.set("Vary", "Origin");
    if (origin && origin !== allowedOrigin) {
      return response.status(403).json({ ok: false, error: "Origine refusée." });
    }
    if (origin === allowedOrigin) response.set("Access-Control-Allow-Origin", allowedOrigin);
    return response.json({
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
    console.log(`Solution real app + API : http://127.0.0.1:${apiPort}`);
  });
  createSecondaryUiApp().listen(secondaryPort, "127.0.0.1", () => {
    console.log(`Solution secondary app : http://127.0.0.1:${secondaryPort}`);
  });
}

module.exports = {
  allowedOrigin,
  createApp: createApiApp,
  createApiApp,
  createSecondaryUiApp,
};
