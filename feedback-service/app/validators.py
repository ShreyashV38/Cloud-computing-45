"""
Input validation — feedback-service

Business rules:
  1. student_name is required, non-empty after trimming, max 100 chars.
  2. message is required, non-empty after trimming, max 2000 chars.
  3. message must contain at least 3 words (to reject spam / gibberish).
  4. All inputs are stripped of leading/trailing whitespace.
"""

import re

MAX_NAME_LENGTH = 100
MAX_MESSAGE_LENGTH = 2000
MIN_MESSAGE_WORDS = 3


def _count_words(text: str) -> int:
    """Count words (sequences of non-whitespace characters)."""
    return len(re.findall(r"\S+", text))


def validate_feedback(data: dict) -> list[str]:
    """
    Validate a feedback submission payload.
    Returns a list of error strings (empty list = valid).
    """
    errors: list[str] = []

    # --- student_name ---
    name = data.get("student_name")
    if not name or not isinstance(name, str) or not name.strip():
        errors.append("student_name is required and must be a non-empty string.")
    elif len(name.strip()) > MAX_NAME_LENGTH:
        errors.append(
            f"student_name must be at most {MAX_NAME_LENGTH} characters."
        )

    # --- message ---
    message = data.get("message")
    if not message or not isinstance(message, str) or not message.strip():
        errors.append("message is required and must be a non-empty string.")
    else:
        trimmed = message.strip()
        if len(trimmed) > MAX_MESSAGE_LENGTH:
            errors.append(
                f"message must be at most {MAX_MESSAGE_LENGTH} characters."
            )
        if _count_words(trimmed) < MIN_MESSAGE_WORDS:
            errors.append(
                f"message must contain at least {MIN_MESSAGE_WORDS} words."
            )

    return errors
