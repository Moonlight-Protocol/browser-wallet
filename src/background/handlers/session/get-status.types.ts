export type GetStatusRequest = Record<string, never>;

export type GetStatusResponse = {
  unlocked: boolean;
  passwordSet: boolean;
  viewMode: "public" | "private";
  lastSelectedNetwork: "mainnet" | "testnet" | "futurenet" | "custom";
  customNetworkName?: string;
  mainKey?: {
    walletId: string;
    accountId: string;
  };
  lastSelectedAccount?: {
    walletId: string;
    accountId: string;
  };
};
