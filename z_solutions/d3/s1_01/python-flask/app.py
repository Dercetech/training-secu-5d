"""Verified Flask solution for Day 3, S1.01."""

from __future__ import annotations

import base64
import binascii
import hashlib
import hmac
import json
import os
import time
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory


SOLUTION_DIR = Path(__file__).resolve().parent.parent
REPOSITORY_DIR = Path(__file__).resolve().parents[4]
EXERCISE_PUBLIC_DIR = REPOSITORY_DIR / "day-3" / "s1_01_jwt" / "public"
SOLUTION_PUBLIC_DIR = SOLUTION_DIR / "public"
USERS_PATH = SOLUTION_DIR / "db" / "users.json"
AUTH_COOKIE = "secu5d_auth"
DEMO_SECRET = b"secu5d-day3-local-secret"


def b64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def b64url_decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def read_json_part(value: str) -> dict[str, object]:
    decoded = json.loads(b64url_decode(value))
    if not isinstance(decoded, dict):
        raise ValueError("Partie JWT invalide.")
    return decoded


def load_users() -> list[dict[str, str]]:
    return json.loads(USERS_PATH.read_text(encoding="utf-8"))


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


def verify_token(token: object) -> dict[str, object]:
    if not isinstance(token, str) or not token or len(token) > 4096:
        raise ValueError("Token absent ou trop long.")
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Format JWT invalide.")
    try:
        header = read_json_part(parts[0])
        payload = read_json_part(parts[1])
        supplied_signature = b64url_decode(parts[2])
    except (binascii.Error, UnicodeDecodeError, ValueError, json.JSONDecodeError) as error:
        raise ValueError("JWT illisible.") from error
    if header.get("alg") != "HS256" or header.get("typ") != "JWT":
        raise ValueError("Algorithme JWT refusé.")
    signing_input = f"{parts[0]}.{parts[1]}"
    expected_signature = hmac.new(
        DEMO_SECRET, signing_input.encode("ascii"), hashlib.sha256
    ).digest()
    if not hmac.compare_digest(supplied_signature, expected_signature):
        raise ValueError("Signature JWT invalide.")
    expiration = payload.get("exp")
    if not isinstance(expiration, int) or expiration <= int(time.time()):
        raise ValueError("JWT expiré ou sans expiration valide.")
    user = next((row for row in load_users() if row["username"] == payload.get("sub")), None)
    if user is None or user["role"] != payload.get("role"):
        raise ValueError("Utilisateur ou rôle invalide.")
    return {"sub": user["username"], "name": user["name"], "role": user["role"]}


def current_claims() -> dict[str, object]:
    return verify_token(request.cookies.get(AUTH_COOKIE, ""))


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
            httponly=True,
            samesite="Lax",
            path="/",
        )
        return response

    @app.post("/api/logout")
    def logout():
        response = jsonify(ok=True)
        response.delete_cookie(AUTH_COOKIE, path="/", samesite="Lax")
        return response

    @app.get("/api/session")
    def session():
        try:
            return jsonify(ok=True, user=current_claims())
        except ValueError as error:
            return jsonify(ok=False, error=str(error)), 401

    @app.get("/api/users")
    def users():
        try:
            claims = current_claims()
        except ValueError as error:
            return jsonify(ok=False, error=str(error)), 401
        if claims["role"] != "admin":
            return jsonify(ok=False, error="Rôle admin requis."), 403
        return jsonify(ok=True, users=public_users())

    @app.get("/")
    @app.get("/login")
    def login_page():
        return send_from_directory(EXERCISE_PUBLIC_DIR, "login.html")

    @app.get("/dashboard")
    def dashboard_page():
        return send_from_directory(SOLUTION_PUBLIC_DIR, "dashboard.html")

    @app.get("/users")
    def users_page():
        return send_from_directory(SOLUTION_PUBLIC_DIR, "users.html")

    @app.get("/app.js")
    def solution_script():
        return send_from_directory(SOLUTION_PUBLIC_DIR, "app.js")

    @app.get("/styles.css")
    def shared_styles():
        return send_from_directory(EXERCISE_PUBLIC_DIR, "styles.css")

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "8051")), debug=False)
