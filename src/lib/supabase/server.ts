import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { configuredWorkshopAuth, workshopAuthConfig } from "@/lib/workshop-auth";

export async function createSupabaseServerClient() {
  const config = workshopAuthConfig();
  if (!configuredWorkshopAuth(config)) throw new Error("La autenticación del taller no está configurada.");
  const cookieStore = await cookies();
  return createServerClient(config.supabaseUrl!, config.supabasePublishableKey!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Los Server Components no pueden escribir cookies. El proxy refresca la sesión.
        }
      },
    },
  });
}
