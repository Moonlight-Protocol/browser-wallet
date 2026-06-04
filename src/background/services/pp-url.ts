// Every Privacy Provider URL encodes the PP's Stellar Ed25519 public key as
// its last non-empty path segment, e.g. `https://provider-x.example.com/<G…>`.
// The wallet stores only `{url, label}` per PP — pubkey + API base are
// derived at call-time via this helper.
//
// `apiBase` is the URL's scheme + host (+ port) WITHOUT the pubkey segment,
// suitable for building `${apiBase}/api/v1/providers/${pubkey}/...` paths.
// Returns null for any URL that doesn't parse, lacks a path segment matching
// the Stellar G-address shape, or is otherwise malformed.

const STELLAR_G_ADDRESS = /^G[A-Z2-7]{55}$/;

export type ExtractedPp = { pubkey: string; apiBase: string };

export function extractPpPubkeyFromUrl(url: string): ExtractedPp | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const segments = parsed.pathname.split("/").filter((s) => s.length > 0);
  const last = segments[segments.length - 1];
  if (!last || !STELLAR_G_ADDRESS.test(last)) return null;
  const basePath = segments.slice(0, -1).join("/");
  const apiBase = basePath.length > 0
    ? `${parsed.origin}/${basePath}`
    : parsed.origin;
  return { pubkey: last, apiBase };
}
