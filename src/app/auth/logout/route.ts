import { isSameOriginRequest } from "@/lib/request-origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { configuredWorkshopAuth } from "@/lib/workshop-auth";
import { publicOrigin } from "@/lib/public-origin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Solicitud inválida." }, { status: 403 });
  if (configuredWorkshopAuth()) await (await createSupabaseServerClient()).auth.signOut();
  const response = NextResponse.redirect(new URL("/login", await publicOrigin()), 303);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
