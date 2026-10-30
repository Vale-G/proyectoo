import { createHash, timingSafeEqual } from "node:crypto";

export function validWorkshopCredentials(header: string | null, username?: string, password?: string) {
  // Fail closed until the owner configures a strong, unique password.
  if (!username || !password || password.length < 20 || !header || header.length > 4096) return false;
  const match = /^Basic ([A-Za-z0-9+/]+={0,2})$/i.exec(header);
  if (!match) return false;
  const actual = Buffer.from(match[1], "base64").toString("utf8");
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(actual), digest(`${username}:${password}`));
}
