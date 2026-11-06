import { createSupabaseServerClient } from "@/lib/supabase/server";
import { configuredWorkshopAuth, isAuthorizedWorkshopUser } from "@/lib/workshop-auth";
import { publicOrigin } from "@/lib/public-origin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const origin = await publicOrigin();
  if (!configuredWorkshopAuth()) return NextResponse.redirect(new URL("/login?error=configuration", origin), 303);
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login?error=callback", origin), 303);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?error=callback", origin), 303);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !isAuthorizedWorkshopUser(user)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=unauthorized", origin), 303);
  }
  return NextResponse.redirect(new URL("/", origin), 303);
}
