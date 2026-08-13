import "server-only";

export const appErrorCodes = ["UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "CONFLICT", "VALIDATION", "INTERNAL"] as const;

export type AppErrorCode = (typeof appErrorCodes)[number];
export type SafeErrorDetail = string | number | boolean | null | SafeErrorDetail[] | { [key: string]: SafeErrorDetail };
export type SafeErrorDetails = Record<string, SafeErrorDetail>;

type AppErrorOptions = {
  details?: SafeErrorDetails;
  cause?: unknown;
};

const statusByCode: Readonly<Record<AppErrorCode, 401 | 403 | 404 | 409 | 400 | 500>> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION: 400,
  INTERNAL: 500,
};

function safeDetail(value: unknown): SafeErrorDetail | undefined {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    const values = value.map(safeDetail);
    return values.every((item) => item !== undefined) ? (values as SafeErrorDetail[]) : undefined;
  }

  if (typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    const details: SafeErrorDetails = {};

    for (const [key, item] of Object.entries(value)) {
      const safeValue = safeDetail(item);
      if (safeValue !== undefined) {
        details[key] = safeValue;
      }
    }

    return details;
  }

  return undefined;
}

function safeDetails(details: SafeErrorDetails | undefined): SafeErrorDetails | undefined {
  if (details === undefined) {
    return undefined;
  }

  return safeDetail(details) as SafeErrorDetails;
}

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: (typeof statusByCode)[AppErrorCode];
  readonly details?: SafeErrorDetails;

  constructor(code: AppErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = "AppError";
    this.code = code;
    this.status = statusByCode[code];
    this.details = safeDetails(options.details);
  }
}
