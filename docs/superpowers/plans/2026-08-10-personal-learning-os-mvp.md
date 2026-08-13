# Personal Learning OS MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the Accounting Week 01 vertical slice: governed course content, a draft-only MCP interface, and responsive learner/admin workflows backed by one shared application-service layer.

**Architecture:** Next.js App Router pages, Server Actions, and MCP Route Handler adapters are thin entry points. They call shared server-only application services that enforce actor permissions, Zod validation, audit records, and Prisma transactions. The MVP starts with a deterministic, seeded assessment workflow and expands outward from the Acceptance Scenario rather than implementing every future Learning OS capability at once.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript strict mode, PostgreSQL, Prisma ORM 7 with `@prisma/adapter-pg`, Zod, Vitest, Testing Library, Playwright, official `@modelcontextprotocol/sdk`, Tailwind CSS v4.

## Global Constraints

- Use Next.js App Router; Route Handlers are public HTTP endpoints and must authenticate/authorize internally.
- Treat every Server Action as reachable by POST and re-check authentication and authorization inside it.
- Web UI and MCP tools MUST call shared `services/*` functions; neither may query Prisma directly for business operations.
- AI/MCP clients MUST NOT receive `publish:write` in MVP; all MCP-created/updated content remains `DRAFT`.
- All important mutations MUST validate inputs with Zod, authorize the actor, create `AuditLog`, and use Prisma transactions when more than one record changes.
- Published Course, Lesson, Question, and Assessment data MUST be revisioned; submitted attempts and question snapshots MUST be immutable.
- MVP question types: `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`, `NUMERIC`. Explicitly defer `SHORT_ANSWER` because its grading contract is not in MVP acceptance criteria.
- Numeric answers MUST use decimal canonical strings and an explicit non-negative `tolerance`; do not compare floating-point values directly.
- MVP mastery formula: `100 * correctCount / (correctCount + incorrectCount)`, returning `0` when there are no attempts. A concept is weak when it has at least 3 graded answers and mastery is below 70.
- MVP course progress: completed published lessons divided by all published lessons in the enrollment’s course, multiplied by 100 and rounded to the nearest integer.
- MVP module unlock: module 1 is unlocked; later modules require completion of the preceding module. Persist `unlockRule` as JSON for future rules, but evaluate only this rule in Phase 1.
- Use current `@/*` alias, Tailwind v4, semantic UI tokens, and every rule in `UXUI.md`.
- Responsive verification is required at 360px, 768px, 1024px, and 1440px.
- Use `pnpm`; do not use npm/yarn commands.
- Required validation after each completed implementation task: relevant tests, `pnpm exec tsc --noEmit`, `pnpm lint`; run `pnpm build` at phase boundaries.
- Do not commit unless the repository owner explicitly requests it.

---

## Deliverable Map

| Deliverable | Main paths | Depends on |
| --- | --- | --- |
| Foundation/test harness | `package.json`, `vitest.config.ts`, `playwright.config.ts`, `test/*` | none |
| Domain persistence | `prisma/schema.prisma`, `prisma/migrations/*`, `db/*` | foundation |
| Shared contracts/security | `schemas/*`, `server/*`, `services/*` | persistence |
| Course/content backend | `services/course.service.ts`, `services/lesson.service.ts`, `app/actions/*` | contracts |
| Questions/assessments backend | `services/question.service.ts`, `services/assessment.service.ts` | content |
| Learning analytics backend | `services/progress.service.ts`, `services/mastery.service.ts` | assessment |
| MCP/AI | `mcp/*`, `app/mcp/route.ts` | services |
| Design system | `app/globals.css`, `components/ui/*`, `components/layout/*` | foundation |
| Learner UX | `app/(learner)/*`, `features/learning/*` | service reads/actions + UI |
| Admin UX | `app/admin/*`, `features/admin/*` | service reads/actions + UI |
| End-to-end verification | `e2e/*`, `test/fixtures/*` | all prior |

## Target File Structure

```text
app/
  (learner)/
    page.tsx
    courses/
    learn/[courseSlug]/[moduleSlug]/[lessonSlug]/
    quiz/[assessmentId]/
    results/[attemptId]/
    progress/
    review/mistakes/
  admin/
    layout.tsx
    courses/
    lessons/[lessonId]/
    questions/
    assessments/
    reviews/
  actions/
    course.actions.ts
    lesson.actions.ts
    assessment.actions.ts
  mcp/route.ts
components/
  layout/
  ui/
  learning/
  admin/
db/
  prisma.ts
  transaction.ts
mcp/
  server.ts
  auth.ts
  permissions.ts
  resources/
  tools/
schemas/
  common.schema.ts
  course.schema.ts
  lesson.schema.ts
  question.schema.ts
  assessment.schema.ts
  mcp.schema.ts
server/
  auth.ts
  authorization.ts
  actor.ts
  errors.ts
  audit.ts
services/
  course.service.ts
  lesson.service.ts
  question.service.ts
  assessment.service.ts
  progress.service.ts
  mastery.service.ts
  validation.service.ts
  source.service.ts
  mcp-client.service.ts
test/
  setup.ts
  factories/
  integration/
  unit/
e2e/
prisma/
  schema.prisma
  migrations/
  seed.ts
```

