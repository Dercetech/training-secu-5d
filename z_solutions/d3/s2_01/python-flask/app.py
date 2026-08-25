"""Owner-authorization Flask solution for Day 3, S2.01."""

from __future__ import annotations

import json
import os
import secrets
from functools import wraps
from pathlib import Path

from flask import Flask, g, jsonify, request, send_from_directory


REPOSITORY_DIR = Path(__file__).resolve().parents[4]
EXERCISE_DIR = REPOSITORY_DIR / "day-3" / "s2_01_idor"
PUBLIC_DIR = EXERCISE_DIR / "public"
DB_DIR = EXERCISE_DIR / "db"
SESSION_COOKIE = "idor_lab_session"


def read_table(name: str) -> list[dict]:
    return json.loads((DB_DIR / f"{name}.json").read_text(encoding="utf-8"))


def public_user(user: dict) -> dict:
    return {"username": user["username"], "name": user["name"]}


def create_app() -> Flask:
    app = Flask(__name__, static_folder=None)
    sessions: dict[str, str] = {}

    @app.before_request
    def identify_user():
        session_id = request.cookies.get(SESSION_COOKIE, "")
        username = sessions.get(session_id)
        g.current_user = next(
            (user for user in read_table("users") if user["username"] == username),
            None,
        )
        g.session_id = session_id

    def require_user():
        if g.current_user is None:
            return jsonify(ok=False, error="Connectez-vous pour continuer."), 401
        return None

    def document_by_id(note_id: int) -> dict | None:
        return next(
            (row for row in read_table("documents") if row["id"] == note_id),
            None,
        )

    def require_owner(view):
        @wraps(view)
        def wrapped(note_id: int):
            auth_error = require_user()
            if auth_error:
                return auth_error
            note = document_by_id(note_id)
            if note is None:
                return jsonify(ok=False, error="Note introuvable."), 404
            if note["owner"] != g.current_user["username"]:
                return jsonify(
                    ok=False,
                    error="Accès refusé : cette note appartient à un autre utilisateur.",
                ), 403
            return view(note_id, note)

        return wrapped

    @app.post("/api/login")
    def login():
        payload = request.get_json(silent=True) or {}
        user = next(
            (
                row
                for row in read_table("users")
                if row["username"] == payload.get("username")
                and row["password"] == payload.get("password")
            ),
            None,
        )
        if user is None:
            return jsonify(ok=False, error="Identifiants incorrects."), 401
        session_id = secrets.token_urlsafe(32)
        sessions[session_id] = user["username"]
        response = jsonify(ok=True, user=public_user(user))
        response.set_cookie(
            SESSION_COOKIE,
            session_id,
            httponly=True,
            samesite="Lax",
            path="/",
        )
        return response

    @app.post("/api/logout")
    def logout():
        sessions.pop(g.session_id, None)
        response = jsonify(ok=True)
        response.delete_cookie(SESSION_COOKIE, path="/")
        return response

    @app.get("/api/session")
    def session():
        auth_error = require_user()
        if auth_error:
            return auth_error
        return jsonify(ok=True, user=public_user(g.current_user))

    @app.get("/api/notes")
    def notes():
        auth_error = require_user()
        if auth_error:
            return auth_error
        own_notes = [
            {"id": row["id"], "title": row["title"]}
            for row in read_table("documents")
            if row["owner"] == g.current_user["username"]
        ]
        return jsonify(ok=True, notes=own_notes)

    @app.get("/api/unsecure/notes/<int:note_id>")
    def unsecure_note(note_id: int):
        auth_error = require_user()
        if auth_error:
            return auth_error
        note = document_by_id(note_id)
        if note is None:
            return jsonify(ok=False, error="Note introuvable."), 404
        return jsonify(
            ok=True,
            note=note,
            warning="Le propriétaire de la note n’a pas été vérifié.",
        )

    @app.get("/api/secure/notes/<int:note_id>")
    @require_owner
    def secure_note(note_id: int, note: dict):
        return jsonify(ok=True, note=note)

    @app.get("/")
    @app.get("/dashboard/")
    def index():
        return send_from_directory(PUBLIC_DIR, "index.html")

    @app.get("/unsecure/notes/<int:note_id>/")
    @app.get("/secure/notes/<int:note_id>/")
    def note_page(note_id: int):
        return send_from_directory(PUBLIC_DIR, "note.html")

    @app.get("/<path:asset_path>")
    def public_asset(asset_path: str):
        return send_from_directory(PUBLIC_DIR, asset_path)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=int(os.environ.get("PORT", "8052")),
        debug=False,
    )
