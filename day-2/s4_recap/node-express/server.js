"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { createHash, randomUUID } = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");
const express = require("express");

const exerciseDir = path.resolve(__dirname, "..");
const publicDir = path.join(exerciseDir, "public");
const defaultDatabasePath = path.join(exerciseDir, "db", "lab.sqlite3");
const seedPath = path.join(exerciseDir, "db", "seed.sql");
const maxSearchLength = 300;

function initialiseDatabase(databasePath) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);
  database.exec("PRAGMA busy_timeout = 2000");
  database.exec(fs.readFileSync(seedPath, "utf8"));
  return database;
}

function passwordDigest(password) {
  return createHash("sha256").update(password, "utf8").digest("hex");
}

function buildUnsafeSearch(search) {
  return "SELECT id, name, port, status FROM services "
    + `WHERE name LIKE '%${search}%' ORDER BY id`;
}

function visibleUser(user) {
  return { id: user.id, username: user.username, role: user.role };
}

function createApp(options = {}) {
  const app = express();
  const database = initialiseDatabase(options.databasePath || defaultDatabasePath);
  const sessions = new Map();
  app.locals.database = database;

  function authenticatedUser(request) {
    const [scheme, token] = (request.get("authorization") || "").split(" ", 2);
    const userId = scheme === "Bearer" ? sessions.get(token) : undefined;
    if (userId === undefined) return undefined;
    return database.prepare("SELECT id, username, role FROM users WHERE id = ?").get(userId);
  }

  app.disable("x-powered-by");
  app.use(express.json({ limit: "16kb" }));

  app.post("/api/login", (request, response) => {
    const body = request.body || {};
    const username = typeof body.username === "string" ? body.username : "";
    const password = typeof body.password === "string" ? body.password : "";
    const user = database.prepare(
      "SELECT id, username, role FROM users WHERE username = ? AND password_sha256 = ?",
    ).get(username, passwordDigest(password));

    if (!user) {
      response.status(401).json({ ok: false, error: "Identifiants incorrects." });
      return;
    }

    const token = randomUUID();
    sessions.set(token, user.id);
    response.json({ ok: true, token, user: visibleUser(user) });
  });

  app.get("/api/services", (request, response) => {
    const user = authenticatedUser(request);
    if (!user) {
      response.status(401).json({ ok: false, error: "Session absente ou expirée." });
      return;
    }

    const search = typeof request.query.q === "string" ? request.query.q : "";
    if (search.length > maxSearchLength) {
      response.status(400).json({ ok: false, error: "La recherche est trop longue." });
      return;
    }

    try {
      const rows = database.prepare(buildUnsafeSearch(search)).all().slice(0, 50);
      response.json({ ok: true, viewer: visibleUser(user), rows });
    } catch (error) {
      response.status(400).json({ ok: false, error: `SQLite : ${error.message}` });
    }
  });

  app.post("/api/services/:serviceId/status", (request, response) => {
    const user = authenticatedUser(request);
    if (!user) {
      response.status(401).json({ ok: false, error: "Session absente ou expirée." });
      return;
    }
    if (user.role !== "admin") {
      response.status(403).json({ ok: false, error: "Action réservée au rôle admin." });
      return;
    }

    const serviceId = Number(request.params.serviceId);
    const nextStatus = request.body?.status;
    if (!Number.isInteger(serviceId) || !["running", "stopped"].includes(nextStatus)) {
      response.status(400).json({ ok: false, error: "État de service invalide." });
      return;
    }

    const result = database.prepare("UPDATE services SET status = ? WHERE id = ?").run(
      nextStatus,
      serviceId,
    );
    if (result.changes === 0) {
      response.status(404).json({ ok: false, error: "Service inconnu." });
      return;
    }

    const service = database.prepare(
      "SELECT id, name, port, status FROM services WHERE id = ?",
    ).get(serviceId);
    response.json({ ok: true, service });
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
  const port = Number(process.env.PORT || 8041);
  createApp().listen(port, "127.0.0.1", () => {
    console.log(`Lab disponible sur http://127.0.0.1:${port}`);
  });
}

module.exports = { buildUnsafeSearch, createApp, initialiseDatabase, passwordDigest };
