import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Actor } from "@/server/actor";
import { createSource, deleteSource, getSource, listSources, updateSource } from "@/services/source.service";
import { mcpErrorResult, jsonResult } from "@/mcp/tools/result";

const sourceFields = {
  courseId: z.string().min(1).optional(), title: z.string().min(1), sourceType: z.string().min(1), publisher: z.string().min(1),
  author: z.string().optional(), url: z.url().optional(), citation: z.string().optional(), publishedAt: z.coerce.date().optional(),
  checkedAt: z.coerce.date(), jurisdiction: z.string().optional(), effectiveFrom: z.coerce.date().optional(), effectiveUntil: z.coerce.date().optional(), notes: z.string().optional(),
};
const sourceUpdateFields = {
  title: z.string().min(1).optional(), sourceType: z.string().min(1).optional(), publisher: z.string().min(1).optional(),
  author: z.string().optional(), url: z.url().optional(), citation: z.string().optional(), publishedAt: z.coerce.date().optional(),
  checkedAt: z.coerce.date().optional(), jurisdiction: z.string().optional(), effectiveFrom: z.coerce.date().optional(), effectiveUntil: z.coerce.date().optional(), notes: z.string().optional(),
};

export function registerSourceTools(server: McpServer, actor: Actor) {
  server.registerTool("list_sources", { description: "List all sources, optionally filtered by course.", inputSchema: { courseId: z.string().min(1).optional(), page: z.number().int().min(1).optional(), pageSize: z.number().int().min(1).max(100).optional() }, annotations: { readOnlyHint: true } }, async (input) => {
    try { return jsonResult(await listSources(actor, input)); } catch (error) { return mcpErrorResult(error); }
  });
  server.registerTool("get_source", { description: "Get a source by ID.", inputSchema: { sourceId: z.string().min(1) }, annotations: { readOnlyHint: true } }, async ({ sourceId }) => {
    try { return jsonResult(await getSource(actor, sourceId)); } catch (error) { return mcpErrorResult(error); }
  });
  server.registerTool("create_source", { description: "Create a source record.", inputSchema: sourceFields }, async (input) => {
    try { return jsonResult(await createSource(actor, input)); } catch (error) { return mcpErrorResult(error); }
  });
  server.registerTool("update_source", { description: "Update a source record.", inputSchema: { sourceId: z.string().min(1), ...sourceUpdateFields } }, async ({ sourceId, ...input }) => {
    try { return jsonResult(await updateSource(actor, sourceId, input)); } catch (error) { return mcpErrorResult(error); }
  });
  server.registerTool("delete_source", { description: "Delete a source record.", inputSchema: { sourceId: z.string().min(1) }, annotations: { destructiveHint: true } }, async ({ sourceId }) => {
    try { return jsonResult(await deleteSource(actor, sourceId)); } catch (error) { return mcpErrorResult(error); }
  });
}
