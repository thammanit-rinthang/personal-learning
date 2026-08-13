CREATE OR REPLACE FUNCTION "reject_submitted_attempt_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  old_attempt_id TEXT;
  new_attempt_id TEXT;
BEGIN
  IF TG_TABLE_NAME = 'AssessmentAttempt' THEN
    IF OLD."isSubmitted" THEN
      RAISE EXCEPTION 'Submitted assessment attempts are immutable';
    END IF;

    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;

    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'AttemptQuestion' THEN
    old_attempt_id := OLD."attemptId";

    IF TG_OP <> 'DELETE' THEN
      new_attempt_id := NEW."attemptId";
    END IF;
  ELSE
    SELECT "attemptId"
    INTO old_attempt_id
    FROM "AttemptQuestion"
    WHERE "id" = OLD."attemptQuestionId";

    IF TG_OP <> 'DELETE' THEN
      SELECT "attemptId"
      INTO new_attempt_id
      FROM "AttemptQuestion"
      WHERE "id" = NEW."attemptQuestionId";
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "AssessmentAttempt"
    WHERE "id" IN (old_attempt_id, new_attempt_id)
      AND "isSubmitted" = true
  ) THEN
    RAISE EXCEPTION 'Submitted assessment attempts are immutable';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "AttemptQuestion_reject_submitted_mutation" ON "AttemptQuestion";
CREATE TRIGGER "AttemptQuestion_reject_submitted_mutation"
BEFORE INSERT OR UPDATE OR DELETE ON "AttemptQuestion"
FOR EACH ROW
EXECUTE FUNCTION "reject_submitted_attempt_mutation"();

DROP TRIGGER IF EXISTS "AttemptAnswer_reject_submitted_mutation" ON "AttemptAnswer";
CREATE TRIGGER "AttemptAnswer_reject_submitted_mutation"
BEFORE INSERT OR UPDATE OR DELETE ON "AttemptAnswer"
FOR EACH ROW
EXECUTE FUNCTION "reject_submitted_attempt_mutation"();