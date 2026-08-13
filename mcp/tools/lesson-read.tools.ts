import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Actor } from "@/server/actor";
import { getLesson } from "@/services/lesson.service";
import { mcpErrorResult, jsonResult } from "@/mcp/tools/result";

export function registerLessonReadTools(server: McpServer, actor: Actor) {
  server.registerTool("get_lesson", {
    description: "Get a lesson with ordered content blocks by ID.",
    inputSchema: { lessonId: z.string().min(1) },
    annotations: { readOnlyHint: true },
  }, async ({ lessonId }) => {
    try {
      return jsonResult(await getLesson(actor, lessonId));
    } catch (error) {
      return mcpErrorResult(error);
    }
  });
}
