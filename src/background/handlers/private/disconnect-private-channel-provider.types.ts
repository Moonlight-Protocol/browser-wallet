import type {
  BackgroundRequest,
  BackgroundResponse,
} from "@/background/types.ts";

export interface DisconnectPrivateChannelProviderRequest
  extends BackgroundRequest {
  type: "DISCONNECT_PRIVATE_CHANNEL_PROVIDER";
  payload: {
    channelAddress: string;
    providerUrl: string;
    accountId: string;
  };
}

export interface DisconnectPrivateChannelProviderResponse
  extends BackgroundResponse {
  payload: void;
}
