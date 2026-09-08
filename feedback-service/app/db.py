"""
Database module — feedback-service (PostgreSQL)

Reads connection parameters from environment variables.
Provides a get_connection() helper and schema bootstrap.
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor


def _dsn() -> dict:
    """Build connection kwargs from env vars."""
    return {
        "host": os.environ["DB_HOST"],
        "port": int(os.environ.get("DB_PORT", 5432)),
        "user": os.environ["DB_USER"],
        "password": os.environ["DB_PASSWORD"],
        "dbname": os.environ["DB_NAME"],
    }


def get_connection():
    """Return a new psycopg2 connection (caller must close it)."""
    return psycopg2.connect(**_dsn())


def init_database() -> None:
    """Create the feedback table if it does not exist."""
    create_sql = """
    CREATE TABLE IF NOT EXISTS feedback (
        id              SERIAL PRIMARY KEY,
        student_name    VARCHAR(100) NOT NULL,
        message         TEXT         NOT NULL,
        submitted_at    TIMESTAMP    NOT NULL DEFAULT NOW()
    );
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(create_sql)
        conn.commit()
        print("[feedback-service] Database schema ready.")
    finally:
        conn.close()
