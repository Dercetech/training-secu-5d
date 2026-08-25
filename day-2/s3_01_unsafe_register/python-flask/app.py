"""Inscription JSON volontairement non validée pour le laboratoire S3.01."""

from __future__ import annotations

import json
import os
import secrets
import uuid
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, request, send_from_directory


EXERCISE_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = EXERCISE_DIR / "public"
DEFAULT_USERS_PATH = EXERCISE_DIR / "db" / "users.json"

PUBLIC_ENTRIES = [
    {"id": 1, "title": "Horaires du laboratoire", "value": "09:00–16:30"},
    {"id": 2, "title": "Salle", "value": "Local B-204"},
]

CONFIDENTIAL_ENTRIES = [
    {"id": 101, "title": "Code fictif de l’alarme", "value": "MOON-2048"},
    {
        "id": 102,
        "title": "Note de direction",
        "value": "Données de démonstration uniquement",
    },
]


def read_users(users_path: Path) -> list[dict[str, Any]]:
    if not users_path.exists():
        return []
    return json.loads(users_path.read_text(encoding="utf-8"))


def write_users(users_path: Path, users: list[dict[str, Any]]) -> None:
    users_path.parent.mkdir(parents=True, exist_ok=True)
    users_path.write_text(
        json.dumps(users, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def visible_user(user: dict[str, Any]) -> dict[str, Any]:
    return {"id": user.get("id"), "user": user.get("user"), "role": user.get("role")}


def create_app(users_path: Path | None = None) -> Flask:
    app = Flask(__name__, static_folder=None)
    app.config["MAX_CONTENT_LENGTH"] = 16 * 1024
    selected_users_path = Path(
        users_path or os.environ.get("USERS_FILE", DEFAULT_USERS_PATH)
    )
    sessions: dict[str, str] = {}

    @app.post("/api/register")
    def register():
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict) or not payload.get("user") or not payload.get("pwd"):
            return jsonify(ok=False, error="user et pwd sont obligatoires."), 400

        users = read_users(selected_users_path)
        if any(user.get("user") == payload.get("user") for user in users):
            return jsonify(ok=False, error="Ce nom existe déjà."), 409

        # Volontairement dangereux : toutes les propriétés du client sont avalées.
        new_user = {"id": str(uuid.uuid4()), "role": "user", **payload}
        users.append(new_user)
        write_users(selected_users_path, users)

        token = secrets.token_urlsafe(24)
        sessions[token] = str(new_user["id"])
        return jsonify(ok=True, token=token, user=visible_user(new_user)), 201

    @app.post("/api/login")
    def login():
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return jsonify(ok=False, error="JSON illisible."), 400

        user = next(
            (
                entry
                for entry in read_users(selected_users_path)
                if entry.get("user") == payload.get("user")
                and entry.get("pwd") == payload.get("pwd")
            ),
            None,
        )
        if user is None:
            return jsonify(ok=False, error="Identifiants incorrects."), 401

        token = secrets.token_urlsafe(24)
        sessions[token] = str(user.get("id"))
        return jsonify(ok=True, token=token, user=visible_user(user))

    @app.get("/api/dashboard")
    def dashboard():
        authorization = request.headers.get("Authorization", "")
        scheme, _, token = authorization.partition(" ")
        user_id = sessions.get(token) if scheme == "Bearer" else None
        user = next(
            (
                entry
                for entry in read_users(selected_users_path)
                if str(entry.get("id")) == user_id
            ),
            None,
        )
        if user is None:
            return jsonify(ok=False, error="Jeton absent ou inconnu."), 401

        confidential: Any = (
            CONFIDENTIAL_ENTRIES
            if user.get("role") == "admin"
            else {"access": "denied", "message": "Réservé au rôle admin."}
        )
        return jsonify(
            ok=True,
            token_received=token,
            viewer=visible_user(user),
            data={"public": PUBLIC_ENTRIES, "confidential": confidential},
        )

    @app.get("/")
    def index():
        return send_from_directory(PUBLIC_DIR, "index.html")

    @app.get("/<path:asset_path>")
    def public_asset(asset_path: str):
        return send_from_directory(PUBLIC_DIR, asset_path)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=int(os.environ.get("PORT", "8031")),
        debug=False,
    )
