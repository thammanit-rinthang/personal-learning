-- Add required source metadata with defaults so existing rows remain valid.
ALTER TABLE "Source"
  ADD COLUMN "sourceType" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
  ADD COLUMN "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "jurisdiction" TEXT,
  ADD COLUMN "effectiveFrom" TIMESTAMP(3),
  ADD COLUMN "effectiveUntil" TIMESTAMP(3),
  ADD COLUMN "notes" TEXT;

-- Ensure every legacy direct lesson link is represented by the join table before retirement.
INSERT INTO "LessonSource" ("lessonId", "sourceId")
SELECT "lessonId", "id"
FROM "Source"
WHERE "lessonId" IS NOT NULL
ON CONFLICT ("lessonId", "sourceId") DO NOTHING;

ALTER TABLE "Source"
  ALTER COLUMN "sourceType" DROP DEFAULT,
  ALTER COLUMN "checkedAt" DROP DEFAULT;

ALTER TABLE "Source" DROP CONSTRAINT "Source_lessonId_fkey";
DROP INDEX "Source_lessonId_idx";
ALTER TABLE "Source" DROP COLUMN "lessonId";
