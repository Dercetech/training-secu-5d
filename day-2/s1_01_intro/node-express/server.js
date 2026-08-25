"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const express = require("express");

const exerciseDir = path.resolve(__dirname, "..");
const publicDir = path.join(exerciseDir, "public");
const defaultDatabasePath = path.join(exerciseDir, "db", "lab.sqlite3");
const seedPath = path.join(exerciseDir, "db", "seed.sql");
const maxSqlLength = 1_200;
const maxRows = 100;

function initialiseDatabase(databasePath) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);
  database.exec(fs.readFileSync(seedPath, "utf8"));
  database.exec("PRAGMA query_only = ON");
  return database;
}

function normaliseSelect(rawSql) {
  if (typeof rawSql !== "string") throw new Error("La requête doit être du texte.");

  let sql = rawSql.trim();
  if (!sql) throw new Error("Écrivez une requête SELECT.");
  if (sql.length > maxSqlLength) throw new Error("La requête est trop longue pour ce laboratoire.");
  if (sql.endsWith(";")) sql = sql.slice(0, -1).trimEnd();
  if (sql.includes(";")) throw new Error("Exécutez une seule requête à la fois.");
  if (!/^select\s/i.test(sql)) throw new Error("Cette introduction accepte uniquement SELECT.");
  return sql;
}

function createApp(options = {}) {
  const app = express();
  const database = initialiseDatabase(options.databasePath || defaultDatabasePath);
  app.locals.database = database;

  app.disable("x-powered-by");
  app.use(express.json({ limit: "10kb" }));

  app.post("/api/query", (request, response) => {
    let sql;
    try {
      sql = normaliseSelect(request.body?.sql);
    } catch (error) {
      response.status(400).json({ ok: false, error: error.message });
      return;
    }

    const started = process.hrtime.bigint();
    try {
      const statement = database.prepare(sql);
      const columns = statement.columns().map((column) => column.name);
      const rawRows = statement.all();
      const truncated = rawRows.length > maxRows;
      const rows = rawRows.slice(0, maxRows);
      const elapsedMs = Number(process.hrtime.bigint() - started) / 1_000_000;
      response.json({
        ok: true,
        columns,
        rows,
        truncated,
        elapsed_ms: Math.round(elapsedMs * 100) / 100,
      });
    } catch (error) {
      response.status(400).json({ ok: false, error: `SQLite : ${error.message}` });
    }
  });

  app.use(express.static(publicDir));
  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8021);
  const app = createApp();
  app.listen(port, "127.0.0.1", () => {
    console.log(`Lab disponible sur http://127.0.0.1:${port}`);
  });
}

module.exports = { createApp, initialiseDatabase, normaliseSelect };
