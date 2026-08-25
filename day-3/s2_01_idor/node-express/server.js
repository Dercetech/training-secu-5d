"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");

const exerciseDir = path.resolve(__dirname, "..");
const publicDir = path.join(exerciseDir, "public");
const dbDir = path.join(exerciseDir, "db");
const sessionCookie = "idor_lab_session";
const readTable = (name) => JSON.parse(fs.readFileSync(path.join(dbDir, `${name}.json`), "utf8"));
const publicUser = (user) => ({ username: user.username, name: user.name });

function parseCookies(request) {
  return Object.fromEntries(
    (request.headers.cookie || "")
      .split(";")
      .filter(Boolean)
      .map((entry) => {
        const [name, ...value] = entry.trim().split("=");
        return [name, decodeURIComponent(value.join("="))];
      }),
  );
}

function createApp() {
  const app = express();
  const sessions = new Map();
  app.disable("x-powered-by");
  app.use(express.json());

  function identifyUser(request, response, next) {
    request.sessionId = parseCookies(request)[sessionCookie] || "";
    const username = sessions.get(request.sessionId);
    request.currentUser = readTable("users").find((user) => user.username === username);
    next();
  }

  function requireUser(request, response, next) {
    if (!request.currentUser) {
      return response.status(401).json({ ok: false, error: "Connectez-vous pour continuer." });
    }
    return next();
  }

  function loadDocument(request, response, next) {
    request.note = readTable("documents").find(
      (row) => row.id === Number(request.params.noteId),
    );
    if (!request.note) {
      return response.status(404).json({ ok: false, error: "Note introuvable." });
    }
    return next();
  }

  function requireOwner(request, response, next) {
    // TODO : comparez request.note.owner à request.currentUser.username.
    // Renvoyez 403 si les deux utilisateurs diffèrent, sinon appelez next().
    return response.status(501).json({
      ok: false,
      error: "Middleware requireOwner à implémenter.",
    });
  }

  app.use("/api", identifyUser);

  app.post("/api/login", (request, response) => {
    const { username, password } = request.body || {};
    const user = readTable("users").find(
      (row) => row.username === username && row.password === password,
    );
    if (!user) {
      return response.status(401).json({ ok: false, error: "Identifiants incorrects." });
    }
    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, user.username);
    response.cookie(sessionCookie, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return response.json({ ok: true, user: publicUser(user) });
  });

  app.post("/api/logout", (request, response) => {
    sessions.delete(request.sessionId);
    response.clearCookie(sessionCookie, { path: "/" });
    return response.json({ ok: true });
  });

  app.get("/api/session", requireUser, (request, response) => {
    response.json({ ok: true, user: publicUser(request.currentUser) });
  });

  app.get("/api/notes", requireUser, (request, response) => {
    const notes = readTable("documents")
      .filter((row) => row.owner === request.currentUser.username)
      .map(({ id, title }) => ({ id, title }));
    response.json({ ok: true, notes });
  });

  app.get(
    "/api/unsecure/notes/:noteId",
    requireUser,
    loadDocument,
    (request, response) => response.json({
      ok: true,
      note: request.note,
      warning: "Le propriétaire de la note n’a pas été vérifié.",
    }),
  );

  app.get(
    "/api/secure/notes/:noteId",
    requireUser,
    loadDocument,
    requireOwner,
    (request, response) => response.json({ ok: true, note: request.note }),
  );

  app.get(["/", "/dashboard/"], (request, response) => {
    response.sendFile(path.join(publicDir, "index.html"));
  });
  app.get(["/unsecure/notes/:noteId/", "/secure/notes/:noteId/"], (request, response) => {
    response.sendFile(path.join(publicDir, "note.html"));
  });
  app.use(express.static(publicDir));
  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8033);
  createApp().listen(port, "127.0.0.1", () => {
    console.log(`Lab IDOR : http://127.0.0.1:${port}`);
  });
}

module.exports = { createApp };
