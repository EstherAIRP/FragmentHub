import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createSessionCookie,
  isAuthConfigured,
  verifyPassword,
} from "@/lib/auth";

const requestSchema = z.object({
  password: z.string().min(1).max(500),
});

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: "FragmentHub authentication is not configured." },
      { status: 503 },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  let password = "";

  if (contentType.includes("application/json")) {
    const parsed = requestSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (parsed.success) password = parsed.data.password;
  } else {
    const form = await request.formData();
    const parsed = requestSchema.safeParse({
      password: form.get("password"),
    });
    if (parsed.success) password = parsed.data.password;
  }

  if (!password || !verifyPassword(password)) {
    if (request.headers.get("accept")?.includes("text/html")) {
      return NextResponse.redirect(new URL("/login?error=1", request.url), 303);
    }

    return NextResponse.json({ error: "密碼不正確。" }, { status: 401 });
  }

  const response = request.headers.get("accept")?.includes("text/html")
    ? NextResponse.redirect(new URL("/", request.url), 303)
    : NextResponse.json({ ok: true });

  const cookie = createSessionCookie();
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
