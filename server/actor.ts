import "server-only";

import type { ActorType, UserRole } from "@/app/generated/prisma/enums";
import type { Permission } from "@/schemas/common.schema";

export type Actor = {
  id: string;
  type: ActorType;
  role?: UserRole;
  permissions: Permission[];
};
