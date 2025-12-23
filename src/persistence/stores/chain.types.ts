export type ChainNetwork = "mainnet" | "testnet" | "futurenet" | "custom";

export type ChainAsset = {
  code: string;
  issuer?: string;
};

export type ChainAccountState = {
  network: ChainNetwork;
  publicKey: string;

  initialized?: boolean;
  assets?: ChainAsset[];

  balanceXlm?: string;
  sequence?: string;

  created?: boolean;
  createdConfirmed?: boolean;

  updatedAt?: number;
  error?: string;
};

export type ChainState = {
  version: 1;
  // Keyed by `${network}:${publicKey}`
  accounts: Record<string, ChainAccountState>;
};
