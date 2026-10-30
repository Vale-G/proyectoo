import { isSameOriginRequest } from "@/lib/request-origin";
import { NextRequest, NextResponse } from "next/server";
import { adminConfig, configuredAdmin, createSession, SESSION_COOKIE, SESSION_SECONDS, validCredentials } from "@/lib/auth-credentials";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 403 });
  }
  const fail = (reason: string) => new NextResponse(null, { status: 303, headers: { Location: `/login?error=${reason}` } });
  const config = adminConfig();
  if (!configuredAdmin(config)) return fail("configuration");
  const form = await request.formData();
  const username = form.get("username");
  const password = form.get("password");
  if (typeof username !== "string" || typeof password !== "string" || !validCredentials(username.trim(), password, config)) return fail("credentials");
  const response = new NextResponse(null, { status: 303, headers: { Location: "/" } });
  response.cookies.set(SESSION_COOKIE, createSession(config), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_SECONDS });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
