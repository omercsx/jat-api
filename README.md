# JAT API

Backend for Job Application Tracker: Project 1 of my fullstack mastering path.

## Stack

- Hono on Node 22 (Phase 2)
- Postgres 16 (Neon in prod, Docker locally)
- Drizzle ORM (Phase 1)
- Zod validation
- Hand-rolled JWT auth (Phase 3)

## Local dev

Prerequisites: [Volta](https://volta.sh/), Docker.

```bash
# Volta auto-switches Node; Corepack auto-switches pnpm
pnpm install
docker compose up -d
# pnpm db:migrate    # Phase 1
# pnpm dev           # Phase 2
```

## Architecture

[Schema](docs/schema.md)

## Decision log

- **UUIDv7 for all primary keys.** App-generated via `uuid` package's `v7()`. Sortable by creation time, B-tree-friendly, no enumeration leak. Postgres 16 doesn't have native `uuidv7()` (Postgres 18+ does), and we don't want to manage extensions for v1. App-side generation is simpler and works identically with Neon and local Docker Postgres.
- **`current_status` denormalized on `applications`** alongside the immutable `application_status_history` table. The latest history row is canonical, but every list query filters on status, and a correlated subquery per row is unworkable at scale. Both writes happen in the same transaction (Phase 4 will enforce this in the service layer).
- **Tags as `text[]` with a GIN index.** First-class tag entities aren't needed for v1. Migration to a join table is straightforward if tag-level metadata becomes a real requirement.
- **Three different `ON DELETE` behaviors in `applications`.** `user_id` cascades (delete the user, delete their data). `company_id` restricts (deleting a company you applied to should not silently destroy interview history — UI must prompt). `primary_contact_id` sets null (deleting a contact shouldn't kill the application).
- **Status as `text` with a CHECK constraint** rather than Postgres `ENUM`. Adding/removing values in a Postgres ENUM requires fragile DDL; CHECK constraints are easy to update with a new migration. Drizzle's TS-side `enum: [...]` gives compile-time safety; the CHECK gives runtime safety. Two layers, neither redundant.
- **`application_status_history` is append-only.** No `updated_at`, no API to edit rows. The history is the audit log; allowing edits would invalidate it.
- **Hard delete in v1, no `deleted_at`.** Soft delete forces every query to filter. Add it only when there's a real "undo" requirement.
- **Denormalized `user_id` on every owned table.** Simpler authorization checks (one column comparison per query) and faster queries (no walking FK chains). Cost is trivial duplication; benefit is real.
