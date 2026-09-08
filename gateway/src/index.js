/**
 * API Gateway — University Notice Board
 *
 * Pure routing layer. No business logic, no database access.
 * Forwards:
 *   /api/notices/*   → NOTICE_SERVICE_URL
 *   /api/feedback/*  → FEEDBACK_SERVICE_URL
 */

const express = require("express");
const morgan = require("morgan");
const { createProxyMiddleware } = require("http-proxy-middleware");

// --------------- Configuration (env vars only) ---------------

const PORT = parseInt(process.env.PORT, 10) || 3000;
const NOTICE_SERVICE_URL = process.env.NOTICE_SERVICE_URL;
const FEEDBACK_SERVICE_URL = process.env.FEEDBACK_SERVICE_URL;

if (!NOTICE_SERVICE_URL || !FEEDBACK_SERVICE_URL) {
  console.error(
    "ERROR: NOTICE_SERVICE_URL and FEEDBACK_SERVICE_URL must be set."
  );
  process.exit(1);
}

// --------------- Express App ---------------

const app = express();

// Request logging
app.use(morgan("short"));

// --------------- Health check ---------------

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "api-gateway" });
});

// --------------- Proxy: /api/notices → notice-service ---------------

const noticeProxy = createProxyMiddleware({
  target: NOTICE_SERVICE_URL,
  changeOrigin: true,
  pathFilter: "/api/notices",
  pathRewrite: { "^/api/notices": "/notices" },
  on: {
    error: (err, _req, res) => {
      console.error("[Gateway] notice-service proxy error:", err.message);
      res.status(502).json({
        error: "notice-service is unavailable",
        details: err.message,
      });
    },
  },
});

app.use(noticeProxy);

// --------------- Proxy: /api/feedback → feedback-service ---------------

const feedbackProxy = createProxyMiddleware({
  target: FEEDBACK_SERVICE_URL,
  changeOrigin: true,
  pathFilter: "/api/feedback",
  pathRewrite: { "^/api/feedback": "/feedback" },
  on: {
    error: (err, _req, res) => {
      console.error("[Gateway] feedback-service proxy error:", err.message);
      res.status(502).json({
        error: "feedback-service is unavailable",
        details: err.message,
      });
    },
  },
});

app.use(feedbackProxy);

// --------------- Fallback ---------------

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found on the gateway" });
});

// --------------- Start ---------------

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Gateway] listening on port ${PORT}`);
  console.log(`[Gateway] /api/notices  → ${NOTICE_SERVICE_URL}`);
  console.log(`[Gateway] /api/feedback → ${FEEDBACK_SERVICE_URL}`);
});
