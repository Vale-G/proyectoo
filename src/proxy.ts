import { NextRequest, NextResponse } from "next/server";
import { adminConfig, SESSION_COOKIE, validSession } from "./lib/auth-credentials";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const readOnlyPublic = path === "/login" || path === "/catalogo" || path === "/seguimiento" || path.startsWith("/seguimiento/");
  if (readOnlyPublic && ["GET", "HEAD"].includes(request.method)) return NextResponse.next();
  if ((path === "/auth/login" || path === "/auth/logout") && request.method === "POST") return NextResponse.next();
  if (validSession(request.cookies.get(SESSION_COOKIE)?.value, adminConfig())) return NextResponse.next();
  if (["GET", "HEAD"].includes(request.method)) return NextResponse.redirect(new URL("/login", `${request.nextUrl.protocol}//${request.headers.get("host") ?? request.nextUrl.host}`));
  return NextResponse.json({ error: "La sesión venció. Volvé a ingresar al taller." }, { status: 401, headers: { "Cache-Control": "no-store" } });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
