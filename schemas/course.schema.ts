import { z } from "zod";

export const courseCreateSchema = z.object({
  subjectId: z.string().min(1, "Subject ID is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9\-]+$/, "Invalid slug"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export type CourseCreate = z.infer<typeof courseCreateSchema>;

export const courseUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
});

export type CourseUpdate = z.infer<typeof courseUpdateSchema>;

export const moduleCreateSchema = z.object({
  courseId: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9\-]+$/),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  position: z.number().int().min(0),
});

export type ModuleCreate = z.infer<typeof moduleCreateSchema>;
