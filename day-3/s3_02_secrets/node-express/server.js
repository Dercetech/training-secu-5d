"use strict";

const path = require("node:path");
const express = require("express");

const publicDir = path.resolve(__dirname, "..", "public");
const hardcodedFakeSecret = "demo_service_token_not_real_123";

function createApp() {
  const app = express();
  app.disable("x-powered-by");

  app.get("/api/unsafe/config", (request, response) => {
    response.json({
      ok: true,
      service: "classroom-notifications",
      configured: true,
      service_token: hardcodedFakeSecret,
      warning: "Le secret est codé en dur et envoyé au navigateur.",
    });
  });

  app.get("/api/safe/config", (request, response) => {
    // TODO :
    // 1. lire process.env.CLASSROOM_SERVICE_TOKEN ;
    // 2. renvoyer 503 si la variable manque ;
    // 3. utiliser le secret uniquement côté serveur ;
    // 4. ne jamais inclure sa valeur dans la réponse JSON.
    response.status(501).json({
      ok: false,
      error: "Lecture sécurisée de CLASSROOM_SERVICE_TOKEN à implémenter.",
    });
  });

  app.use(express.static(publicDir));
  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8035);
  createApp().listen(port, "127.0.0.1", () => {
    console.log(`Lab secrets : http://127.0.0.1:${port}`);
  });
}

module.exports = { createApp, hardcodedFakeSecret };
