import type {
  BackgroundRequest,
  BackgroundResponse,
} from "@/background/types.ts";
import type { AuthChallengeResponse } from "@/background/services/private-channel-provider-client.ts";

export interface GetProviderAuthChallengeRequest extends BackgroundRequest {
  type: "GET_PROVIDER_AUTH_CHALLENGE";
  payload: {
    providerUrl: string;
    publicKey: string;
  };
}

export interface GetProviderAuthChallengeResponse extends BackgroundResponse {
  payload: AuthChallengeResponse;
}
