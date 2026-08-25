"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const express = require("express");

// TODO S3.03 : importez ici les outils de validation que vous aurez choisis.

const exerciseDir = path.resolve(__dirname, "..");
const publicDir = path.join(exerciseDir, "public");
const defaultBriefsPath = path.join(exerciseDir, "db", "briefs.json");

function readBriefs(briefsPath) {
  if (!fs.existsSync(briefsPath)) return [];
  return JSON.parse(fs.readFileSync(briefsPath, "utf8"));
}

function writeBriefs(briefsPath, briefs) {
  fs.mkdirSync(path.dirname(briefsPath), { recursive: true });
  fs.writeFileSync(briefsPath, `${JSON.stringify(briefs, null, 2)}\n`, "utf8");
}

function createApp(options = {}) {
  const app = express();
  const briefsPath = options.briefsPath || process.env.BRIEFS_FILE || defaultBriefsPath;

  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));

  app.get("/api/briefs", (request, response) => {
    response.json({ ok: true, briefs: readBriefs(briefsPath) });
  });

  // TODO S3.03 : imposez ici le contrat décrit dans le README avant l’écriture.
  app.post("/api/briefs", (request, response) => {
    if (!request.body || typeof request.body !== "object" || Array.isArray(request.body)) {
      response.status(400).json({ ok: false, error: "Un objet JSON est obligatoire." });
      return;
    }

    const briefs = readBriefs(briefsPath);
    // Volontairement dangereux : id, status et toutes les clés sont remplaçables.
    const newBrief = { id: randomUUID(), status: "received", ...request.body };
    briefs.push(newBrief);
    writeBriefs(briefsPath, briefs);
    response.status(201).json({ ok: true, brief: newBrief });
  });

  app.use(express.static(publicDir));
  app.use((error, request, response, next) => {
    if (error instanceof SyntaxError && "body" in error) {
      response.status(400).json({ ok: false, error: "JSON illisible." });
      return;
    }
    next(error);
  });
  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8035);
  createApp().listen(port, "127.0.0.1", () => {
    console.log(`Lab disponible sur http://127.0.0.1:${port}`);
  });
}

module.exports = { createApp, readBriefs, writeBriefs };
