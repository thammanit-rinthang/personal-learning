import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { QuestionType } from "@/app/generated/prisma/client";
import type { Actor } from "@/server/actor";
import { createQuestionsBulk, updateQuestion } from "@/services/question.service";
import { mcpErrorResult, jsonResult } from "@/mcp/tools/result";

const questionSchema = z.object({
  type: z.nativeEnum(QuestionType),
  prompt: z.string().min(1),
  explanation: z.string().nullable().optional(),
  hint: z.string().nullable().optional(),
  difficulty: z.number().int().min(1).max(5).default(1),
  answerConfig: z.unknown(),
  choices: z.array(z.object({ text: z.string().min(1), isCorrect: z.boolean().default(false), feedback: z.string().nullable().optional() })).optional(),
  conceptIds: z.array(z.string()).default([]),
});

export function registerQuestionWriteTools(server: McpServer, actor: Actor) {
  server.registerTool("create_questions_bulk", { description: "Create draft questions. MCP-created questions always remain DRAFT.", inputSchema: { questions: z.array(questionSchema).min(1) } }, async (input) => {
    try { return jsonResult(await createQuestionsBulk(actor, input)); } catch (error) { return mcpErrorResult(error); }
  });
  server.registerTool("update_question", { description: "Update a draft question. Published questions cannot be changed by MCP.", inputSchema: { questionId: z.string().min(1), prompt: z.string().min(1).optional(), explanation: z.string().nullable().optional(), hint: z.string().nullable().optional(), difficulty: z.number().int().min(1).max(5).optional(), answerConfig: z.unknown().optional(), choices: z.array(z.object({ text: z.string().min(1), isCorrect: z.boolean(), feedback: z.string().nullable().optional() })).optional(), conceptIds: z.array(z.string().min(1)).optional() } }, async ({ questionId, ...input }) => {
    try { return jsonResult(await updateQuestion(actor, questionId, input)); } catch (error) { return mcpErrorResult(error); }
  });
}
