WITH ranked_seed_questions AS (
  SELECT
    "id",
    row_number() OVER (ORDER BY "createdAt", "id") AS position
  FROM "Question"
  WHERE "seedKey" IS NULL
    AND "prompt" ~ '^Accounting Foundations (numeric|true or false|multiple-choice|single-choice) question [1-9][0-9]*$'
)
UPDATE "Question" AS question
SET "seedKey" = 'accounting-foundations-question-' || ranked_seed_questions.position
FROM ranked_seed_questions
WHERE question."id" = ranked_seed_questions."id"
  AND ranked_seed_questions.position <= 50;
