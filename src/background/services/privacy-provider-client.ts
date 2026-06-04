import axios from "@/common/polyfills/axios.ts";
import {
  createSpan,
  endSpan,
  isEnabled,
  type Span,
  startTrace,
  traceparent,
} from "@/background/services/telemetry.ts";
import type { EntityStatus } from "@/persistence/stores/private-channels.types.ts";
import { extractPpPubkeyFromUrl } from "@/background/services/pp-url.ts";

export type AuthChallengeResponse = {
  status: number;
  message: string;
  data: {
    hash: string;
    challenge: string;
  };
};

export class PrivacyProviderAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrivacyProviderAuthError";
  }
}

// The wallet stores `{url, label}` per PP. The client derives the API base
// (origin or origin + intermediate path) and the PP pubkey from the URL at
// construction. Throws on any malformed URL — callers are expected to surface
// the stale-URL notice to the user rather than propagate.
export class PrivacyProviderClient {
  private apiBase: string;
  private ppPubkey: string;
  private traceId?: string;
  private rootSpanId?: string;

  constructor(url: string) {
    const extracted = extractPpPubkeyFromUrl(url);
    if (!extracted) {
      throw new Error(
        `Provider URL has no Stellar pubkey path segment: ${url}`,
      );
    }
    this.apiBase = extracted.apiBase;
    this.ppPubkey = extracted.pubkey;

    if (isEnabled()) {
      const trace = startTrace();
      this.traceId = trace.traceId;
      this.rootSpanId = trace.rootSpanId;
    }
  }

  private traceHeaders(spanId: string): Record<string, string> {
    if (!this.traceId) return {};
    return { traceparent: traceparent(this.traceId, spanId) };
  }

  private startSpan(
    name: string,
    attrs?: Record<string, string>,
  ): Span | undefined {
    if (!this.traceId) return undefined;
    return createSpan({
      traceId: this.traceId,
      parentSpanId: this.rootSpanId,
      name,
      attributes: { "peer.service": "provider-platform", ...attrs },
    });
  }

  /**
   * Validates and cleans a JWT token
   * @throws {PrivacyProviderAuthError} if token is invalid
   */
  private validateToken(token: string | undefined | null): string {
    if (!token || typeof token !== "string") {
      throw new PrivacyProviderAuthError("Invalid provider session token");
    }

    const cleaned = token.trim();
    if (!cleaned) {
      throw new PrivacyProviderAuthError("Provider session token is empty");
    }

    return cleaned;
  }

