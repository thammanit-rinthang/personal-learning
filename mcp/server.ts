import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Actor } from "@/server/actor";
import { registerAnalyticsResources } from "@/mcp/resources/analytics.resources";
import { registerCourseResources } from "@/mcp/resources/course.resources";
import { registerLessonResources } from "@/mcp/resources/lesson.resources";
import { registerAnalyticsTools } from "@/mcp/tools/analytics.tools";
import { registerCourseReadTools } from "@/mcp/tools/course-read.tools";
import { registerLessonReadTools } from "@/mcp/tools/lesson-read.tools";
import { registerAssessmentWriteTools } from "@/mcp/tools/assessment-write.tools";
import { registerCourseWriteTools } from "@/mcp/tools/course-write.tools";
import { registerLessonWriteTools } from "@/mcp/tools/lesson-write.tools";
import { registerQuestionWriteTools } from "@/mcp/tools/question-write.tools";
import { registerValidationTools } from "@/mcp/tools/validation.tools";

export function createMcpServer(actor: Actor): McpServer {
  const server = new McpServer({
    name: "Personal Learning OS",
    version: "1.0.0",
  });

  registerCourseResources(server, actor);
  registerLessonResources(server, actor);
  registerAnalyticsResources(server, actor);
  registerCourseReadTools(server, actor);
  registerLessonReadTools(server, actor);
  registerAnalyticsTools(server, actor);
  registerCourseWriteTools(server, actor);
  registerLessonWriteTools(server, actor);
  registerQuestionWriteTools(server, actor);
  registerAssessmentWriteTools(server, actor);
  registerValidationTools(server, actor);

  return server;
}
