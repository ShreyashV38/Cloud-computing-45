# 🎓 University Notice Board

A fully containerized **microservices application** where admins can
broadcast official notices and students can submit feedback. The project is designed with **single-container deployment readiness**, bundling each service and its corresponding database together into 3 core containers. Each container is managed by a separate Docker Compose file for easy load balancing across multiple VMs.

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (:8080)                          │
│                    http://localhost:8080                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │  /api/*  (nginx reverse proxy)
                           ▼
              ┌────────────────────────┐
              │  Gateway Container     │
              │ Node Gateway + Nginx   │
              │  (VM 3 / Gateway)      │
              └─────┬────────────┬─────┘
         /api/notices            /api/feedback
                │                      │
     ┌──────────▼──────────┐  ┌────────▼──────────┐
     │  Notice Container   │  │ Feedback Container │
     │  Node.js + MySQL    │  │Python + PostgreSQL │
     │  (VM 1 / Notice)    │  │ (VM 2 / Feedback)  │
     └─────────────────────┘  └────────────────────┘
```

**3 core containers**, each managed by their own compose file to allow seamless deployment across three distinct Virtual Machines (as per assignment requirements):
- `docker-compose.gateway.yml`: API Gateway + Nginx Frontend
- `docker-compose.notice.yml`: Notice API + MySQL DB
- `docker-compose.feedback.yml`: Feedback API + PostgreSQL DB

---

## Microservice Justification

### Notice Service (Node.js + MySQL)
Owns the **Notices bounded context**: creating, validating, storing, and
paginating official university announcements. It enforces title/message
length limits, rejects empty submissions, and generates `created_at`
server-side.

### Feedback Service (Python + Flask + PostgreSQL)
Owns the **Feedback bounded context**: accepting, validating, sanitising,
and paginating student feedback submissions. It trims whitespace, enforces
character limits, and requires a minimum word count to reject gibberish.

---

## Quick Start (Local Deployment)

### 1. Clone & configure

```bash
git clone <your-repo-url>
cd cloudmidpoint
```

### 2. Start Services Independently

Run these three commands to simulate the 3 VMs locally on your machine:
```bash
docker compose -f docker-compose.notice.yml up --build -d
docker compose -f docker-compose.feedback.yml up --build -d
docker compose -f docker-compose.gateway.yml up --build -d
```

Wait for the containers to fully build and the databases to initialize internally (about 1-2 minutes on first run), then open:

> **http://localhost:8080**

### 3. Stop / clean up

```bash
docker compose -f docker-compose.notice.yml down -v --remove-orphans
docker compose -f docker-compose.feedback.yml down -v --remove-orphans
docker compose -f docker-compose.gateway.yml down -v --remove-orphans
```

---

## Project Structure

```text
cloudmidpoint/
├── frontend/              ← Static HTML/CSS/JS (Merged into Gateway container)
├── gateway/               ← API Gateway + Nginx
│   ├── Dockerfile
│   ├── start.sh           ← Boot script handling Node + Nginx
│   └── src/
├── notice-service/        ← Microservice 1 (Node.js + MySQL)
│   ├── Dockerfile
│   ├── start.sh           ← Boot script handling Node + MySQL
│   └── src/
├── feedback-service/      ← Microservice 2 (Python + Flask + PostgreSQL)
│   ├── Dockerfile
│   ├── start.sh           ← Boot script handling Python + PostgreSQL
│   └── app/
├── docker-compose.gateway.yml   ← Compose config for Gateway VM
├── docker-compose.notice.yml    ← Compose config for Notice VM
├── docker-compose.feedback.yml  ← Compose config for Feedback VM
└── README.md
```
