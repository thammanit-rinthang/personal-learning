import "server-only";
import crypto from "crypto";
import { prisma } from "@/db/prisma";
import { AppError } from "@/server/errors";
import type { Actor } from "@/server/actor";
import { validateMcpPermissions } from "@/mcp/permissions";

export function generateToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString("base64url");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

// In-memory rate limiter interface
interface RateLimiter {
  check(clientId: string): boolean;
}

class InMemoryRateLimiter implements RateLimiter {
  private rateLimit = new Map<string, { count: number; resetAt: number }>();
  
  check(clientId: string): boolean {
    const now = Date.now();
    const limit = 60;
    const windowMs = 60 * 1000;
    
    const record = this.rateLimit.get(clientId);
    if (!record || record.resetAt < now) {
      this.rateLimit.set(clientId, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (record.count >= limit) {
      return false;
    }
    record.count++;
    return true;
  }
}

export const defaultRateLimiter = new InMemoryRateLimiter();

export async function authenticateMcpRequest(request: Request, limiter: RateLimiter = defaultRateLimiter): Promise<Actor> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("UNAUTHORIZED", "Missing or invalid authorization header");
  }

  const rawToken = authHeader.substring(7);
  const hash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const client = await prisma.mcpClient.findUnique({
    where: { tokenHash: hash }
  });

  if (!client) {
    throw new AppError("UNAUTHORIZED", "Invalid token");
  }

  if (client.revokedAt && client.revokedAt <= new Date()) {
    throw new AppError("UNAUTHORIZED", "Token revoked");
  }

  if (!limiter.check(client.id)) {
    throw new AppError("FORBIDDEN", "Rate limit exceeded");
  }

  await prisma.mcpClient.update({
    where: { id: client.id },
    data: { lastUsedAt: new Date() }
  });

  const permissions = validateMcpPermissions(client.permissions);

  if (permissions.length === 0) {
    throw new AppError("FORBIDDEN", "Missing scope");
  }

  return {
    id: client.id,
    type: "MCP",
    permissions
  };
}
