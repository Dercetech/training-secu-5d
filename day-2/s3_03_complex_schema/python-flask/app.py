"""Schéma JSON imbriqué à écrire par l’élève avec Pydantic."""

from __future__ import annotations

import json
import os
import uuid
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, request, send_from_directory

# TODO S3.03 : importez ici les outils de validation que vous aurez choisis.


EXERCISE_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = EXERCISE_DIR / "public"
DEFAULT_BRIEFS_PATH = EXERCISE_DIR / "db" / "briefs.json"


def read_briefs(briefs_path: Path) -> list[dict[str, Any]]:
    if not briefs_path.exists():
        return []
    return json.loads(briefs_path.read_text(encoding="utf-8"))


def write_briefs(briefs_path: Path, briefs: list[dict[str, Any]]) -> None:
    briefs_path.parent.mkdir(parents=True, exist_ok=True)
    briefs_path.write_text(
        json.dumps(briefs, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def create_app(briefs_path: Path | None = None) -> Flask:
    app = Flask(__name__, static_folder=None)
    app.config["MAX_CONTENT_LENGTH"] = 32 * 1024
    selected_briefs_path = Path(
        briefs_path or os.environ.get("BRIEFS_FILE", DEFAULT_BRIEFS_PATH)
    )

    @app.get("/api/briefs")
    def list_briefs():
        return jsonify(ok=True, briefs=read_briefs(selected_briefs_path))

    @app.post("/api/briefs")
    def create_brief():
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return jsonify(ok=False, error="Un objet JSON est obligatoire."), 400

        # TODO S3.03 : imposez ici le contrat décrit dans le README avant l’écriture.

        briefs = read_briefs(selected_briefs_path)
        # Volontairement dangereux : id, status et toutes les clés sont remplaçables.
        new_brief = {"id": str(uuid.uuid4()), "status": "received", **payload}
        briefs.append(new_brief)
        write_briefs(selected_briefs_path, briefs)
        return jsonify(ok=True, brief=new_brief), 201

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
        port=int(os.environ.get("PORT", "8035")),
        debug=False,
    )
