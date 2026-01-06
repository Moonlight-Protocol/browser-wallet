import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export type PrivateChannelAsset = {
  code: string;
  issuer?: string;
};

export type PrivacyProviderSession = {
  token: string;
  expiresAt: number;
};

export type PrivacyProvider = {
  id: string;
  name: string;
  url: string;
  sessions: Record<string, PrivacyProviderSession>; // Keyed by account ID
};

export type PrivateChannel = {
  id: string;
  name: string;
  network: ChainNetwork;
  contractId: string;
  quorumContractId: string;
  asset: PrivateChannelAsset;
  createdAt: number;
  providers: PrivacyProvider[];
  selectedProviderId?: string;
};

export type PrivateChannelsState = {
  version: 3;
  channelsByNetwork: Partial<Record<ChainNetwork, PrivateChannel[]>>;
  selectedChannelIdByNetwork: Partial<Record<ChainNetwork, string>>;
};
