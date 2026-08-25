"""Flask flavour of the cookie-parameter exercise."""

from __future__ import annotations

import os
import secrets
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory


EXERCISE_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = EXERCISE_DIR / "public"
DEMO_USER = {"username": "admin", "password": "password", "name": "Alex"}


def public_user() -> dict[str, str]:
    return {"username": DEMO_USER["username"], "name": DEMO_USER["name"]}


def create_app() -> Flask:
    app = Flask(__name__, static_folder=None)
    sessions: dict[str, dict[str, str]] = {}

    @app.post("/api/login")
    def login():
        body = request.get_json(silent=True) or {}
        if (
            body.get("username") != DEMO_USER["username"]
            or body.get("password") != DEMO_USER["password"]
        ):
            return jsonify(ok=False, error="Identifiants incorrects."), 401

        token = secrets.token_urlsafe(24)
        user = public_user()
        sessions[token] = user
        response = jsonify(ok=True, user=user)

        # Exercice : décommentez une option à la fois, redémarrez le serveur,
        # supprimez l'ancien cookie dans DevTools, puis reconnectez-vous.
        response.set_cookie(
            "session",
            token,
            # httponly=True,
            # secure=True,
            # samesite="Lax",
            # path="/",
            # domain="127.0.0.1",
            # max_age=3600,
        )
        return response

    @app.get("/api/me")
    def me():
        user = sessions.get(request.cookies.get("session", ""))
        if user is None:
            return jsonify(ok=False, error="Session absente ou cookie non envoyé."), 401
        return jsonify(ok=True, user=user)

    @app.post("/api/logout")
    def logout():
        token = request.cookies.get("session", "")
        sessions.pop(token, None)
        response = jsonify(ok=True)
        response.delete_cookie("session", path="/")
        return response

    @app.get("/")
    def index():
        return send_from_directory(PUBLIC_DIR, "index.html")

    @app.get("/<path:asset_path>")
    def public_asset(asset_path: str):
        return send_from_directory(PUBLIC_DIR, asset_path)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "8012")), debug=False)
