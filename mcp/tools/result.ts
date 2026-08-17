import { AppError } from "@/server/errors";

export function jsonResult(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value) }],
    structuredContent: { data: value },
  };
}

export function mcpErrorResult(error: unknown) {
  const appError = error instanceof AppError ? error : null;
  const code = appError?.code ?? "INTERNAL";
  const message = appError?.message ?? "MCP operation failed. Check the input, scope, and entity identifier, then retry.";
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ error: { code, message } }) }],
    structuredContent: { error: { code, message } },
    isError: true,
  };
}
