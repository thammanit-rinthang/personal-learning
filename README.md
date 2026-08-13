# Personal Learning OS

A multi-subject learning platform built around the hierarchy `Subject → Course → Module → Lesson → LessonBlock`. Accounting Week 01 is the MVP acceptance slice; subject-specific behavior belongs in interactive blocks rather than the core domain.

## Local development

Use pnpm only. Accounts use an email and a unique username; either can be used to sign in. Passwords must be at least 8 characters. Setup, database, test, E2E, build, authentication, and MCP operating details are in [Local development](docs/operations/local-development.md).

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## MVP architecture

Next.js pages, Server Actions, route handlers, and MCP adapters are entry points. Shared server-only application services own validation, authorization, business rules, transactions, revisions, and audit logging; business operations do not access Prisma directly from UI or MCP tool modules.

Published content is revisioned rather than overwritten. Started assessment attempts snapshot questions, and submitted attempts are immutable and graded from those snapshots.

## MCP policy

The Streamable HTTP MCP endpoint is `/mcp`. Clients authenticate with bearer tokens that are stored only as hashes, receive explicit scopes, are limited to 60 requests per minute per client, and can be revoked. MCP cannot receive `publish:write` in the MVP: every MCP content write remains `DRAFT`, requires the relevant scope and Zod validation, and creates an `AuditLog` record. Human review and an Admin publish the content.

See [ADR 0001](docs/decisions/0001-mvp-behavior-contracts.md) for the fixed MVP behavior contracts and [BREAKDOWN.md](BREAKDOWN.md) for domain and delivery detail.
