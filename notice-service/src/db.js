/**
 * Database connection pool — notice-service (MySQL)
 *
 * Reads connection parameters from environment variables.
 * Exports a promise-based pool so queries can use async/await.
 * Also runs the initial schema migration (CREATE TABLE IF NOT EXISTS).
 */

const mysql = require("mysql2/promise");

// --------------- Pool ---------------

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// --------------- Schema bootstrap ---------------

async function initDatabase() {
  const createTable = `
    CREATE TABLE IF NOT EXISTS notices (
      id          INT           AUTO_INCREMENT PRIMARY KEY,
      title       VARCHAR(255)  NOT NULL,
      message     TEXT          NOT NULL,
      posted_by   VARCHAR(100)  NOT NULL,
      created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  try {
    await pool.execute(createTable);
    console.log("[notice-service] Database schema ready.");
  } catch (err) {
    console.error("[notice-service] Schema migration failed:", err.message);
    throw err;
  }
}

module.exports = { pool, initDatabase };
