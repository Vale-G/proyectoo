export type WorkshopAuthConfig = {
  supabaseUrl?: string;
  supabasePublishableKey?: string;
  adminEmail?: string;
};

export function workshopAuthConfig(): WorkshopAuthConfig {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
    supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim(),
    adminEmail: process.env.WORKSHOP_ADMIN_EMAIL?.trim().toLowerCase(),
  };
}

export function configuredWorkshopAuth(config = workshopAuthConfig()) {
  return Boolean(config.supabaseUrl && config.supabasePublishableKey && config.adminEmail);
}

export function isWorkshopAdminEmail(email: string | null | undefined, config = workshopAuthConfig()) {
  return configuredWorkshopAuth(config) && email?.trim().toLowerCase() === config.adminEmail;
}
