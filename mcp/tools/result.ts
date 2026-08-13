import type { AppError } from "@/server/errors";

export function jsonResult(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value) }],
  };
}

export function mcpErrorResult(error: unknown) {
  const appError = error as AppError;
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ error: { code: appError.code ?? "INTERNAL", message: appError.message ?? "Internal error" } }) }],
    isError: true,
  };
}
