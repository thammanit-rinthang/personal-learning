ALTER TABLE "User" ADD COLUMN "username" TEXT;

UPDATE "User"
SET "username" = CASE
  WHEN "email" = 'admin@learning.local' THEN 'admin'
  WHEN "email" = 'learner@learning.local' THEN 'learner'
  ELSE LOWER(REGEXP_REPLACE(SPLIT_PART("email", '@', 1), '[^a-z0-9_-]+', '-', 'g')) || '-' || SUBSTRING("id" FROM 1 FOR 8)
END
WHERE "username" IS NULL;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
