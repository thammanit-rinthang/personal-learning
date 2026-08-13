import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Actor } from "@/server/actor";
import { validateAssessment, validateCourse, validateLesson, validateQuestionBank } from "@/services/validation.service";
import { mcpErrorResult, jsonResult } from "@/mcp/tools/result";

export function registerValidationTools(server: McpServer, actor: Actor) {
  server.registerTool("validate_course", { description: "Validate a course and return blocking errors and warnings.", inputSchema: { courseId: z.string().min(1) }, annotations: { readOnlyHint: true } }, async ({ courseId }) => {
    try { return jsonResult(await validateCourse(actor, courseId)); } catch (error) { return mcpErrorResult(error); }
  });
  server.registerTool("validate_lesson", { description: "Validate a lesson and return blocking errors and warnings.", inputSchema: { lessonId: z.string().min(1) }, annotations: { readOnlyHint: true } }, async ({ lessonId }) => {
    try { return jsonResult(await validateLesson(actor, lessonId)); } catch (error) { return mcpErrorResult(error); }
  });
  server.registerTool("validate_question_bank", { description: "Validate questions and return blocking errors and warnings.", annotations: { readOnlyHint: true } }, async () => {
    try { return jsonResult(await validateQuestionBank(actor)); } catch (error) { return mcpErrorResult(error); }
  });
  server.registerTool("validate_assessment", { description: "Validate an assessment and return blocking errors and warnings.", inputSchema: { assessmentId: z.string().min(1) }, annotations: { readOnlyHint: true } }, async ({ assessmentId }) => {
    try { return jsonResult(await validateAssessment(actor, assessmentId)); } catch (error) { return mcpErrorResult(error); }
  });
}
