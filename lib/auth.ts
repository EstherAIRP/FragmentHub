import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "fragmenthub_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function configuredPassword() {
  return process.env.FRAGMENTHUB_PASSWORD ?? "";
}

function configuredSecret() {
  return process.env.FRAGMENTHUB_SESSION_SECRET ?? "";
}

export function isAuthConfigured(): boolean {
  return Boolean(configuredPassword() && configuredSecret());
}

function sessionToken(): string {
  const secret = configuredSecret();

  if (!secret) {
    throw new Error("FRAGMENTHUB_SESSION_SECRET is not configured.");
  }

  return createHmac("sha256", secret)
    .update("fragmenthub-private-session-v1")
    .digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function verifyPassword(password: string): boolean {
  const expected = configuredPassword();
  if (!expected) return false;
  return safeEqual(password, expected);
}

export async function isAuthenticated(): Promise<boolean> {
  if (!isAuthConfigured()) return false;

  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;

  if (!value) return false;
  return safeEqual(value, sessionToken());
}

export function createSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: sessionToken(),
    options: {
      httpOnly: true,
      sameSite: "strict" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    },
  };
}

export function expiredSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: "",
    options: {
      httpOnly: true,
      sameSite: "strict" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    },
  };
}
