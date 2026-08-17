import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/db/prisma";
import { AppError } from "@/server/errors";

const accessTokenLifetimeMs = 60 * 60 * 1000;
const refreshTokenLifetimeMs = 30 * 24 * 60 * 60 * 1000;
const mcpPermissions = [
  "content:write_all",
  "analytics:read",
] as string[];

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function base64url(value: Buffer) {
  return value.toString("base64url");
}

function isAllowedRedirectUri(value: string) {
  const url = new URL(value);
  return url.protocol === "https:" || (url.protocol === "http:" && url.hostname === "localhost");
}

function assertResource(resource: string) {
  const configured = new URL(process.env.APP_URL ?? "https://personal-learning-flax.vercel.app");
  const origin = configured.origin;
  const normalized = resource.replace(/\/$/, "");
  if (normalized !== `${origin}/mcp` && normalized !== origin) throw new AppError("VALIDATION", "OAuth resource does not match this MCP server");
}

export async function registerOAuthClient(input: { clientName?: string; redirectUris: string[] }) {
  if (input.redirectUris.some((uri) => !isAllowedRedirectUri(uri))) throw new AppError("VALIDATION", "Redirect URIs must use HTTPS or localhost");
  const clientId = `plc_${base64url(randomBytes(24))}`;
  await prisma.mcpOAuthClient.create({ data: { clientId, redirectUris: input.redirectUris } });
  return { client_id: clientId, client_name: input.clientName ?? "Codex MCP client", redirect_uris: input.redirectUris, grant_types: ["authorization_code", "refresh_token"], response_types: ["code"], token_endpoint_auth_method: "none" };
}

export async function createAuthorizationCode(input: { clientId: string; userId: string; redirectUri: string; codeChallenge: string; codeChallengeMethod: string; resource: string }) {
  assertResource(input.resource);
  const client = await prisma.mcpOAuthClient.findUnique({ where: { clientId: input.clientId } });
  if (!client || !client.redirectUris.includes(input.redirectUri)) throw new AppError("VALIDATION", "OAuth client or redirect URI is not registered");
  if (input.codeChallengeMethod !== "S256") throw new AppError("VALIDATION", "Only S256 PKCE is supported");
  const rawCode = base64url(randomBytes(32));
  await prisma.mcpAuthorizationCode.create({ data: { codeHash: hash(rawCode), clientId: input.clientId, userId: input.userId, redirectUri: input.redirectUri, codeChallenge: input.codeChallenge, codeChallengeMethod: input.codeChallengeMethod, resource: input.resource, expiresAt: new Date(Date.now() + 5 * 60 * 1000) } });
  return rawCode;
}

function verifyPkce(verifier: string, challenge: string) {
  return base64url(createHash("sha256").update(verifier).digest()) === challenge;
}

async function issueTokens(clientId: string, userId: string, resource: string) {
  assertResource(resource);
  const accessToken = base64url(randomBytes(32));
  const refreshToken = base64url(randomBytes(32));
  const now = Date.now();
  await prisma.$transaction([
    prisma.mcpClient.create({ data: { name: `OAuth ${clientId}`, tokenHash: hash(accessToken), userId, permissions: mcpPermissions, expiresAt: new Date(now + accessTokenLifetimeMs) } }),
    prisma.mcpRefreshToken.create({ data: { tokenHash: hash(refreshToken), clientId, userId, expiresAt: new Date(now + refreshTokenLifetimeMs) } }),
  ]);
  return { access_token: accessToken, token_type: "Bearer", expires_in: Math.floor(accessTokenLifetimeMs / 1000), refresh_token: refreshToken, scope: mcpPermissions.join(" ") };
}

export async function exchangeAuthorizationCode(input: { clientId: string; code: string; redirectUri: string; codeVerifier: string; resource: string }) {
  assertResource(input.resource);
  const code = await prisma.mcpAuthorizationCode.findUnique({ where: { codeHash: hash(input.code) } });
  if (!code || code.usedAt || code.expiresAt <= new Date() || code.clientId !== input.clientId || code.redirectUri !== input.redirectUri || code.resource !== input.resource) throw new AppError("UNAUTHORIZED", "Invalid or expired authorization code");
  if (!verifyPkce(input.codeVerifier, code.codeChallenge)) throw new AppError("UNAUTHORIZED", "PKCE verification failed");
  await prisma.mcpAuthorizationCode.update({ where: { id: code.id }, data: { usedAt: new Date() } });
  return issueTokens(code.clientId, code.userId, code.resource);
}

export async function exchangeRefreshToken(input: { clientId: string; refreshToken: string; resource: string }) {
  assertResource(input.resource);
  const token = await prisma.mcpRefreshToken.findUnique({ where: { tokenHash: hash(input.refreshToken) } });
  if (!token || token.clientId !== input.clientId || token.revokedAt || token.expiresAt <= new Date()) throw new AppError("UNAUTHORIZED", "Invalid or expired refresh token");
  await prisma.mcpRefreshToken.update({ where: { id: token.id }, data: { revokedAt: new Date() } });
  return issueTokens(token.clientId, token.userId, input.resource);
}
