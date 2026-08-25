"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const repositoryDir = path.resolve(__dirname, "../../../..");
const exerciseDir = path.join(repositoryDir, "day-3", "s1_01_jwt");
const solutionDir = path.resolve(__dirname, "..");
const express = require(path.join(exerciseDir, "node-express", "node_modules", "express"));
const exercisePublicDir = path.join(exerciseDir, "public");
const solutionPublicDir = path.join(solutionDir, "public");
const usersPath = path.join(solutionDir, "db", "users.json");
const authCookie = "secu5d_auth";
const demoSecret = "secu5d-day3-local-secret";

const b64urlJson = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const loadUsers = () => JSON.parse(fs.readFileSync(usersPath, "utf8"));

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

function verifyToken(token) {
  if (typeof token !== "string" || !token || token.length > 4096) {
    throw new Error("Token absent ou trop long.");
  }
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Format JWT invalide.");
  let header;
  let payload;
  let suppliedSignature;
  try {
    header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    suppliedSignature = Buffer.from(parts[2], "base64url");
  } catch {
    throw new Error("JWT illisible.");
  }
  if (!header || Array.isArray(header) || header.alg !== "HS256" || header.typ !== "JWT") {
    throw new Error("Algorithme JWT refusé.");
  }
  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    throw new Error("Payload JWT invalide.");
  }
  const expectedSignature = crypto
    .createHmac("sha256", demoSecret)
    .update(`${parts[0]}.${parts[1]}`)
    .digest();
  if (
    suppliedSignature.length !== expectedSignature.length
    || !crypto.timingSafeEqual(suppliedSignature, expectedSignature)
  ) {
    throw new Error("Signature JWT invalide.");
  }
  if (!Number.isInteger(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error("JWT expiré ou sans expiration valide.");
  }
  const user = loadUsers().find((row) => row.username === payload.sub);
  if (!user || user.role !== payload.role) throw new Error("Utilisateur ou rôle invalide.");
  return { sub: user.username, name: user.name, role: user.role };
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

function currentClaims(request) {
  return verifyToken(cookieToken(request));
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
      httpOnly: true,
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

  app.get("/api/session", (request, response) => {
    try {
      return response.json({ ok: true, user: currentClaims(request) });
    } catch (error) {
      return response.status(401).json({ ok: false, error: error.message });
    }
  });

  app.get("/api/users", (request, response) => {
    let claims;
    try {
      claims = currentClaims(request);
    } catch (error) {
      return response.status(401).json({ ok: false, error: error.message });
    }
    if (claims.role !== "admin") {
      return response.status(403).json({ ok: false, error: "Rôle admin requis." });
    }
    return response.json({ ok: true, users: publicUsers() });
  });

  app.get(["/", "/login"], (request, response) => {
    response.sendFile(path.join(exercisePublicDir, "login.html"));
  });
  app.get("/dashboard", (request, response) => {
    response.sendFile(path.join(solutionPublicDir, "dashboard.html"));
  });
  app.get("/users", (request, response) => {
    response.sendFile(path.join(solutionPublicDir, "users.html"));
  });
  app.get("/app.js", (request, response) => {
    response.sendFile(path.join(solutionPublicDir, "app.js"));
  });
  app.get("/styles.css", (request, response) => {
    response.sendFile(path.join(exercisePublicDir, "styles.css"));
  });
  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8051);
  createApp().listen(port, "127.0.0.1", () => {
    console.log(`Solution JWT : http://127.0.0.1:${port}`);
  });
}

module.exports = { createApp, createToken, verifyToken };
