"""Flask flavour for the JWT audit-logging lab."""

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


EXERCISE_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = EXERCISE_DIR / "public"
DB_DIR = EXERCISE_DIR / "db"
LOG_DIR = EXERCISE_DIR / "logs"
SAFE_LOG = LOG_DIR / "logs.safe.txt"
UNSAFE_LOG = LOG_DIR / "logs.unsafe.txt"
JWT_SECRET = b"fictional-classroom-logging-secret"
SAFE_ALLOWED_FIELDS = {"outcome", "route", "note_count", "note_id", "requested_mode"}


class SafeLoggerNotImplemented(RuntimeError):
    """Signal the intentionally unfinished learner logger."""


def read_table(name: str) -> list[dict]:
    return json.loads((DB_DIR / f"{name}.json").read_text(encoding="utf-8"))


def public_user(user: dict) -> dict:
    return {"username": user["username"], "name": user["name"]}


def base64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def base64url_decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def encode_jwt(payload: dict) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    encoded_header = base64url_encode(
        json.dumps(header, separators=(",", ":")).encode("utf-8")
    )
    encoded_payload = base64url_encode(
        json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    )
    signing_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
    signature = hmac.new(JWT_SECRET, signing_input, hashlib.sha256).digest()
    return f"{encoded_header}.{encoded_payload}.{base64url_encode(signature)}"


def decode_jwt(token: str) -> dict | None:
    try:
        encoded_header, encoded_payload, encoded_signature = token.split(".")
        signing_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
        expected = hmac.new(JWT_SECRET, signing_input, hashlib.sha256).digest()
        if not hmac.compare_digest(expected, base64url_decode(encoded_signature)):
            return None
        payload = json.loads(base64url_decode(encoded_payload))
        if int(payload.get("exp", 0)) < int(time.time()):
            return None
        if payload.get("logging_mode") not in {"safe", "unsafe"}:
            return None
        return payload
    except (ValueError, TypeError, json.JSONDecodeError):
        return None


def clean(value: object) -> str:
    return str(value).replace("\r", "_").replace("\n", "_")[:300]


def request_header_dump() -> str:
    """Deliberately serialize every header for the unsafe classroom path."""
    return json.dumps(
        dict(request.headers),
        separators=(",", ":"),
        ensure_ascii=False,
    ).replace("\r", "_").replace("\n", "_")


def bearer_token() -> str:
    authorization = request.headers.get("Authorization", "")
    if not authorization.lower().startswith("bearer "):
        return ""
    return authorization[7:].strip()


def safe_user_id(token: str) -> str:
    """Return the audited identity without ever returning the token."""
    # TODO :
    # 1. décoder et valider token avec decode_jwt(token) ;
    # 2. lire le claim standard "sub" dans le payload ;
    # 3. renvoyer "anonymous" si le token manque ou n’est pas valide ;
    # 4. sinon, renvoyer uniquement cet identifiant utilisateur ;
    # 5. ne jamais journaliser token ou le header Authorization.
    raise SafeLoggerNotImplemented


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
    ensure_log_files()
    request_id = uuid.uuid4().hex[:8]
    timestamp = datetime.now().astimezone().isoformat(timespec="milliseconds")
    parts = [f"event={clean(event)}", f"request_id={request_id}"]
    if mode == "unsafe":
        parts.append(f"user={clean(user)}")
        parts.extend(f"{clean(key)}={clean(value)}" for key, value in fields.items())
        parts.append(f"headers={request_header_dump()}")
    else:
        parts.append(f"user_id={clean(safe_user_id(token))}")
        safe_fields = {
            key: value for key, value in fields.items() if key in SAFE_ALLOWED_FIELDS
        }
        parts.extend(
            f"{clean(key)}={clean(value)}" for key, value in safe_fields.items()
        )
    line = f"{timestamp} {level:<5} fr.dercetech.training.{logger} - {' '.join(parts)}\n"
    target = UNSAFE_LOG if mode == "unsafe" else SAFE_LOG
    with target.open("a", encoding="utf-8") as log_file:
        log_file.write(line)


def create_app() -> Flask:
    ensure_log_files()
    app = Flask(__name__, static_folder=None)

    @app.errorhandler(SafeLoggerNotImplemented)
    def safe_logger_not_implemented(error):
        del error
        return jsonify(
            ok=False,
            error="Méthode de journalisation sûre non implémentée.",
        ), 500

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
                mode,
                "WARN",
                "AuthService",
                "AUTH_FAILURE",
                user=username or "unknown",
                outcome="denied",
            )
            return jsonify(ok=False, error="Identifiants incorrects."), 401

        now = int(time.time())
        token = encode_jwt(
            {
                "sub": user["username"],
                "name": user["name"],
                "logging_mode": mode,
                "iat": now,
                "exp": now + 3600,
            }
        )
        audit(
            mode,
            "INFO",
            "AuthService",
            "AUTH_SUCCESS",
            user=user["username"],
            token=token,
            outcome="granted",
        )
        return jsonify(
            ok=True,
            user=public_user(user),
            logging_mode=mode,
            token=token,
        )

    @app.get("/api/session")
    @require_session
    def session():
        mode = g.claims["logging_mode"]
        audit(
            mode,
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
            logging_mode=mode,
        )

    @app.get("/api/dashboard")
    @require_session
    def dashboard():
        mode = g.claims["logging_mode"]
        notes = [
            {"id": note["id"], "title": note["title"]}
            for note in read_table("notes")
        ]
        audit(
            mode,
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
        mode = g.claims["logging_mode"]
        selected = next(
            (row for row in read_table("notes") if row["id"] == note_id),
            None,
        )
        if selected is None:
            audit(
                mode,
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
            mode,
            "INFO",
            "NoteController",
            "NOTE_READ",
            user=g.claims["sub"],
            token=g.jwt,
            outcome="granted",
            note_id=note_id,
        )
        return jsonify(ok=True, note=selected, logging_mode=mode)

    @app.post("/api/logout")
    @require_session
    def logout():
        mode = g.claims["logging_mode"]
        audit(
            mode,
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
        port=int(os.environ.get("PORT", "8036")),
        debug=False,
    )
