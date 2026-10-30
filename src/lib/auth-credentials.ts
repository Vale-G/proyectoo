import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "omnifix_session";
export const SESSION_SECONDS = 8 * 60 * 60;
export type AdminConfig = { username?: string; password?: string };

export function configuredAdmin(config: AdminConfig) {
  return Boolean(config.username?.trim() && config.password && config.password.length >= 20);
}

function equalSecret(actual: string, expected: string) {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(actual), digest(expected));
}

export function validCredentials(username: string, password: string, config: AdminConfig) {
  if (!configuredAdmin(config) || username.length > 256 || password.length > 1024) return false;
  const userMatches = equalSecret(username, config.username!);
  const passwordMatches = equalSecret(password, config.password!);
  return userMatches && passwordMatches;
}

function signature(payload: string, config: AdminConfig) {
  const key = createHash("sha256").update(JSON.stringify([config.username, config.password])).digest();
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function createSession(config: AdminConfig, now = Date.now()) {
  if (!configuredAdmin(config)) throw new Error("El acceso del taller no está configurado.");
  const payload = Buffer.from(JSON.stringify({ exp: now + SESSION_SECONDS * 1000, nonce: randomBytes(16).toString("hex") })).toString("base64url");
  return `${payload}.${signature(payload, config)}`;
}

export function validSession(token: string | undefined, config: AdminConfig, now = Date.now()) {
  if (!configuredAdmin(config) || !token || token.length > 1024) return false;
  const pieces = token.split(".");
  if (pieces.length !== 2 || !pieces.every(piece => /^[A-Za-z0-9_-]+$/.test(piece))) return false;
  const [payload, signed] = pieces;
  if (!equalSecret(signed, signature(payload, config))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number.isSafeInteger(data.exp) && data.exp > now && data.exp <= now + SESSION_SECONDS * 1000 && typeof data.nonce === "string";
  } catch { return false; }
}

export function adminConfig(): AdminConfig {
  return { username: process.env.WORKSHOP_ADMIN_USER?.trim(), password: process.env.WORKSHOP_ADMIN_PASSWORD };
}
