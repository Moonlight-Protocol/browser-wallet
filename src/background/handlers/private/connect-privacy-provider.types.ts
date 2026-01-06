import type {
  BackgroundRequest,
  BackgroundResponse,
} from "@/background/types.ts";

import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export interface ConnectPrivacyProviderRequest extends BackgroundRequest {
  type: "CONNECT_PRIVACY_PROVIDER";
  payload: {
    channelId: string;
    channelAddress: string;
    providerId: string;
    providerUrl: string;
    accountId: string;
    publicKey: string;
    network: ChainNetwork;
  };
}

export interface ConnectPrivacyProviderResponse extends BackgroundResponse {
  payload: {
    signingRequestId: string;
  };
}
