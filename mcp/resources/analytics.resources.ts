import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Actor } from "@/server/actor";
import { getConceptMastery, getWeakConcepts } from "@/services/mastery.service";

function resourceId(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export function registerAnalyticsResources(server: McpServer, actor: Actor) {
  server.registerResource("user-analytics", new ResourceTemplate("learning://analytics/user/{userId}", { list: undefined }), { mimeType: "application/json" }, async (uri, { userId }) => ({
    contents: [{
      uri: uri.href,
      mimeType: "application/json",
      text: JSON.stringify({
        mastery: await getConceptMastery(actor, resourceId(userId)),
        weakConcepts: await getWeakConcepts(actor, resourceId(userId)),
      }),
    }],
  }));
}
