# Personal Learning OS

Read `AGENTS.md` first and follow it as the repository instruction source.

## Fast context

- Product: multi-subject Learning OS; Accounting is the Week 01 MVP acceptance case only.
- Architecture: UI/Server Actions/Route Handlers/MCP → shared services → Prisma/PostgreSQL.
- Never bypass services or access Prisma directly from UI adapters, route handlers, or MCP tools.
- MCP is scoped, audited, draft-only in MVP; AI cannot publish.
- Read `UXUI.md` before UI work and `docs/superpowers/plans/2026-08-10-personal-learning-os-mvp.md` before implementation.

## Mandatory checks

```text
pnpm exec tsc --noEmit
pnpm lint
pnpm build  # phase boundary
```

Use `pnpm`, Zod for external inputs, TypeScript strict, and the installed Next.js 16 documentation.
