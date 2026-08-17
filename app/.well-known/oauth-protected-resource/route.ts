export const runtime = "nodejs";

export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return Response.json({
    resource: `${origin}/mcp`,
    authorization_servers: [origin],
    scopes_supported: ["mcp:use"],
    bearer_methods_supported: ["header"],
  });
}
