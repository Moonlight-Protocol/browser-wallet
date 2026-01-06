import axios from "@/common/polyfills/axios.ts";

export type AuthChallengeResponse = {
  status: number;
  message: string;
  data: {
    hash: string;
    challenge: string;
  };
};

export class PrivacyProviderClient {
  private baseUrl: string;

  constructor(url: string) {
    // Ensure no trailing slash
    this.baseUrl = url.replace(/\/$/, "");
  }

  // TODO: Currently we just use the provided domain on /api/v1/stellar/auth according to the provider api
  // but in future versions we need to review to conform with sep10 as the provider platform is updated
  // and we hosting the stellar.toml file.
  async getAuthChallenge(
    accountPublicKey: string
  ): Promise<AuthChallengeResponse> {
    const response = await axios.get<AuthChallengeResponse>(
      `${this.baseUrl}/api/v1/stellar/auth`,
      {
        params: {
          account: accountPublicKey,
        },
      }
    );
    return response.data;
  }

  async postAuth(signedChallenge: string): Promise<{ token: string }> {
    // TODO: This endpoint implementation is specific to the current provider API
    // and might not fully conform to SEP-10 standard yet. Move to standard SEP-10
    // once stellar.toml is hosted.
    const response = await axios.post<{ token: string }>(
      `${this.baseUrl}/api/v1/stellar/auth`,
      {
        signedChallenge,
      }
    );
    return response.data;
  }
}
