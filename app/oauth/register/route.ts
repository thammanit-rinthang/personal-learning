import { oauthRegistrationSchema } from "@/schemas/mcp-oauth.schema";
import { registerOAuthClient } from "@/mcp/oauth";
import { AppError } from "@/server/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = oauthRegistrationSchema.parse(await request.json());
    return Response.json(await registerOAuthClient({ clientName: body.client_name, redirectUris: body.redirect_uris }), { status: 201 });
  } catch (error) {
    if (error instanceof AppError) return Response.json({ error: "invalid_client_metadata", error_description: error.message }, { status: 400 });
    return Response.json({ error: "invalid_client_metadata" }, { status: 400 });
  }
}
