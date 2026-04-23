# Technical Debt

## TD-01: In-Memory Cache Should Be Redis

**What:** `exercise.service.js` uses a plain JS object as a cache with a 60-second TTL.

**Why it's debt:** The cache is per-process. With multiple backend replicas, each process has its own cache — inconsistent data between instances. A write on replica A doesn't invalidate replica B's cache.

**Impact:** Medium. Acceptable for a single-node deployment; becomes a correctness bug at scale.

**Paydown plan:**
1. Add Redis to `docker-compose.yaml`
2. Replace the in-memory object with `ioredis` client calls
3. Use `SETEX` for TTL and `DEL` on invalidation
4. Estimated effort: 2–3 hours

---

## TD-02: JWT Stored in localStorage (XSS Risk)

**What:** The frontend stores the JWT in `localStorage`, accessible to any JavaScript on the page.

**Why it's debt:** If an XSS vulnerability is introduced, an attacker could steal the token.

**Impact:** Medium. Helmet headers reduce XSS surface, but the risk is not eliminated.

**Paydown plan:**
1. Move token to an `httpOnly`, `Secure`, `SameSite=Strict` cookie
2. Backend sets the cookie on login response
3. Frontend stops manual token management; cookie sent automatically
4. Requires CSRF protection (SameSite=Strict largely handles this)
5. Estimated effort: 4–6 hours

---

## TD-03: No Refresh Token / Token Expiry UX

**What:** Tokens expire after 7 days with no refresh mechanism. The user gets a 401 and is silently stuck.

**Why it's debt:** Poor user experience; no graceful re-authentication flow.

**Impact:** Low-medium. Users just need to re-login, but there's no friendly message.

**Paydown plan:**
1. Add a `refreshToken` field to the User model
2. Issue a long-lived refresh token on login
3. Add `POST /api/v1/auth/refresh` endpoint
4. Frontend intercepts 401 responses and attempts silent refresh
5. Estimated effort: 1 day

---

## TD-04: No Integration / E2E Tests

**What:** Only unit tests with mocked Prisma exist. No tests run against a real database.

**Why it's debt:** Migrations, ORM queries, and DB constraints are untested.

**Impact:** Medium. A schema change could break queries silently.

**Paydown plan:**
1. Add a `test` PostgreSQL service in `docker-compose.yaml`
2. Write integration tests using `supertest` + real Prisma (test DB seeded before each suite)
3. Run integration tests in CI using the existing GitHub Actions postgres service
4. Estimated effort: 1–2 days

---

## TD-05: Frontend Has No Error Boundary

**What:** React has no `ErrorBoundary` component. An uncaught render error crashes the entire SPA.

**Why it's debt:** Poor resilience; a single bad API response can white-screen the app.

**Impact:** Low. Mostly UX.

**Paydown plan:**
1. Wrap `<App>` or major page groups in a React `ErrorBoundary`
2. Show a friendly fallback UI with a "Reload" button
3. Estimated effort: 1–2 hours
