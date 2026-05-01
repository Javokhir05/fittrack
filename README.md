#  FitTrack — Health & Fitness Tracker

A multi-tier web application for logging workouts, tracking body progress, and managing an exercise catalog. Built for the *Design of Multi-Tier Internet Applications* course project.

---

## What the system does

- **Users** register/login, log workouts with exercises, track body-weight progress over time
- **Admins** manage the exercise catalog and assign user roles
- Role-based access control (USER / ADMIN) with JWT authentication
- Fully containerized, CI-tested, production-ready structure

---

## Architecture overview

```
Browser (React SPA)
      │  REST /api/v1
      ▼
Express API (Node.js)
  ├── modules/auth
  ├── modules/exercises   ← in-memory cache
  ├── modules/workouts    ← transactions
  ├── modules/progress
  └── modules/users       ← admin only
      │
      ▼
PostgreSQL (via Prisma ORM)
```

See [`docs/architecture.md`](docs/architecture.md) for full diagrams.

---

## Quick start (local without Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL running locally

### Backend
```bash
cd backend
cp .env.example .env          # edit DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
# → http://localhost:3000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Quick start with Docker Compose

```bash
# at repo root
cp backend/.env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health: http://localhost:3000/health
- Ready: http://localhost:3000/ready

---

## Required environment variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `JWT_SECRET` | Secret for signing JWTs | **required** |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `PORT` | API port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `LOG_LEVEL` | Pino log level | `info` |
| `CORS_ORIGIN` | Allowed CORS origin | `*` |

---

## How to test

```bash
cd backend
npm test                  # run all tests
npm run test:coverage     # with coverage report
```

---

## Demo steps

### Happy path
1. Open http://localhost:5173
2. Register a new user or login with `user@fittrack.com` / `User1234!`
3. Go to **Exercises** — browse the catalog (cached, see `X-Cache` header)
4. Go to **Workouts** → create a workout
5. Go to **Progress** → log a weight entry
6. Logout and login as `admin@fittrack.com` / `Admin1234!`
7. Go to **Exercises** → add a new exercise (admin only)
8. Go to **Admin** → change a user's role

### Failure path
1. Try to access `GET /api/v1/users` without a token → **401**
2. Login as USER and access `GET /api/v1/users` → **403**
3. Stop the database container: `docker compose stop db`
4. Call `GET /ready` → **503** `{ status: "not ready", db: "disconnected" }`
5. Restart: `docker compose start db` → `GET /ready` returns **200** again

---

## Project structure

```
fittrack/
├── backend/
│   ├── src/
│   │   ├── modules/         # feature modules (auth, exercises, workouts, progress, users)
│   │   ├── middleware/      # auth, validation, error handling
│   │   └── config/          # express, database, logger
│   ├── prisma/              # schema + migrations + seed
│   ├── tests/
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   └── api/
│   └── Dockerfile
├── docs/
│   ├── architecture.md
│   ├── adr/
│   ├── architecture_evaluation.md
│   └── technical_debt.md
├── docker-compose.yaml
└── .github/workflows/ci.yml
```
