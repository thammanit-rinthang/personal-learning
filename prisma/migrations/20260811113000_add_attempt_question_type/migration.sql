ALTER TABLE "AttemptQuestion" ADD COLUMN "questionType" "QuestionType" NOT NULL DEFAULT 'TRUE_FALSE';

UPDATE "AttemptQuestion" AS "attemptQuestion"
SET "questionType" = "question"."type"
FROM "Question" AS "question"
WHERE "attemptQuestion"."questionId" = "question"."id"
  AND "attemptQuestion"."questionType" IS NULL;

UPDATE "AttemptQuestion"
SET "questionType" = 'SINGLE_CHOICE'
WHERE "questionType" IS NULL;

ALTER TABLE "AttemptQuestion" ALTER COLUMN "questionType" SET NOT NULL;
