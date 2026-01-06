import type {
  BackgroundRequest,
  BackgroundResponse,
} from "@/background/types.ts";
import type { AuthChallengeResponse } from "@/background/services/privacy-provider-client.ts";

export interface GetPrivacyProviderAuthChallengeRequest
  extends BackgroundRequest {
  type: "GET_PRIVACY_PROVIDER_AUTH_CHALLENGE";
  payload: {
    providerUrl: string;
    publicKey: string;
  };
}

export interface GetPrivacyProviderAuthChallengeResponse
  extends BackgroundResponse {
  payload: AuthChallengeResponse;
}
