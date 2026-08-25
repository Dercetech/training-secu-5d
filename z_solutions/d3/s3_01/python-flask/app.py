"""Explicit-origin Flask solution for Day 3, S3.01."""

from __future__ import annotations

import os
from pathlib import Path
from threading import Thread

from flask import Flask, jsonify, request, send_from_directory


REPOSITORY_DIR = Path(__file__).resolve().parents[4]
EXERCISE_DIR = REPOSITORY_DIR / "day-3" / "s3_01_cors"
PUBLIC_DIR = EXERCISE_DIR / "public"
ALLOWED_ORIGIN = "http://127.0.0.1:8034"


def register_public_routes(app: Flask) -> None:
    @app.get("/")
    def index():
        return send_from_directory(PUBLIC_DIR, "index.html")

    @app.get("/<path:asset_path>")
    def public_asset(asset_path: str):
        return send_from_directory(PUBLIC_DIR, asset_path)


def create_api_app() -> Flask:
    app = Flask("cors-solution-api-and-ui", static_folder=None)

    @app.get("/api/data")
    def api_data():
        origin = request.headers.get("Origin", "")
        if origin and origin != ALLOWED_ORIGIN:
            response = jsonify(ok=False, error="Origine refusée.")
            response.status_code = 403
        else:
            response = jsonify(
                ok=True,
                message="Données fictives de la vraie application.",
                requested_by=origin or "same-origin",
            )
        response.headers["Vary"] = "Origin"
        if origin == ALLOWED_ORIGIN:
            response.headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGIN
        return response

    register_public_routes(app)
    return app


def create_secondary_ui_app() -> Flask:
    app = Flask("cors-solution-secondary-ui", static_folder=None)
    register_public_routes(app)
    return app


api_app = create_api_app()
secondary_ui_app = create_secondary_ui_app()
app = api_app


if __name__ == "__main__":
    api_port = int(os.environ.get("API_PORT", "8034"))
    secondary_port = int(os.environ.get("SECONDARY_PORT", "8038"))
    Thread(
        target=secondary_ui_app.run,
        kwargs={
            "host": "127.0.0.1",
            "port": secondary_port,
            "debug": False,
            "use_reloader": False,
        },
        daemon=True,
    ).start()
    api_app.run(
        host="127.0.0.1",
        port=api_port,
        debug=False,
        use_reloader=False,
    )
