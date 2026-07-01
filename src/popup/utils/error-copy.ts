// Single source of truth mapping surfaced error codes (from the provider
// platform's StructuredError identity, threaded through the flow handlers as
// `error.code`) to friendly, human-readable copy for the popup. Keeps raw
// internal strings and stack traces off the user surface.

const ERROR_COPY: Record<string, string> = {
  SOROBAN_1010: "Your authorization expired — please try again.",
  SOROBAN_2002: "Those funds were already spent. Refresh and try again.",
  SOROBAN_2003: "The payment amounts didn't balance. Please try again.",
  SOROBAN_3006: "That operation wasn't authorized.",
  SOROBAN_3007: "The amount must be greater than zero.",
  BND_005: "Some funds are no longer available. Refresh and try again.",
  BND_011: "Your account isn't approved for payments yet.",
  BND_015:
    "This channel is temporarily withdraw-only — you can still withdraw.",
  PROVIDER_EXECUTION_FAILED:
    "The payment couldn't be completed. Please try again.",
  AUTH_FAILED: "Your session expired. Please sign in again.",
};

const GENERIC_FALLBACK = "Something went wrong. Please try again.";

/**
 * Heuristic guard so an unknown code's carried message is only shown when it
 * reads like human copy — never a raw internal string, XDR blob, or stack.
 */
function isHumanSafe(message: string): boolean {
  const m = message.trim();
  if (!m) return false;
  if (m.length > 160) return false;
  if (m.includes("\n")) return false;
  // Stack frames like "at fn (file.ts:12)".
  if (/\bat\s+\S+.*:\d+/.test(m)) return false;
  // Raw internal thrown strings / serialized payloads / hex or base64 blobs.
  if (
    /(MLXDR|XDR|undefined|\[object |0x[0-9a-fA-F]{6,}|[A-Za-z0-9+/]{40,})/
      .test(m)
  ) {
    return false;
  }
  // Bare bundle status strings, e.g. "Bundle abc123 FAILED".
  if (/^Bundle\s+\S+\s+(FAILED|EXPIRED)/.test(m)) return false;
  return true;
}

/**
 * Maps a flow-handler `error` object to user-facing copy. A known code wins;
 * otherwise the carried message is shown when human-safe, else a generic line.
 */
export function errorCopy(
  error?: { code?: string; message?: string } | null,
): string {
  if (!error) return GENERIC_FALLBACK;
  const { code, message } = error;
  if (code && ERROR_COPY[code]) return ERROR_COPY[code];
  if (message && isHumanSafe(message)) return message;
  return GENERIC_FALLBACK;
}
