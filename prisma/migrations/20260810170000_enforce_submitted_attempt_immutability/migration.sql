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

    RETURN OLD;
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

  RETURN OLD;
END;
$$;

CREATE TRIGGER "AssessmentAttempt_reject_submitted_mutation"
BEFORE UPDATE OR DELETE ON "AssessmentAttempt"
FOR EACH ROW
EXECUTE FUNCTION "reject_submitted_attempt_mutation"();

CREATE TRIGGER "AttemptQuestion_reject_submitted_mutation"
BEFORE UPDATE OR DELETE ON "AttemptQuestion"
FOR EACH ROW
EXECUTE FUNCTION "reject_submitted_attempt_mutation"();

CREATE TRIGGER "AttemptAnswer_reject_submitted_mutation"
BEFORE UPDATE OR DELETE ON "AttemptAnswer"
FOR EACH ROW
EXECUTE FUNCTION "reject_submitted_attempt_mutation"();
