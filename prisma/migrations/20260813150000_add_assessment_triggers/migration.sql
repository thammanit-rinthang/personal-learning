-- Add configurable assessment placement and completion triggers.
CREATE TYPE "AssessmentTrigger" AS ENUM ('MANUAL', 'LESSON_COMPLETED', 'MODULE_COMPLETED', 'COURSE_COMPLETED');

ALTER TABLE "Assessment"
  ADD COLUMN "trigger" "AssessmentTrigger" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "isRequired" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "maxAttempts" INTEGER,
  ADD COLUMN "triggerModuleId" TEXT,
  ADD COLUMN "triggerLessonId" TEXT;

CREATE INDEX "Assessment_triggerModuleId_idx" ON "Assessment"("triggerModuleId");
CREATE INDEX "Assessment_triggerLessonId_idx" ON "Assessment"("triggerLessonId");

ALTER TABLE "Assessment"
  ADD CONSTRAINT "Assessment_triggerModuleId_fkey"
  FOREIGN KEY ("triggerModuleId") REFERENCES "Module"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Assessment_triggerLessonId_fkey"
  FOREIGN KEY ("triggerLessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
