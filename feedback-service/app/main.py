"""
feedback-service — Entry point

Microservice that exclusively owns the "Feedback" bounded context.
Runs its own Flask server and connects to its own PostgreSQL database.
"""

import os

from flask import Flask, jsonify

from .db import init_database
from .routes import feedback_bp


def create_app() -> Flask:
    """Application factory."""
    app = Flask(__name__)

    # Register the feedback blueprint
    app.register_blueprint(feedback_bp)

    # Health check (not part of the feedback domain — pure infra)
    @app.route("/health")
    def health():
        return jsonify({"status": "ok", "service": "feedback-service"})

    # 404 fallback
    @app.errorhandler(404)
    def not_found(_exc):
        return jsonify({"error": "Not found"}), 404

    # 500 fallback
    @app.errorhandler(500)
    def server_error(_exc):
        return jsonify({"error": "Internal server error"}), 500

    return app


if __name__ == "__main__":
    # Bootstrap schema, then start the server
    init_database()

    app = create_app()
    port = int(os.environ.get("PORT", 5000))

    print(f"[feedback-service] listening on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
