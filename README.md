# 🎓 University Notice Board

A fully containerized **microservices application** where admins can
broadcast official notices and students can submit feedback — all running
with a single `docker compose up`.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (:8080)                          │
│                    http://localhost:8080                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │  /api/*  (nginx reverse proxy)
                           ▼
              ┌────────────────────────┐
              │      API Gateway       │  ← only externally
              │   Node.js + Express    │     exposed service
              │       (:3000)          │
              └─────┬────────────┬─────┘
         /api/notices            /api/feedback
                │                      │
     ┌──────────▼──────────┐  ┌────────▼──────────┐
     │   notice-service    │  │  feedback-service  │
     │  Node.js + Express  │  │  Python + Flask    │
     │      (:3001)        │  │      (:5000)       │
     └──────────┬──────────┘  └────────┬───────────┘
                │                      │
     ┌──────────▼──────────┐  ┌────────▼───────────┐
     │     notice-db       │  │    feedback-db      │
     │     MySQL 8.0       │  │   PostgreSQL 16     │
     │      (:3306)        │  │      (:5432)        │
     └─────────────────────┘  └────────────────────-┘

     ◀──── backend network ────▶  (not exposed outside)
```

**6 containers** on two Docker networks:
- **frontend** network: `frontend` ↔ `gateway`
- **backend** network: `gateway` ↔ microservices ↔ databases

Databases and microservices are **never directly accessible** from outside.

---

## Microservice Justification

### notice-service (Node.js + MySQL)
Owns the **Notices bounded context**: creating, validating, storing, and
paginating official university announcements. It enforces title/message
length limits, rejects empty submissions, and generates `created_at`
server-side to prevent timestamp spoofing. This domain is self-contained —
it has no dependency on student feedback data or any other service.

### feedback-service (Python + Flask + PostgreSQL)
Owns the **Feedback bounded context**: accepting, validating, sanitising,
and paginating student feedback submissions. It trims whitespace, enforces
character limits, requires a minimum word count to reject gibberish, and
generates `submitted_at` server-side. This domain is entirely independent —
it never needs to know whether notices exist.

---

## Quick Start

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose v2+
- Git (optional, for cloning)

### 1. Clone & configure

```bash
git clone <your-repo-url>
cd cloudmidpoint

# Copy the example env and edit with your own secrets
cp .env.example .env
```

### 2. Start everything

```bash
docker compose up --build
```

Wait for all health checks to pass (≈30-60 s on first run), then open:

> **http://localhost:8080**

### 3. Stop / clean up

```bash
docker compose down        # stop containers
docker compose down -v     # stop + wipe database volumes
```

---

## API Endpoints

All requests go through the **API Gateway** at `http://localhost:8080/api/`.

### Notices

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/notices?page=1&limit=10` | List notices (paginated, newest first) |
| `POST` | `/api/notices` | Create a new notice |

**POST body:**
```json
{
  "title": "Exam Schedule Released",
  "message": "Mid-term exams will begin on 20 Sep 2026. Check the portal for your hall ticket.",
  "posted_by": "Dean of Academics"
}
```

### Feedback

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/feedback?page=1&limit=10` | List feedback (paginated, newest first) |
| `POST` | `/api/feedback` | Submit new feedback |

**POST body:**
```json
{
  "student_name": "Priya Sharma",
  "message": "The new library hours are very convenient. Thank you!"
}
```

---

## Example curl Commands

```bash
# ── Notices ────────────────────────────────────────────────

# List all notices (page 1)
curl http://localhost:8080/api/notices?page=1&limit=5

# Post a new notice
curl -X POST http://localhost:8080/api/notices \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Campus Wi-Fi Upgrade",
    "message": "All campus buildings will have upgraded Wi-Fi starting next Monday. Expect brief outages during installation.",
    "posted_by": "IT Department"
  }'

# ── Feedback ───────────────────────────────────────────────

# List all feedback (page 1)
curl http://localhost:8080/api/feedback?page=1&limit=5

# Submit new feedback
curl -X POST http://localhost:8080/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "student_name": "Rahul Verma",
    "message": "The cafeteria food quality has improved significantly this semester."
  }'

# ── Validation error examples ──────────────────────────────

# Missing title → 400
curl -X POST http://localhost:8080/api/notices \
  -H "Content-Type: application/json" \
  -d '{"message": "no title", "posted_by": "admin"}'

# Too few words in feedback → 400
curl -X POST http://localhost:8080/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"student_name": "Test", "message": "hi"}'
```

---

## Project Structure

```
cloudmidpoint/
├── frontend/              ← Static HTML/CSS/JS served by nginx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── gateway/               ← API Gateway (Node.js + Express)
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       └── index.js
├── notice-service/        ← Microservice 1 (Node.js + MySQL)
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── db.js
│       └── routes/
│           └── notices.js
├── feedback-service/      ← Microservice 2 (Python + Flask + PostgreSQL)
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── __init__.py
│       ├── main.py
│       ├── db.py
│       ├── routes.py
│       └── validators.py
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## Environment Variables

All configuration is driven by environment variables — see
[`.env.example`](.env.example) for the full list. No credentials,
hostnames, or ports are hardcoded in source code.

| Variable | Used By | Description |
|----------|---------|-------------|
| `NOTICE_DB_HOST` | notice-service | MySQL hostname |
| `NOTICE_DB_PORT` | notice-service | MySQL port |
| `NOTICE_DB_USER` | notice-service, notice-db | MySQL user |
| `NOTICE_DB_PASSWORD` | notice-service, notice-db | MySQL password |
| `NOTICE_DB_NAME` | notice-service, notice-db | MySQL database name |
| `NOTICE_DB_ROOT_PASSWORD` | notice-db | MySQL root password |
| `FEEDBACK_DB_HOST` | feedback-service | PostgreSQL hostname |
| `FEEDBACK_DB_PORT` | feedback-service | PostgreSQL port |
| `FEEDBACK_DB_USER` | feedback-service, feedback-db | PostgreSQL user |
| `FEEDBACK_DB_PASSWORD` | feedback-service, feedback-db | PostgreSQL password |
| `FEEDBACK_DB_NAME` | feedback-service, feedback-db | PostgreSQL database name |
| `GATEWAY_PORT` | gateway | Port the gateway listens on |
| `NOTICE_SERVICE_PORT` | notice-service | Port the notice service listens on |
| `FEEDBACK_SERVICE_PORT` | feedback-service | Port the feedback service listens on |
| `NOTICE_SERVICE_URL` | gateway | Internal URL for routing to notice-service |
| `FEEDBACK_SERVICE_URL` | gateway | Internal URL for routing to feedback-service |
| `FRONTEND_PORT` | frontend | Port exposed to the browser |

---

## License

MIT
