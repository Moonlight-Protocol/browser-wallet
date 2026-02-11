import axios from "@/common/polyfills/axios.ts";

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

export class PrivacyProviderClient {
  private baseUrl: string;

  constructor(url: string) {
    // Ensure no trailing slash
    this.baseUrl = url.replace(/\/$/, "");
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
    const response = await axios.get<AuthChallengeResponse>(
      `${this.baseUrl}/api/v1/stellar/auth`,
      {
        params: {
          account: accountPublicKey,
        },
      },
    );
    return response.data;
  }

  async postAuth(signedChallenge: string): Promise<{ token: string }> {
    // TODO: This endpoint implementation is specific to the current provider API
    // and might not fully conform to SEP-10 standard yet. Move to standard SEP-10
    // once stellar.toml is hosted.
    const response = await axios.post<{
      status: number;
      message: string;
      data: { jwt: string };
    }>(
      `${this.baseUrl}/api/v1/stellar/auth`,
      {
        signedChallenge,
      },
    );
    
    // Extract token from response.data.data.jwt
    const token = response.data.data?.jwt;
    if (!token || typeof token !== "string") {
      throw new Error(
        `Invalid auth response: token not found in ${JSON.stringify(response.data)}`,
      );
    }

    return { token };
  }

  async submitBundle(params: {
    token: string;
    operationsMLXDR: string[];
  }): Promise<{ id: string; hash: string }> {
    // Validate and clean token
    // This will throw PrivacyProviderAuthError if token is invalid
    const token = this.validateToken(params.token);

    try {
      const response = await axios.post<{ id: string; hash: string }>(
        `${this.baseUrl}/api/v1/bundle`,
        {
          operationsMLXDR: params.operationsMLXDR,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error: unknown) {
      // Check if it's an authentication error
      if (this.isAuthError(error)) {
        throw new PrivacyProviderAuthError(
          "Provider session expired or invalid. Please reconnect to the provider.",
        );
      }
      // Re-throw other errors as-is
      throw error;
    }
  }
}
