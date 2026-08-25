"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");

const exerciseDir = path.resolve(__dirname, "..");
const publicDir = path.join(exerciseDir, "public");
const usersPath = path.join(exerciseDir, "db", "users.json");
const demoSecret = "secu5d-day3-local-secret";
const authCookie = "secu5d_auth";

const b64urlJson = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");

function createToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64urlJson({ alg: "HS256", typ: "JWT" });
  const payload = b64urlJson({
    sub: user.username,
    name: user.name,
    role: user.role,
    iat: now,
    exp: now + 3600,
  });
  const signingInput = `${header}.${payload}`;
  const signature = crypto.createHmac("sha256", demoSecret).update(signingInput).digest("base64url");
  return `${signingInput}.${signature}`;
}

function decodeWithoutVerification(token) {
  if (typeof token !== "string" || token.length > 4096) throw new Error("Token absent ou trop long.");
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Un JWT contient exactement trois parties.");
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    if (!payload || Array.isArray(payload) || typeof payload !== "object") throw new Error();
    return payload;
  } catch {
    throw new Error("Le JWT n'est pas lisible.");
  }
}

function cookieToken(request) {
  const prefix = `${authCookie}=`;
  const entry = String(request.get("Cookie") || "")
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix));
  if (!entry) throw new Error("Cookie d’authentification absent.");
  try {
    return decodeURIComponent(entry.slice(prefix.length));
  } catch {
    throw new Error("Cookie d’authentification illisible.");
  }
}

function loadUsers() {
  return JSON.parse(fs.readFileSync(usersPath, "utf8"));
}

function publicUsers() {
  return loadUsers().map(({ username, name, role }) => ({ username, name, role }));
}

function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "10kb" }));

  app.post("/api/login", (request, response) => {
    const user = loadUsers().find(
      (row) => row.username === request.body?.username && row.password === request.body?.password,
    );
    if (!user) return response.status(401).json({ ok: false, error: "Identifiants incorrects." });
    response.cookie(authCookie, createToken(user), {
      httpOnly: false,
      maxAge: 60 * 60 * 1000,
      path: "/",
      sameSite: "lax",
    });
    return response.json({ ok: true });
  });

  app.post("/api/logout", (request, response) => {
    response.clearCookie(authCookie, { path: "/", sameSite: "lax" });
    return response.json({ ok: true });
  });

  app.get("/api/users", (request, response) => {
    let payload;
    try {
      payload = decodeWithoutVerification(cookieToken(request));
    } catch (error) {
      return response.status(401).json({ ok: false, error: error.message });
    }
    if (payload.role !== "admin") {
      return response.status(403).json({ ok: false, error: "Rôle admin requis." });
    }
    return response.json({ ok: true, users: publicUsers() });
  });

  app.get(["/", "/login"], (request, response) => response.sendFile(path.join(publicDir, "login.html")));
  app.get("/dashboard", (request, response) => response.sendFile(path.join(publicDir, "dashboard.html")));
  app.get("/users", (request, response) => response.sendFile(path.join(publicDir, "users.html")));
  app.use(express.static(publicDir));
  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8031);
  createApp().listen(port, "127.0.0.1", () => console.log(`Lab JWT : http://127.0.0.1:${port}`));
}

module.exports = { createApp, createToken, decodeWithoutVerification };
