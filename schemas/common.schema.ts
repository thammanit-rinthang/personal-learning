import { z } from "zod";

export const permissionSchema = z.enum([
  "course:read",
  "course:write",
  "lesson:read",
  "lesson:write",
  "question:read",
  "question:write",
  "assessment:read",
  "assessment:write",
  "analytics:read",
  "source:read",
  "source:write",
  "content:read_all",
  "content:write_all",
  "publish:write",
]);

export type Permission = z.infer<typeof permissionSchema>;
