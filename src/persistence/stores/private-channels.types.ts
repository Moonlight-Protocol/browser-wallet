import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export type PrivateChannelAsset = {
  code: string;
  issuer?: string;
};

export type EntityStatus = "UNVERIFIED" | "APPROVED" | "PENDING" | "BLOCKED";

export type PrivacyProviderSession = {
  token: string;
  expiresAt: number;
  // Mirrors the provider-platform PER-PP entity status at session-mint time.
  // Wallet gates the "Submit KYC" link render on this field.
  entityStatus: EntityStatus;
  // Operator-supplied KYC submission URL for THIS PP. The wallet renders it
  // verbatim as the anchor href when entityStatus != APPROVED. Null when the
  // operator hasn't published a URL — link is hidden.
  kycSubmissionUrl: string | null;
};

export type PrivacyProvider = {
  id: string;
  name: string;
  // The PP URL encodes the PP's Stellar public key as its last path segment.
  // The wallet parses it at call-time via extractPpPubkeyFromUrl(); pubkey is
  // never persisted as a separate field.
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
  version: 4;
  channelsByNetwork: Partial<Record<ChainNetwork, PrivateChannel[]>>;
  selectedChannelIdByNetwork: Partial<Record<ChainNetwork, string>>;
};
