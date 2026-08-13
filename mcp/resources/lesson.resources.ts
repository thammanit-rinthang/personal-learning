import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Actor } from "@/server/actor";
import { getLesson } from "@/services/lesson.service";

function resourceId(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export function registerLessonResources(server: McpServer, actor: Actor) {
  server.registerResource("lesson", new ResourceTemplate("learning://lessons/{lessonId}", { list: undefined }), { mimeType: "application/json" }, async (uri, { lessonId }) => ({
    contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(await getLesson(actor, resourceId(lessonId))) }],
  }));
}
