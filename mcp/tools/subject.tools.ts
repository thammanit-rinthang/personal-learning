import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Actor } from "@/server/actor";
import { listSubjects } from "@/services/subject.service";
import { jsonResult, mcpErrorResult } from "@/mcp/tools/result";

export function registerSubjectTools(server: McpServer, actor: Actor) {
  server.registerTool("list_subjects", {
    description: "List subjects that can be used as the parent of a new course.",
    annotations: { readOnlyHint: true },
  }, async () => {
    try { return jsonResult(await listSubjects(actor)); } catch (error) { return mcpErrorResult(error); }
  });
}
