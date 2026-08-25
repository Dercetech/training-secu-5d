"""Allowlisted audit-logging Flask solution for Day 3, S3.03."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
import uuid
from datetime import datetime
from functools import wraps
from pathlib import Path

from flask import Flask, g, jsonify, request, send_from_directory


REPOSITORY_DIR = Path(__file__).resolve().parents[4]
EXERCISE_DIR = REPOSITORY_DIR / "day-3" / "s3_03_logging"
PUBLIC_DIR = EXERCISE_DIR / "public"
DB_DIR = EXERCISE_DIR / "db"
LOG_DIR = EXERCISE_DIR / "logs"
SAFE_LOG = LOG_DIR / "logs.safe.txt"
UNSAFE_LOG = LOG_DIR / "logs.unsafe.txt"
JWT_SECRET = b"fictional-classroom-logging-secret"
ALLOWED_LOG_FIELDS = {"outcome", "route", "note_count", "note_id", "requested_mode"}


def read_table(name: str) -> list[dict]:
    return json.loads((DB_DIR / f"{name}.json").read_text(encoding="utf-8"))


def public_user(user: dict) -> dict:
    return {"username": user["username"], "name": user["name"]}


def base64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def base64url_decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def encode_jwt(payload: dict) -> str:
    header = base64url_encode(
        json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode()
    )
    body = base64url_encode(
        json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode()
    )
    signing_input = f"{header}.{body}".encode("ascii")
    signature = hmac.new(JWT_SECRET, signing_input, hashlib.sha256).digest()
    return f"{header}.{body}.{base64url_encode(signature)}"


def decode_jwt(token: str) -> dict | None:
    try:
        header, body, signature = token.split(".")
        signing_input = f"{header}.{body}".encode("ascii")
        expected = hmac.new(JWT_SECRET, signing_input, hashlib.sha256).digest()
        if not hmac.compare_digest(expected, base64url_decode(signature)):
            return None
        payload = json.loads(base64url_decode(body))
        if int(payload.get("exp", 0)) < int(time.time()):
            return None
        return payload if payload.get("logging_mode") == "safe" else None
    except (ValueError, TypeError, json.JSONDecodeError):
        return None


def clean(value: object) -> str:
    return str(value).replace("\r", "_").replace("\n", "_")[:300]


def bearer_token() -> str:
    authorization = request.headers.get("Authorization", "")
    if not authorization.lower().startswith("bearer "):
        return ""
    return authorization[7:].strip()


def safe_user_id(token: str) -> str:
    claims = decode_jwt(token) if token else None
    return str(claims.get("sub", "anonymous")) if claims else "anonymous"


def ensure_log_files() -> None:
    LOG_DIR.mkdir(exist_ok=True)
    SAFE_LOG.touch(exist_ok=True)
    UNSAFE_LOG.touch(exist_ok=True)


def audit(
    mode: str,
    level: str,
    logger: str,
    event: str,
    *,
    user: str,
    token: str = "",
    **fields: object,
) -> None:
    """Decode the identity, then write only explicitly allowed context."""
    del mode, user
    ensure_log_files()
    safe_fields = {key: value for key, value in fields.items() if key in ALLOWED_LOG_FIELDS}
    parts = [
        f"event={clean(event)}",
        f"user_id={clean(safe_user_id(token))}",
        f"request_id={uuid.uuid4().hex[:8]}",
    ]
    parts.extend(f"{clean(key)}={clean(value)}" for key, value in safe_fields.items())
    timestamp = datetime.now().astimezone().isoformat(timespec="milliseconds")
    line = f"{timestamp} {level:<5} fr.dercetech.training.{logger} - {' '.join(parts)}\n"
    with SAFE_LOG.open("a", encoding="utf-8") as log_file:
        log_file.write(line)


def create_app() -> Flask:
    ensure_log_files()
    app = Flask(__name__, static_folder=None)

    @app.before_request
    def read_session():
        g.jwt = bearer_token()
        g.claims = decode_jwt(g.jwt) if g.jwt else None

    def require_session(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            if g.claims is None:
                audit(
                    "safe",
                    "WARN",
                    "SessionFilter",
                    "AUTH_REQUIRED",
                    user="anonymous",
                    outcome="denied",
                    route=request.path,
                )
                return jsonify(ok=False, error="Connectez-vous pour continuer."), 401
            return view(*args, **kwargs)

        return wrapped

    @app.post("/api/login/<mode>")
    def login(mode: str):
        if mode not in {"safe", "unsafe"}:
            return jsonify(ok=False, error="Mode de journalisation inconnu."), 404
        body = request.get_json(silent=True) or {}
        username = str(body.get("username", ""))[:80]
        password = str(body.get("password", ""))[:80]
        user = next(
            (
                row
                for row in read_table("users")
                if row["username"] == username and row["password"] == password
            ),
            None,
        )
        if user is None:
            audit(
                "safe",
                "WARN",
                "AuthService",
                "AUTH_FAILURE",
                user=username or "unknown",
                outcome="denied",
                requested_mode=mode,
            )
            return jsonify(ok=False, error="Identifiants incorrects."), 401

        now = int(time.time())
        token = encode_jwt(
            {
                "sub": user["username"],
                "name": user["name"],
                "logging_mode": "safe",
                "iat": now,
                "exp": now + 3600,
            }
        )
        audit(
            "safe",
            "INFO",
            "AuthService",
            "AUTH_SUCCESS",
            user=user["username"],
            token=token,
            outcome="granted",
            requested_mode=mode,
        )
        return jsonify(
            ok=True,
            user=public_user(user),
            logging_mode="safe",
            token=token,
        )

    @app.get("/api/session")
    @require_session
    def session():
        audit(
            "safe",
            "DEBUG",
            "SessionFilter",
            "SESSION_CHECK",
            user=g.claims["sub"],
            token=g.jwt,
            outcome="valid",
        )
        return jsonify(
            ok=True,
            user={"username": g.claims["sub"], "name": g.claims["name"]},
            logging_mode="safe",
        )

    @app.get("/api/dashboard")
    @require_session
    def dashboard():
        notes = [{"id": row["id"], "title": row["title"]} for row in read_table("notes")]
        audit(
            "safe",
            "INFO",
            "DashboardController",
            "DASHBOARD_ACCESS",
            user=g.claims["sub"],
            token=g.jwt,
            outcome="granted",
            note_count=len(notes),
        )
        return jsonify(ok=True, notes=notes)

    @app.get("/api/notes/<int:note_id>")
    @require_session
    def note(note_id: int):
        selected = next((row for row in read_table("notes") if row["id"] == note_id), None)
        if selected is None:
            audit(
                "safe",
                "WARN",
                "NoteController",
                "NOTE_NOT_FOUND",
                user=g.claims["sub"],
                token=g.jwt,
                outcome="missing",
                note_id=note_id,
            )
            return jsonify(ok=False, error="Note introuvable."), 404
        audit(
            "safe",
            "INFO",
            "NoteController",
            "NOTE_READ",
            user=g.claims["sub"],
            token=g.jwt,
            outcome="granted",
            note_id=note_id,
        )
        return jsonify(ok=True, note=selected, logging_mode="safe")

    @app.post("/api/logout")
    @require_session
    def logout():
        audit(
            "safe",
            "INFO",
            "AuthService",
            "LOGOUT",
            user=g.claims["sub"],
            token=g.jwt,
            outcome="success",
        )
        return jsonify(ok=True)

    @app.get("/")
    @app.get("/dashboard/")
    def index():
        return send_from_directory(PUBLIC_DIR, "index.html")

    @app.get("/notes/<int:note_id>/")
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
        port=int(os.environ.get("PORT", "8055")),
        debug=False,
    )
