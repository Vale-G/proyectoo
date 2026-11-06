import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isWorkshopAdminEmail } from "@/lib/workshop-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login?error=callback", request.url), 303);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?error=callback", request.url), 303);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !isWorkshopAdminEmail(user?.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=unauthorized", request.url), 303);
  }
  return NextResponse.redirect(new URL("/", request.url), 303);
}
