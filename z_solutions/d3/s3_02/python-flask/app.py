"""Environment-variable Flask solution for Day 3, S3.02."""

from __future__ import annotations

import os
from pathlib import Path

from flask import Flask, jsonify, send_from_directory


REPOSITORY_DIR = Path(__file__).resolve().parents[4]
EXERCISE_DIR = REPOSITORY_DIR / "day-3" / "s3_02_secrets"
PUBLIC_DIR = EXERCISE_DIR / "public"
SECRET_NAME = "CLASSROOM_SERVICE_TOKEN"


def query_classroom_service(service_token: str) -> dict[str, str]:
    """Represent a server-side SDK call without transmitting anything."""
    if not service_token:
        raise ValueError("Service token missing")
    return {"service": "classroom-notifications", "status": "ready"}


def create_app() -> Flask:
    app = Flask(__name__, static_folder=None)
    service_token = os.environ.get(SECRET_NAME)

    @app.get("/api/unsafe/config")
    @app.get("/api/safe/config")
    def safe_config():
        if not service_token:
            return jsonify(
                ok=False,
                error="Configuration serveur incomplète.",
                configured=False,
            ), 503
        service = query_classroom_service(service_token)
        return jsonify(ok=True, configured=True, **service)

    @app.get("/")
    def index():
        return send_from_directory(PUBLIC_DIR, "index.html")

    @app.get("/<path:asset_path>")
    def public_asset(asset_path: str):
        return send_from_directory(PUBLIC_DIR, asset_path)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "8054")), debug=False)
