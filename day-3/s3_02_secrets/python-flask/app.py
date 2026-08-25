"""Flask flavour for the environment-variable secret exercise."""

from __future__ import annotations

import os
from pathlib import Path

from flask import Flask, jsonify, send_from_directory


EXERCISE_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = EXERCISE_DIR / "public"
HARDCODED_FAKE_SECRET = "demo_service_token_not_real_123"


def create_app() -> Flask:
    app = Flask(__name__, static_folder=None)

    @app.get("/api/unsafe/config")
    def unsafe_config():
        return jsonify(
            ok=True,
            service="classroom-notifications",
            configured=True,
            service_token=HARDCODED_FAKE_SECRET,
            warning="Le secret est codé en dur et envoyé au navigateur.",
        )

    @app.get("/api/safe/config")
    def safe_config():
        # TODO :
        # 1. lire CLASSROOM_SERVICE_TOKEN avec os.environ.get ;
        # 2. renvoyer 503 si la variable manque ;
        # 3. utiliser le secret uniquement côté serveur ;
        # 4. ne jamais inclure sa valeur dans la réponse JSON.
        return jsonify(
            ok=False,
            error="Lecture sécurisée de CLASSROOM_SERVICE_TOKEN à implémenter.",
        ), 501

    @app.get("/")
    def index():
        return send_from_directory(PUBLIC_DIR, "index.html")

    @app.get("/<path:asset_path>")
    def public_asset(asset_path: str):
        return send_from_directory(PUBLIC_DIR, asset_path)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "8035")), debug=False)
