import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";

type PrivateTrackingModule = {
  handleEnsurePrivateChannelTracking: (
    message: MessageFor<MessageType.EnsurePrivateChannelTracking>
  ) => Promise<ResponseFor<MessageType.EnsurePrivateChannelTracking>>;
};

type CapturedWorkerError = {
  ts: number;
  message?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  error?: unknown;
};

let lastWorkerError: CapturedWorkerError | undefined;
let lastUnhandledRejection: { ts: number; reason?: unknown } | undefined;

// IMPORTANT (Chrome MV3): error handlers must be added during initial evaluation
// of the worker script, not dynamically later.
try {
  globalThis.addEventListener?.("error", (event: unknown) => {
    try {
      const e = event as {
        message?: unknown;
        filename?: unknown;
        lineno?: unknown;
        colno?: unknown;
        error?: unknown;
      };
      lastWorkerError = {
        ts: Date.now(),
        message: e.message !== undefined ? String(e.message) : undefined,
        filename: e.filename !== undefined ? String(e.filename) : undefined,
        lineno: typeof e.lineno === "number" ? e.lineno : undefined,
        colno: typeof e.colno === "number" ? e.colno : undefined,
        error: e.error,
      };
    } catch {
      lastWorkerError = { ts: Date.now(), message: String(event) };
    }
  });

  globalThis.addEventListener?.("unhandledrejection", (event: unknown) => {
    try {
      const r = event as { reason?: unknown };
      lastUnhandledRejection = { ts: Date.now(), reason: r.reason };
    } catch {
      lastUnhandledRejection = { ts: Date.now(), reason: event };
    }
  });
} catch {
  // ignore
}

function devLog(...args: unknown[]) {
  try {
    // `__DEV__` is injected by esbuild.
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      // eslint-disable-next-line no-console
      console.log("[private-tracking:loader]", ...args);
    }
  } catch {
    // ignore
  }
}

function devError(...args: unknown[]) {
  try {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      // eslint-disable-next-line no-console
      console.error("[private-tracking:loader]", ...args);
    }
  } catch {
    // ignore
  }
}

function getBundleUrl(): string {
  const chromeObj = (globalThis as unknown as { chrome?: unknown }).chrome as
    | { runtime?: { getURL?: (path: string) => string } }
    | undefined;
  const getURL = chromeObj?.runtime?.getURL;
  if (typeof getURL === "function") {
    return getURL("private-tracking.js");
  }
  return "private-tracking.js";
}

function getLoadedModule(): PrivateTrackingModule | undefined {
  const g = globalThis as unknown as Record<string, unknown>;
  const mod = g.MoonlightPrivateTracking;
  if (!mod || typeof mod !== "object") return undefined;
  const maybe = mod as Partial<PrivateTrackingModule>;
  if (typeof maybe.handleEnsurePrivateChannelTracking !== "function") {
    return undefined;
  }
  return maybe as PrivateTrackingModule;
}

async function tryLoadPrivateTrackingBundle(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  if (getLoadedModule()) return { ok: true };

  const importScriptsFn = (
    globalThis as unknown as { importScripts?: (...urls: string[]) => void }
  ).importScripts;

  if (typeof importScriptsFn !== "function") {
    return {
      ok: false,
      error:
        "Private tracking requires importScripts(), which is unavailable in this service worker environment.",
    };
  }

  const url = getBundleUrl();
  devLog("attempting load", { url });

  // Preflight: helps distinguish "file missing/blocked" vs "script threw".
  try {
    const res = await fetch(url, { cache: "no-store" });
    devLog("preflight fetch", {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      contentType: res.headers.get("content-type"),
      contentLength: res.headers.get("content-length"),
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Failed to fetch private tracking bundle (${res.status} ${res.statusText}) at ${url}`,
      };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    devError("preflight fetch threw", msg);
    return {
      ok: false,
      error: `Failed to fetch private tracking bundle at ${url}: ${msg}`,
    };
  }

  try {
    // Reset captured state right before attempting to load.
    lastWorkerError = undefined;
    lastUnhandledRejection = undefined;

    devLog("calling importScripts", { url });
    importScriptsFn(url);
    devLog("importScripts returned", { url, exports: !!getLoadedModule() });

    return getLoadedModule()
      ? { ok: true }
      : {
          ok: false,
          error: "Private tracking bundle loaded but did not register exports.",
        };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    // Include any captured error details (Chrome often logs these separately).
    const extra = (() => {
      const parts: string[] = [];
      if (lastWorkerError) {
        parts.push(
          `errorEvent(message=${String(
            lastWorkerError.message
          )}, filename=${String(lastWorkerError.filename)}, lineno=${String(
            lastWorkerError.lineno
          )}, colno=${String(lastWorkerError.colno)})`
        );
        if (lastWorkerError.error !== undefined) {
          parts.push(`error=${String(lastWorkerError.error)}`);
        }
      }
      if (lastUnhandledRejection) {
        parts.push(
          `unhandledRejection(reason=${String(lastUnhandledRejection.reason)})`
        );
      }
      return parts.length ? ` (${parts.join("; ")})` : "";
    })();

    devError("importScripts threw", msg, extra);
    return {
      ok: false,
      error: `importScripts failed for ${url}: ${msg}${extra}`,
    };
  }
}

export const handleEnsurePrivateChannelTracking = async (
  message: MessageFor<MessageType.EnsurePrivateChannelTracking>
): Promise<ResponseFor<MessageType.EnsurePrivateChannelTracking>> => {
  const loaded = await tryLoadPrivateTrackingBundle();
  if (!loaded.ok) {
    return {
      type: MessageType.EnsurePrivateChannelTracking,
      ok: false,
      error: { code: "UNKNOWN", message: loaded.error },
    };
  }

  const mod = getLoadedModule();
  if (!mod) {
    return {
      type: MessageType.EnsurePrivateChannelTracking,
      ok: false,
      error: {
        code: "UNKNOWN",
        message: "Private tracking module is not available.",
      },
    };
  }

  return await mod.handleEnsurePrivateChannelTracking(message);
};
