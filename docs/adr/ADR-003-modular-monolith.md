# ADR-003: Modular Monolith over Microservices

**Date:** 2024-01-22  
**Status:** Accepted

## Context

Week 8 of the course requires a decision between a modular monolith and a microservices architecture. The team evaluated both paths.

## Decision

Adopt a **modular monolith** with clear module boundaries and internal contracts.

## Rationale

- Team size (4–5 people) and timeline (12 weeks) does not justify the operational overhead of microservices
- All modules share one database, simplifying transactions (e.g. workout + exercises in one atomic operation)
- Module boundaries are enforced by convention: modules do not import from each other's service layers
- Easier to debug, test, and deploy as a single unit
- Migration to microservices is possible later by extracting modules (seam-based decomposition)

## Module Contracts

| Module | Exposes | Consumes |
|---|---|---|
| auth | JWT token, `req.user` via middleware | User model |
| exercises | Exercise list/CRUD | — |
| workouts | Workout CRUD | User (via auth), Exercise (via exerciseId FK) |
| progress | ProgressEntry CRUD | User (via auth) |
| users | User list/role update | User model |

Modules share: `prisma` client, `logger`, `AppError`, auth middleware.

## Alternatives Rejected

- **Microservices**: would require service discovery, inter-service auth, distributed tracing, and a message broker — all disproportionate for this project scope

## Consequences

- Single `docker-compose` service for backend
- Single CI pipeline for backend tests
- If the system grows: extract `exercises` or `auth` as the first candidate microservice (lowest coupling)
