"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");

const exerciseDir = path.resolve(__dirname, "..");
const staticDir = path.join(exerciseDir, "static");
const usersFile = path.join(exerciseDir, "db", "users.json");
const jwtSecret = process.env.LAB_JWT_SECRET || "secu5d-local-demo-secret";
const jwtLifetimeSeconds = 60 * 60;

function loadUsers() {
  const users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
  if (!Array.isArray(users)) throw new Error("db/users.json doit contenir une liste.");
  return users;
}

function publicUser(user) {
  return { username: user.username, name: user.name };
}

function encodeJson(value) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function createJwt(user) {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeJson({ alg: "HS256", typ: "JWT" });
  const payload = encodeJson({
    sub: user.username,
    name: user.name,
    iat: now,
    exp: now + jwtLifetimeSeconds,
  });
  const signingInput = `${header}.${payload}`;
  const signature = crypto
    .createHmac("sha256", jwtSecret)
    .update(signingInput)
    .digest("base64url");
  return `${signingInput}.${signature}`;
}

function verifyJwt(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerPart, payloadPart, signaturePart] = parts;
    const signingInput = `${headerPart}.${payloadPart}`;
    const expected = crypto.createHmac("sha256", jwtSecret).update(signingInput).digest();
    const received = Buffer.from(signaturePart, "base64url");
    if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
      return null;
    }

    const header = JSON.parse(Buffer.from(headerPart, "base64url").toString("utf8"));
    const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8"));
    if (header.alg !== "HS256" || header.typ !== "JWT") return null;
    if (typeof payload.sub !== "string" || typeof payload.name !== "string") return null;
    if (!Number.isInteger(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return { username: payload.sub, name: payload.name };
  } catch {
    return null;
  }
}

function readCookie(request, name) {
  const rawCookies = request.headers.cookie || "";
  for (const rawCookie of rawCookies.split(";")) {
    const [key, ...valueParts] = rawCookie.trim().split("=");
    if (key === name) return decodeURIComponent(valueParts.join("="));
  }
  return "";
}

function createApp() {
  const app = express();
  const users = loadUsers();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "10kb" }));

  app.post("/api/login", (request, response) => {
    const { username, password } = request.body || {};
    const user = users.find(
      (candidate) => candidate.username === username && candidate.password === password,
    );

    if (!user) {
      response.status(401).json({ ok: false, error: "Identifiants incorrects." });
      return;
    }

    const safeUser = publicUser(user);
    const token = createJwt(safeUser);
    response.cookie("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: jwtLifetimeSeconds * 1000,
    });
    response.json({ ok: true, token, user: safeUser });
  });

  app.get("/api/me", (request, response) => {
    const user = verifyJwt(readCookie(request, "auth_token"));
    if (!user) {
      response.status(401).json({ ok: false, error: "Jeton absent ou invalide." });
      return;
    }
    response.json({ ok: true, user });
  });

  app.post("/api/logout", (request, response) => {
    response.clearCookie("auth_token", { path: "/" });
    response.json({ ok: true });
  });

  app.use(express.static(staticDir));
  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8012);
  createApp().listen(port, "127.0.0.1", () => {
    console.log(`Lab disponible sur http://127.0.0.1:${port}`);
  });
}

module.exports = { createApp, createJwt, verifyJwt };
