import "server-only";

import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { prisma } from "@/db/prisma";
import { AppError } from "@/server/errors";
import { loginInputSchema, registerInputSchema, type LoginInput, type RegisterInput } from "@/schemas/auth.schema";

const scrypt = promisify(scryptCallback);
const keyLength = 64;
const sessionDurationMs = 1000 * 60 * 60 * 24 * 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = await scrypt(password, salt, keyLength) as Buffer;
  return `${salt}:${derivedKey.toString("base64url")}`;
}

async function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedKey] = passwordHash.split(":");
  if (!salt || !storedKey) {
    return false;
  }

  const derivedKey = await scrypt(password, salt, keyLength) as Buffer;
  const storedBuffer = Buffer.from(storedKey, "base64url");
  return storedBuffer.length === derivedKey.length && timingSafeEqual(storedBuffer, derivedKey);
}

export async function registerUser(input: RegisterInput) {
  const data = registerInputSchema.parse(input);
  const [existingEmail, existingUsername] = await Promise.all([
    prisma.user.findUnique({ where: { email: data.email }, select: { id: true } }),
    prisma.user.findUnique({ where: { username: data.username }, select: { id: true } }),
  ]);
  if (existingEmail) {
    throw new AppError("CONFLICT", "อีเมลนี้ถูกใช้งานแล้ว");
  }
  if (existingUsername) {
    throw new AppError("CONFLICT", "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว");
  }

  const passwordHash = await hashPassword(data.password);
  return prisma.user.create({
    data: { name: data.name, username: data.username, email: data.email, passwordHash, role: "LEARNER" },
    select: { id: true, username: true, email: true, name: true, role: true },
  });
}

export async function authenticateUser(input: LoginInput) {
  const data = loginInputSchema.parse(input);
  const identifier = data.identifier.toLowerCase();
  const user = identifier.includes("@")
    ? await prisma.user.findUnique({ where: { email: identifier } })
    : await prisma.user.findUnique({ where: { username: identifier } });
  if (!user?.passwordHash || !(await verifyPassword(data.password, user.passwordHash))) {
    throw new AppError("UNAUTHORIZED", "ชื่อผู้ใช้ อีเมล หรือรหัสผ่านไม่ถูกต้อง");
  }

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function createSession(userId: string) {
  const rawToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionDurationMs);
  await prisma.session.deleteMany({ where: { userId, expiresAt: { lt: new Date() } } });
  await prisma.session.create({ data: { userId, tokenHash: hashToken(rawToken), expiresAt } });
  return { rawToken, expiresAt };
}

export async function getSessionUser(rawToken: string) {
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: { select: { id: true, role: true } } },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    return null;
  }

  return session.user;
}

export async function revokeSession(rawToken: string) {
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(rawToken) } });
}
