"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");

const exerciseDir = path.resolve(__dirname, "..");
const publicDir = path.join(exerciseDir, "public");
const dbDir = path.join(exerciseDir, "db");
const logDir = path.join(exerciseDir, "logs");
const safeLog = path.join(logDir, "logs.safe.txt");
const unsafeLog = path.join(logDir, "logs.unsafe.txt");
const jwtSecret = "fictional-classroom-logging-secret";
const safeAllowedFields = new Set(["outcome", "route", "note_count", "note_id", "requested_mode"]);
const readTable = (name) => JSON.parse(fs.readFileSync(path.join(dbDir, `${name}.json`), "utf8"));
const publicUser = (user) => ({ username: user.username, name: user.name });

class SafeLoggerNotImplemented extends Error {}

function ensureLogFiles() {
  fs.mkdirSync(logDir, { recursive: true });
  for (const logFile of [safeLog, unsafeLog]) fs.closeSync(fs.openSync(logFile, "a"));
}

function bearerToken(request) {
  const authorization = request.get("Authorization") || "";
  return authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";
}

function encodeJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", jwtSecret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function decodeJwt(token) {
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;
    const expected = crypto.createHmac("sha256", jwtSecret).update(`${header}.${body}`).digest();
    const received = Buffer.from(signature, "base64url");
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (Number(payload.exp || 0) < Math.floor(Date.now() / 1000)) return null;
    if (!["safe", "unsafe"].includes(payload.logging_mode)) return null;
    return payload;
  } catch {
    return null;
  }
}

function clean(value) {
  return String(value).replace(/[\r\n]/g, "_").slice(0, 300);
}

function safeUserId(token) {
  // TODO :
  // 1. décodez et validez token avec decodeJwt(token) ;
  // 2. lisez le claim standard sub dans le payload ;
  // 3. renvoyez "anonymous" si le token manque ou n’est pas valide ;
  // 4. sinon, renvoyez uniquement cet identifiant utilisateur ;
  // 5. ne journalisez jamais token ou le header Authorization.
  throw new SafeLoggerNotImplemented();
}

function headerDump(headers) {
  return JSON.stringify(headers).replace(/[\r\n]/g, "_");
}

function audit(
  mode,
  level,
  logger,
  event,
  { user, token = "", request_headers: requestHeaders = {}, ...fields },
) {
  ensureLogFiles();
  const requestId = crypto.randomUUID().slice(0, 8);
  const parts = [`event=${clean(event)}`, `request_id=${requestId}`];
  if (mode === "unsafe") {
    parts.push(`user=${clean(user)}`);
    for (const [key, value] of Object.entries(fields)) parts.push(`${clean(key)}=${clean(value)}`);
    parts.push(`headers=${headerDump(requestHeaders)}`);
  } else {
    parts.push(`user_id=${clean(safeUserId(token))}`);
    for (const [key, value] of Object.entries(fields)) {
      if (safeAllowedFields.has(key)) parts.push(`${clean(key)}=${clean(value)}`);
    }
  }
  const line = `${new Date().toISOString()} ${level.padEnd(5)} fr.dercetech.training.${logger} - ${parts.join(" ")}\n`;
  fs.appendFileSync(mode === "unsafe" ? unsafeLog : safeLog, line, "utf8");
}

