import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { configuredWorkshopAuth, isWorkshopAdminEmail, workshopAuthConfig } from "./lib/workshop-auth";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const readOnlyPublic = path === "/brand/omnifix-original.jpg" || path.startsWith("/brand/fonts/") || path === "/login" || path === "/catalogo" || path === "/seguimiento" || path.startsWith("/seguimiento/");
  if (readOnlyPublic && ["GET", "HEAD"].includes(request.method)) return NextResponse.next();
  if (path === "/auth/callback" && request.method === "GET") return NextResponse.next();
  if ((path === "/auth/google" || path === "/auth/logout") && request.method === "POST") return NextResponse.next();
  const authConfig = workshopAuthConfig();
  if (configuredWorkshopAuth(authConfig)) {
    let response = NextResponse.next({ request });
    const supabase = createServerClient(authConfig.supabaseUrl!, authConfig.supabasePublishableKey!, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && isWorkshopAdminEmail(user?.email, authConfig)) return response;
  }
  if (["GET", "HEAD"].includes(request.method)) return NextResponse.redirect(new URL("/login", `${request.nextUrl.protocol}//${request.headers.get("host") ?? request.nextUrl.host}`));
  return NextResponse.json({ error: "La sesión venció. Volvé a ingresar al taller." }, { status: 401, headers: { "Cache-Control": "no-store" } });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
