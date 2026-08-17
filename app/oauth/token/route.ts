import { oauthTokenSchema } from "@/schemas/mcp-oauth.schema";
import { exchangeAuthorizationCode, exchangeRefreshToken } from "@/mcp/oauth";
import { AppError } from "@/server/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const input = oauthTokenSchema.parse(Object.fromEntries(form.entries()));
    if (input.grant_type === "authorization_code") {
      if (!input.code || !input.redirect_uri || !input.code_verifier) throw new AppError("VALIDATION", "Authorization code, redirect_uri, and code_verifier are required");
      return Response.json(await exchangeAuthorizationCode({ clientId: input.client_id, code: input.code, redirectUri: input.redirect_uri, codeVerifier: input.code_verifier, resource: input.resource }));
    }
    if (!input.refresh_token) throw new AppError("VALIDATION", "refresh_token is required");
    return Response.json(await exchangeRefreshToken({ clientId: input.client_id, refreshToken: input.refresh_token, resource: input.resource }));
  } catch (error) {
    if (error instanceof AppError) return Response.json({ error: error.code === "UNAUTHORIZED" ? "invalid_grant" : "invalid_request", error_description: error.message }, { status: error.status === 401 ? 400 : error.status });
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }
}
