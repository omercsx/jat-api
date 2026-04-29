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

*Diagram coming — Phase 11.*

## Decision log

*Decisions logged as the project evolves.*