import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminConfig, SESSION_COOKIE, validSession } from "./auth-credentials";

export async function requireWorkshopAccess() {
  const cookieStore = await cookies();
  if (!validSession(cookieStore.get(SESSION_COOKIE)?.value, adminConfig())) redirect("/login");
}
