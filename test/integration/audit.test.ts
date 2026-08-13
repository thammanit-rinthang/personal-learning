import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/db/prisma";
import { createAuditLog } from "@/server/audit";

describe.sequential("audit log persistence", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("persists an MCP actor audit row", async () => {
    const tokenHash = `audit-test-token-${randomUUID()}`;
    const client = await prisma.mcpClient.create({
      data: { name: "Audit test client", tokenHash, permissions: ["course:write"] },
    });

    try {
      await createAuditLog({
        actor: { id: client.id, type: "MCP", permissions: ["course:write"] },
        action: "course.create",
        entityType: "Course",
        entityId: "course-audit-test",
        source: "mcp",
        after: { status: "DRAFT" },
      });

      await expect(prisma.auditLog.findFirstOrThrow({ where: { mcpClientId: client.id } })).resolves.toMatchObject({
        actorType: "MCP",
        mcpClientId: client.id,
        action: "course.create",
        entityType: "Course",
        entityId: "course-audit-test",
        source: "mcp",
        after: { status: "DRAFT" },
      });
    } finally {
      await prisma.auditLog.deleteMany({ where: { mcpClientId: client.id } });
      await prisma.mcpClient.delete({ where: { id: client.id } });
    }
  });
});
