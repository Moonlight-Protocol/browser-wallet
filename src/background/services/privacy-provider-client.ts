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

export type AuthChallengeResponse = {
  status: number;
  message: string;
  data: {
    hash: string;
    challenge: string;
  };
};

export type EntityChallengeResponse = {
  data: { nonce: string };
};

export class PrivacyProviderAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrivacyProviderAuthError";
  }
}

export class PrivacyProviderClient {
  private baseUrl: string;
  private ppPubkey: string;
  private traceId?: string;
  private rootSpanId?: string;

  constructor(url: string, ppPubkey: string) {
    // Ensure protocol and no trailing slash
    let normalized = url.replace(/\/$/, "");
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }
    this.baseUrl = normalized;
    this.ppPubkey = ppPubkey;

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
        `${this.baseUrl}/api/v1/stellar/auth`,
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
  ): Promise<{ token: string; entityStatus: EntityStatus }> {
    // TODO: This endpoint implementation is specific to the current provider API
    // and might not fully conform to SEP-10 standard yet. Move to standard SEP-10
    // once stellar.toml is hosted.
    const span = this.startSpan("POST /api/v1/stellar/auth");
    try {
      const response = await axios.post<{
        status: number;
        message: string;
        data: { jwt: string; entityStatus?: EntityStatus };
      }>(
        `${this.baseUrl}/api/v1/stellar/auth`,
        { signedChallenge },
        { headers: span ? this.traceHeaders(span.spanId) : {} },
      );

      // Extract token from response.data.data.jwt
      const token = response.data.data?.jwt;
      if (!token || typeof token !== "string") {
        throw new Error(
          `Invalid auth response: token not found in ${
            JSON.stringify(response.data)
          }`,
        );
      }
      // entityStatus defaults to UNVERIFIED if the provider hasn't deployed
      // the 0.7+ response shape yet, so the wallet can still gate KYC.
      const entityStatus: EntityStatus = response.data.data?.entityStatus ??
        "UNVERIFIED";

      if (span) endSpan(span, { code: 0 });
      return { token, entityStatus };
    } catch (error) {
      if (span) endSpan(span, { code: 2, message: String(error) });
      throw error;
    }
  }

  // KYC challenge — wallet requests a nonce per-PP, signs it with the entity's
  // Stellar key, and posts back to /providers/:pp/entities to register.
  async getEntityChallenge(pubkey: string): Promise<{ nonce: string }> {
    const span = this.startSpan(
      "POST /api/v1/providers/:pp/entities/challenge",
      { "stellar.account": pubkey },
    );
    try {
      const response = await axios.post<{
        data: { nonce: string };
      }>(
        `${this.baseUrl}/api/v1/providers/${this.ppPubkey}/entities/challenge`,
        { pubkey },
        { headers: span ? this.traceHeaders(span.spanId) : {} },
      );
      const nonce = response.data.data?.nonce;
      if (!nonce) throw new Error("entity challenge missing nonce");
      if (span) endSpan(span, { code: 0 });
      return { nonce };
    } catch (error) {
      if (span) endSpan(span, { code: 2, message: String(error) });
      throw error;
    }
  }

  async submitEntity(params: {
    pubkey: string;
    name: string;
    jurisdictions?: string[];
    signedChallenge: { nonce: string; signature: string };
  }): Promise<{ entityId: string; status: EntityStatus }> {
    const span = this.startSpan("POST /api/v1/providers/:pp/entities");
    try {
      const response = await axios.post<{
        data: { entityId: string; status: EntityStatus };
      }>(
        `${this.baseUrl}/api/v1/providers/${this.ppPubkey}/entities`,
        {
          pubkey: params.pubkey,
          name: params.name,
          jurisdictions: params.jurisdictions ?? [],
          signedChallenge: params.signedChallenge,
        },
        { headers: span ? this.traceHeaders(span.spanId) : {} },
      );
      if (span) endSpan(span, { code: 0 });
      return response.data.data;
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
    // Validate and clean token
    // This will throw PrivacyProviderAuthError if token is invalid
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
        `${this.baseUrl}/api/v1/providers/${this.ppPubkey}/entity/bundles`,
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
      // Check if it's an authentication error
      if (this.isAuthError(error)) {
        throw new PrivacyProviderAuthError(
          "Provider session expired or invalid. Please reconnect to the provider.",
        );
      }
      // Re-throw other errors as-is
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
          `${this.baseUrl}/api/v1/providers/${this.ppPubkey}/entity/bundles/${bundleId}`,
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
