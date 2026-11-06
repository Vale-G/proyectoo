import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";
import { configuredWorkshopAuth, isAuthorizedWorkshopUser } from "./workshop-auth";

export async function requireWorkshopAccess() {
  if (!configuredWorkshopAuth()) redirect("/login?error=configuration");
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !isAuthorizedWorkshopUser(user)) redirect("/login");
}
