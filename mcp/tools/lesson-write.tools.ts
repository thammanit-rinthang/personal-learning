import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Actor } from "@/server/actor";
import { createLessonDraft, reorderLessons, upsertLessonBlocks } from "@/services/lesson.service";
import { mcpErrorResult, jsonResult } from "@/mcp/tools/result";

const blockSchema = z.object({
  type: z.enum(["MARKDOWN", "HEADING", "TEXT", "CALLOUT", "EXAMPLE", "PRACTICE", "REFERENCE"]),
  position: z.number().int().min(0),
  contentMarkdown: z.string().optional(),
  data: z.unknown().optional(),
});

export function registerLessonWriteTools(server: McpServer, actor: Actor) {
  server.registerTool("create_lesson", { description: "Create a draft lesson.", inputSchema: { moduleId: z.string().min(1), slug: z.string().regex(/^[a-z0-9-]+$/), title: z.string().min(1), summary: z.string().optional(), objectives: z.array(z.string().min(1)).min(1), position: z.number().int().min(0), durationMin: z.number().int().min(1).optional() } }, async (input) => {
    try { return jsonResult(await createLessonDraft(actor, input)); } catch (error) { return mcpErrorResult(error); }
  });

  server.registerTool("upsert_lesson_blocks", { description: "Replace a lesson's ordered content blocks.", inputSchema: { lessonId: z.string().min(1), blocks: z.array(blockSchema) } }, async ({ lessonId, blocks }) => {
    try { return jsonResult(await upsertLessonBlocks(actor, lessonId, { blocks })); } catch (error) { return mcpErrorResult(error); }
  });

  server.registerTool("reorder_lessons", { description: "Apply a complete lesson order for a module.", inputSchema: { moduleId: z.string().min(1), lessonIds: z.array(z.string().min(1)).min(1) }, annotations: { idempotentHint: true } }, async ({ moduleId, lessonIds }) => {
    try { await reorderLessons(actor, moduleId, lessonIds); return jsonResult({ success: true, moduleId, lessonIds }); } catch (error) { return mcpErrorResult(error); }
  });
}
