# Local development

## Prerequisites

- Node.js compatible with the checked-in pnpm version
- pnpm 11.4.0
- PostgreSQL reachable from the local environment
- Playwright Chromium installed for E2E tests

Install dependencies with pnpm only:

```bash
pnpm install
pnpm exec playwright install chromium
```

## Environment variables

Create a local environment file with the variables required for the workflows you run. Do not commit environment files or credentials.

```text
DATABASE_URL
ADMIN_EMAIL
ADMIN_USERNAME
ADMIN_PASSWORD
E2E_DATABASE_URL
E2E_LEARNER_EMAIL
E2E_LEARNER_PASSWORD
PLAYWRIGHT_BASE_URL
CI
NODE_ENV
```

`DATABASE_URL` is required by Prisma, the application, and the seed command. `ADMIN_EMAIL`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` optionally set the seeded Admin credentials. E2E uses `E2E_DATABASE_URL` so it can seed its dedicated test database; `E2E_LEARNER_EMAIL` and `E2E_LEARNER_PASSWORD` provide the seeded learner credentials. `PLAYWRIGHT_BASE_URL` is optional and overrides the E2E server base address. `CI` changes Playwright retry, reporter, and development-server reuse behavior.

## Database lifecycle

Run schema validation before changing the database. Applying a development migration may create or alter database schema and prompts for a migration name when needed.

```bash
pnpm db:validate
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

The seed is idempotent for the MVP fixture data. It creates or updates the local admin, learner, Accounting subject, Week 01 course content, question fixtures, quiz blueprint, and enrollment. It uses `E2E_LEARNER_EMAIL` and `E2E_LEARNER_PASSWORD` when supplied; otherwise the seeded learner can exist without a password suitable for browser login.

## Run and verify

```bash
pnpm dev
pnpm test
pnpm exec tsc --noEmit
pnpm lint
pnpm test:e2e
pnpm build
```

`pnpm test:e2e` starts its configured Next.js development server on port 3001 unless an eligible server is already running outside CI. It performs global setup, seeds the database identified by `E2E_DATABASE_URL`, and signs in with the E2E learner credentials. Run E2E only against a disposable test database.

For the final local verification sequence:

```bash
pnpm db:validate
pnpm test
pnpm exec tsc --noEmit
pnpm lint
pnpm build
pnpm test:e2e
```

## Application authentication and sessions

The MVP authenticates locally against the seeded user records. Passwords must contain 8–128 characters and are stored as salted scrypt hashes. Successful login creates a random session token; only its SHA-256 hash is persisted. The browser receives the raw token in the `learning_session` cookie, which is `HttpOnly`, `SameSite=Lax`, scoped to `/`, and marked `Secure` in production.

Sessions expire after 30 days. Reading a session verifies its stored hash and expiry; expired or invalid sessions are cleared. Signing out revokes the matching persisted session and clears the cookie. Server Actions and route handlers call `requireCurrentActor()` themselves and do not trust role data supplied by a form or client request.

## MCP boundary and policy

MCP is exposed through the Streamable HTTP endpoint at `/mcp`. The route authenticates `Authorization: Bearer` credentials, maps the client to an MCP actor, and passes that actor to the MCP server. Raw MCP tokens are returned only when an Admin creates a client; the database retains only a SHA-256 hash. Revoked tokens are denied, successful use updates the client’s last-used timestamp, and the in-memory MVP limiter permits 60 requests per minute per client.

MCP resources and tools are adapters over the same application services used by web entry points. They must not implement separate business rules or access Prisma directly for business operations. Services validate external input with Zod, verify the actor’s scope, apply authorization and domain rules, use transactions where required, and record important mutations in `AuditLog` with the MCP actor and source.

Supported scope names are:

```text
course:read
course:write
lesson:read
lesson:write
question:read
question:write
assessment:read
assessment:write
analytics:read
source:read
source:write
```

`publish:write` is deliberately excluded from MCP client creation, updates, and effective permissions in the MVP. MCP write tools create or update only `DRAFT` content, including questions. MCP may validate content but cannot publish it. A human reviewer/Admin completes the review and publishing workflow. Admins can inspect audit records, manage client scopes, and revoke a client; raw tokens are never displayed again.
