# JAT v1 Schema

```mermaid
erDiagram
  USERS ||--o{ COMPANIES : owns
  USERS ||--o{ CONTACTS : owns
  USERS ||--o{ APPLICATIONS : owns
  COMPANIES ||--o{ CONTACTS : "employs"
  COMPANIES ||--o{ APPLICATIONS : "receives"
  CONTACTS |o--o{ APPLICATIONS : "primary contact"
  APPLICATIONS ||--o{ APPLICATION_STATUS_HISTORY : "tracked by"

  USERS {
    uuid id PK
    text email UK
    text password_hash
    timestamptz created_at
    timestamptz updated_at
  }
  COMPANIES {
    uuid id PK
    uuid user_id FK
    text name
    text website
    text notes
    timestamptz created_at
    timestamptz updated_at
  }
  CONTACTS {
    uuid id PK
    uuid user_id FK
    uuid company_id FK
    text name
    text email
    text role
    text notes
    timestamptz created_at
    timestamptz updated_at
  }
  APPLICATIONS {
    uuid id PK
    uuid user_id FK
    uuid company_id FK
    uuid primary_contact_id FK
    text role_title
    text job_post_url
    text source
    text current_status
    timestamptz applied_at
    text_array tags
    text notes
    timestamptz created_at
    timestamptz updated_at
  }
  APPLICATION_STATUS_HISTORY {
    uuid id PK
    uuid application_id FK
    text status
    text note
    timestamptz created_at
  }
```

See `src/db/schema.ts` for the source of truth (Drizzle). See `drizzle/` for the generated SQL migrations.

## Entities

| Table                        | Purpose                                                 |
| ---------------------------- | ------------------------------------------------------- |
| `users`                      | Account holders. One per signup.                        |
| `companies`                  | Organizations the user has applied to or is tracking.   |
| `contacts`                   | People at companies (recruiters, hiring managers, ICs). |
| `applications`               | A specific role applied to at a specific company.       |
| `application_status_history` | Append-only log of status changes per application.      |

## Conventions

- All primary keys are UUIDv7 generated in the application layer.
- All timestamps are `timestamp with time zone` (Postgres `timestamptz`).
- All owned tables carry `user_id` for fast tenant filtering.
- `created_at` defaults to `now()`. `updated_at` is maintained by Drizzle's `$onUpdate`.

See the **Decision log** in the main README for rationale on schema-level choices.
