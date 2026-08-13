-- CreateTable
CREATE TABLE "LessonSource" (
    "lessonId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonSource_pkey" PRIMARY KEY ("lessonId", "sourceId")
);

-- Backfill legacy direct source-to-lesson links before retiring "Source"."lessonId".
INSERT INTO "LessonSource" ("lessonId", "sourceId")
SELECT "lessonId", "id"
FROM "Source"
WHERE "lessonId" IS NOT NULL
ON CONFLICT ("lessonId", "sourceId") DO NOTHING;

-- CreateIndex
CREATE INDEX "LessonSource_sourceId_idx" ON "LessonSource"("sourceId");

-- AddForeignKey
ALTER TABLE "LessonSource" ADD CONSTRAINT "LessonSource_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonSource" ADD CONSTRAINT "LessonSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
