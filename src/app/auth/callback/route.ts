import { createSupabaseServerClient } from "@/lib/supabase/server";
import { configuredWorkshopAuth, isAuthorizedWorkshopUser } from "@/lib/workshop-auth";
import { publicOrigin } from "@/lib/public-origin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const origin = await publicOrigin();
  const redirect = (path: string) => {
    const response = NextResponse.redirect(new URL(path, origin), 303);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  };
  if (!configuredWorkshopAuth()) return redirect("/login?error=configuration");
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return redirect("/login?error=callback");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return redirect("/login?error=callback");
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !isAuthorizedWorkshopUser(user)) {
    await supabase.auth.signOut({ scope: "local" });
    return redirect("/login?error=unauthorized");
  }
  return redirect("/");
}
