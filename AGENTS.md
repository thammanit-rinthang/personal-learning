<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Personal Learning OS — Agent Guide

## Read first

- `REQUIREMENT.md`: complete requirements.
- `BREAKDOWN.md`: domain/system summary.
- `UXUI.md`: mandatory UI/UX rules.
- `docs/superpowers/plans/2026-08-10-personal-learning-os-mvp.md`: approved MVP implementation plan.

Use this file as the compact source of truth; read the referenced file only when its topic is relevant.

## Product

Build a multi-subject learning platform, not an Accounting-only site. Core hierarchy:

```text
Subject → Course → Module → Lesson → LessonBlock
```

Accounting is the first acceptance scenario. Subject-specific functionality belongs in plugins/interactive blocks, never in core domain logic.

MVP success flow:

```text
Dashboard → Course → Lesson → Quiz → Result → Progress
AI/MCP: read content → create draft questions → validate
```

## Stack and conventions

- Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4.
- PostgreSQL + Prisma 7 (`@prisma/adapter-pg`).
- Use Zod for all external input.
- Use `@/*` imports.
- Use `pnpm` only.
- Check installed Next.js docs before writing/modifying Next.js code.
- Before adding a dependency, inspect `package.json`; do not assume packages exist.
- Keep server code outside client bundles; client components must be isolated and receive serializable data.

## Architecture — non-negotiable

```text
Web UI / Server Actions / Route Handlers / MCP Tools
                    ↓
         shared application services
                    ↓
              Prisma + PostgreSQL
```

- Never access Prisma directly from UI actions, route handlers, or MCP tools for business operations.
- Services own authorization, validation, business rules, transactions, revisions, and audits.
- Treat Server Actions and Route Handlers as public entry points: authenticate and authorize internally.
- Mutations require: actor check, Zod validation, permission/ownership check, audit log, and transaction when multiple records change.

## Domain invariants

- Core data is relational; JSON/JSONB only for polymorphic payloads/config/snapshots.
- `Course.slug` is unique; module positions are unique per course; lesson positions are unique per module.
- Published content is never overwritten. Create a revision/draft.
- Started attempts snapshot question version, prompt, choices, and answer config.
- Submitted attempts are immutable; grade historical attempts from snapshots, not current questions.
- Assessment submission is atomic: answers → grade → score → mastery → mistakes → submitted state.
- Question Bank is reusable; Concepts are real entities linked to Lessons and Questions.
- `Module` is the core term; a UI may display “Week” but database/domain code must not use Week.

## Roles and MCP

- Learner: learn, practice, assess, view progress/mistakes.
- Editor: create/update draft content; no publish by default.
- Reviewer: review, approve/reject, notes.
- Admin: publish/archive/users/MCP/audit.
- MCP uses scoped permissions, never unrestricted admin.
- AI/MCP has no `publish:write` in MVP. MCP writes must remain `DRAFT` and create `AuditLog` entries.
- MCP never bypasses services or authorization.

## UI rules

Follow `UXUI.md`. Essential rules:

- One unified system: calm, readable learner UI; dense, task-focused admin UI.
- Mobile-first; verify 360, 768, 1024, 1440px.
- Include loading, empty, error, disabled, permission/locked, success, and unsaved states where applicable.
- Use semantic HTML, keyboard support, visible focus, WCAG AA contrast, 44px touch targets, and `prefers-reduced-motion`.
- Do not use AI-purple gradients, neon glows, generic glass cards, fake metrics/screenshots, emoji icons, hover-only actions, placeholder-only labels, or desktop tables on mobile.
- Learner: prioritize Continue Learning, course position, progress, next action, weak concepts.
- Admin: make status, save state, validation, revision, actor/source, and publish impact explicit.

## Testing and verification

Before declaring work done, run the relevant tests plus:

```text
pnpm exec tsc --noEmit
pnpm lint
```

At phase boundaries also run:

```text
pnpm build
```

Use the approved plan for exact test commands. Never claim success without command output. Do not commit unless explicitly asked.

## Scope discipline

Implement the approved Week 01 vertical slice first. Do not add payments, marketplace, social features, vector DB, AI chat, gamification, multi-tenancy, advanced spaced repetition, or subject-specific simulators unless explicitly requested.
