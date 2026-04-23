# ADR-002: Use Prisma as the ORM

**Date:** 2024-01-15  
**Status:** Accepted

## Context

The backend needs a data access layer for PostgreSQL. Options considered: raw SQL (pg), query builder (Knex), full ORM (Sequelize, TypeORM, Prisma).

## Decision

Use **Prisma** as the ORM.

## Rationale

- Schema-first with `schema.prisma` — single source of truth for data model
- Auto-generated, type-safe client reduces runtime errors
- Built-in migration system (`prisma migrate dev` / `prisma migrate deploy`)
- Excellent support for relations, cascade operations, and transactions via `prisma.$transaction`
- Good N+1 awareness: `include` clauses allow explicit eager loading, making it clear when relations are loaded

## Trade-offs & Risks

| Risk | Mitigation |
|---|---|
| Prisma Client bundle size | Acceptable for a server-side Node.js app |
| Less flexible than raw SQL for complex queries | Raw SQL available via `prisma.$queryRaw` for edge cases |
| Schema changes require migration files | This is a feature, not a bug — migrations are version-controlled |

## N+1 Awareness

All `findMany` calls that include relations use explicit `include` clauses (e.g. `workout.exercises.exercise`). No lazy loading exists in Prisma by design, which forces explicit data fetching decisions.

## Alternatives Rejected

- **Raw pg**: maximum flexibility but requires manual query building, no schema management
- **Knex**: good query builder but no schema/migration story out of the box
- **Sequelize**: mature but verbose and less type-safe
- **TypeORM**: decorator-based, better with TypeScript; overkill for this JS project

## Consequences

- `prisma/schema.prisma` is the authoritative data model
- Migrations are committed to the repo and run automatically in CI and on container startup
- Seeding is done via `prisma/seed.js`
