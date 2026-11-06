import { isSameOriginRequest } from "@/lib/request-origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { configuredWorkshopAuth } from "@/lib/workshop-auth";
import { publicOrigin } from "@/lib/public-origin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Solicitud inválida." }, { status: 403 });
  const origin = await publicOrigin();
  if (!configuredWorkshopAuth()) return NextResponse.redirect(new URL("/login?error=configuration", origin), 303);
  const supabase = await createSupabaseServerClient();
  const callback = new URL("/auth/callback", origin);
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback.toString() } });
  if (error || !data.url) return NextResponse.redirect(new URL("/login?error=provider", origin), 303);
  const response = NextResponse.redirect(data.url, 303);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
