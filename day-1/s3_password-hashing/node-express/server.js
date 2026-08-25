"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { performance } = require("node:perf_hooks");
const argon2 = require("argon2");
const express = require("express");
const { findPassword, MAX_LENGTH } = require("./rainbow-table");

const exerciseDir = path.resolve(__dirname, "..");
const staticDir = path.join(exerciseDir, "static");
const usersFile = path.join(exerciseDir, "db", "users.json");
const demoPassword = "password";
const shaIterations = 10_000;
const argonSampleIterations = 3;
const argonTargetIterations = 10_000;
const sha256Pattern = /^[0-9a-f]{64}$/;

function sha256Password(password) {
  return crypto.createHash("sha256").update(password, "utf8").digest("hex");
}

function loadUsers() {
  const users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
  if (!Array.isArray(users)) throw new Error("db/users.json doit contenir une liste.");
  return users;
}

function publicUser(user) {
  return { username: user.username, name: user.name };
}

function exposedHash(user) {
  return {
    username: user.username,
    name: user.name,
    password_hash: user.password_hash,
  };
}

function sameHash(first, second) {
  const firstBuffer = Buffer.from(first, "hex");
  const secondBuffer = Buffer.from(second, "hex");
  return firstBuffer.length === secondBuffer.length && crypto.timingSafeEqual(firstBuffer, secondBuffer);
}

function sha256Benchmark() {
  const startedAt = performance.now();
  let sampleHash = "";
  for (let index = 0; index < shaIterations; index += 1) {
    sampleHash = sha256Password(demoPassword);
  }
  const elapsedMilliseconds = performance.now() - startedAt;
  return {
    algorithm: "SHA-256",
    iterations: shaIterations,
    elapsed_ms: Number(elapsedMilliseconds.toFixed(3)),
    hashes_per_second: Math.round(shaIterations / (elapsedMilliseconds / 1_000)),
    sample_hash: sampleHash,
  };
}

async function argon2Benchmark() {
  const startedAt = performance.now();
  let sampleHash = "";
  for (let index = 0; index < argonSampleIterations; index += 1) {
    sampleHash = await argon2.hash(demoPassword);
  }
  const measuredMilliseconds = performance.now() - startedAt;
  return {
    algorithm: "Argon2id",
    measured_iterations: argonSampleIterations,
    target_iterations: argonTargetIterations,
    measured_ms: Number(measuredMilliseconds.toFixed(3)),
    projected_ms: Number(
      (measuredMilliseconds / argonSampleIterations * argonTargetIterations).toFixed(3),
    ),
    sample_hash: sampleHash,
    projection_only: true,
  };
}

function createApp() {
  const app = express();
  const users = loadUsers();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: false }));

  app.post(["/api/login", "/login"], (request, response) => {
    const { username = "", password = "" } = request.body || {};
    const suppliedHash = sha256Password(String(password));
    const user = users.find(
      (candidate) => candidate.username === username && sameHash(candidate.password_hash, suppliedHash),
    );

    if (!user) {
      response.status(401).json({ ok: false, error: "Identifiants incorrects." });
      return;
    }
    response.json({ ok: true, user: publicUser(user) });
  });

  app.get(["/api/dump", "/dump"], (_request, response) => {
    // Intentionally exposed for this local classroom exercise only.
    response.json(users.map(exposedHash));
  });

  app.post(["/api/benchmark", "/benchmark"], (_request, response) => {
    response.json(sha256Benchmark());
  });

  app.post("/api/argon2/hash", async (_request, response) => {
    response.json({ algorithm: "Argon2id", hash: await argon2.hash(demoPassword) });
  });

  app.post("/api/argon2/benchmark", async (_request, response) => {
    response.json(await argon2Benchmark());
  });

  app.post("/api/decrypt", (request, response) => {
    const targetHash = String(request.body?.hash || "").toLowerCase();
    const minLength = Number(request.body?.min_length);
    const maxLength = Number(request.body?.max_length);
    if (!sha256Pattern.test(targetHash)) {
      response.status(400).json({
        ok: false,
        error: "Un SHA-256 hexadécimal de 64 caractères est requis.",
      });
      return;
    }

    const validRange =
      Number.isInteger(minLength) &&
      Number.isInteger(maxLength) &&
      minLength >= 1 &&
      minLength <= maxLength &&
      maxLength <= MAX_LENGTH;
    if (!validRange) {
      response.status(400).json({
        ok: false,
        error: "Plage requise : 1 ≤ min ≤ max ≤ 4.",
      });
      return;
    }

    const searchResult = findPassword(targetHash, minLength, maxLength);
    if (searchResult === null) {
      response.status(501).json({
        ok: false,
        error: "Labo : implémentez findPassword dans rainbow-table.js.",
      });
      return;
    }

    if (searchResult.password === null) {
      response.status(404).json({
        ok: false,
        error: "Aucun mot de passe trouvé dans la plage demandée.",
        elapsed_ms: searchResult.elapsed_ms,
        min_length: minLength,
        max_length: maxLength,
      });
      return;
    }
    response.json({
      ok: true,
      password: searchResult.password,
      elapsed_ms: searchResult.elapsed_ms,
      min_length: minLength,
      max_length: maxLength,
      method: "sequential_sha256_search",
    });
  });

  app.use(express.static(staticDir));
  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8015);
  createApp().listen(port, "127.0.0.1", () => {
    console.log(`Lab disponible sur http://127.0.0.1:${port}`);
  });
}

module.exports = {
  argon2Benchmark,
  createApp,
  loadUsers,
  sha256Benchmark,
  sha256Password,
};
