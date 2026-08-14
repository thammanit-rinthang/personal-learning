import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Actor } from "@/server/actor";
import { getAssessmentForAdmin, listAssessments } from "@/services/admin-content.service";
import { mcpErrorResult, jsonResult } from "@/mcp/tools/result";

export function registerAssessmentReadTools(server: McpServer, actor: Actor) {
  server.registerTool("list_assessments", {
    description: "List all assessments visible to this MCP client, including draft and review content when content:read_all is granted.",
    annotations: { readOnlyHint: true },
  }, async () => {
    try { return jsonResult(await listAssessments(actor)); } catch (error) { return mcpErrorResult(error); }
  });

  server.registerTool("get_assessment", {
    description: "Get an assessment with its sections and attached questions.",
    inputSchema: { assessmentId: z.string().min(1) },
    annotations: { readOnlyHint: true },
  }, async ({ assessmentId }) => {
    try { return jsonResult(await getAssessmentForAdmin(actor, assessmentId)); } catch (error) { return mcpErrorResult(error); }
  });
}
