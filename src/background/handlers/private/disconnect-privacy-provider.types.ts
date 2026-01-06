import type {
  BackgroundRequest,
  BackgroundResponse,
} from "@/background/types.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export interface DisconnectPrivacyProviderRequest extends BackgroundRequest {
  type: "DISCONNECT_PRIVACY_PROVIDER";
  payload: {
    network: ChainNetwork;
    channelId: string;
    providerId: string;
    accountId: string;
  };
}

export interface DisconnectPrivacyProviderResponse extends BackgroundResponse {
  payload: void;
}
