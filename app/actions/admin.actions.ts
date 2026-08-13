"use server";

import { requireCurrentActor } from "@/server/auth";
import { AppError } from "@/server/errors";
import { createMcpClient, revokeMcpClient, updateMcpClient } from "@/services/admin.service";
import { publishContent, requestContentReview } from "@/services/content-governance.service";
import { createMcpClientInputSchema, publishContentInputSchema, reviewContentInputSchema, updateMcpClientInputSchema } from "@/schemas/admin.schema";

function failure(error: unknown) {
  return { success: false as const, error: error instanceof AppError ? error.message : "An unexpected error occurred" };
}

function parseJson(value: FormDataEntryValue | null) {
  if (typeof value !== "string") throw new AppError("VALIDATION", "Expected JSON input");
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new AppError("VALIDATION", "Invalid JSON input");
  }
}

export async function reviewContentAction(formData: FormData) {
  try {
    const actor = await requireCurrentActor();
    const content = await requestContentReview(actor, reviewContentInputSchema.parse(parseJson(formData.get("data"))));
    return { success: true as const, data: { id: content.id } };
  } catch (error) {
    return failure(error);
  }
}

export async function publishContentAction(formData: FormData) {
  try {
    const actor = await requireCurrentActor();
    const content = await publishContent(actor, publishContentInputSchema.parse(parseJson(formData.get("data"))));
    return { success: true as const, data: { id: content.id } };
  } catch (error) {
    return failure(error);
  }
}

export async function createMcpClientAction(formData: FormData) {
  try {
    const actor = await requireCurrentActor();
    const result = await createMcpClient(actor, createMcpClientInputSchema.parse(parseJson(formData.get("data"))));
    return { success: true as const, data: result };
  } catch (error) {
    return failure(error);
  }
}

export async function updateMcpClientAction(clientId: string, formData: FormData) {
  try {
    const actor = await requireCurrentActor();
    const client = await updateMcpClient(actor, clientId, updateMcpClientInputSchema.parse(parseJson(formData.get("data"))));
    return { success: true as const, data: client };
  } catch (error) {
    return failure(error);
  }
}

export async function revokeMcpClientAction(clientId: string) {
  try {
    const actor = await requireCurrentActor();
    const client = await revokeMcpClient(actor, clientId);
    return { success: true as const, data: { id: client.id } };
  } catch (error) {
    return failure(error);
  }
}
