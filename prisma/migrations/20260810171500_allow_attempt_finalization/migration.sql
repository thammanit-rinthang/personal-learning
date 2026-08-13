CREATE OR REPLACE FUNCTION "reject_submitted_attempt_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_attempt_id TEXT;
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
    target_attempt_id := OLD."attemptId";
  ELSE
    SELECT "attemptId"
    INTO target_attempt_id
    FROM "AttemptQuestion"
    WHERE "id" = OLD."attemptQuestionId";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "AssessmentAttempt"
    WHERE "id" = target_attempt_id
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
