"use strict";

const path = require("node:path");
const express = require("express");

const publicDir = path.resolve(__dirname, "..", "public");

function createApp() {
  const app = express();

  app.disable("x-powered-by");
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
