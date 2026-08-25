"use strict";

const crypto = require("node:crypto");
const path = require("node:path");
const express = require("express");

const publicDir = path.resolve(__dirname, "..", "public");
const demoUser = { username: "admin", password: "password", name: "Alex" };

function publicUser() {
  return { username: demoUser.username, name: demoUser.name };
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
  const sessions = new Map();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "10kb" }));

  app.post("/api/login", (request, response) => {
    const { username, password } = request.body || {};
    if (username !== demoUser.username || password !== demoUser.password) {
      response.status(401).json({ ok: false, error: "Identifiants incorrects." });
      return;
    }

    const token = crypto.randomBytes(24).toString("base64url");
    const user = publicUser();
    sessions.set(token, user);

    // Exercice : décommentez une option à la fois, redémarrez le serveur,
    // supprimez l'ancien cookie dans DevTools, puis reconnectez-vous.
    response.cookie("session", token, {
      // httpOnly: true,
      // secure: true,
      // sameSite: "lax",
      // path: "/",
      // domain: "127.0.0.1",
      // maxAge: 60 * 60 * 1000,
    });
    response.json({ ok: true, user });
  });

  app.get("/api/me", (request, response) => {
    const user = sessions.get(readCookie(request, "session"));
    if (!user) {
      response.status(401).json({
        ok: false,
        error: "Session absente ou cookie non envoyé.",
      });
      return;
    }
    response.json({ ok: true, user });
  });

  app.post("/api/logout", (request, response) => {
    sessions.delete(readCookie(request, "session"));
    response.clearCookie("session", { path: "/" });
    response.json({ ok: true });
  });

  app.use(express.static(publicDir));
  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8012);
  createApp().listen(port, "127.0.0.1", () => {
    console.log(`Lab disponible sur http://127.0.0.1:${port}`);
  });
}

module.exports = { createApp };
