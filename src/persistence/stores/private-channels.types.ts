import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export type PrivateChannelAsset = {
  code: string;
  issuer?: string;
};

export type PrivateChannel = {
  id: string;
  name: string;
  network: ChainNetwork;
  contractId: string;
  quorumContractId: string;
  asset: PrivateChannelAsset;
  createdAt: number;
};

export type PrivateChannelsState = {
  version: 2;
  channelsByNetwork: Partial<Record<ChainNetwork, PrivateChannel[]>>;
  selectedChannelIdByNetwork: Partial<Record<ChainNetwork, string>>;
};
