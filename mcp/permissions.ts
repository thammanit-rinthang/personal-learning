import "server-only";

import { type Permission, permissionSchema } from "@/schemas/common.schema";

export function validateMcpPermissions(scopes: string[]): Permission[] {
  const valid = new Set<Permission>();
  for (const scope of scopes) {
    const parsed = permissionSchema.safeParse(scope);
    if (parsed.success && parsed.data !== "publish:write") valid.add(parsed.data);
  }
  return [...valid];
}
