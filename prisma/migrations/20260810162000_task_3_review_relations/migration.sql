-- CreateTable
CREATE TABLE "QuestionSource" (
    "questionId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionSource_pkey" PRIMARY KEY ("questionId","sourceId")
);

-- CreateIndex
CREATE INDEX "QuestionSource_sourceId_idx" ON "QuestionSource"("sourceId");

-- CreateIndex
CREATE INDEX "MistakeRecord_questionId_idx" ON "MistakeRecord"("questionId");

-- CreateIndex
CREATE INDEX "MistakeRecord_attemptQuestionId_idx" ON "MistakeRecord"("attemptQuestionId");

-- AddForeignKey
ALTER TABLE "MistakeRecord" ADD CONSTRAINT "MistakeRecord_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MistakeRecord" ADD CONSTRAINT "MistakeRecord_attemptQuestionId_fkey" FOREIGN KEY ("attemptQuestionId") REFERENCES "AttemptQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSource" ADD CONSTRAINT "QuestionSource_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSource" ADD CONSTRAINT "QuestionSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
