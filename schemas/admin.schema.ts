import { z } from "zod";

import { ContentStatus, UserRole } from "@/app/generated/prisma/client";
import { permissionSchema } from "@/schemas/common.schema";

export const identifierSchema = z.string().min(1);

export const pageInputSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const questionBankListInputSchema = pageInputSchema.extend({
  query: z.string().trim().min(1).optional(),
  status: z.nativeEnum(ContentStatus).optional(),
  type: z.string().min(1).optional(),
});

export const auditLogListInputSchema = pageInputSchema.extend({
  actorType: z.enum(["USER", "MCP", "SYSTEM"]).optional(),
  entityType: z.string().trim().min(1).optional(),
  action: z.string().trim().min(1).optional(),
});

export const createMcpClientInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  permissions: z.array(permissionSchema.exclude(["publish:write"])).min(1).max(12),
});

export const updateMcpClientInputSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  permissions: z.array(permissionSchema.exclude(["publish:write"])).min(1).max(12).optional(),
}).refine((input) => input.name !== undefined || input.permissions !== undefined, {
  message: "At least one field must be provided",
});

export const reviewContentInputSchema = z.object({
  entityType: z.enum(["COURSE", "LESSON", "QUESTION", "ASSESSMENT"]),
  entityId: identifierSchema,
  approved: z.boolean(),
  note: z.string().trim().max(2_000).optional(),
});

export const publishContentInputSchema = z.object({
  entityType: z.enum(["COURSE", "LESSON", "QUESTION", "ASSESSMENT"]),
  entityId: identifierSchema,
  revisionId: identifierSchema.optional(),
});

export const userRoleSchema = z.nativeEnum(UserRole);

export type QuestionBankListInput = z.infer<typeof questionBankListInputSchema>;
export type AuditLogListInput = z.infer<typeof auditLogListInputSchema>;
export type CreateMcpClientInput = z.infer<typeof createMcpClientInputSchema>;
export type UpdateMcpClientInput = z.infer<typeof updateMcpClientInputSchema>;
export type ReviewContentInput = z.infer<typeof reviewContentInputSchema>;
export type PublishContentInput = z.infer<typeof publishContentInputSchema>;
