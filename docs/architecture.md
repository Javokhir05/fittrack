# Architecture Documentation

## C4 Level 1 — System Context

```
┌─────────────────────────────────────────────────────┐
│                  FitTrack System                    │
│                                                     │
│  ┌──────────┐    HTTPS     ┌────────────────────┐   │
│  │  User /  │─────────────▶│   React SPA        │   │
│  │  Admin   │              │  (Presentation)    │   │
│  └──────────┘              └────────┬───────────┘   │
│                                     │ REST /api/v1  │
│                            ┌────────▼───────────┐   │
│                            │   Express API      │   │
│                            │  (Application)     │   │
│                            └────────┬───────────┘   │
│                                     │ Prisma ORM    │
│                            ┌────────▼───────────┐   │
│                            │   PostgreSQL       │   │
│                            │   (Data tier)      │   │
│                            └────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## C4 Level 2 — Container Diagram

```
┌──────────────────────────────────────────────────────────┐
│  User/Admin Browser                                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │  React SPA (Vite)                                  │  │
│  │  - AuthContext (JWT storage)                       │  │
│  │  - Pages: Login, Dashboard, Workouts,              │  │
│  │           Exercises, Progress, Admin               │  │
│  │  - API client (fetch wrapper)                      │  │
│  └──────────────────────┬─────────────────────────────┘  │
│                         │ REST JSON /api/v1               │
│  ┌──────────────────────▼─────────────────────────────┐  │
│  │  Express API (Node.js 20)                          │  │
│  │                                                    │  │
│  │  Middleware layer:                                 │  │
│  │    helmet · cors · rateLimit · errorHandler        │  │
│  │                                                    │  │
│  │  Module: auth      → JWT issue/verify              │  │
│  │  Module: exercises → CRUD + in-memory cache        │  │
│  │  Module: workouts  → CRUD + transactions           │  │
│  │  Module: progress  → CRUD                          │  │
│  │  Module: users     → admin user management         │  │
│  │                                                    │  │
│  │  /health  /ready                                   │  │
│  └──────────────────────┬─────────────────────────────┘  │
│                         │ Prisma Client                   │
│  ┌──────────────────────▼─────────────────────────────┐  │
│  │  PostgreSQL 16                                     │  │
│  │  Tables: User, Exercise, Workout,                  │  │
│  │          WorkoutExercise, ProgressEntry            │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Module Boundaries (Modular Monolith)

Each module under `src/modules/` owns:
- `*.router.js`   — HTTP routing, input validation rules
- `*.controller.js` — request/response shaping
- `*.service.js`  — business logic, cache management

Cross-cutting concerns live in `src/middleware/` and `src/config/`.

Modules do NOT import from each other's service layers. Only shared config/middleware is shared.

```
auth ──────────────────────────────────────┐
exercises  (cache: in-memory, TTL 60s) ────┤
workouts   (transactions for update)  ─────┼── shared: prisma, logger, AppError
progress ──────────────────────────────────┤
users (admin only) ────────────────────────┘
```

## Data Model

```
User ──< Workout ──< WorkoutExercise >── Exercise
User ──< ProgressEntry
```

- `WorkoutExercise` is a join table with extra data (sets, reps, weightKg)
- Cascade deletes on User → Workout and User → ProgressEntry

## Authentication & Authorization Flow

```
POST /api/v1/auth/login
  → validate input
  → bcrypt.compare password
  → jwt.sign({ userId, role }, JWT_SECRET, 7d)
  → return token

Protected request:
  → authenticate middleware
      → extract Bearer token
      → jwt.verify
      → prisma.user.findUnique (hydrate user)
      → req.user = user
  → requireRole('ADMIN') middleware (if needed)
      → check req.user.role
      → 403 if insufficient
```

## Scalability: In-Memory Cache

`GET /api/v1/exercises` is read-heavy and rarely mutated. The exercise service implements a simple TTL cache (60 seconds). Cache is invalidated on any write (create/update/delete). Response includes `X-Cache: HIT | MISS` header.

For higher scale, this can be replaced with Redis (see `docs/technical_debt.md`).

## Observability

- Structured JSON logs via **pino** in production
- Pretty logs in development
- Every error logged with `method`, `url`, `statusCode`
- `GET /health` — liveness (always 200 if process is running)
- `GET /ready` — readiness (checks DB connection, returns 503 if down)
