import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;
export const SESSION_COOKIE = "ambulance_admin_session";

if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  // Fail loudly in production rather than silently signing tokens with `undefined`.
  throw new Error("JWT_SECRET is not set. Refusing to start in production without it.");
}

export type SessionPayload = {
  adminId: string;
  email: string;
  role: string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, JWT_SECRET || "dev-only-insecure-secret", { expiresIn: "12h" });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET || "dev-only-insecure-secret") as SessionPayload;
  } catch {
    return null;
  }
}

/** Server Component / Route Handler helper: read + verify the current admin session. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}
