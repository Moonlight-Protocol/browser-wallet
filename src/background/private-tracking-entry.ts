try {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    // eslint-disable-next-line no-console
    console.log("[private-tracking] bundle entry evaluating", {
      href: (globalThis as unknown as { location?: { href?: string } }).location
        ?.href,
    });
  }
} catch {
  // ignore
}

import { handleEnsurePrivateChannelTracking } from "@/background/handlers/private/ensure-private-channel-tracking.ts";

export { handleEnsurePrivateChannelTracking };

try {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    // eslint-disable-next-line no-console
    console.log("[private-tracking] exports registered", {
      hasHandler:
        typeof (globalThis as unknown as Record<string, unknown>)
          .MoonlightPrivateTracking === "object",
    });
  }
} catch {
  // ignore
}
