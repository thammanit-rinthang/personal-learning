import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Actor } from "@/server/actor";
import { getAssessmentHistory } from "@/services/assessment.service";
import { getConceptMastery, getCommonMistakes, getWeakConcepts } from "@/services/mastery.service";
import { getCourseProgress } from "@/services/progress.service";
import { mcpErrorResult, jsonResult } from "@/mcp/tools/result";

export function registerAnalyticsTools(server: McpServer, actor: Actor) {
  server.registerTool("get_course_progress", {
    description: "Get a user's published-lesson progress for a course.",
    inputSchema: { courseId: z.string().min(1), userId: z.string().min(1) },
    annotations: { readOnlyHint: true },
  }, async ({ courseId, userId }) => {
    try {
      return jsonResult(await getCourseProgress(actor, courseId, userId));
    } catch (error) {
      return mcpErrorResult(error);
    }
  });

  server.registerTool("get_concept_mastery", {
    description: "Get a user's concept mastery records.",
    inputSchema: { userId: z.string().min(1) },
    annotations: { readOnlyHint: true },
  }, async ({ userId }) => {
    try {
      return jsonResult(await getConceptMastery(actor, userId));
    } catch (error) {
      return mcpErrorResult(error);
    }
  });

  server.registerTool("get_weak_concepts", {
    description: "Get concepts with at least three graded answers and mastery below 70 percent.",
    inputSchema: { userId: z.string().min(1) },
    annotations: { readOnlyHint: true },
  }, async ({ userId }) => {
    try {
      return jsonResult(await getWeakConcepts(actor, userId));
    } catch (error) {
      return mcpErrorResult(error);
    }
  });

  server.registerTool("get_common_mistakes", {
    description: "Get unresolved mistakes ordered by frequency.",
    inputSchema: { userId: z.string().min(1) },
    annotations: { readOnlyHint: true },
  }, async ({ userId }) => {
    try {
      return jsonResult(await getCommonMistakes(actor, userId));
    } catch (error) {
      return mcpErrorResult(error);
    }
  });

  server.registerTool("get_assessment_history", {
    description: "Get submitted assessment attempts for a user.",
    inputSchema: { userId: z.string().min(1) },
    annotations: { readOnlyHint: true },
  }, async ({ userId }) => {
    try {
      return jsonResult(await getAssessmentHistory(actor, userId));
    } catch (error) {
      return mcpErrorResult(error);
    }
  });
}
