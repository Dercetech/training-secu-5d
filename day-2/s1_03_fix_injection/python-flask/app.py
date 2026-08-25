"""Deliberately vulnerable Flask teacher search for the local classroom lab."""

from __future__ import annotations

import os
import sqlite3
import time
from contextlib import closing
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory


EXERCISE_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = EXERCISE_DIR / "public"
DEFAULT_DATABASE_PATH = EXERCISE_DIR / "db" / "lab.sqlite3"
SEED_PATH = EXERCISE_DIR / "db" / "seed.sql"
MAX_SEARCH_LENGTH = 200


def initialise_database(database_path: Path) -> None:
    database_path.parent.mkdir(parents=True, exist_ok=True)
    with closing(sqlite3.connect(database_path)) as connection:
        connection.executescript(SEED_PATH.read_text(encoding="utf-8"))
        connection.commit()


def build_unsafe_query(search: str) -> str:
    # Intentionally vulnerable: learners replace this concatenation themselves.
    return (
        "SELECT id, name, subject FROM teachers "
        f"WHERE name LIKE '%{search}%' ORDER BY id"
    )


def create_app(database_path: Path | None = None) -> Flask:
    app = Flask(__name__, static_folder=None)
    selected_database = Path(database_path or DEFAULT_DATABASE_PATH)
    initialise_database(selected_database)

    @app.get("/api/search")
    def search_teachers():
        search = request.args.get("name", "")
        if len(search) > MAX_SEARCH_LENGTH:
            return jsonify(ok=False, error="La recherche est trop longue."), 400

        sql = build_unsafe_query(search)
        started = time.perf_counter()
        try:
            with closing(sqlite3.connect(selected_database)) as connection:
                connection.row_factory = sqlite3.Row
                connection.execute("PRAGMA query_only = ON")
                rows = [dict(row) for row in connection.execute(sql).fetchmany(31)]
        except sqlite3.Error as error:
            return jsonify(
                ok=False,
                received={"method": "GET", "path": "/api/search", "name": search},
                sql=sql,
                error=f"SQLite : {error}",
            ), 400

        elapsed_ms = round((time.perf_counter() - started) * 1_000, 2)
        return jsonify(
            ok=True,
            received={"method": "GET", "path": "/api/search", "name": search},
            sql=sql,
            rows=rows[:30],
            elapsed_ms=elapsed_ms,
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
        port=int(os.environ.get("PORT", "8025")),
        debug=False,
    )
