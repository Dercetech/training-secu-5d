"""Minimal Flask flavour for the Security 101 login exercise."""

from __future__ import annotations

import json
import base64
import hashlib
import hmac
import os
import time
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, request, send_from_directory


EXERCISE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = EXERCISE_DIR / "static"
USERS_FILE = EXERCISE_DIR / "db" / "users.json"
JWT_SECRET = os.environ.get("LAB_JWT_SECRET", "secu5d-local-demo-secret").encode()
JWT_LIFETIME_SECONDS = 60 * 60


def load_users() -> list[dict[str, str]]:
    with USERS_FILE.open(encoding="utf-8") as file:
        users: Any = json.load(file)
    if not isinstance(users, list):
        raise ValueError("db/users.json doit contenir une liste.")
    return users


def public_user(user: dict[str, str]) -> dict[str, str]:
    return {"username": user["username"], "name": user["name"]}


def base64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def base64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def create_jwt(user: dict[str, str]) -> str:
    now = int(time.time())
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": user["username"],
        "name": user["name"],
        "iat": now,
        "exp": now + JWT_LIFETIME_SECONDS,
    }

    segments = [
        base64url_encode(
            json.dumps(part, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
        )
        for part in (header, payload)
    ]
    signing_input = ".".join(segments).encode("ascii")
    signature = hmac.new(JWT_SECRET, signing_input, hashlib.sha256).digest()
    return f"{segments[0]}.{segments[1]}.{base64url_encode(signature)}"


def verify_jwt(token: str) -> dict[str, str] | None:
    try:
        header_part, payload_part, signature_part = token.split(".")
        signing_input = f"{header_part}.{payload_part}".encode("ascii")
        received_signature = base64url_decode(signature_part)
        expected_signature = hmac.new(
            JWT_SECRET, signing_input, hashlib.sha256
        ).digest()
        if not hmac.compare_digest(received_signature, expected_signature):
            return None

        header = json.loads(base64url_decode(header_part))
        payload = json.loads(base64url_decode(payload_part))
        if header != {"alg": "HS256", "typ": "JWT"}:
            return None
        if not isinstance(payload.get("sub"), str) or not isinstance(
            payload.get("name"), str
        ):
            return None
        if not isinstance(payload.get("exp"), int) or payload["exp"] <= int(time.time()):
            return None
        return {"username": payload["sub"], "name": payload["name"]}
    except (ValueError, TypeError, KeyError, UnicodeDecodeError, json.JSONDecodeError):
        return None


def create_app() -> Flask:
    app = Flask(__name__, static_folder=None)
    users = load_users()

    @app.post("/api/login")
    def login():
        body = request.get_json(silent=True) or {}
        username = body.get("username")
        password = body.get("password")
        user = next(
            (
                candidate
                for candidate in users
                if candidate.get("username") == username
                and candidate.get("password") == password
            ),
            None,
        )

        if user is None:
            return jsonify(ok=False, error="Identifiants incorrects."), 401

        safe_user = public_user(user)
        token = create_jwt(safe_user)
        response = jsonify(ok=True, token=token, user=safe_user)
        response.set_cookie(
            "auth_token",
            token,
            httponly=True,
            samesite="Lax",
            path="/",
            max_age=JWT_LIFETIME_SECONDS,
        )
        return response

    @app.get("/api/me")
    def me():
        user = verify_jwt(request.cookies.get("auth_token", ""))
        if user is None:
            return jsonify(ok=False, error="Jeton absent ou invalide."), 401
        return jsonify(ok=True, user=user)

    @app.post("/api/logout")
    def logout():
        response = jsonify(ok=True)
        response.delete_cookie("auth_token", path="/")
        return response

    @app.get("/")
    def index():
        return send_from_directory(STATIC_DIR, "index.html")

    @app.get("/<path:asset_path>")
    def static_asset(asset_path: str):
        return send_from_directory(STATIC_DIR, asset_path)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "8012")), debug=False)
