import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { hashToken, newToken } from "./password";

const COOKIE = "bbc_session";
const SESSION_DAYS = 30;

export type CurrentUser = { userId: string; email: string; businessId: string; businessName: string; isDemo: boolean };

export async function createSession(userId: string) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt } });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(COOKIE);
}

/** Resolves the signed-in user from the session cookie. The businessId returned here is the
 *  ONLY source of tenant identity — never trust a businessId sent by the browser. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { business: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return {
    userId: session.user.id,
    email: session.user.email,
    businessId: session.user.businessId,
    businessName: session.user.business.name,
    isDemo: session.user.business.isDemo,
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
