import { NextRequest, NextResponse } from "next/server";
import { oauthAuthorizeSchema } from "@/schemas/mcp-oauth.schema";
import { createAuthorizationCode } from "@/mcp/oauth";
import { getCurrentActor } from "@/server/auth";
import { AppError } from "@/server/errors";

export const runtime = "nodejs";

function errorResponse(message: string, status = 400) {
  return Response.json({ error: "invalid_request", error_description: message }, { status });
}

export async function GET(request: NextRequest) {
  const parsed = oauthAuthorizeSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!parsed.success) return errorResponse("Invalid OAuth authorization request");
  const input = parsed.data;
  const actor = await getCurrentActor();
  if (!actor) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }
  if (actor.type !== "USER" || actor.role !== "ADMIN") return errorResponse("Only an Admin user may authorize this MCP client", 403);
  try {
    const code = await createAuthorizationCode({ clientId: input.client_id, userId: actor.id, redirectUri: input.redirect_uri, codeChallenge: input.code_challenge, codeChallengeMethod: input.code_challenge_method, resource: input.resource });
    const redirectUrl = new URL(input.redirect_uri);
    redirectUrl.searchParams.set("code", code);
    if (input.state) redirectUrl.searchParams.set("state", input.state);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error.message);
    return errorResponse("Authorization failed", 500);
  }
}
