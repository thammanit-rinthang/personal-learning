import "server-only";

import type { Prisma } from "@/app/generated/prisma/client";
import type { Actor } from "@/server/actor";
import { prisma } from "@/db/prisma";
import type { TransactionClient } from "@/db/transaction";

type AuditLogClient = Pick<TransactionClient, "auditLog">;

export type AuditInput = {
  actor: Actor;
  action: string;
  entityType: string;
  entityId?: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  source?: string;
  db?: AuditLogClient;
};

export async function createAuditLog({ actor, action, entityType, entityId, before, after, source, db }: AuditInput): Promise<void> {
  await (db ?? prisma).auditLog.create({
    data: {
      actorType: actor.type,
      actorId: actor.type === "USER" ? actor.id : null,
      mcpClientId: actor.type === "MCP" ? actor.id : null,
      action,
      entityType,
      entityId,
      source,
      before,
      after,
    },
  });
}
