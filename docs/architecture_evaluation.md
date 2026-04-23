# Architecture Evaluation

## Scenario 1: Database Unavailability

**Description:** The PostgreSQL container crashes or becomes unreachable during normal operation.

**What happens:**
- `GET /ready` immediately returns `503 { status: "not ready", db: "disconnected" }` — load balancers / orchestrators can use this to stop routing traffic
- Prisma throws a connection error on the next query
- The global `errorHandler` catches it and returns `500 Internal server error` (non-operational error, no detail exposed)
- The `GET /api/v1/exercises` cache continues to serve stale data for up to 60 seconds for read requests — a partial degradation rather than full outage
- Structured logs capture the error with full context

**Risk:** Users lose all write functionality; reads may serve stale data briefly.

**Mitigation:**
- `GET /ready` endpoint enables readiness-based traffic management
- In-memory cache provides brief resilience for the exercise list
- Upgrade path: add connection retry logic in `database.js` and expose a circuit breaker

---

## Scenario 2: JWT Secret Rotation

**Description:** The `JWT_SECRET` environment variable needs to be rotated (security incident or scheduled rotation).

**What happens:**
- New secret set in environment and service restarted
- All previously issued tokens become invalid immediately (jwt.verify fails)
- All logged-in users are effectively logged out on their next request
- They receive a `401 Invalid or expired token` response
- Frontend receives 401 and the user must log in again

**Risk:** Disruptive for all active users simultaneously.

**Mitigation:**
- Inform users in advance if possible (planned rotation)
- Upgrade path: implement dual-secret verification window (accept both old and new secret for a transition period), then drop the old one after TTL
- Monitor `401` spike in logs as a signal of rotation success/failure

---

## Scenario 3: Sudden Traffic Spike (10× normal load)

**Description:** A viral social media post sends 10× the normal user load to the app.

**What happens:**
- Rate limiter (`express-rate-limit`, 100 req/15min per IP) starts returning `429 Too Many Requests` for abusive clients
- `GET /api/v1/exercises` benefits from in-memory cache — DB not hit for repeat reads within 60s window
- Write-heavy endpoints (POST /workouts, POST /progress) hit the DB on every request — potential bottleneck
- Node.js single-thread event loop may queue up under very high concurrency

**Risk:** DB connection pool exhaustion; slow response times for write endpoints; legitimate users rate-limited.

**Mitigation:**
- Short term: increase Prisma connection pool size via `DATABASE_URL?connection_limit=20`
- Medium term: replace in-memory cache with Redis for distributed caching
- Long term: horizontal scaling (multiple backend replicas behind a load balancer); rate limit tuning per-user rather than per-IP
- Monitoring: structured logs + `/ready` polling to detect DB saturation early
