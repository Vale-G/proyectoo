import { headers } from "next/headers";
export async function publicOrigin() {
  if (process.env.APP_URL) return new URL(process.env.APP_URL).origin;
  const h = await headers();
  return `${process.env.NODE_ENV === "production" ? "https" : "http"}://${h.get("host") ?? "localhost:3000"}`;
}
