import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { db } from "../db";
import { forbidden, unauthorized } from "../http";
import { siteConfig } from "@/config/site";

export const SESSION_COOKIE = "swapdo_session";

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string, meta: { ip?: string; userAgent?: string } = {}) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + siteConfig.sessionDays * 86400000);
  await db.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt, ip: meta.ip, userAgent: meta.userAgent?.slice(0, 255) },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  sellerId: string | null;
  sellerStatus: string | null;
};

/** Resolve the signed-in user from the session cookie (memoised per request). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { seller: { select: { id: true, status: true } } } } },
  });
  if (!session || session.expiresAt.getTime() <= Date.now() || session.user.status !== "ACTIVE") return null;
  const { user } = session;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    sellerId: user.seller?.id ?? null,
    sellerStatus: user.seller?.status ?? null,
  };
});

/** For API routes: throws 401/403 ApiErrors. */
export async function requireUser(...roles: Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw unauthorized();
  if (roles.length && !roles.includes(user.role) && user.role !== "ADMIN") throw forbidden();
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw unauthorized();
  if (user.role !== "ADMIN") throw forbidden();
  return user;
}

export async function requireApprovedSeller(): Promise<SessionUser & { sellerId: string }> {
  const user = await requireUser();
  if (!user.sellerId || user.sellerStatus !== "APPROVED") throw forbidden("An approved provider account is required.");
  return user as SessionUser & { sellerId: string };
}

/** For server components/pages: redirects instead of throwing. */
export async function requirePageUser(opts: { roles?: Role[]; next?: string } = {}): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login${opts.next ? `?next=${encodeURIComponent(opts.next)}` : ""}`);
  if (opts.roles?.length && !opts.roles.includes(user.role)) redirect("/dashboard?denied=1");
  return user;
}
