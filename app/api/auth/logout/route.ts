import { NextResponse } from "next/server";

import { expiredSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  const cookie = expiredSessionCookie();
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
