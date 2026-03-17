/**
 * Lightweight OTEL-compatible telemetry for the browser wallet.
 * Only active when SEED_TELEMETRY is set to "true" in .env.seed.
 *
 * - Generates W3C trace context (traceparent headers) for provider requests
 * - Collects spans and exports them via OTLP HTTP to a collector
 * - Minimal implementation to avoid MV3 CSP issues (no eval, no new Function)
 */

declare const __SEED_TELEMETRY__: string;
declare const __SEED_TELEMETRY_ENDPOINT__: string;
declare const __SEED_TELEMETRY_AUTH__: string;

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export type Span = {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTimeUnixNano: string;
  endTimeUnixNano?: string;
  attributes: Record<string, string | number | boolean>;
  status?: { code: number; message?: string };
};

let enabled = false;
let collectorEndpoint = "";
let authHeader = "";
const pendingSpans: Span[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function initTelemetry(): void {
  try {
    enabled = __SEED_TELEMETRY__ === "true";
    collectorEndpoint = __SEED_TELEMETRY_ENDPOINT__ || "http://localhost:4318";
    authHeader = __SEED_TELEMETRY_AUTH__ || "";
  } catch {
    enabled = false;
  }

  if (enabled) {
    console.log("[telemetry] Enabled, endpoint:", collectorEndpoint);
    scheduleFlush();
  }
}

export function isEnabled(): boolean {
  return enabled;
}

export function startTrace(): { traceId: string; rootSpanId: string } {
  return {
    traceId: randomHex(16),
    rootSpanId: randomHex(8),
  };
}

export function createSpan(opts: {
  traceId: string;
  parentSpanId?: string;
  name: string;
  attributes?: Record<string, string | number | boolean>;
}): Span {
  return {
    traceId: opts.traceId,
    spanId: randomHex(8),
    parentSpanId: opts.parentSpanId,
    name: opts.name,
    startTimeUnixNano: String(Date.now() * 1_000_000),
    attributes: opts.attributes ?? {},
  };
}

export function endSpan(
  span: Span,
  status?: { code: number; message?: string },
): void {
  span.endTimeUnixNano = String(Date.now() * 1_000_000);
  if (status) span.status = status;
  if (enabled) {
    pendingSpans.push(span);
  }
}

/**
 * Build a W3C traceparent header value.
 * Format: 00-{traceId}-{spanId}-01
 */
export function traceparent(traceId: string, spanId: string): string {
  return `00-${traceId}-${spanId}-01`;
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, 5000);
}

async function flush(): Promise<void> {
  if (pendingSpans.length === 0) {
    if (enabled) scheduleFlush();
    return;
  }

  const spans = pendingSpans.splice(0, pendingSpans.length);

  // Convert to OTLP JSON format
  const body = {
    resourceSpans: [
      {
        resource: {
          attributes: [
            { key: "service.name", value: { stringValue: "browser-wallet" } },
          ],
        },
        scopeSpans: [
          {
            scope: { name: "browser-wallet" },
            spans: spans.map((s) => ({
              traceId: s.traceId,
              spanId: s.spanId,
              parentSpanId: s.parentSpanId || "",
              name: s.name,
              kind: 3, // CLIENT
              startTimeUnixNano: s.startTimeUnixNano,
              endTimeUnixNano: s.endTimeUnixNano || s.startTimeUnixNano,
              attributes: Object.entries(s.attributes).map(([k, v]) => ({
                key: k,
                value:
                  typeof v === "string"
                    ? { stringValue: v }
                    : typeof v === "number"
                      ? { intValue: String(v) }
                      : { boolValue: v },
              })),
              status: s.status
                ? { code: s.status.code, message: s.status.message || "" }
                : { code: 0 },
            })),
          },
        ],
      },
    ],
  };

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }
    await fetch(`${collectorEndpoint}/v1/traces`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.warn("[telemetry] Failed to export spans:", err);
  }

  if (enabled) scheduleFlush();
}
