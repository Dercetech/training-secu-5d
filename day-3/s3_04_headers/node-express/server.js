"use strict";
const path = require("node:path");
const fs = require("node:fs");
const express = require("express");
const publicDir = path.resolve(__dirname, "..", "public");
const apiAssetDir = path.resolve(__dirname, "..", "api-assets");
const securityHeaders = {
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "geolocation=()",
};
const cspLearner = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
].join("; ");
const permissionsPolicyLearner = [
  'camera=(self "https://training.dercetech.com")',
  "microphone=()",
  "geolocation=()",
].join(", ");
function createApp() {
  const app = express(); app.disable("x-powered-by");
  app.get("/api/unsafe/report", (request, response) => response.json({ ok: true, report: "Rapport fictif" }));
  app.get("/api/safe/report", (request, response) => { response.set(securityHeaders); response.json({ ok: true, report: "Rapport fictif" }); });
  app.get("/api/x-content-type-options/script", (request, response) => {
    // TODO : annoncez application/javascript dans le Content-Type.
    response.set("X-Content-Type-Options", "nosniff");
    response.end(fs.readFileSync(path.join(apiAssetDir, "mime-demo.js"), "utf8"));
  });
  app.get("/api/x-content-type-options/styles", (request, response) => {
    // TODO : annoncez text/css dans le Content-Type.
    response.set("X-Content-Type-Options", "nosniff");
    response.end(fs.readFileSync(path.join(apiAssetDir, "mime-demo.css"), "utf8"));
  });
  app.get("/referrer-policy/unsafe/", (request, response) => {
    response.set("Referrer-Policy", "unsafe-url");
    response.set("Cache-Control", "no-store");
    response.sendFile(path.join(publicDir, "referrer-policy", "unsafe.html"));
  });
  app.get("/referrer-policy/safe/", (request, response) => {
    // TODO : remplacez la politique bavarde par no-referrer.
    response.set("Referrer-Policy", "unsafe-url");
    response.set("Cache-Control", "no-store");
    response.sendFile(path.join(publicDir, "referrer-policy", "safe.html"));
  });
  app.get("/content-security-policy/", (request, response) => {
    // TODO : ajoutez uniquement https://training.dercetech.com à script-src.
    response.set("Content-Security-Policy", cspLearner);
    response.set("Cache-Control", "no-store");
    response.sendFile(path.join(publicDir, "content-security-policy", "index.html"));
  });
  app.get("/permissions-policy/", (request, response) => {
    // TODO : retirez la caméra à tous les contenus avec camera=().
    response.set("Permissions-Policy", permissionsPolicyLearner);
    response.set("Cache-Control", "no-store");
    response.sendFile(path.join(publicDir, "permissions-policy", "index.html"));
  });
  app.use(express.static(publicDir)); return app;
}
if (require.main === module) { const port=Number(process.env.PORT||8037); createApp().listen(port,"127.0.0.1",()=>console.log(`Lab headers : http://127.0.0.1:${port}`)); }
module.exports = { createApp, securityHeaders };
