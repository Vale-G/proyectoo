export function trackingUrl(token: string, base: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error("Token inválido.");
  const origin = new URL(base);
  if (!["https:", "http:"].includes(origin.protocol) || origin.username || origin.password) throw new Error("APP_URL inválida.");
  return new URL(`/seguimiento/${token}`, origin.origin).toString();
}
