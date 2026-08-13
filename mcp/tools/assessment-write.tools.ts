import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AssessmentType, FeedbackMode } from "@/app/generated/prisma/client";
import type { Actor } from "@/server/actor";
import { createAssessment } from "@/services/assessment.service";
import { mcpErrorResult, jsonResult } from "@/mcp/tools/result";

export function registerAssessmentWriteTools(server: McpServer, actor: Actor) {
  server.registerTool("create_assessment", {
    description: "Create a draft assessment.",
    inputSchema: {
      courseId: z.string().min(1), slug: z.string().min(1), title: z.string().min(1), description: z.string().nullable().optional(),
      type: z.nativeEnum(AssessmentType), feedbackMode: z.nativeEnum(FeedbackMode).default(FeedbackMode.AFTER_SUBMIT),
      passingScore: z.number().int().min(0).max(100).default(70), randomizeOrder: z.boolean().default(false),
      sections: z.array(z.object({ title: z.string().min(1), instructions: z.string().nullable().optional(), position: z.number().int(), questionCount: z.number().int().nullable().optional(), randomize: z.boolean().default(false) })).optional(),
    },
  }, async (input) => {
    try { return jsonResult(await createAssessment(actor, input)); } catch (error) { return mcpErrorResult(error); }
  });
}
