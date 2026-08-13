import "server-only";

import { prisma } from "@/db/prisma";
import { type Actor } from "@/server/actor";
import { requirePermission, requireRole } from "@/server/authorization";
import { createAuditLog } from "@/server/audit";
import { AppError } from "@/server/errors";
import { generateToken } from "@/mcp/auth";
import {
  auditLogListInputSchema,
  createMcpClientInputSchema,
  pageInputSchema,
  type AuditLogListInput,
  type CreateMcpClientInput,
  type UpdateMcpClientInput,
  updateMcpClientInputSchema,
} from "@/schemas/admin.schema";

function requireAdmin(actor: Actor) {
  requireRole(actor, ["ADMIN"]);
}

export async function listAuditLogs(actor: Actor, input: Partial<AuditLogListInput> = {}) {
  requireAdmin(actor);
  const data = auditLogListInputSchema.parse(input);
  const where = {
    actorType: data.actorType,
    entityType: data.entityType,
    action: data.action,
  };
  const [items, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (data.page - 1) * data.pageSize,
      take: data.pageSize,
      select: {
        id: true,
        actorType: true,
        actorId: true,
        mcpClientId: true,
        action: true,
        entityType: true,
        entityId: true,
        source: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { items, total, page: data.page, pageSize: data.pageSize };
}

export async function listMcpClients(actor: Actor, input: { page?: number; pageSize?: number } = {}) {
  requireAdmin(actor);
  const data = pageInputSchema.parse(input);
  const [items, total] = await prisma.$transaction([
    prisma.mcpClient.findMany({
      orderBy: { createdAt: "desc" },
      skip: (data.page - 1) * data.pageSize,
      take: data.pageSize,
      select: { id: true, name: true, permissions: true, revokedAt: true, lastUsedAt: true, createdAt: true, updatedAt: true },
    }),
    prisma.mcpClient.count(),
  ]);
  return { items, total, page: data.page, pageSize: data.pageSize };
}

export async function createMcpClient(actor: Actor, input: CreateMcpClientInput) {
  requireAdmin(actor);
  const data = createMcpClientInputSchema.parse(input);
  const token = generateToken();
  return prisma.$transaction(async (tx) => {
    const client = await tx.mcpClient.create({
      data: { name: data.name, permissions: data.permissions, tokenHash: token.hash },
      select: { id: true, name: true, permissions: true, revokedAt: true, createdAt: true },
    });
    await createAuditLog({ actor, action: "CREATE_MCP_CLIENT", entityType: "MCP_CLIENT", entityId: client.id, after: client, db: tx });
    return { client, token: token.raw };
  });
}

export async function updateMcpClient(actor: Actor, clientId: string, input: UpdateMcpClientInput) {
  requireAdmin(actor);
  const data = updateMcpClientInputSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const before = await tx.mcpClient.findUnique({ where: { id: clientId } });
    if (!before) throw new AppError("NOT_FOUND", "MCP client not found");
    const client = await tx.mcpClient.update({
      where: { id: clientId },
      data,
      select: { id: true, name: true, permissions: true, revokedAt: true, lastUsedAt: true, createdAt: true, updatedAt: true },
    });
    await createAuditLog({ actor, action: "UPDATE_MCP_CLIENT", entityType: "MCP_CLIENT", entityId: client.id, before, after: client, db: tx });
    return client;
  });
}

export async function revokeMcpClient(actor: Actor, clientId: string) {
  requireAdmin(actor);
  return prisma.$transaction(async (tx) => {
    const before = await tx.mcpClient.findUnique({ where: { id: clientId } });
    if (!before) throw new AppError("NOT_FOUND", "MCP client not found");
    if (before.revokedAt) return before;
    const client = await tx.mcpClient.update({ where: { id: clientId }, data: { revokedAt: new Date() } });
    await createAuditLog({ actor, action: "REVOKE_MCP_CLIENT", entityType: "MCP_CLIENT", entityId: client.id, before, after: client, db: tx });
    return client;
  });
}

export function requireQuestionBankRead(actor: Actor) {
  requirePermission(actor, "question:read");
}
