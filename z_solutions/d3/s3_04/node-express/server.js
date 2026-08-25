"use strict";

const path = require("node:path");
const fs = require("node:fs");

const solutionDir = path.resolve(__dirname, "..");
const express = require("express");
const publicDir = path.join(solutionDir, "public");
const apiAssetDir = path.join(solutionDir, "api-assets");
const securityHeaders = {
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "geolocation=()",
};
const cspSolution = [
  "default-src 'self'",
  "script-src 'self' https://training.dercetech.com",
  "style-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
].join("; ");
const permissionsPolicySolution = "camera=(), microphone=(), geolocation=()";

function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.get(["/api/unsafe/report", "/api/safe/report"], (request, response) => {
    response.set(securityHeaders);
    response.json({ ok: true, report: "Rapport fictif" });
  });
  app.get("/api/x-content-type-options/script", (request, response) => {
    response.set("X-Content-Type-Options", "nosniff");
    response.type("application/javascript");
    response.send(fs.readFileSync(path.join(apiAssetDir, "mime-demo.js"), "utf8"));
  });
  app.get("/api/x-content-type-options/styles", (request, response) => {
    response.set("X-Content-Type-Options", "nosniff");
    response.type("text/css");
    response.send(fs.readFileSync(path.join(apiAssetDir, "mime-demo.css"), "utf8"));
  });
  app.get("/referrer-policy/unsafe/", (request, response) => {
    response.set("Referrer-Policy", "unsafe-url");
    response.set("Cache-Control", "no-store");
    response.sendFile(path.join(publicDir, "referrer-policy", "unsafe.html"));
  });
  app.get("/referrer-policy/safe/", (request, response) => {
    response.set("Referrer-Policy", "no-referrer");
    response.set("Cache-Control", "no-store");
    response.sendFile(path.join(publicDir, "referrer-policy", "safe.html"));
  });
  app.get("/content-security-policy/", (request, response) => {
    response.set("Content-Security-Policy", cspSolution);
    response.set("Cache-Control", "no-store");
    response.sendFile(path.join(publicDir, "content-security-policy", "index.html"));
  });
  app.get("/permissions-policy/", (request, response) => {
    response.set("Permissions-Policy", permissionsPolicySolution);
    response.set("Cache-Control", "no-store");
    response.sendFile(path.join(publicDir, "permissions-policy", "index.html"));
  });
  app.use(express.static(publicDir));
  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8056);
  createApp().listen(port, "127.0.0.1", () => {
    console.log(`Solution headers : http://127.0.0.1:${port}`);
  });
}

module.exports = { createApp, securityHeaders };
