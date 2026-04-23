# ADR-001: Use JWT for Authentication

**Date:** 2024-01-15  
**Status:** Accepted

## Context

The application needs a stateless authentication mechanism for a REST API consumed by a React SPA. Options considered: session-based (server-side), JWT (stateless), OAuth2 (delegated).

## Decision

Use **JWT (JSON Web Tokens)** signed with HS256 and stored client-side in `localStorage`.

## Rationale

- Stateless: no server-side session store required, fits a single-node deployment and is easy to scale horizontally later
- Simple to implement with `jsonwebtoken` library
- Token carries `userId` and `role`, so authorization middleware can work without an extra DB call for role checks (we still hydrate the user to detect deactivation)
- 7-day expiry with re-login is acceptable for a fitness app

## Trade-offs & Risks

| Risk | Mitigation |
|---|---|
| Token cannot be invalidated before expiry | Acceptable for this scope; short expiry (7d) reduces window |
| `localStorage` vulnerable to XSS | Helmet CSP headers reduce risk; httpOnly cookie is the production upgrade path |
| Secret rotation requires all users to re-login | Documented in technical debt |

## Alternatives Rejected

- **Sessions**: requires sticky sessions or a session store (Redis) — added complexity for no benefit at this scale
- **OAuth2**: overkill for a self-contained app with no third-party identity providers

## Consequences

- All protected endpoints require `Authorization: Bearer <token>` header
- Frontend stores token in `localStorage` and attaches it to every request via the API client
- `authenticate` middleware verifies token and attaches `req.user`
