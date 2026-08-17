import { z } from "zod";

export const oauthAuthorizeSchema = z.object({
  response_type: z.literal("code"),
  client_id: z.string().min(1),
  redirect_uri: z.url(),
  code_challenge: z.string().min(43).max(128),
  code_challenge_method: z.literal("S256"),
  state: z.string().min(1).max(500).optional(),
  resource: z.url(),
});

export const oauthTokenSchema = z.object({
  grant_type: z.enum(["authorization_code", "refresh_token"]),
  client_id: z.string().min(1),
  code: z.string().min(1).optional(),
  redirect_uri: z.url().optional(),
  code_verifier: z.string().min(43).max(128).optional(),
  refresh_token: z.string().min(1).optional(),
  resource: z.url(),
});

export const oauthRegistrationSchema = z.object({
  client_name: z.string().trim().min(1).max(200).optional(),
  redirect_uris: z.array(z.url()).min(1).max(10),
  grant_types: z.array(z.string()).optional(),
  response_types: z.array(z.string()).optional(),
  token_endpoint_auth_method: z.string().optional(),
});
