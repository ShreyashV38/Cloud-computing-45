/**
 * Notice routes — business logic for the Notices domain.
 *
 * Business rules enforced here (not just CRUD):
 *  1. title and message are required and must be non-empty strings.
 *  2. title max 255 chars; message max 5 000 chars.
 *  3. posted_by is required, max 100 chars.
 *  4. created_at is ALWAYS generated server-side — client timestamps are
 *     ignored to prevent spoofing.
 *  5. GET supports pagination via ?page=&limit= (default 20 per page),
 *     always sorted most-recent-first.
 *  6. Proper HTTP status codes: 201 on create, 400 on bad input, 500 on
 *     server errors.
 */

const express = require("express");
const { pool } = require("../db");

const router = express.Router();

// --------------- Constants ---------------

const MAX_TITLE_LENGTH = 255;
const MAX_MESSAGE_LENGTH = 5000;
const MAX_POSTED_BY_LENGTH = 100;
const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 100;

// --------------- Helpers ---------------

/**
 * Validate the request body for creating a notice.
 * Returns an array of error strings (empty = valid).
 */
function validateNotice(body) {
  const errors = [];

  // --- title ---
  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    errors.push("title is required and must be a non-empty string.");
  } else if (body.title.trim().length > MAX_TITLE_LENGTH) {
    errors.push(`title must be at most ${MAX_TITLE_LENGTH} characters.`);
  }

  // --- message ---
  if (
    !body.message ||
    typeof body.message !== "string" ||
    !body.message.trim()
  ) {
    errors.push("message is required and must be a non-empty string.");
  } else if (body.message.trim().length > MAX_MESSAGE_LENGTH) {
    errors.push(`message must be at most ${MAX_MESSAGE_LENGTH} characters.`);
  }

  // --- posted_by ---
  if (
    !body.posted_by ||
    typeof body.posted_by !== "string" ||
    !body.posted_by.trim()
  ) {
    errors.push("posted_by is required and must be a non-empty string.");
  } else if (body.posted_by.trim().length > MAX_POSTED_BY_LENGTH) {
    errors.push(
      `posted_by must be at most ${MAX_POSTED_BY_LENGTH} characters.`
    );
  }

  return errors;
}

// --------------- GET /notices ---------------

router.get("/", async (req, res) => {
  try {
    // Pagination
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || DEFAULT_PAGE_LIMIT;

    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > MAX_PAGE_LIMIT) limit = MAX_PAGE_LIMIT;

    const offset = (page - 1) * limit;

    // Total count (for pagination metadata)
    const [[{ total }]] = await pool.execute(
      "SELECT COUNT(*) AS total FROM notices"
    );

    // Fetch page — most recent first
    const [rows] = await pool.execute(
      "SELECT id, title, message, posted_by, created_at FROM notices ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [String(limit), String(offset)]
    );

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: rows,
    });
  } catch (err) {
    console.error("[notice-service] GET /notices error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --------------- POST /notices ---------------

router.post("/", async (req, res) => {
  try {
    const errors = validateNotice(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const title = req.body.title.trim();
    const message = req.body.message.trim();
    const posted_by = req.body.posted_by.trim();
    // Server-generated timestamp — never trust the client
    const created_at = new Date();

    const [result] = await pool.execute(
      "INSERT INTO notices (title, message, posted_by, created_at) VALUES (?, ?, ?, ?)",
      [title, message, posted_by, created_at]
    );

    res.status(201).json({
      id: result.insertId,
      title,
      message,
      posted_by,
      created_at,
    });
  } catch (err) {
    console.error("[notice-service] POST /notices error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
