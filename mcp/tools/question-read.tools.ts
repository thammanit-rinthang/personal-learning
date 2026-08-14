import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ContentStatus, QuestionType } from "@/app/generated/prisma/client";
import type { Actor } from "@/server/actor";
import { getQuestion, listQuestions } from "@/services/question.service";
import { mcpErrorResult, jsonResult } from "@/mcp/tools/result";

export function registerQuestionReadTools(server: McpServer, actor: Actor) {
  server.registerTool("list_questions", { description: "List question bank items, including draft and review questions when content:read_all is granted.", inputSchema: { page: z.number().int().min(1).optional(), pageSize: z.number().int().min(1).max(100).optional(), query: z.string().optional(), status: z.nativeEnum(ContentStatus).optional(), type: z.nativeEnum(QuestionType).optional() }, annotations: { readOnlyHint: true } }, async (input) => {
    try { return jsonResult(await listQuestions(actor, input)); } catch (error) { return mcpErrorResult(error); }
  });
  server.registerTool("get_question", { description: "Get a question with choices, concepts and sources.", inputSchema: { questionId: z.string().min(1) }, annotations: { readOnlyHint: true } }, async ({ questionId }) => {
    try { return jsonResult(await getQuestion(actor, questionId)); } catch (error) { return mcpErrorResult(error); }
  });
}
