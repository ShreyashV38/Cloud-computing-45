/**
 * notice-service — Entry point
 *
 * Microservice that exclusively owns the "Notices" bounded context.
 * Runs its own Express server and connects to its own MySQL database.
 */

const express = require("express");
const morgan = require("morgan");
const { initDatabase } = require("./db");
const noticeRoutes = require("./routes/notices");

const PORT = parseInt(process.env.PORT, 10) || 3001;

const app = express();

// --------------- Middleware ---------------

app.use(morgan("short"));
app.use(express.json({ limit: "64kb" }));

// --------------- Routes ---------------

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "notice-service" });
});

app.use("/notices", noticeRoutes);

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// --------------- Global error handler ---------------

app.use((err, _req, res, _next) => {
  console.error("[notice-service] Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// --------------- Start ---------------

(async () => {
  try {
    await initDatabase();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[notice-service] listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("[notice-service] Failed to start:", err.message);
    process.exit(1);
  }
})();
