import { headers } from "next/headers";
import { validWorkshopCredentials } from "./auth-credentials";

export async function requireWorkshopAccess() {
  const requestHeaders = await headers();
  if (!validWorkshopCredentials(requestHeaders.get("authorization"), process.env.WORKSHOP_ADMIN_USER, process.env.WORKSHOP_ADMIN_PASSWORD)) {
    throw new Error("Acceso al taller no autorizado.");
  }
}
