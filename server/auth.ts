import "server-only";

import { cookies } from "next/headers";
import { getSessionUser, revokeSession } from "@/services/auth.service";
import type { Actor } from "@/server/actor";
import { AppError } from "@/server/errors";

export const sessionCookieName = "learning_session";

const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function setCurrentSession(rawToken: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, rawToken, { ...sessionCookieOptions, expires: expiresAt });
}

export async function clearCurrentSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(sessionCookieName)?.value;
  if (rawToken) {
    await revokeSession(rawToken);
  }
  cookieStore.set(sessionCookieName, "", { ...sessionCookieOptions, maxAge: 0 });
}

export async function getCurrentActor(): Promise<Actor | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(sessionCookieName)?.value;
  if (!rawToken) {
    return null;
  }

  const user = await getSessionUser(rawToken);
  if (!user) {
    cookieStore.set(sessionCookieName, "", { ...sessionCookieOptions, maxAge: 0 });
    return null;
  }

  return { id: user.id, type: "USER", role: user.role, permissions: [] };
}

export async function requireCurrentActor(): Promise<Actor> {
  const actor = await getCurrentActor();
  if (!actor) {
    throw new AppError("UNAUTHORIZED", "Authentication required");
  }

  return actor;
}
