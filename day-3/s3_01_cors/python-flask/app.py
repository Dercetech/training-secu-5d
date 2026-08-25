"""Two-origin Flask flavour for the deliberately permissive CORS lab."""

from __future__ import annotations

import os
from pathlib import Path
from threading import Thread

from flask import Flask, jsonify, request, send_from_directory


EXERCISE_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = EXERCISE_DIR / "public"


def register_public_routes(app: Flask) -> None:
    @app.get("/")
    def index():
        return send_from_directory(PUBLIC_DIR, "index.html")

    @app.get("/<path:asset_path>")
    def public_asset(asset_path: str):
        return send_from_directory(PUBLIC_DIR, asset_path)


def create_api_app() -> Flask:
    app = Flask("cors-api-and-ui", static_folder=None)

    @app.get("/api/data")
    def api_data():
        origin = request.headers.get("Origin", "")
        response = jsonify(
            ok=True,
            message="Données fictives de la vraie application.",
            requested_by=origin or "same-origin",
        )
        if origin:
            # Vulnérabilité volontaire : n’importe quelle origine est recopiée.
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Vary"] = "Origin"
        return response

    register_public_routes(app)
    return app


def create_secondary_ui_app() -> Flask:
    app = Flask("cors-secondary-ui", static_folder=None)
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
