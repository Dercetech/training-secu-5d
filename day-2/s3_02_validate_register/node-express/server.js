"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const express = require("express");

// TODO S3.02 : importez ici les outils de validation que vous aurez choisis.

const exerciseDir = path.resolve(__dirname, "..");
const publicDir = path.join(exerciseDir, "public");
const defaultUsersPath = path.join(exerciseDir, "db", "users.json");

const publicEntries = [
  { id: 1, title: "Horaires du laboratoire", value: "09:00–16:30" },
  { id: 2, title: "Salle", value: "Local B-204" },
];

const confidentialEntries = [
  { id: 101, title: "Code fictif de l’alarme", value: "MOON-2048" },
  { id: 102, title: "Note de direction", value: "Données de démonstration uniquement" },
];

function readUsers(usersPath) {
  if (!fs.existsSync(usersPath)) return [];
  return JSON.parse(fs.readFileSync(usersPath, "utf8"));
}

function writeUsers(usersPath, users) {
  fs.mkdirSync(path.dirname(usersPath), { recursive: true });
  fs.writeFileSync(usersPath, `${JSON.stringify(users, null, 2)}\n`, "utf8");
}

function visibleUser(user) {
  return { id: user.id, user: user.user, role: user.role };
}

function createApp(options = {}) {
  const app = express();
  const usersPath = options.usersPath || process.env.USERS_FILE || defaultUsersPath;
  const sessions = new Map();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "16kb" }));

  // TODO S3.02 : imposez ici le contrat décrit dans le README avant l’écriture.
  app.post("/api/register", (request, response) => {
    const body = request.body || {};
    if (!body.user || !body.pwd) {
      response.status(400).json({ ok: false, error: "user et pwd sont obligatoires." });
      return;
    }

    const users = readUsers(usersPath);
    if (users.some((user) => user.user === body.user)) {
      response.status(409).json({ ok: false, error: "Ce nom existe déjà." });
      return;
    }

    // Toujours vulnérable au départ. Votre schéma doit protéger cette ligne.
    const newUser = { id: randomUUID(), role: "user", ...request.body };
    users.push(newUser);
    writeUsers(usersPath, users);

    const token = randomUUID();
    sessions.set(token, newUser.id);
    response.status(201).json({ ok: true, token, user: visibleUser(newUser) });
  });

  app.post("/api/login", (request, response) => {
    const body = request.body || {};
    const user = readUsers(usersPath).find(
      (entry) => entry.user === body.user && entry.pwd === body.pwd,
    );
    if (!user) {
      response.status(401).json({ ok: false, error: "Identifiants incorrects." });
      return;
    }
    const token = randomUUID();
    sessions.set(token, user.id);
    response.json({ ok: true, token, user: visibleUser(user) });
  });

  app.get("/api/dashboard", (request, response) => {
    const authorization = request.get("authorization") || "";
    const [scheme, token] = authorization.split(" ", 2);
    const userId = scheme === "Bearer" ? sessions.get(token) : undefined;
    const user = readUsers(usersPath).find((entry) => entry.id === userId);
    if (!user) {
      response.status(401).json({ ok: false, error: "Jeton absent ou inconnu." });
      return;
    }
    response.json({
      ok: true,
      token_received: token,
      viewer: visibleUser(user),
      data: {
        public: publicEntries,
        confidential: user.role === "admin"
          ? confidentialEntries
          : { access: "denied", message: "Réservé au rôle admin." },
      },
    });
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
  const port = Number(process.env.PORT || 8033);
  createApp().listen(port, "127.0.0.1", () => {
    console.log(`Lab disponible sur http://127.0.0.1:${port}`);
  });
}

module.exports = { createApp, readUsers, writeUsers };
