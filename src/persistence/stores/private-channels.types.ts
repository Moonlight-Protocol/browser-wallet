import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export type PrivateChannelAsset = {
  code: string;
  issuer?: string;
};

export type EntityStatus = "UNVERIFIED" | "APPROVED" | "PENDING" | "BLOCKED";

export type PrivacyProviderSession = {
  token: string;
  expiresAt: number;
  // Mirrors the provider-platform entity record's status at session-mint time.
  // Wallet uses this to gate bundle ops behind a KYC submission step.
  entityStatus: EntityStatus;
};

export type PrivacyProvider = {
  id: string;
  name: string;
  url: string;
  // Required for per-PP URL paths (/api/v1/providers/:pubkey/...) — supplied
  // by the operator alongside the URL. Stored once at add-provider time.
  pubkey: string;
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
