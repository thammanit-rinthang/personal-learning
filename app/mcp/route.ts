import { authenticateMcpRequest } from "@/mcp/auth";
import { createMcpServer } from "@/mcp/server";
import { AppError } from "@/server/errors";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

export const runtime = "nodejs";

function errorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }

  return Response.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
}

async function handleMcpRequest(request: Request): Promise<Response> {
  try {
    const actor = await authenticateMcpRequest(request);
    const server = createMcpServer(actor);
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    await server.connect(transport);
    return transport.handleRequest(request);
  } catch (error) {
    return errorResponse(error);
  }
}

export const GET = handleMcpRequest;
export const POST = handleMcpRequest;
export const DELETE = handleMcpRequest;
