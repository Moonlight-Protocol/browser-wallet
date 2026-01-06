import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export type DisconnectPrivacyProviderRequest = {
  network: ChainNetwork;
  channelId: string;
  providerId: string;
  accountId: string;
};

// Empty response - only the type field from ResponseFor<T> is returned
export type DisconnectPrivacyProviderResponse = Record<string, unknown>;
