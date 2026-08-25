"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const repositoryDir = path.resolve(__dirname, "../../../..");
const exerciseDir = path.join(repositoryDir, "day-3", "s3_03_logging");
const express = require(path.join(exerciseDir, "node-express", "node_modules", "express"));
const publicDir = path.join(exerciseDir, "public");
const dbDir = path.join(exerciseDir, "db");
const logDir = path.join(exerciseDir, "logs");
const safeLog = path.join(logDir, "logs.safe.txt");
const unsafeLog = path.join(logDir, "logs.unsafe.txt");
const jwtSecret = "fictional-classroom-logging-secret";
const allowedLogFields = new Set(["outcome", "route", "note_count", "note_id", "requested_mode"]);
const readTable = (name) => JSON.parse(fs.readFileSync(path.join(dbDir, `${name}.json`), "utf8"));
const publicUser = (user) => ({ username: user.username, name: user.name });

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
    return payload.logging_mode === "safe" ? payload : null;
  } catch {
    return null;
  }
}

function clean(value) {
  return String(value).replace(/[\r\n]/g, "_").slice(0, 300);
}

function safeUserId(token) {
  const claims = token ? decodeJwt(token) : null;
  return claims?.sub || "anonymous";
}

function audit(mode, level, logger, event, { user, token = "", ...fields }) {
  void mode;
  void user;
  ensureLogFiles();
  const parts = [
    `event=${clean(event)}`,
    `user_id=${clean(safeUserId(token))}`,
    `request_id=${crypto.randomUUID().slice(0, 8)}`,
  ];
  for (const [key, value] of Object.entries(fields)) {
    if (allowedLogFields.has(key)) parts.push(`${clean(key)}=${clean(value)}`);
  }
  const line = `${new Date().toISOString()} ${level.padEnd(5)} fr.dercetech.training.${logger} - ${parts.join(" ")}\n`;
  fs.appendFileSync(safeLog, line, "utf8");
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
    const requestedMode = request.params.mode;
    if (!["safe", "unsafe"].includes(requestedMode)) {
      return response.status(404).json({ ok: false, error: "Mode de journalisation inconnu." });
    }
    const { username = "", password = "" } = request.body || {};
    const user = readTable("users").find(
      (row) => row.username === String(username).slice(0, 80)
        && row.password === String(password).slice(0, 80),
    );
    if (!user) {
      audit("safe", "WARN", "AuthService", "AUTH_FAILURE", {
        user: String(username).slice(0, 80) || "unknown",
        outcome: "denied",
        requested_mode: requestedMode,
      });
      return response.status(401).json({ ok: false, error: "Identifiants incorrects." });
    }

    const now = Math.floor(Date.now() / 1000);
    const token = encodeJwt({
      sub: user.username,
      name: user.name,
      logging_mode: "safe",
      iat: now,
      exp: now + 3600,
    });
    audit("safe", "INFO", "AuthService", "AUTH_SUCCESS", {
      user: user.username,
      token,
      outcome: "granted",
      requested_mode: requestedMode,
    });
    return response.json({
      ok: true,
      user: publicUser(user),
      logging_mode: "safe",
      token,
    });
  });

  app.get("/api/session", requireSession, (request, response) => {
    audit("safe", "DEBUG", "SessionFilter", "SESSION_CHECK", {
      user: request.claims.sub,
      token: request.jwt,
      outcome: "valid",
    });
    response.json({
      ok: true,
      user: { username: request.claims.sub, name: request.claims.name },
      logging_mode: "safe",
    });
  });

  app.get("/api/dashboard", requireSession, (request, response) => {
    const notes = readTable("notes").map(({ id, title }) => ({ id, title }));
    audit("safe", "INFO", "DashboardController", "DASHBOARD_ACCESS", {
      user: request.claims.sub,
      token: request.jwt,
      outcome: "granted",
      note_count: notes.length,
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
    };
    if (!note) {
      audit("safe", "WARN", "NoteController", "NOTE_NOT_FOUND", fields);
      return response.status(404).json({ ok: false, error: "Note introuvable." });
    }
    audit("safe", "INFO", "NoteController", "NOTE_READ", fields);
    return response.json({ ok: true, note, logging_mode: "safe" });
  });

  app.post("/api/logout", requireSession, (request, response) => {
    audit("safe", "INFO", "AuthService", "LOGOUT", {
      user: request.claims.sub,
      token: request.jwt,
      outcome: "success",
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
  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8055);
  createApp().listen(port, "127.0.0.1", () => {
    console.log(`Solution logging : http://127.0.0.1:${port}`);
  });
}

module.exports = { createApp, decodeJwt, encodeJwt };
