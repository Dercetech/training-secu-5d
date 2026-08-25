"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const express = require("express");

const exerciseDir = path.resolve(__dirname, "..");
const publicDir = path.join(exerciseDir, "public");
const defaultDatabasePath = path.join(exerciseDir, "db", "lab.sqlite3");
const seedPath = path.join(exerciseDir, "db", "seed.sql");
const maxSearchLength = 200;

function initialiseDatabase(databasePath) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);
  database.exec(fs.readFileSync(seedPath, "utf8"));
  database.exec("PRAGMA query_only = ON");
  return database;
}

function buildUnsafeQuery(search) {
  // Intentionally vulnerable: learners replace this concatenation themselves.
  return "SELECT id, name, subject FROM teachers "
    + `WHERE name LIKE '%${search}%' ORDER BY id`;
}

function createApp(options = {}) {
  const app = express();
  const database = initialiseDatabase(options.databasePath || defaultDatabasePath);
  app.locals.database = database;
  app.disable("x-powered-by");

  app.get("/api/search", (request, response) => {
    const search = typeof request.query.name === "string" ? request.query.name : "";
    if (search.length > maxSearchLength) {
      response.status(400).json({ ok: false, error: "La recherche est trop longue." });
      return;
    }

    const sql = buildUnsafeQuery(search);
    const started = process.hrtime.bigint();
    try {
      const rows = database.prepare(sql).all().slice(0, 30);
      const elapsedMs = Number(process.hrtime.bigint() - started) / 1_000_000;
      response.json({
        ok: true,
        received: { method: "GET", path: "/api/search", name: search },
        sql,
        rows,
        elapsed_ms: Math.round(elapsedMs * 100) / 100,
      });
    } catch (error) {
      response.status(400).json({
        ok: false,
        received: { method: "GET", path: "/api/search", name: search },
        sql,
        error: `SQLite : ${error.message}`,
      });
    }
  });

  app.use(express.static(publicDir));
  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8025);
  const app = createApp();
  app.listen(port, "127.0.0.1", () => {
    console.log(`Lab disponible sur http://127.0.0.1:${port}`);
  });
}

module.exports = { buildUnsafeQuery, createApp, initialiseDatabase };
