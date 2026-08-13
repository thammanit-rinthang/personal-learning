CREATE OR REPLACE FUNCTION "reject_submitted_attempt_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  old_attempt_id TEXT;
  new_attempt_id TEXT;
BEGIN
  IF TG_TABLE_NAME = 'AssessmentAttempt' THEN
    IF TG_OP <> 'INSERT' AND OLD."isSubmitted" THEN
      RAISE EXCEPTION 'Submitted assessment attempts are immutable';
    END IF;

    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;

    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'AttemptQuestion' THEN
    IF TG_OP <> 'INSERT' THEN
      old_attempt_id := OLD."attemptId";
    END IF;

    IF TG_OP <> 'DELETE' THEN
      new_attempt_id := NEW."attemptId";
    END IF;
  ELSE
    IF TG_OP <> 'INSERT' THEN
      SELECT "attemptId"
      INTO old_attempt_id
      FROM "AttemptQuestion"
      WHERE "id" = OLD."attemptQuestionId";
    END IF;

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