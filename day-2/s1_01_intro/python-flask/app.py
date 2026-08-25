"""Flask flavour for the local SQL introduction lab."""

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
MAX_SQL_LENGTH = 1_200
MAX_ROWS = 100


def initialise_database(database_path: Path) -> None:
    database_path.parent.mkdir(parents=True, exist_ok=True)
    with closing(sqlite3.connect(database_path)) as connection:
        connection.executescript(SEED_PATH.read_text(encoding="utf-8"))
        connection.commit()


def normalise_select(raw_sql: object) -> str:
    if not isinstance(raw_sql, str):
        raise ValueError("La requête doit être du texte.")

    sql = raw_sql.strip()
    if not sql:
        raise ValueError("Écrivez une requête SELECT.")
    if len(sql) > MAX_SQL_LENGTH:
        raise ValueError("La requête est trop longue pour ce laboratoire.")
    if sql.endswith(";"):
        sql = sql[:-1].rstrip()
    if ";" in sql:
        raise ValueError("Exécutez une seule requête à la fois.")
    if not sql.lower().startswith("select "):
        raise ValueError("Cette introduction accepte uniquement SELECT.")
    return sql


def create_app(database_path: Path | None = None) -> Flask:
    app = Flask(__name__, static_folder=None)
    selected_database = Path(database_path or DEFAULT_DATABASE_PATH)
    initialise_database(selected_database)

    @app.post("/api/query")
    def query_database():
        body = request.get_json(silent=True) or {}
        try:
            sql = normalise_select(body.get("sql"))
        except ValueError as error:
            return jsonify(ok=False, error=str(error)), 400

        started = time.perf_counter()
        try:
            with closing(sqlite3.connect(selected_database)) as connection:
                connection.row_factory = sqlite3.Row
                connection.execute("PRAGMA query_only = ON")
                cursor = connection.execute(sql)
                columns = [description[0] for description in cursor.description or ()]
                rows = [dict(row) for row in cursor.fetchmany(MAX_ROWS + 1)]
        except sqlite3.Error as error:
            return jsonify(ok=False, error=f"SQLite : {error}"), 400

        truncated = len(rows) > MAX_ROWS
        rows = rows[:MAX_ROWS]
        elapsed_ms = round((time.perf_counter() - started) * 1_000, 2)
        return jsonify(
            ok=True,
            columns=columns,
            rows=rows,
            truncated=truncated,
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
        port=int(os.environ.get("PORT", "8021")),
        debug=False,
    )
