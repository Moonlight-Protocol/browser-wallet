import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export type ConnectPrivacyProviderRequest = {
  channelId: string;
  channelAddress: string;
  providerId: string;
  providerUrl: string;
  accountId: string;
  publicKey: string;
  network: ChainNetwork;
};

export type ConnectPrivacyProviderResponse = {
  signingRequestId: string;
};
