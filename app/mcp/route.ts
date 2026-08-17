import { authenticateMcpRequest } from "@/mcp/auth";
import { createMcpServer } from "@/mcp/server";
import { AppError } from "@/server/errors";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

export const runtime = "nodejs";

function errorResponse(error: unknown, request: Request): Response {
  if (error instanceof AppError) {
    const headers = new Headers({ "content-type": "application/json" });
    if (error.code === "UNAUTHORIZED") {
      headers.set("WWW-Authenticate", `Bearer resource_metadata="${new URL("/.well-known/oauth-protected-resource", request.url).toString()}"`);
    }
    return new Response(JSON.stringify({ error: { code: error.code, message: error.message } }), { status: error.status, headers });
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
    return errorResponse(error, request);
  }
}

export const GET = handleMcpRequest;
export const POST = handleMcpRequest;
export const DELETE = handleMcpRequest;