function createApp() {
  ensureLogFiles();
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "10kb" }));

  function readSession(request, response, next) {
    request.jwt = bearerToken(request);
    request.claims = request.jwt ? decodeJwt(request.jwt) : null;
    next();
  }

  function requireSession(request, response, next) {
    if (!request.claims) {
      audit("safe", "WARN", "SessionFilter", "AUTH_REQUIRED", {
        user: "anonymous",
        outcome: "denied",
        route: request.path,
      });
      return response.status(401).json({ ok: false, error: "Connectez-vous pour continuer." });
    }
    return next();
  }

  app.use("/api", readSession);

  app.post("/api/login/:mode", (request, response) => {
    const mode = request.params.mode;
    if (!["safe", "unsafe"].includes(mode)) {
      return response.status(404).json({ ok: false, error: "Mode de journalisation inconnu." });
    }
    const { username = "", password = "" } = request.body || {};
    const user = readTable("users").find(
      (row) => row.username === String(username).slice(0, 80)
        && row.password === String(password).slice(0, 80),
    );
    if (!user) {
      audit(mode, "WARN", "AuthService", "AUTH_FAILURE", {
        user: String(username).slice(0, 80) || "unknown",
        outcome: "denied",
        request_headers: request.headers,
      });
      return response.status(401).json({ ok: false, error: "Identifiants incorrects." });
    }

    const now = Math.floor(Date.now() / 1000);
    const token = encodeJwt({
      sub: user.username,
      name: user.name,
      logging_mode: mode,
      iat: now,
      exp: now + 3600,
    });
    audit(mode, "INFO", "AuthService", "AUTH_SUCCESS", {
      user: user.username,
      token,
      outcome: "granted",
      request_headers: request.headers,
    });
    return response.json({ ok: true, user: publicUser(user), logging_mode: mode, token });
  });

  app.get("/api/session", requireSession, (request, response) => {
    const mode = request.claims.logging_mode;
    audit(mode, "DEBUG", "SessionFilter", "SESSION_CHECK", {
      user: request.claims.sub,
      token: request.jwt,
      outcome: "valid",
      request_headers: request.headers,
    });
    response.json({
      ok: true,
      user: { username: request.claims.sub, name: request.claims.name },
      logging_mode: mode,
    });
  });

  app.get("/api/dashboard", requireSession, (request, response) => {
    const notes = readTable("notes").map(({ id, title }) => ({ id, title }));
    audit(request.claims.logging_mode, "INFO", "DashboardController", "DASHBOARD_ACCESS", {
      user: request.claims.sub,
      token: request.jwt,
      outcome: "granted",
      note_count: notes.length,
      request_headers: request.headers,
    });
    response.json({ ok: true, notes });
  });

  app.get("/api/notes/:noteId", requireSession, (request, response) => {
    const note = readTable("notes").find((row) => row.id === Number(request.params.noteId));
    const fields = {
      user: request.claims.sub,
      token: request.jwt,
      outcome: note ? "granted" : "missing",
      note_id: request.params.noteId,
      request_headers: request.headers,
    };
    if (!note) {
      audit(request.claims.logging_mode, "WARN", "NoteController", "NOTE_NOT_FOUND", fields);
      return response.status(404).json({ ok: false, error: "Note introuvable." });
    }
    audit(request.claims.logging_mode, "INFO", "NoteController", "NOTE_READ", fields);
    return response.json({ ok: true, note, logging_mode: request.claims.logging_mode });
  });

  app.post("/api/logout", requireSession, (request, response) => {
    audit(request.claims.logging_mode, "INFO", "AuthService", "LOGOUT", {
      user: request.claims.sub,
      token: request.jwt,
      outcome: "success",
      request_headers: request.headers,
    });
    return response.json({ ok: true });
  });

  app.get(["/", "/dashboard/"], (request, response) => {
    response.sendFile(path.join(publicDir, "index.html"));
  });
  app.get("/notes/:noteId/", (request, response) => {
    response.sendFile(path.join(publicDir, "note.html"));
  });
  app.use(express.static(publicDir));

  app.use((error, request, response, next) => {
    if (error instanceof SafeLoggerNotImplemented) {
      return response.status(500).json({
        ok: false,
        error: "Méthode de journalisation sûre non implémentée.",
      });
    }
    return next(error);
  });
  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8036);
  createApp().listen(port, "127.0.0.1", () => {
    console.log(`Lab logging : http://127.0.0.1:${port}`);
  });
}

module.exports = { createApp, decodeJwt, encodeJwt };
