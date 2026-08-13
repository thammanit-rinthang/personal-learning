ALTER TABLE "Source" ADD COLUMN "publisher" TEXT;

UPDATE "Source"
SET "publisher" = "author"
WHERE "publisher" IS NULL
  AND "author" IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "Source"
    WHERE "publisher" IS NULL
  ) THEN
    ALTER TABLE "Source" ALTER COLUMN "publisher" SET NOT NULL;
  END IF;
END $$;
