import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Actor } from "@/server/actor";
import { getCourse, listCourses, listModules } from "@/services/course.service";

function resourceContents(uri: URL, value: unknown) {
  return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(value) }] };
}

function resourceId(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export function registerCourseResources(server: McpServer, actor: Actor) {
  server.registerResource("courses", "learning://courses", { mimeType: "application/json" }, async (uri) => resourceContents(uri, await listCourses(actor)));

  server.registerResource("course", new ResourceTemplate("learning://courses/{courseId}", { list: undefined }), { mimeType: "application/json" }, async (uri, { courseId }) => resourceContents(uri, await getCourse(actor, resourceId(courseId))));

  server.registerResource("course-modules", new ResourceTemplate("learning://courses/{courseId}/modules", { list: undefined }), { mimeType: "application/json" }, async (uri, { courseId }) => resourceContents(uri, await listModules(actor, resourceId(courseId))));
}
