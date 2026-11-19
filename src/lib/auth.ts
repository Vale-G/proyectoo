import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";
import { configuredWorkshopAuth, isVerifiedWorkshopIdentity } from "./workshop-auth";

export async function requireWorkshopAccess() {
  if (!configuredWorkshopAuth()) redirect("/login?error=configuration");
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !isVerifiedWorkshopIdentity(user)) redirect("/login");
  return user!;
}
