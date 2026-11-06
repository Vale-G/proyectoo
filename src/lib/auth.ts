import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";
import { configuredWorkshopAuth, isWorkshopAdminEmail } from "./workshop-auth";

export async function requireWorkshopAccess() {
  if (!configuredWorkshopAuth()) redirect("/login?error=configuration");
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !isWorkshopAdminEmail(user?.email)) redirect("/login");
}
