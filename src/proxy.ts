import { NextRequest, NextResponse } from "next/server";
import { validWorkshopCredentials } from "./lib/auth-credentials";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // Only read-only customer pages are public. Server Actions always require access.
  const publicPage = path === "/catalogo" || path === "/seguimiento" || path.startsWith("/seguimiento/");
  if (publicPage && ["GET", "HEAD"].includes(request.method)) return NextResponse.next();
  if (validWorkshopCredentials(request.headers.get("authorization"), process.env.WORKSHOP_ADMIN_USER, process.env.WORKSHOP_ADMIN_PASSWORD)) return NextResponse.next();
  return new NextResponse("Ingresá con las credenciales del taller.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="OmniFix", charset="UTF-8"', "Cache-Control": "no-store" },
  });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
