import type { AuthChallengeResponse } from "@/background/services/privacy-provider-client.ts";

export type GetPrivacyProviderAuthChallengeRequest = {
  providerUrl: string;
  publicKey: string;
};

export type GetPrivacyProviderAuthChallengeResponse = AuthChallengeResponse;
