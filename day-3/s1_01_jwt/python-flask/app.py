"""Flask flavour for the deliberately unverified JWT authorization lab."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory


EXERCISE_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = EXERCISE_DIR / "public"
USERS_PATH = EXERCISE_DIR / "db" / "users.json"
DEMO_SECRET = b"secu5d-day3-local-secret"
AUTH_COOKIE = "secu5d_auth"


def b64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def b64url_decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def create_token(user: dict[str, str]) -> str:
    now = int(time.time())
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": user["username"],
        "name": user["name"],
        "role": user["role"],
        "iat": now,
        "exp": now + 3600,
    }
    header_part = b64url_encode(json.dumps(header, separators=(",", ":")).encode())
    payload_part = b64url_encode(json.dumps(payload, separators=(",", ":")).encode())
    signing_input = f"{header_part}.{payload_part}"
    signature = hmac.new(DEMO_SECRET, signing_input.encode("ascii"), hashlib.sha256).digest()
    return f"{signing_input}.{b64url_encode(signature)}"


def decode_without_verification(token: object) -> dict[str, object]:
    """Decode the payload on purpose without checking the JWT signature."""
    if not isinstance(token, str) or len(token) > 4096:
        raise ValueError("Token absent ou trop long.")
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Un JWT contient exactement trois parties.")
    try:
        payload = json.loads(b64url_decode(parts[1]))
    except (ValueError, json.JSONDecodeError) as error:
        raise ValueError("Le JWT n'est pas lisible.") from error
    if not isinstance(payload, dict):
        raise ValueError("Le payload doit être un objet JSON.")
    return payload


def cookie_token() -> str:
    token = request.cookies.get(AUTH_COOKIE, "")
    if not token:
        raise ValueError("Cookie d’authentification absent.")
    return token


def load_users() -> list[dict[str, str]]:
    return json.loads(USERS_PATH.read_text(encoding="utf-8"))


def public_users() -> list[dict[str, str]]:
    return [
        {"username": row["username"], "name": row["name"], "role": row["role"]}
        for row in load_users()
    ]


def create_app() -> Flask:
    app = Flask(__name__, static_folder=None)

    @app.post("/api/login")
    def login():
        body = request.get_json(silent=True) or {}
        user = next(
            (
                row
                for row in load_users()
                if row["username"] == body.get("username")
                and row["password"] == body.get("password")
            ),
            None,
        )
        if user is None:
            return jsonify(ok=False, error="Identifiants incorrects."), 401
        response = jsonify(ok=True)
        response.set_cookie(
            AUTH_COOKIE,
            create_token(user),
            max_age=3600,
            httponly=False,
            samesite="Lax",
            path="/",
        )
        return response

    @app.post("/api/logout")
    def logout():
        response = jsonify(ok=True)
        response.delete_cookie(AUTH_COOKIE, path="/", samesite="Lax")
        return response

    @app.get("/api/users")
    def users():
        try:
            payload = decode_without_verification(cookie_token())
        except ValueError as error:
            return jsonify(ok=False, error=str(error)), 401
        if payload.get("role") != "admin":
            return jsonify(ok=False, error="Rôle admin requis."), 403
        return jsonify(ok=True, users=public_users())

    @app.get("/")
    @app.get("/login")
    def login_page():
        return send_from_directory(PUBLIC_DIR, "login.html")

    @app.get("/dashboard")
    def dashboard_page():
        return send_from_directory(PUBLIC_DIR, "dashboard.html")

    @app.get("/users")
    def users_page():
        return send_from_directory(PUBLIC_DIR, "users.html")

    @app.get("/<path:asset_path>")
    def public_asset(asset_path: str):
        return send_from_directory(PUBLIC_DIR, asset_path)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "8031")), debug=False)
