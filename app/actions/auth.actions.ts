"use server";

import { redirect } from "next/navigation";
import { authenticateUser, createSession, registerUser } from "@/services/auth.service";
import { clearCurrentSession, setCurrentSession } from "@/server/auth";
import { AppError } from "@/server/errors";

export type AuthActionState = { error?: string };

function credentials(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    username: String(formData.get("username") ?? ""),
    email: String(formData.get("email") ?? ""),
    identifier: String(formData.get("identifier") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    returnTo: String(formData.get("returnTo") ?? ""),
  };
}

function safeReturnTo(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function messageFor(error: unknown) {
  if (error instanceof AppError) {
    return error.message;
  }
  return "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
}

export async function registerAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  try {
    const user = await registerUser(credentials(formData));
    const session = await createSession(user.id);
    await setCurrentSession(session.rawToken, session.expiresAt);
  } catch (error) {
    return { error: messageFor(error) };
  }
  redirect("/");
}

export async function loginAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? ""));
  try {
    const user = await authenticateUser(credentials(formData));
    const session = await createSession(user.id);
    await setCurrentSession(session.rawToken, session.expiresAt);
  } catch (error) {
    return { error: messageFor(error) };
  }
  redirect(returnTo);
}

export async function logoutAction() {
  await clearCurrentSession();
  redirect("/login");
}
