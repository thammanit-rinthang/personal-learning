import "server-only";

import { UserRole } from "@/app/generated/prisma/enums";
import type { Actor } from "@/server/actor";
import { AppError } from "@/server/errors";
import type { Permission } from "@/schemas/common.schema";

const allPermissions: Permission[] = [
  "course:read",
  "course:write",
  "lesson:read",
  "lesson:write",
  "question:read",
  "question:write",
  "assessment:read",
  "assessment:write",
  "analytics:read",
  "source:read",
  "source:write",
  "publish:write",
];

const permissionsByRole: Record<UserRole, readonly Permission[]> = {
  [UserRole.LEARNER]: ["course:read", "lesson:read", "assessment:read", "analytics:read"],
  [UserRole.EDITOR]: [
    "course:read",
    "course:write",
    "lesson:read",
    "lesson:write",
    "question:read",
    "question:write",
    "assessment:read",
    "assessment:write",
    "source:read",
    "source:write",
  ],
  [UserRole.REVIEWER]: [
    "course:read",
    "lesson:read",
    "question:read",
    "assessment:read",
    "source:read",
  ],
  [UserRole.ADMIN]: allPermissions,
};

function hasPermission(actor: Actor, permission: Permission) {
  if (actor.permissions.includes(permission)) {
    return true;
  }

  return actor.type === "USER" && actor.role !== undefined && permissionsByRole[actor.role].includes(permission);
}

export function requirePermission(actor: Actor, permission: Permission): void {
  if (!hasPermission(actor, permission)) {
    throw new AppError("FORBIDDEN", "You do not have permission to perform this action.", {
      details: { permission },
    });
  }
}

export function requireRole(actor: Actor, roles: UserRole[]): void {
  if (actor.role === undefined || !roles.includes(actor.role)) {
    throw new AppError("FORBIDDEN", "You do not have the required role to perform this action.", {
      details: { roles },
    });
  }
}
