import { z } from "zod";

const attemptIdSchema = z.string().cuid();

export const startAttemptInputSchema = z.object({
  assessmentId: attemptIdSchema,
});

export const submitAttemptInputSchema = z.object({
  attemptId: attemptIdSchema,
  answers: z.record(z.string().cuid(), z.unknown()),
});

export type StartAttemptInput = z.infer<typeof startAttemptInputSchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptInputSchema>;
