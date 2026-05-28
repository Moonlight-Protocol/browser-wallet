/**
 * PostHog error-tracking wrapper for the popup.
 *
 * MV3 CSP (script-src 'self') blocks PostHog's array.js loader pattern used by
 * the moonlight web frontends, so this bundles posthog-js directly. Init is
 * gated on the build-time __POSTHOG_KEY__ define: dev builds with an empty
 * key NOOP silently.
 */
import { posthog } from "posthog-js";

declare const __POSTHOG_KEY__: string;
declare const __POSTHOG_HOST__: string;

let initialized = false;

export function initAnalytics(): void {
  if (initialized) return;
  if (!__POSTHOG_KEY__) {
    return;
  }

  posthog.init(__POSTHOG_KEY__, {
    api_host: __POSTHOG_HOST__,
    capture_exceptions: true,
    person_profiles: "identified_only",
  });
  initialized = true;
}

export function captureException(
  error: unknown,
  properties?: Record<string, unknown>,
): void {
  if (!initialized) return;
  posthog.captureException(error, properties);
}
