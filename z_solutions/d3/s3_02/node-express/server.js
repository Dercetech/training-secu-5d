"use strict";

const path = require("node:path");

const repositoryDir = path.resolve(__dirname, "../../../..");
const exerciseDir = path.join(repositoryDir, "day-3", "s3_02_secrets");
const express = require(path.join(exerciseDir, "node-express", "node_modules", "express"));
const publicDir = path.join(exerciseDir, "public");

function queryClassroomService(serviceToken) {
  if (!serviceToken) throw new Error("Service token missing");
  return { service: "classroom-notifications", status: "ready" };
}

function createApp() {
  const app = express();
  const serviceToken = process.env.CLASSROOM_SERVICE_TOKEN;
  app.disable("x-powered-by");

  app.get(["/api/unsafe/config", "/api/safe/config"], (request, response) => {
    if (!serviceToken) {
      return response.status(503).json({
        ok: false,
        error: "Configuration serveur incomplète.",
        configured: false,
      });
    }
    const service = queryClassroomService(serviceToken);
    return response.json({ ok: true, configured: true, ...service });
  });

  app.use(express.static(publicDir));
  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8054);
  createApp().listen(port, "127.0.0.1", () => {
    console.log(`Solution secrets : http://127.0.0.1:${port}`);
  });
}

module.exports = { createApp, queryClassroomService };