## Phase 0 — Decisions and Test Harness

### Task 1: Lock MVP behavior contracts

**Files:**
- Create: `docs/decisions/0001-mvp-behavior-contracts.md`
- Modify: `BREAKDOWN.md`
- Test: none; document review is the verification

**Interfaces:**
- Produces: immutable decisions consumed by schema, services, UI, and MCP tasks.

- [ ] **Step 1: Create the decision record with these exact MVP decisions**

```md
# ADR 0001: MVP Behavior Contracts

## Authentication and roles
The MVP uses a local development session adapter with one seeded learner and one seeded admin. `Actor` is `{ id: string; type: "USER" | "MCP" | "SYSTEM"; role?: "LEARNER" | "EDITOR" | "REVIEWER" | "ADMIN"; permissions: Permission[] }`.

## Content lifecycle
Allowed transitions: `DRAFT -> IN_REVIEW -> PUBLISHED`, `DRAFT -> ARCHIVED`, `IN_REVIEW -> DRAFT`, `PUBLISHED -> ARCHIVED`. Only `ADMIN` may publish or archive. Editing published content creates a draft revision.

## Assessment scope
MVP supports `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`, and `NUMERIC`. `SHORT_ANSWER` is deferred. Numeric answer config is `{ expected: string; tolerance: string }` using decimal strings.

## Learning calculations
Course progress is completed published lessons / all published lessons. Mastery is correct / graded answers. Weak concepts require 3+ graded answers and mastery below 70.

## Module unlock
Only `PREVIOUS_MODULE_COMPLETED` is evaluated in MVP; its persisted config is `{ type: "PREVIOUS_MODULE_COMPLETED" }`.

## MCP policy
MCP uses Streamable HTTP at `/mcp`, bearer API tokens stored only as hashes, scoped permissions, 60 requests/minute/client in MVP, and no `publish:write` grant.
```

- [ ] **Step 2: Add a concise “Resolved MVP decisions” link in `BREAKDOWN.md` to this ADR**
- [ ] **Step 3: Verify the document contains no unresolved alternatives or TODO markers**

Run: `pnpm exec tsc --noEmit`

Expected: PASS; documentation does not alter compilation.

### Task 2: Install and configure the test stack

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `vitest.config.ts`
- Create: `test/setup.ts`
- Create: `playwright.config.ts`
- Create: `test/unit/smoke.test.ts`
- Create: `e2e/smoke.spec.ts`

**Interfaces:**
- Produces: `pnpm test`, `pnpm test:watch`, `pnpm test:e2e`, and `pnpm test:e2e:ui` commands.

- [ ] **Step 1: Add direct development dependencies**

```text
vitest
@vitejs/plugin-react
jsdom
@testing-library/react
@testing-library/jest-dom
@testing-library/user-event
@playwright/test
```

- [ ] **Step 2: Add scripts**

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "db:generate": "prisma generate",
  "db:migrate": "prisma migrate dev",
  "db:seed": "tsx prisma/seed.ts",
  "db:validate": "prisma validate"
}
```

- [ ] **Step 3: Write the initial failing/smoke unit test**

```ts
import { describe, expect, it } from "vitest";

