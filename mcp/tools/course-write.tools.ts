import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Actor } from "@/server/actor";
import { createCourseDraft, createModule, reorderModules, updateCourse } from "@/services/course.service";
import { mcpErrorResult, jsonResult } from "@/mcp/tools/result";

export function registerCourseWriteTools(server: McpServer, actor: Actor) {
  server.registerTool("create_course_draft", { description: "Create a draft course.", inputSchema: { subjectId: z.string().min(1), slug: z.string().regex(/^[a-z0-9-]+$/), title: z.string().min(1), description: z.string().optional() } }, async (input) => {
    try { return jsonResult(await createCourseDraft(actor, input)); } catch (error) { return mcpErrorResult(error); }
  });

  server.registerTool("create_module", { description: "Create a module within a course.", inputSchema: { courseId: z.string().min(1), slug: z.string().regex(/^[a-z0-9-]+$/), title: z.string().min(1), description: z.string().optional(), position: z.number().int().min(0) } }, async (input) => {
    try { return jsonResult(await createModule(actor, input)); } catch (error) { return mcpErrorResult(error); }
  });

  server.registerTool("update_course", { description: "Update a draft course's title or description.", inputSchema: { courseId: z.string().min(1), title: z.string().min(1).optional(), description: z.string().optional() } }, async ({ courseId, ...input }) => {
    try { return jsonResult(await updateCourse(actor, courseId, input)); } catch (error) { return mcpErrorResult(error); }
  });

  server.registerTool("reorder_modules", { description: "Apply a complete module order for a course.", inputSchema: { courseId: z.string().min(1), moduleIds: z.array(z.string().min(1)).min(1) } }, async ({ courseId, moduleIds }) => {
    try { await reorderModules(actor, courseId, moduleIds); return jsonResult({ success: true }); } catch (error) { return mcpErrorResult(error); }
  });
}
