import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Actor } from "@/server/actor";
import { getCourse, listCourses, listModules } from "@/services/course.service";
import { mcpErrorResult, jsonResult } from "@/mcp/tools/result";

export function registerCourseReadTools(server: McpServer, actor: Actor) {
  server.registerTool("list_courses", {
    description: "List courses visible to the scoped client.",
    annotations: { readOnlyHint: true },
  }, async () => {
    try {
      return jsonResult(await listCourses(actor));
    } catch (error) {
      return mcpErrorResult(error);
    }
  });

  server.registerTool("get_course", {
    description: "Get a course and its modules by ID.",
    inputSchema: { courseId: z.string().min(1) },
    annotations: { readOnlyHint: true },
  }, async ({ courseId }) => {
    try {
      return jsonResult(await getCourse(actor, courseId));
    } catch (error) {
      return mcpErrorResult(error);
    }
  });

  server.registerTool("list_modules", {
    description: "List modules and visible lessons for a course.",
    inputSchema: { courseId: z.string().min(1) },
    annotations: { readOnlyHint: true },
  }, async ({ courseId }) => {
    try {
      return jsonResult(await listModules(actor, courseId));
    } catch (error) {
      return mcpErrorResult(error);
    }
  });
}