describe("test harness", () => {
  it("runs unit tests", () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 4: Configure Vitest with the `@/*` alias and `test/setup.ts` importing `@testing-library/jest-dom/vitest`**
- [ ] **Step 5: Configure Playwright to use Chromium and a `webServer` command of `pnpm dev` at port 3000**
- [ ] **Step 6: Write a smoke E2E test that opens `/` and expects a visible page heading**
- [ ] **Step 7: Run validations**

Run: `pnpm test && pnpm exec tsc --noEmit && pnpm lint`

Expected: all PASS.

## Phase 1 — Backend, API, and Application Services

### Task 3: Implement the Prisma domain schema and database constraints

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_learning_os_mvp/migration.sql`
- Create: `prisma/seed.ts`
- Test: `test/integration/schema-constraints.test.ts`

**Interfaces:**
- Produces Prisma models: `User`, `Subject`, `Course`, `Module`, `Lesson`, `LessonBlock`, `Concept`, `Question`, `QuestionChoice`, `Assessment`, `AssessmentSection`, `AssessmentQuestion`, `AssessmentAttempt`, `AttemptQuestion`, `AttemptAnswer`, `CourseEnrollment`, `LessonProgress`, `UserConceptMastery`, `MistakeRecord`, `ContentRevision`, `Source`, `McpClient`, and `AuditLog`.

- [ ] **Step 1: Write constraint tests for unique course slug, module position per course, lesson position per module, and immutable submitted attempt behavior**
- [ ] **Step 2: Run the tests to confirm they fail because models do not exist**

Run: `pnpm test test/integration/schema-constraints.test.ts`

Expected: FAIL with Prisma model/type errors.

- [ ] **Step 3: Define Prisma enums**

```prisma
enum ContentStatus { DRAFT IN_REVIEW PUBLISHED ARCHIVED }
enum UserRole { LEARNER EDITOR REVIEWER ADMIN }
enum QuestionType { SINGLE_CHOICE MULTIPLE_CHOICE TRUE_FALSE NUMERIC }
enum AssessmentType { PRACTICE CONCEPT_CHECK QUIZ MASTERY_TEST MIDTERM FINAL_EXAM }
enum FeedbackMode { IMMEDIATE AFTER_SUBMIT AFTER_CLOSING }
enum LessonProgressStatus { NOT_STARTED IN_PROGRESS COMPLETED }
enum ActorType { USER MCP SYSTEM }
```

- [ ] **Step 4: Implement relations and database-level unique constraints**

```prisma
model Course {
  id        String @id @default(cuid())
  subjectId String
  slug      String @unique
  status    ContentStatus @default(DRAFT)
  version   Int @default(1)
  modules   Module[]
  @@index([subjectId, status])
}

model Module {
  id       String @id @default(cuid())
  courseId String
  position Int
  @@unique([courseId, position])
}

model Lesson {
  id       String @id @default(cuid())
  moduleId String
  position Int
  @@unique([moduleId, position])
}
```

- [ ] **Step 5: Add snapshot JSON fields to `ContentRevision` and `AttemptQuestion`, and an `isSubmitted`/`submittedAt` immutable attempt state**
- [ ] **Step 6: Create/apply migration and generate Prisma client**

Run: `pnpm db:migrate -- --name learning_os_mvp && pnpm db:generate`

Expected: migration applied and Prisma client generated.

- [ ] **Step 7: Implement seed fixtures: one admin, one learner, `accounting` subject, `accounting-pre-master` course, Week 01 module, Accounting Foundations lesson, concepts, sources, 50 draft/published question fixtures, and a 20-question quiz blueprint**
- [ ] **Step 8: Run schema and constraint tests**

Run: `pnpm db:validate && pnpm test test/integration/schema-constraints.test.ts && pnpm exec tsc --noEmit && pnpm lint`

Expected: all PASS.

### Task 4: Add server-only data access, actor authorization, audit, and typed errors

**Files:**
- Create: `db/prisma.ts`
- Create: `db/transaction.ts`
- Create: `server/actor.ts`
- Create: `server/authorization.ts`
- Create: `server/errors.ts`
- Create: `server/audit.ts`
- Create: `schemas/common.schema.ts`
- Test: `test/unit/authorization.test.ts`
- Test: `test/integration/audit.test.ts`

**Interfaces:**
- Consumes: Prisma models from Task 3.
- Produces:

```ts
export type Permission = "course:read" | "course:write" | "lesson:read" | "lesson:write" | "question:read" | "question:write" | "assessment:read" | "assessment:write" | "analytics:read" | "source:read" | "source:write" | "publish:write";
export type Actor = { id: string; type: "USER" | "MCP" | "SYSTEM"; role?: UserRole; permissions: Permission[] };
export function requirePermission(actor: Actor, permission: Permission): void;
export function requireRole(actor: Actor, roles: UserRole[]): void;
export async function createAuditLog(input: AuditInput): Promise<void>;
```

- [ ] **Step 1: Write unit tests that deny a learner `course:write`, allow an editor `lesson:write`, and deny an MCP actor without the requested scope**
- [ ] **Step 2: Implement `AppError` with `code`, `message`, HTTP status, and safe `details`**
- [ ] **Step 3: Implement the singleton Prisma client using `PrismaPg` with `DATABASE_URL`; mark module `server-only`**
- [ ] **Step 4: Implement role-to-permission mapping and `requirePermission`/`requireRole`**
- [ ] **Step 5: Implement `createAuditLog` accepting actor, action, entity type/id, before/after snapshots, and source**
- [ ] **Step 6: Write integration test proving a write service can persist one audit row with `actorType: MCP`**
- [ ] **Step 7: Run validations**

Run: `pnpm test test/unit/authorization.test.ts test/integration/audit.test.ts && pnpm exec tsc --noEmit && pnpm lint`

Expected: all PASS.

### Task 5: Build course, module, lesson, block, concept, and source services

**Files:**
- Create: `schemas/course.schema.ts`
- Create: `schemas/lesson.schema.ts`
- Create: `schemas/source.schema.ts`
- Create: `services/course.service.ts`
- Create: `services/lesson.service.ts`
- Create: `services/source.service.ts`
- Create: `services/validation.service.ts`
- Test: `test/unit/course.schema.test.ts`
- Test: `test/integration/course.service.test.ts`
- Test: `test/integration/lesson.service.test.ts`

**Interfaces:**
- Produces:

```ts
export async function createCourseDraft(actor: Actor, input: CreateCourseInput): Promise<Course>;
export async function updateCourse(actor: Actor, courseId: string, input: UpdateCourseInput): Promise<Course>;
export async function reorderModules(actor: Actor, courseId: string, moduleIds: string[]): Promise<void>;
export async function upsertLessonBlocks(actor: Actor, lessonId: string, input: UpsertLessonBlocksInput): Promise<LessonBlock[]>;
export async function validateLesson(actor: Actor, lessonId: string): Promise<ValidationResult>;
```

- [ ] **Step 1: Write Zod contract tests rejecting blank title, invalid slug, duplicate block positions, and a lesson without learning objectives**
- [ ] **Step 2: Define schemas for create/update/reorder inputs; all client-facing input types must be inferred from Zod**
- [ ] **Step 3: Implement draft Course/Module/Lesson creation with actor authorization and audit log**
- [ ] **Step 4: Implement transactional reorder by verifying that submitted IDs exactly equal persisted IDs, temporarily offsetting positions, then writing final contiguous positions**
- [ ] **Step 5: Implement ordered LessonBlock upsert supporting only `MARKDOWN`, `HEADING`, `TEXT`, `CALLOUT`, `EXAMPLE`, `PRACTICE`, and `REFERENCE` in Phase 1**
- [ ] **Step 6: Implement Concept and Source attachment services and a lesson validation result shaped as**

```ts
type ValidationResult = {
  valid: boolean;
  errors: Array<{ code: string; message: string; entityId?: string }>;
  warnings: Array<{ code: string; message: string; entityId?: string }>;
};
```

- [ ] **Step 7: Write service integration tests for ordering, audit creation, a missing objective validation error, and a source attachment**
- [ ] **Step 8: Run validations**

Run: `pnpm test test/unit/course.schema.test.ts test/integration/course.service.test.ts test/integration/lesson.service.test.ts && pnpm exec tsc --noEmit && pnpm lint`

Expected: all PASS.

### Task 6: Build question-bank and assessment services

**Files:**
- Create: `schemas/question.schema.ts`
- Create: `schemas/assessment.schema.ts`
- Create: `services/question.service.ts`
- Create: `services/assessment.service.ts`
- Test: `test/unit/question.schema.test.ts`
- Test: `test/unit/grading.test.ts`
- Test: `test/integration/assessment.service.test.ts`

**Interfaces:**
- Produces:

```ts
export function gradeAnswer(question: GradingQuestion, answer: unknown): GradeResult;
export async function createQuestionsBulk(actor: Actor, input: CreateQuestionsBulkInput): Promise<Question[]>;
export async function createAssessment(actor: Actor, input: CreateAssessmentInput): Promise<Assessment>;
export async function startAssessmentAttempt(actor: Actor, assessmentId: string): Promise<AssessmentAttempt>;
```

- [ ] **Step 1: Write failing grading tests for single choice, multiple choice order independence, true/false, numeric tolerance, and invalid answer payloads**
- [ ] **Step 2: Define discriminated Zod schemas keyed by `QuestionType`**

```ts
const numericAnswerConfigSchema = z.object({ expected: z.string().regex(/^-?\d+(\.\d+)?$/), tolerance: z.string().regex(/^\d+(\.\d+)?$/) });
```

- [ ] **Step 3: Implement pure `gradeAnswer` without database access; normalize multiple-choice IDs before comparison and parse numeric values using a decimal library selected and installed in this task**
- [ ] **Step 4: Implement question CRUD and `createQuestionsBulk`, forcing `status: DRAFT` when `actor.type === "MCP"`**
- [ ] **Step 5: Implement assessment sections/questions, deterministic random selection using an attempt-specific stored seed, and validation for inadequate pools/passing score**
- [ ] **Step 6: Implement `startAssessmentAttempt` transaction that increments attempt number, selects questions, and persists `AttemptQuestion` prompt/choice/answer snapshots**
- [ ] **Step 7: Write integration tests showing random selection is reproducible from the stored seed and an edited question cannot alter a started attempt snapshot**
- [ ] **Step 8: Run validations**

Run: `pnpm test test/unit/question.schema.test.ts test/unit/grading.test.ts test/integration/assessment.service.test.ts && pnpm exec tsc --noEmit && pnpm lint`

Expected: all PASS.

### Task 7: Submit attempts atomically and update progress, mastery, and mistakes

**Files:**
- Create: `schemas/attempt.schema.ts`
- Create: `services/progress.service.ts`
- Create: `services/mastery.service.ts`
- Modify: `services/assessment.service.ts`
- Test: `test/integration/attempt-submission.test.ts`
- Test: `test/unit/mastery.test.ts`

**Interfaces:**
- Produces:

```ts
export async function submitAssessmentAttempt(actor: Actor, attemptId: string, input: SubmitAttemptInput): Promise<AssessmentResult>;
export async function getCourseProgress(actor: Actor, courseId: string): Promise<CourseProgress>;
export async function getWeakConcepts(actor: Actor, userId: string): Promise<WeakConcept[]>;
```

- [ ] **Step 1: Write a failing transaction test that submits a 20-question attempt and expects answers, score, passed flag, mastery updates, mistake records, and submitted timestamp**
- [ ] **Step 2: Write a failing rollback test that forces an answer-validation exception and expects no answers/mastery/mistake changes**
- [ ] **Step 3: Implement pure mastery calculation tests for no answers, 2/3 correct, and weak threshold behavior**
- [ ] **Step 4: Implement `submitAssessmentAttempt` in one `prisma.$transaction`**

```text
verify attempt ownership/status
→ verify answers match snapshot questions
→ grade snapshots
→ insert AttemptAnswer rows
→ compute score/percentage/pass
→ update UserConceptMastery per question concept
→ upsert MistakeRecord for incorrect answers
→ update LessonProgress/CourseEnrollment where completion rule is met
→ mark attempt submitted
→ insert one audit log
```

- [ ] **Step 5: Ensure a submitted attempt rejects all future answer or submit calls with `CONFLICT`**
- [ ] **Step 6: Implement read services for progress, assessment history, mastery, weak concepts, and mistake review**
- [ ] **Step 7: Run validations**

Run: `pnpm test test/unit/mastery.test.ts test/integration/attempt-submission.test.ts && pnpm exec tsc --noEmit && pnpm lint && pnpm build`

Expected: all PASS.

### Task 8: Add thin Server Actions and HTTP Route Handlers

**Files:**
- Create: `app/actions/course.actions.ts`
- Create: `app/actions/lesson.actions.ts`
- Create: `app/actions/assessment.actions.ts`
- Create: `app/api/courses/[courseSlug]/route.ts`
- Create: `app/api/assessments/[assessmentId]/attempts/route.ts`
- Test: `test/integration/action-authorization.test.ts`
- Test: `test/integration/api-route-authorization.test.ts`

**Interfaces:**
- Consumes service functions from Tasks 5–7.
- Produces UI/API adapters only; no Prisma imports permitted in `app/actions/*` or `app/api/*`.

- [ ] **Step 1: Write tests that invoke a Server Action/Route Handler with an unauthorized actor and expect a safe unauthorized/forbidden response**
- [ ] **Step 2: Implement `requireCurrentActor()` in `server/auth.ts` using the local development session adapter; do not trust role data sent from forms**
- [ ] **Step 3: Implement Server Actions that parse `FormData` with Zod, call service functions, and map `AppError` to field-safe action state**
- [ ] **Step 4: Implement Route Handlers using Web `Request`/`Response`, Zod request parsing, and the same services**
- [ ] **Step 5: Add a static lint rule/test assertion that `app/actions` and `app/api` contain no imports from `@/db/prisma`**
- [ ] **Step 6: Run validations**

Run: `pnpm test test/integration/action-authorization.test.ts test/integration/api-route-authorization.test.ts && pnpm exec tsc --noEmit && pnpm lint`

Expected: all PASS.

## Phase 2 — MCP and AI Interface

### Task 9: Implement MCP authentication, permission enforcement, audit, and Streamable HTTP transport

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `mcp/auth.ts`
- Create: `mcp/permissions.ts`
- Create: `mcp/server.ts`
- Create: `app/mcp/route.ts`
- Test: `test/integration/mcp-auth.test.ts`

**Interfaces:**
- Produces:

```ts
export async function authenticateMcpRequest(request: Request): Promise<Actor>;
export function createMcpServer(): McpServer;
```

- [ ] **Step 1: Add `@modelcontextprotocol/sdk` as a direct dependency and inspect its installed API before writing transport code**
- [ ] **Step 2: Write failing tests for missing bearer token, revoked token, hashed-token match, missing scope, and audit event for successful mutation**
- [ ] **Step 3: Implement token generation that returns raw token only at creation, stores SHA-256 hash in `McpClient`, and never logs raw token**
- [ ] **Step 4: Implement `authenticateMcpRequest` from `Authorization: Bearer <token>`, check `revokedAt`, map permissions to `Actor`, update `lastUsedAt`, and enforce 60 requests/minute/client using a replaceable in-memory limiter interface**
- [ ] **Step 5: Implement `/mcp` Route Handler with the official SDK’s Streamable HTTP transport; specify Node runtime if the SDK requires it**
- [ ] **Step 6: Run validation**

Run: `pnpm test test/integration/mcp-auth.test.ts && pnpm exec tsc --noEmit && pnpm lint`

Expected: all PASS.

### Task 10: Expose MCP resources and read-only tools

**Files:**
- Create: `mcp/resources/course.resources.ts`
- Create: `mcp/resources/lesson.resources.ts`
- Create: `mcp/resources/analytics.resources.ts`
- Create: `mcp/tools/course-read.tools.ts`
- Create: `mcp/tools/analytics.tools.ts`
- Modify: `mcp/server.ts`
- Test: `test/integration/mcp-read-tools.test.ts`

**Interfaces:**
- Produces MCP resources:

```text
learning://courses
learning://courses/{courseId}
learning://courses/{courseId}/modules
learning://lessons/{lessonId}
learning://analytics/user/{userId}
```

- [ ] **Step 1: Write tests that a scoped client can read only published courses/lessons and that an unscoped client gets a structured permission error**
- [ ] **Step 2: Register `list_courses`, `get_course`, `list_modules`, `get_lesson`, `get_course_progress`, `get_concept_mastery`, `get_weak_concepts`, `get_common_mistakes`, and `get_assessment_history`**
- [ ] **Step 3: Define each tool’s input with Zod and call existing service functions only**
- [ ] **Step 4: Convert `AppError` to consistent MCP error responses without database internals**
- [ ] **Step 5: Test resources and tools against seeded Week 01 data**
- [ ] **Step 6: Run validation**

Run: `pnpm test test/integration/mcp-read-tools.test.ts && pnpm exec tsc --noEmit && pnpm lint`

Expected: all PASS.

### Task 11: Expose draft-only MCP write and validation tools

**Files:**
- Create: `mcp/tools/course-write.tools.ts`
- Create: `mcp/tools/lesson-write.tools.ts`
- Create: `mcp/tools/question-write.tools.ts`
- Create: `mcp/tools/assessment-write.tools.ts`
- Create: `mcp/tools/validation.tools.ts`
- Modify: `mcp/server.ts`
- Test: `test/integration/mcp-write-tools.test.ts`
- Test: `test/integration/mcp-validation-tools.test.ts`

**Interfaces:**
- Produces: `create_course_draft`, `create_module`, `update_module`, `reorder_modules`, `create_lesson`, `update_lesson`, `upsert_lesson_blocks`, `reorder_lesson_blocks`, `create_question`, `create_questions_bulk`, `update_question`, `create_assessment`, `update_assessment`, `add_questions_to_assessment`, `validate_course`, `validate_lesson`, `validate_question_bank`, `validate_assessment`.

- [ ] **Step 1: Write test that `create_questions_bulk` via MCP creates 20 `DRAFT` questions with `actorType: MCP` audit rows**
- [ ] **Step 2: Write test that an MCP client with forged/attempted `publish:write` cannot register or invoke publish tools in MVP**
- [ ] **Step 3: Implement each registered tool as Zod input → required permission → shared service call → safe result**
- [ ] **Step 4: Implement validation output with errors/warnings and entity identifiers so Admin UI can link to the affected record**
- [ ] **Step 5: Write end-to-end MCP acceptance test**

```text
list_courses()
→ get_course()
→ get_lesson()
→ create_questions_bulk(20 draft questions)
→ validate_course()
→ verify questions appear in admin query as Draft
```

- [ ] **Step 6: Run phase validation**

Run: `pnpm test test/integration/mcp-write-tools.test.ts test/integration/mcp-validation-tools.test.ts && pnpm exec tsc --noEmit && pnpm lint && pnpm build`

Expected: all PASS.

## Phase 3 — Frontend UX/UI

### Task 12: Establish the UXUI design system and shared UI primitives

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Create: `components/ui/button.tsx`
- Create: `components/ui/form-field.tsx`
- Create: `components/ui/status-badge.tsx`
- Create: `components/ui/progress.tsx`
- Create: `components/ui/empty-state.tsx`
- Create: `components/ui/alert.tsx`
- Create: `components/ui/dialog.tsx`
- Create: `components/ui/skeleton.tsx`
- Create: `components/layout/site-header.tsx`
- Test: `test/unit/ui-primitives.test.tsx`

**Interfaces:**
- Produces components with required states: `Button`, `FormField`, `StatusBadge`, `Progress`, `EmptyState`, `Alert`, `Dialog`, `Skeleton`.

- [ ] **Step 1: Write component tests for visible focus, disabled button state, accessible label/error connection, and text+icon content in status badge**
- [ ] **Step 2: Replace the scaffold colors with semantic CSS tokens from `UXUI.md`, including light/dark values and focus ring**
- [ ] **Step 3: Set document language to Thai (`lang="th"`) and retain Geist only if Thai glyph coverage is verified; otherwise select a single Thai/Latin-capable font through `next/font`**
- [ ] **Step 4: Implement primitives using semantic HTML, 44px minimum touch targets for icon controls, and no emoji icons**
- [ ] **Step 5: Add global reduced-motion CSS and prevent horizontal overflow without hiding legitimate table/code scrolling**
- [ ] **Step 6: Run unit validation**

Run: `pnpm test test/unit/ui-primitives.test.tsx && pnpm exec tsc --noEmit && pnpm lint`

Expected: all PASS.

### Task 13: Implement learner dashboard, course outline, and lesson reader

**Files:**
- Create: `app/(learner)/layout.tsx`
- Create: `app/(learner)/page.tsx`
- Create: `app/(learner)/courses/[courseSlug]/page.tsx`
- Create: `app/(learner)/learn/[courseSlug]/[moduleSlug]/[lessonSlug]/page.tsx`
- Create: `components/learning/course-outline.tsx`
- Create: `components/learning/lesson-renderer.tsx`
- Create: `components/learning/continue-learning.tsx`
- Create: `components/learning/mobile-outline-drawer.tsx`
- Test: `test/unit/lesson-renderer.test.tsx`
- Test: `test/unit/course-outline.test.tsx`

**Interfaces:**
- Consumes read services directly from Server Components; client components receive serializable view models only.

- [ ] **Step 1: Write tests for lesson blocks rendering safe Markdown/text/callout/example/reference content and for course outline status text not relying on color alone**
- [ ] **Step 2: Implement dashboard with exactly one primary “Continue learning” action, progress, recent result, and linked weak concepts**
- [ ] **Step 3: Implement course page as structured module/lesson list with title, duration, completion, and lock explanation**
- [ ] **Step 4: Implement desktop lesson layout with breadcrumb + course tree + focused readable content; limit reading column width**
- [ ] **Step 5: Implement mobile lesson layout with outline Drawer and previous/next navigation; do not render a persistent sidebar below 1024px**
- [ ] **Step 6: Use skeleton/empty/error/locked states defined in Task 12**
- [ ] **Step 7: Run validation**

Run: `pnpm test test/unit/lesson-renderer.test.tsx test/unit/course-outline.test.tsx && pnpm exec tsc --noEmit && pnpm lint`

Expected: all PASS.

### Task 14: Implement practice/quiz, results, progress, and mistake-review learner flows

**Files:**
- Create: `app/(learner)/quiz/[assessmentId]/page.tsx`
- Create: `app/(learner)/results/[attemptId]/page.tsx`
- Create: `app/(learner)/progress/page.tsx`
- Create: `app/(learner)/review/mistakes/page.tsx`
- Create: `components/learning/question-runner.tsx`
- Create: `components/learning/assessment-navigation.tsx`
- Create: `components/learning/assessment-result.tsx`
- Modify: `app/actions/assessment.actions.ts`
- Test: `test/unit/question-runner.test.tsx`
- Test: `test/unit/assessment-result.test.tsx`

**Interfaces:**
- Consumes: `startAssessmentAttempt`, `submitAssessmentAttempt`, progress/mastery services, and action adapters.

- [ ] **Step 1: Write tests for keyboard-selectable choices, answered/unanswered text state, numeric field validation, and submit button reporting unanswered count**
- [ ] **Step 2: Implement question runner with one question at a time on mobile, navigable question list on desktop, and 44px controls**
- [ ] **Step 3: Implement practice feedback only when `feedbackMode` permits; exam mode must not render hints/correct answers before submission**
- [ ] **Step 4: Implement submit confirmation that names the remaining unanswered count and preserves answers on server/action failure**
- [ ] **Step 5: Implement results view beginning with score/pass status, then review actions, then weak-concept recommendations**
- [ ] **Step 6: Implement progress and mistake review pages with neutral, non-punitive Thai copy and direct links to relevant practice/lesson**
- [ ] **Step 7: Run validation**

Run: `pnpm test test/unit/question-runner.test.tsx test/unit/assessment-result.test.tsx && pnpm exec tsc --noEmit && pnpm lint`

Expected: all PASS.

### Task 15: Implement Admin shell, Course/Lesson editor, and draft/revision workflow

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `app/admin/page.tsx`
- Create: `app/admin/courses/page.tsx`
- Create: `app/admin/courses/[courseId]/page.tsx`
- Create: `app/admin/lessons/[lessonId]/page.tsx`
- Create: `components/admin/admin-sidebar.tsx`
- Create: `components/admin/course-form.tsx`
- Create: `components/admin/lesson-editor.tsx`
- Create: `components/admin/lesson-block-editor.tsx`
- Create: `components/admin/validation-summary.tsx`
- Create: `components/admin/revision-panel.tsx`
- Test: `test/unit/lesson-editor.test.tsx`
- Test: `test/unit/revision-panel.test.tsx`

**Interfaces:**
- Consumes course/lesson actions and `ValidationResult` from Task 5.

- [ ] **Step 1: Write tests that editor shows save state, block-specific validation error, unsaved-change warning, and actor/source on MCP-created content**
- [ ] **Step 2: Implement responsive Admin shell: persistent sidebar on desktop, accessible drawer on mobile, and grouped navigation by Content/Quality/System**
- [ ] **Step 3: Implement Course editor with explicit Draft status, form labels/help/errors, module ordering, and no publish action for Editor role**
- [ ] **Step 4: Implement Lesson editor separating content, structure, metadata, validation, and revision controls**
- [ ] **Step 5: Implement block list with type label, ordered controls, drag/drop only after a keyboard reorder control and service-level reorder action are working**
- [ ] **Step 6: Implement Preview mode using the same `LessonRenderer` as learner pages**
- [ ] **Step 7: Implement revision panel with version, actor, time, summary, and status transition; publish button is visible/active only for Admin after blocking validation passes**
- [ ] **Step 8: Run validation**

Run: `pnpm test test/unit/lesson-editor.test.tsx test/unit/revision-panel.test.tsx && pnpm exec tsc --noEmit && pnpm lint`

Expected: all PASS.

### Task 16: Implement Admin question bank, assessment builder, review, source, audit, and MCP client views

**Files:**
- Create: `app/admin/questions/page.tsx`
- Create: `app/admin/assessments/page.tsx`
- Create: `app/admin/reviews/page.tsx`
- Create: `app/admin/sources/page.tsx`
- Create: `app/admin/mcp-clients/page.tsx`
- Create: `app/admin/audit-logs/page.tsx`
- Create: `components/admin/question-form.tsx`
- Create: `components/admin/question-bank-table.tsx`
- Create: `components/admin/assessment-builder.tsx`
- Create: `components/admin/review-queue.tsx`
- Create: `components/admin/mcp-client-table.tsx`
- Test: `test/unit/question-form.test.tsx`
- Test: `test/unit/assessment-builder.test.tsx`

**Interfaces:**
- Consumes question/assessment/source/MCP-client services and actions.

- [ ] **Step 1: Write component tests for type-specific answer configuration, correct answer visibility in edit mode, insufficient pool error, and active filter reset**
- [ ] **Step 2: Implement responsive Question Bank: desktop comparison table, mobile stacked list, search/filter state in URL, draft/validation/actor visibility**
- [ ] **Step 3: Implement Question form using the same Zod discriminated types as backend; do not duplicate answer validation rules in ad hoc UI code**
- [ ] **Step 4: Implement Assessment Builder displaying sections, selected/pool counts, randomization, total points, passing score, and blocking validation in context**
- [ ] **Step 5: Implement review queue/revision comparison and human-only Publish confirmation**
- [ ] **Step 6: Implement source list and MCP client management views; never re-display raw token after creation; Revocation requires confirmation**
- [ ] **Step 7: Implement audit list with actor/action/entity/time/source, pagination, filters, and responsive fallback**
- [ ] **Step 8: Run phase validation**

Run: `pnpm test test/unit/question-form.test.tsx test/unit/assessment-builder.test.tsx && pnpm exec tsc --noEmit && pnpm lint && pnpm build`

Expected: all PASS.

## Phase 4 — Acceptance, Accessibility, and Runtime Verification

### Task 17: Add Week 01 acceptance E2E suite and responsive checks

**Files:**
- Create: `e2e/learner-week-01.spec.ts`
- Create: `e2e/admin-mcp-draft.spec.ts`
- Create: `e2e/responsive.spec.ts`
- Modify: `playwright.config.ts`

**Interfaces:**
- Validates the user-visible acceptance criteria in `REQUIREMENT.md` section 66.

- [ ] **Step 1: Write the learner journey test**

```text
sign in as learner
→ open dashboard
→ continue Accounting Week 01
→ read Accounting Foundations
→ start 20-question quiz
→ answer fixture values to score 85%
→ submit
→ see score/result
→ see Week 01 completed
→ see Profit vs Cash in weak concepts
```

- [ ] **Step 2: Write admin/MCP draft visibility test**

```text
invoke seeded MCP client create_questions_bulk
→ sign in as admin
→ open Question Bank
→ filter Draft
→ see MCP actor/source and created questions
→ verify no AI publish control exists
```

- [ ] **Step 3: Write viewport loop for 360, 768, 1024, 1440 checking nav/action visibility, no document horizontal overflow, learner outline behavior, and Admin table fallback**
- [ ] **Step 4: Add keyboard test for question selection, dialog escape/focus return, and admin drawer navigation**
- [ ] **Step 5: Run E2E suite**

Run: `pnpm test:e2e`

Expected: all PASS.

### Task 18: Final verification and documentation update

**Files:**
- Modify: `README.md`
- Modify: `BREAKDOWN.md`
- Modify: `UXUI.md` only if implementation uncovered a concrete rule ambiguity
- Create: `docs/operations/local-development.md`

**Interfaces:**
- Produces reproducible local setup and MVP verification instructions.

- [ ] **Step 1: Document required environment variables without values**

```text
DATABASE_URL=
APP_URL=http://localhost:3000
SESSION_SECRET=
MCP_TOKEN_PEPPER=
```

- [ ] **Step 2: Document local commands**

```text
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
pnpm test
pnpm test:e2e
pnpm build
```

- [ ] **Step 3: Document the MCP boundary: `/mcp`, bearer token handling, scopes, draft-only writes, and audit behavior**
- [ ] **Step 4: Run final full verification**

Run: `pnpm db:validate && pnpm test && pnpm exec tsc --noEmit && pnpm lint && pnpm build && pnpm test:e2e`

Expected: all PASS.

- [ ] **Step 5: Manually verify the `UXUI.md` Definition of Done at 360px, 768px, 1024px, and 1440px for dashboard, lesson, quiz, course editor, question bank, and assessment builder**

## Plan Self-Review

### Coverage

- Core content hierarchy, concepts, sources, question bank, assessment blueprint, snapshots, grading, progress, mastery, mistakes, revisions, audit, MCP clients: Tasks 3–7.
- Shared application layer and protected web/API adapters: Tasks 4–8.
- MCP authentication, scoped reads/writes, validation, audit, no AI publishing: Tasks 9–11.
- Learner and Admin UX/UI rules, state completeness, responsive behavior, accessibility: Tasks 12–16.
- Requirement acceptance scenario and UX verification: Tasks 17–18.

### Explicit deferrals after MVP acceptance

Flashcards, Markdown import/export, full-text search, source freshness scheduler, reviewer notes workflow depth, generic unlock-rule engine, user management, remote OAuth, advanced question types, interactive subject plugins, PDF export, and all Phase 2–4 capabilities. Each requires a separate approved plan after the Week 01 vertical slice passes.

### Consistency checks

- All web and MCP mutations depend on the same service layer.
- `DRAFT` is enforced for MCP writes.
- Question snapshots are created before answers and grading reads snapshots rather than current questions.
- Service contracts named here are introduced before their UI/MCP consumers.
- The plan deliberately avoids direct Prisma imports from UI Actions, Route Handlers, and MCP tool modules.
