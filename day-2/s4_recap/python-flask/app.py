"""Day 2 recap: deliberately vulnerable local service dashboard."""

from __future__ import annotations

import hashlib
import os
import secrets
import sqlite3
from contextlib import closing
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, request, send_from_directory


EXERCISE_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = EXERCISE_DIR / "public"
DEFAULT_DATABASE_PATH = EXERCISE_DIR / "db" / "lab.sqlite3"
SEED_PATH = EXERCISE_DIR / "db" / "seed.sql"
MAX_SEARCH_LENGTH = 300


def initialise_database(database_path: Path) -> None:
    database_path.parent.mkdir(parents=True, exist_ok=True)
    with closing(sqlite3.connect(database_path)) as connection:
        connection.executescript(SEED_PATH.read_text(encoding="utf-8"))
        connection.commit()


def password_digest(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def build_unsafe_search(search: str) -> str:
    return (
        "SELECT id, name, port, status FROM services "
        f"WHERE name LIKE '%{search}%' ORDER BY id"
    )


def row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {key: row[key] for key in row.keys()}


def visible_user(user: sqlite3.Row) -> dict[str, Any]:
    return {"id": user["id"], "username": user["username"], "role": user["role"]}


def create_app(database_path: Path | None = None) -> Flask:
    app = Flask(__name__, static_folder=None)
    selected_database = Path(database_path or os.environ.get("DB_FILE", DEFAULT_DATABASE_PATH))
    sessions: dict[str, int] = {}
    initialise_database(selected_database)

    def connect() -> sqlite3.Connection:
        connection = sqlite3.connect(selected_database)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA busy_timeout = 2000")
        return connection

    def authenticated_user() -> sqlite3.Row | None:
        authorization = request.headers.get("Authorization", "")
        scheme, _, token = authorization.partition(" ")
        user_id = sessions.get(token) if scheme == "Bearer" else None
        if user_id is None:
            return None
        with closing(connect()) as connection:
            return connection.execute(
                "SELECT id, username, role FROM users WHERE id = ?",
                (user_id,),
            ).fetchone()

    @app.post("/api/login")
    def login():
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return jsonify(ok=False, error="JSON illisible."), 400
        username = payload.get("username") if isinstance(payload.get("username"), str) else ""
        password = payload.get("password") if isinstance(payload.get("password"), str) else ""
        with closing(connect()) as connection:
            user = connection.execute(
                "SELECT id, username, role FROM users "
                "WHERE username = ? AND password_sha256 = ?",
                (username, password_digest(password)),
            ).fetchone()

        if user is None:
            return jsonify(ok=False, error="Identifiants incorrects."), 401

        token = secrets.token_urlsafe(24)
        sessions[token] = int(user["id"])
        return jsonify(ok=True, token=token, user=visible_user(user))

    @app.get("/api/services")
    def search_services():
        user = authenticated_user()
        if user is None:
            return jsonify(ok=False, error="Session absente ou expirée."), 401

        search = request.args.get("q", "")
        if len(search) > MAX_SEARCH_LENGTH:
            return jsonify(ok=False, error="La recherche est trop longue."), 400

        try:
            with closing(connect()) as connection:
                rows = connection.execute(build_unsafe_search(search)).fetchmany(51)
        except sqlite3.Error as error:
            return jsonify(ok=False, error=f"SQLite : {error}"), 400

        return jsonify(
            ok=True,
            viewer=visible_user(user),
            rows=[row_to_dict(row) for row in rows[:50]],
        )

    @app.post("/api/services/<int:service_id>/status")
    def set_service_status(service_id: int):
        user = authenticated_user()
        if user is None:
            return jsonify(ok=False, error="Session absente ou expirée."), 401
        if user["role"] != "admin":
            return jsonify(ok=False, error="Action réservée au rôle admin."), 403

        payload = request.get_json(silent=True)
        next_status = payload.get("status") if isinstance(payload, dict) else None
        if next_status not in {"running", "stopped"}:
            return jsonify(ok=False, error="État de service invalide."), 400

        with closing(connect()) as connection:
            cursor = connection.execute(
                "UPDATE services SET status = ? WHERE id = ?",
                (next_status, service_id),
            )
            if cursor.rowcount == 0:
                return jsonify(ok=False, error="Service inconnu."), 404
            service = connection.execute(
                "SELECT id, name, port, status FROM services WHERE id = ?",
                (service_id,),
            ).fetchone()
            connection.commit()

        return jsonify(ok=True, service=row_to_dict(service))

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
        port=int(os.environ.get("PORT", "8041")),
        debug=False,
    )
