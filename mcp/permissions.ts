import "server-only";

import { type Permission, permissionSchema } from "@/schemas/common.schema";

export function validateMcpPermissions(scopes: string[]): Permission[] {
  const valid = new Set<Permission>();
  for (const scope of scopes) {
    const parsed = permissionSchema.safeParse(scope);
    if (parsed.success && parsed.data !== "publish:write") valid.add(parsed.data);
  }
  if (valid.has("content:read_all")) {
    ["course:read", "lesson:read", "question:read", "assessment:read", "source:read"].forEach((permission) => valid.add(permission as Permission));
  }
  if (valid.has("content:write_all")) {
    ["course:read", "course:write", "lesson:read", "lesson:write", "question:read", "question:write", "assessment:read", "assessment:write", "source:read", "source:write", "content:read_all"].forEach((permission) => valid.add(permission as Permission));
  }
  return [...valid];
}
