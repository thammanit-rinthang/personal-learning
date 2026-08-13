import { z } from "zod";

export const lessonCreateSchema = z.object({
  moduleId: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9\-]+$/),
  title: z.string().min(1, "Title is required"),
  summary: z.string().optional(),
  objectives: z.array(z.string().min(1)).min(1, "At least one learning objective is required"),
  position: z.number().int().min(0),
  durationMin: z.number().int().min(1).optional(),
});

export type LessonCreate = z.infer<typeof lessonCreateSchema>;

export const lessonBlockSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["MARKDOWN", "HEADING", "TEXT", "CALLOUT", "EXAMPLE", "PRACTICE", "REFERENCE"]),
  position: z.number().int().min(0),
  contentMarkdown: z.string().optional(),
  data: z.any().optional(),
});

export type LessonBlockInput = z.infer<typeof lessonBlockSchema>;

export const upsertLessonBlocksSchema = z.object({
  blocks: z.array(lessonBlockSchema).superRefine((blocks, ctx) => {
    const positions = blocks.map(b => b.position);
    if (new Set(positions).size !== positions.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Duplicate block positions",
      });
    }
  }),
});

export type UpsertLessonBlocks = z.infer<typeof upsertLessonBlocksSchema>;
