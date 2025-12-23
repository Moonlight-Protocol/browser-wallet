import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export type PrivateUtxoStatus = "empty" | "derived" | "reserved" | "spent";

// Stored as base64 to keep browser.storage JSON-friendly.
export type Base64Bytes = string;

export type PrivateDerivedUtxo = {
  index: number;
  utxoPublicKey?: Base64Bytes;
  status: PrivateUtxoStatus;

  // String for lossless UI formatting (SDKs often use bigint-like amounts).
  balance?: string;
  updatedAt?: number;
};

export type PrivateChannelTracking = {
  network: ChainNetwork;
  accountId: string;
  channelId: string;

  // Useful for debugging/consistency checks.
  contractId: string;
  quorumContractId: string;
  asset: { code: string; issuer?: string };

  targetCount: number;
  // Next Moonlight derivation index to use when we actually derive more.
  nextIndex: number;

  utxos: PrivateDerivedUtxo[];

  createdAt: number;
  updatedAt: number;

  // Computed/denormalized stats for quick UI.
  totalBalance?: string;
  nonZeroCount?: number;
};

export type PrivateUtxosState = {
  version: 1;
  byKey: Record<string, PrivateChannelTracking>;
};

export type PrivateChannelStats = {
  targetCount: number;
  derivedCount: number;
  nonZeroCount: number;
  totalBalance: string;
  updatedAt: number;
};
