import { describe, expect, it } from "vitest";

import { createMcpClientInputSchema } from "@/schemas/admin.schema";
import { sourceCreateSchema } from "@/schemas/source.schema";
import { validateMcpPermissions } from "@/mcp/permissions";

describe("admin domain contracts", () => {
  it("rejects MCP publish scope at client creation and authentication mapping", () => {
    expect(() => createMcpClientInputSchema.parse({ name: "assistant", permissions: ["publish:write"] })).toThrow();
    expect(validateMcpPermissions(["course:read", "publish:write"])).toEqual(["course:read"]);
  });

  it("validates complete source records and date ranges", () => {
    expect(() => sourceCreateSchema.parse({ title: "Revenue Department", sourceType: "GOVERNMENT", publisher: "Revenue Department", checkedAt: "2026-08-13" })).not.toThrow();
    expect(() => sourceCreateSchema.parse({ title: "Revenue Department", sourceType: "GOVERNMENT", publisher: "Revenue Department", checkedAt: "2026-08-13", effectiveFrom: "2026-02-01", effectiveUntil: "2026-01-01" })).toThrow();
  });
});
