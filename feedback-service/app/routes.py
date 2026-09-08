"""
Feedback routes — business logic for the Feedback domain.

Business rules:
  - Validate all inputs (see validators.py).
  - Trim / sanitise student_name and message before storage.
  - submitted_at is generated server-side (never trusted from client).
  - GET supports pagination (?page=&limit=), sorted most-recent-first.
  - Proper HTTP status codes (201, 400, 500).
"""

from datetime import datetime, timezone

from flask import Blueprint, request, jsonify
from psycopg2.extras import RealDictCursor

from .db import get_connection
from .validators import validate_feedback

feedback_bp = Blueprint("feedback", __name__)

DEFAULT_PAGE_LIMIT = 20
MAX_PAGE_LIMIT = 100


# --------------- GET /feedback ---------------

@feedback_bp.route("/feedback", methods=["GET"])
def list_feedback():
    """Return paginated feedback, most recent first."""
    try:
        page = max(1, int(request.args.get("page", 1)))
        limit = min(MAX_PAGE_LIMIT, max(1, int(request.args.get("limit", DEFAULT_PAGE_LIMIT))))
    except (ValueError, TypeError):
        page, limit = 1, DEFAULT_PAGE_LIMIT

    offset = (page - 1) * limit

    try:
        conn = get_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT COUNT(*) AS total FROM feedback")
            total = cur.fetchone()["total"]

            cur.execute(
                "SELECT id, student_name, message, submitted_at "
                "FROM feedback ORDER BY submitted_at DESC "
                "LIMIT %s OFFSET %s",
                (limit, offset),
            )
            rows = cur.fetchall()
        conn.close()

        # Convert datetimes to ISO strings for JSON
        for row in rows:
            if row.get("submitted_at"):
                row["submitted_at"] = row["submitted_at"].isoformat()

        return jsonify({
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": -(-total // limit) if limit else 1,  # ceil division
            "data": rows,
        })

    except Exception as exc:
        print(f"[feedback-service] GET /feedback error: {exc}")
        return jsonify({"error": "Internal server error"}), 500


# --------------- POST /feedback ---------------

@feedback_bp.route("/feedback", methods=["POST"])
def create_feedback():
    """Validate and store a new feedback entry."""
    body = request.get_json(silent=True)
    if body is None:
        return jsonify({"errors": ["Request body must be valid JSON."]}), 400

    errors = validate_feedback(body)
    if errors:
        return jsonify({"errors": errors}), 400

    student_name = body["student_name"].strip()
    message = body["message"].strip()
    submitted_at = datetime.now(timezone.utc)

    try:
        conn = get_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "INSERT INTO feedback (student_name, message, submitted_at) "
                "VALUES (%s, %s, %s) RETURNING id, student_name, message, submitted_at",
                (student_name, message, submitted_at),
            )
            row = cur.fetchone()
        conn.commit()
        conn.close()

        row["submitted_at"] = row["submitted_at"].isoformat()
        return jsonify(row), 201

    except Exception as exc:
        print(f"[feedback-service] POST /feedback error: {exc}")
        return jsonify({"error": "Internal server error"}), 500