  /**
   * Checks if an error is an authentication error (401, JWT verification failed, etc.)
   */
  private isAuthError(error: unknown): boolean {
    const errorStr = String(error);
    return (
      errorStr.includes("401") ||
      errorStr.includes("JWT verification failed") ||
      errorStr.includes("HTTP_AUTH_004") ||
      (typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: unknown }).response === "object" &&
        (error as { response?: { status?: unknown } }).response?.status === 401)
    );
  }

  // TODO: Currently we just use the provided domain on /api/v1/stellar/auth according to the provider api
  // but in future versions we need to review to conform with sep10 as the provider platform is updated
  // and we hosting the stellar.toml file.
  async getAuthChallenge(
    accountPublicKey: string,
  ): Promise<AuthChallengeResponse> {
    const span = this.startSpan("GET /api/v1/stellar/auth", {
      "stellar.account": accountPublicKey,
    });
    try {
      const response = await axios.get<AuthChallengeResponse>(
        `${this.apiBase}/api/v1/stellar/auth`,
        {
          params: { account: accountPublicKey },
          headers: span ? this.traceHeaders(span.spanId) : {},
        },
      );
      if (span) endSpan(span, { code: 0 });
      return response.data;
    } catch (error) {
      if (span) endSpan(span, { code: 2, message: String(error) });
      throw error;
    }
  }

  async postAuth(
    signedChallenge: string,
    ppPublicKey: string,
  ): Promise<{
    token: string;
    entityStatus: EntityStatus;
    kycSubmissionUrl: string | null;
  }> {
    // SEP-10 verify is PP-aware: `ppPublicKey` in the body, response carries
    // per-PP entityStatus + per-PP kycSubmissionUrl.
    const span = this.startSpan("POST /api/v1/stellar/auth");
    try {
      const response = await axios.post<{
        status: number;
        message: string;
        data: {
          jwt: string;
          entityStatus?: EntityStatus;
          kycSubmissionUrl?: string | null;
        };
      }>(
        `${this.apiBase}/api/v1/stellar/auth`,
        { signedChallenge, ppPublicKey },
        { headers: span ? this.traceHeaders(span.spanId) : {} },
      );

      const token = response.data.data?.jwt;
      if (!token || typeof token !== "string") {
        throw new Error(
          `Invalid auth response: token not found in ${
            JSON.stringify(response.data)
          }`,
        );
      }
      const entityStatus: EntityStatus = response.data.data?.entityStatus ??
        "UNVERIFIED";
      const kycSubmissionUrl = response.data.data?.kycSubmissionUrl ?? null;

      if (span) endSpan(span, { code: 0 });
      return { token, entityStatus, kycSubmissionUrl };
    } catch (error) {
      if (span) endSpan(span, { code: 2, message: String(error) });
      throw error;
    }
  }

  async submitBundle(params: {
    token: string;
    operationsMLXDR: string[];
    channelContractId: string;
  }): Promise<{ id: string }> {
    const token = this.validateToken(params.token);

    const span = this.startSpan(
      "POST /api/v1/providers/:pp/entity/bundles",
      {
        "bundle.operations_count": String(params.operationsMLXDR.length),
        "bundle.channel_contract_id": params.channelContractId,
      },
    );
    let operationsBundleId: string;
    try {
      const response = await axios.post<{
        status: number;
        message: string;
        data: { operationsBundleId: string; status: string };
      }>(
        `${this.apiBase}/api/v1/providers/${this.ppPubkey}/entity/bundles`,
        {
          operationsMLXDR: params.operationsMLXDR,
          channelContractId: params.channelContractId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            ...(span ? this.traceHeaders(span.spanId) : {}),
          },
        },
      );
      const id = response.data.data?.operationsBundleId;
      if (!id || typeof id !== "string") {
        throw new Error(
          `Invalid bundle response: operationsBundleId not found in ${
            JSON.stringify(response.data)
          }`,
        );
      }
      operationsBundleId = id;
      if (span) endSpan(span, { code: 0 });
    } catch (error: unknown) {
      if (span) endSpan(span, { code: 2, message: String(error) });
      if (this.isAuthError(error)) {
        throw new PrivacyProviderAuthError(
          "Provider session expired or invalid. Please reconnect to the provider.",
        );
      }
      throw error;
    }

    // POST returns immediately with status:"PENDING" — poll until the
    // executor settles the bundle on chain. Mirrors the e2e suite's
    // waitForBundle. Without this, the popup goes home before settlement
    // and the home view's balance polling races the executor.
    await this.waitForBundle(token, operationsBundleId);
    return { id: operationsBundleId };
  }

  private async waitForBundle(
    token: string,
    bundleId: string,
    timeoutMs = 180_000,
    pollIntervalMs = 5_000,
  ): Promise<void> {
    const span = this.startSpan(
      "GET /api/v1/providers/:pp/entity/bundles/:id (poll)",
      { "bundle.id": bundleId },
    );
    const start = Date.now();
    try {
      while (Date.now() - start < timeoutMs) {
        await new Promise((r) => setTimeout(r, pollIntervalMs));
        const res = await axios.get<{
          status: number;
          message: string;
          data: { status: string };
        }>(
          `${this.apiBase}/api/v1/providers/${this.ppPubkey}/entity/bundles/${bundleId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              ...(span ? this.traceHeaders(span.spanId) : {}),
            },
          },
        );
        const status = res.data.data?.status;
        if (status === "COMPLETED") {
          if (span) endSpan(span, { code: 0 });
          return;
        }
        if (status === "FAILED" || status === "EXPIRED") {
          const err = new Error(`Bundle ${bundleId} ${status}`);
          if (span) endSpan(span, { code: 2, message: err.message });
          throw err;
        }
        // PENDING / SUBMITTED / other intermediate → keep polling
      }
      const err = new Error(
        `Bundle ${bundleId} timed out after ${timeoutMs}ms`,
      );
      if (span) endSpan(span, { code: 2, message: err.message });
      throw err;
    } catch (error: unknown) {
      if (this.isAuthError(error)) {
        throw new PrivacyProviderAuthError(
          "Provider session expired or invalid. Please reconnect to the provider.",
        );
      }
      throw error;
    }
  }
}
