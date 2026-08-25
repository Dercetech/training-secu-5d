"""Flask flavour of the deliberately vulnerable password-hashing lab."""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
from pathlib import Path
from time import perf_counter
from typing import Any

from argon2 import PasswordHasher
from flask import Flask, jsonify, request, send_from_directory
from rainbow_table import MAX_LENGTH, find_password


EXERCISE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = EXERCISE_DIR / "static"
USERS_FILE = EXERCISE_DIR / "db" / "users.json"
DEMO_PASSWORD = "password"
SHA_ITERATIONS = 10_000
ARGON_SAMPLE_ITERATIONS = 3
ARGON_TARGET_ITERATIONS = 10_000
ARGON2_HASHER = PasswordHasher()
SHA256_PATTERN = re.compile(r"^[0-9a-f]{64}$")


def sha256_password(password: str) -> str:
    """Return the deliberately fast, unsalted hash used by this fixture."""

    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def load_users() -> list[dict[str, str]]:
    with USERS_FILE.open(encoding="utf-8") as file:
        users: Any = json.load(file)
    if not isinstance(users, list):
        raise ValueError("db/users.json doit contenir une liste.")
    return users


def public_user(user: dict[str, str]) -> dict[str, str]:
    return {"username": user["username"], "name": user["name"]}


def exposed_hash(user: dict[str, str]) -> dict[str, str]:
    return {
        "username": user["username"],
        "name": user["name"],
        "password_hash": user["password_hash"],
    }


def sha256_benchmark() -> dict[str, int | float | str]:
    started_at = perf_counter()
    sample_hash = ""
    for _ in range(SHA_ITERATIONS):
        sample_hash = sha256_password(DEMO_PASSWORD)
    elapsed_seconds = perf_counter() - started_at
    return {
        "algorithm": "SHA-256",
        "iterations": SHA_ITERATIONS,
        "elapsed_ms": round(elapsed_seconds * 1_000, 3),
        "hashes_per_second": round(SHA_ITERATIONS / elapsed_seconds),
        "sample_hash": sample_hash,
    }


def argon2_benchmark() -> dict[str, int | float | str]:
    started_at = perf_counter()
    sample_hash = ""
    for _ in range(ARGON_SAMPLE_ITERATIONS):
        sample_hash = ARGON2_HASHER.hash(DEMO_PASSWORD)
    elapsed_seconds = perf_counter() - started_at
    projected_seconds = (
        elapsed_seconds / ARGON_SAMPLE_ITERATIONS * ARGON_TARGET_ITERATIONS
    )
    return {
        "algorithm": "Argon2id",
        "measured_iterations": ARGON_SAMPLE_ITERATIONS,
        "target_iterations": ARGON_TARGET_ITERATIONS,
        "measured_ms": round(elapsed_seconds * 1_000, 3),
        "projected_ms": round(projected_seconds * 1_000, 3),
        "sample_hash": sample_hash,
        "projection_only": True,
    }


def create_app() -> Flask:
    app = Flask(__name__, static_folder=None)
    users = load_users()

    @app.post("/api/login")
    @app.post("/login")
    def login():
        body = request.get_json(silent=True) or request.form
        username = body.get("username", "")
        supplied_hash = sha256_password(body.get("password", ""))
        user = next(
            (
                candidate
                for candidate in users
                if candidate.get("username") == username
                and hmac.compare_digest(
                    candidate.get("password_hash", ""), supplied_hash
                )
            ),
            None,
        )

        if user is None:
            return jsonify(ok=False, error="Identifiants incorrects."), 401
        return jsonify(ok=True, user=public_user(user))

    @app.get("/api/dump")
    @app.get("/dump")
    def dump():
        # Intentionally exposed for this local classroom exercise only.
        return jsonify([exposed_hash(user) for user in users])

    @app.post("/api/benchmark")
    @app.post("/benchmark")
    def benchmark():
        return jsonify(sha256_benchmark())

    @app.post("/api/argon2/hash")
    def create_argon2_hash():
        return jsonify(algorithm="Argon2id", hash=ARGON2_HASHER.hash(DEMO_PASSWORD))

    @app.post("/api/argon2/benchmark")
    def benchmark_argon2():
        return jsonify(argon2_benchmark())

    @app.post("/api/decrypt")
    def decrypt_sha256():
        body = request.get_json(silent=True) or {}
        target_hash = str(body.get("hash", "")).lower()
        min_length = body.get("min_length")
        max_length = body.get("max_length")
        if not SHA256_PATTERN.fullmatch(target_hash):
            return (
                jsonify(
                    ok=False,
                    error="Un SHA-256 hexadécimal de 64 caractères est requis.",
                ),
                400,
            )

        valid_range = (
            isinstance(min_length, int)
            and not isinstance(min_length, bool)
            and isinstance(max_length, int)
            and not isinstance(max_length, bool)
            and 1 <= min_length <= max_length <= MAX_LENGTH
        )
        if not valid_range:
            return (
                jsonify(
                    ok=False,
                    error="Plage requise : 1 ≤ min ≤ max ≤ 4.",
                ),
                400,
            )

        search_result = find_password(target_hash, min_length, max_length)
        if search_result is None:
            return (
                jsonify(
                    ok=False,
                    error=(
                        "Labo : implémentez find_password dans "
                        "rainbow_table.py."
                    ),
                ),
                501,
            )

        if search_result["password"] is None:
            return (
                jsonify(
                    ok=False,
                    error="Aucun mot de passe trouvé dans la plage demandée.",
                    elapsed_ms=search_result["elapsed_ms"],
                    min_length=min_length,
                    max_length=max_length,
                ),
                404,
            )
        return jsonify(
            ok=True,
            password=search_result["password"],
            elapsed_ms=search_result["elapsed_ms"],
            min_length=min_length,
            max_length=max_length,
            method="sequential_sha256_search",
        )

    @app.get("/")
    def index():
        return send_from_directory(STATIC_DIR, "index.html")

    @app.get("/<path:asset_path>")
    def static_asset(asset_path: str):
        return send_from_directory(STATIC_DIR, asset_path)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "8015")), debug=False)
