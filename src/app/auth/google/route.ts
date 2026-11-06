import { isSameOriginRequest } from "@/lib/request-origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { configuredWorkshopAuth } from "@/lib/workshop-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Solicitud inválida." }, { status: 403 });
  if (!configuredWorkshopAuth()) return NextResponse.redirect(new URL("/login?error=configuration", request.url), 303);
  const supabase = await createSupabaseServerClient();
  const callback = new URL("/auth/callback", request.url);
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback.toString() } });
  if (error || !data.url) return NextResponse.redirect(new URL("/login?error=provider", request.url), 303);
  return NextResponse.redirect(data.url, 303);
}
