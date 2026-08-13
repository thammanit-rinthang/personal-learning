import "server-only";

import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/db/prisma";

export type TransactionClient = Prisma.TransactionClient;

export function transaction<T>(operation: (tx: TransactionClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(operation);
}
