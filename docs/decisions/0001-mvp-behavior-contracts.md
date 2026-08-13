# ADR 0001: MVP Behavior Contracts

## Authentication and roles
The MVP uses a local development session adapter with one seeded learner and one seeded admin. `Actor` is `{ id: string; type: "USER" | "MCP" | "SYSTEM"; role?: "LEARNER" | "EDITOR" | "REVIEWER" | "ADMIN"; permissions: Permission[] }`.

## Content lifecycle
Allowed transitions: `DRAFT -> IN_REVIEW -> PUBLISHED`, `DRAFT -> ARCHIVED`, `IN_REVIEW -> DRAFT`, `PUBLISHED -> ARCHIVED`. Only `ADMIN` may publish or archive. Editing published content creates a draft revision.

## Assessment scope
MVP supports `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`, and `NUMERIC`. `SHORT_ANSWER` is deferred. Numeric answer config is `{ expected: string; tolerance: string }` using decimal strings.

## Learning calculations
Course progress is completed published lessons / all published lessons. Mastery is correct / graded answers. Weak concepts require 3+ graded answers and mastery below 70.

## Attempt immutability
`AssessmentAttempt.isSubmitted` and `submittedAt` record finalization. PostgreSQL triggers reject `UPDATE` and `DELETE` operations against a submitted attempt and its `AttemptQuestion` and `AttemptAnswer` rows. Services reject post-submission calls before they reach persistence and grade historical attempts exclusively from `AttemptQuestion` snapshots. The final Task 7 submission update is permitted because the pre-update attempt is not yet submitted.

## Module unlock
Only `PREVIOUS_MODULE_COMPLETED` is evaluated in MVP; its persisted config is `{ type: "PREVIOUS_MODULE_COMPLETED" }`.

## MCP policy
MCP uses Streamable HTTP at `/mcp`, bearer API tokens stored only as hashes, scoped permissions, 60 requests/minute/client in MVP, and no `publish:write` grant.
