"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const repositoryDir = path.resolve(__dirname, "../../../..");
const exerciseDir = path.join(repositoryDir, "day-2", "s1_03_fix_injection");
const express = require(path.join(exerciseDir, "node-express", "node_modules", "express"));
const publicDir = path.join(exerciseDir, "public");
const defaultDatabasePath = path.join(exerciseDir, "db", "lab.sqlite3");
const seedPath = path.join(exerciseDir, "db", "seed.sql");
const maxSearchLength = 200;
const safeSql = "SELECT id, name, subject FROM teachers WHERE name LIKE ? ORDER BY id";

function initialiseDatabase(databasePath) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);
  database.exec(fs.readFileSync(seedPath, "utf8"));
  database.exec("PRAGMA query_only = ON");
  return database;
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

    const parameters = [`%${search}%`];
    const started = process.hrtime.bigint();
    try {
      const rows = database.prepare(safeSql).all(...parameters).slice(0, 30);
      const elapsedMs = Number(process.hrtime.bigint() - started) / 1_000_000;
      response.json({
        ok: true,
        received: { method: "GET", path: "/api/search", name: search },
        sql: safeSql,
        parameters,
        rows,
        elapsed_ms: Math.round(elapsedMs * 100) / 100,
      });
    } catch (error) {
      response.status(400).json({
        ok: false,
        received: { method: "GET", path: "/api/search", name: search },
        sql: safeSql,
        parameters,
        error: `SQLite : ${error.message}`,
      });
    }
  });

  app.use(express.static(publicDir));
  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8027);
  const app = createApp();
  app.listen(port, "127.0.0.1", () => {
    console.log(`Solution disponible sur http://127.0.0.1:${port}`);
  });
}

module.exports = { createApp, initialiseDatabase, safeSql };
