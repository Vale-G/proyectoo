// Compare the browser Origin with the HTTP Host. Next can internally normalize
// request.nextUrl to localhost, so it is not the public origin behind a proxy.
export function isSameOriginRequest(request: { headers: Headers }) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    const url = new URL(origin);
    return ["https:", "http:"].includes(url.protocol) && url.origin === origin && url.host === host;
  } catch { return false; }
}
