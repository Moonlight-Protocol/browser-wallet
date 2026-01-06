import type {
  BackgroundRequest,
  BackgroundResponse,
} from "@/background/types.ts";

export interface ConnectPrivateChannelProviderRequest
  extends BackgroundRequest {
  type: "CONNECT_PRIVATE_CHANNEL_PROVIDER";
  payload: {
    channelAddress: string;
    providerUrl: string;
    jwt: string;
    expiresAt: number;
    accountId: string;
  };
}

export interface ConnectPrivateChannelProviderResponse
  extends BackgroundResponse {
  payload: void;
}
