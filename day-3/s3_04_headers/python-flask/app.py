"""Flask flavour for the browser security headers lab."""

from __future__ import annotations

import os
from pathlib import Path

from flask import Flask, Response, jsonify, send_from_directory


EXERCISE_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = EXERCISE_DIR / "public"
API_ASSET_DIR = EXERCISE_DIR / "api-assets"
SECURITY_HEADERS = {
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "geolocation=()",
}
CSP_LEARNER = (
    "default-src 'self'; "
    "script-src 'self'; "
    "style-src 'self'; "
    "connect-src 'self'; "
    "object-src 'none'; "
    "base-uri 'none'; "
    "frame-ancestors 'none'"
)
PERMISSIONS_POLICY_LEARNER = (
    'camera=(self "https://training.dercetech.com"), '
    "microphone=(), geolocation=()"
)


def create_app() -> Flask:
    app = Flask(__name__, static_folder=None)

    @app.get("/api/unsafe/report")
    def unsafe_report():
        return jsonify(ok=True, report="Rapport fictif")

    @app.get("/api/safe/report")
    def safe_report():
        response = jsonify(ok=True, report="Rapport fictif")
        for name, value in SECURITY_HEADERS.items():
            response.headers[name] = value
        return response

    @app.get("/api/x-content-type-options/script")
    def mime_demo_script():
        # TODO : annoncez application/javascript dans le Content-Type.
        response = Response(
            API_ASSET_DIR.joinpath("mime-demo.js").read_text(encoding="utf-8")
        )
        response.headers.pop("Content-Type", None)
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    @app.get("/api/x-content-type-options/styles")
    def mime_demo_styles():
        # TODO : annoncez text/css dans le Content-Type.
        response = Response(
            API_ASSET_DIR.joinpath("mime-demo.css").read_text(encoding="utf-8")
        )
        response.headers.pop("Content-Type", None)
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    @app.get("/x-content-type-options/")
    def x_content_type_options():
        return send_from_directory(PUBLIC_DIR / "x-content-type-options", "index.html")

    @app.get("/referrer-policy/")
    def referrer_policy():
        return send_from_directory(PUBLIC_DIR / "referrer-policy", "index.html")

    @app.get("/referrer-policy/unsafe/")
    def referrer_policy_unsafe():
        response = send_from_directory(PUBLIC_DIR / "referrer-policy", "unsafe.html")
        response.headers["Referrer-Policy"] = "unsafe-url"
        response.headers["Cache-Control"] = "no-store"
        return response

    @app.get("/referrer-policy/safe/")
    def referrer_policy_safe():
        response = send_from_directory(PUBLIC_DIR / "referrer-policy", "safe.html")
        # TODO : remplacez la politique bavarde par no-referrer.
        response.headers["Referrer-Policy"] = "unsafe-url"
        response.headers["Cache-Control"] = "no-store"
        return response

    @app.get("/content-security-policy/")
    def content_security_policy():
        response = send_from_directory(
            PUBLIC_DIR / "content-security-policy", "index.html"
        )
        # TODO : ajoutez uniquement https://training.dercetech.com à script-src.
        response.headers["Content-Security-Policy"] = CSP_LEARNER
        response.headers["Cache-Control"] = "no-store"
        return response

    @app.get("/permissions-policy/")
    def permissions_policy():
        response = send_from_directory(PUBLIC_DIR / "permissions-policy", "index.html")
        # TODO : retirez la caméra à tous les contenus avec camera=().
        response.headers["Permissions-Policy"] = PERMISSIONS_POLICY_LEARNER
        response.headers["Cache-Control"] = "no-store"
        return response

    @app.get("/")
    def index():
        return send_from_directory(PUBLIC_DIR, "index.html")

    @app.get("/<path:asset_path>")
    def public_asset(asset_path: str):
        return send_from_directory(PUBLIC_DIR, asset_path)

    return app


app = create_app()
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "8037")), debug=False)
